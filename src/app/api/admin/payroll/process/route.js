import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { notifyPayrollGenerated } from '@/lib/notifications'
import { 
    getDefaultSalaryStructure,
    calculateWeekends,
    calculateApprovedLeaveDays,
    calculateCompletePayroll
} from '@/lib/payroll-calculator'

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { month, year } = body // month is 0-indexed (0=Jan)

        if (month === undefined || !year) {
            return NextResponse.json({ error: 'Month and Year required' }, { status: 400 })
        }

        // Validate that payroll month is not in the future
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        
        if (year > currentYear || (year === currentYear && month > currentMonth)) {
            return NextResponse.json({ 
                error: 'Cannot process payroll for future months' 
            }, { status: 400 })
        }

        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)
        const daysInMonth = endDate.getDate()

        // 1. Fetch all employees (even those without defined salary)
        const employees = await prisma.user.findMany({
            where: { role: 'EMPLOYEE' },
            include: {
                salary: true,
                details: true
            }
        })

        const payrolls = []
        const skippedEmployees = []

        for (const emp of employees) {
            // Check if employee joined before or during this payroll month
            if (emp.details?.joiningDate) {
                const joiningDate = new Date(emp.details.joiningDate)
                const joiningYear = joiningDate.getFullYear()
                const joiningMonth = joiningDate.getMonth()
                
                // Skip if employee hasn't joined yet in this payroll month
                if (year < joiningYear || (year === joiningYear && month < joiningMonth)) {
                    skippedEmployees.push({
                        employeeId: emp.employeeId,
                        name: emp.details ? `${emp.details.firstName} ${emp.details.lastName}` : 'Unknown',
                        reason: `Not joined yet (Joining: ${joiningDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`
                    })
                    continue
                }
            }

            // Default salary if not defined
            let salary = emp.salary
            if (!salary) {
                salary = getDefaultSalaryStructure()
            }

            // 2. Fetch Attendance Count
            const attendanceCount = await prisma.attendance.count({
                where: {
                    userId: emp.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: { in: ['PRESENT', 'HALF_DAY'] }
                }
            })

            // 3. Count Weekends using shared library
            const joiningDate = emp.details?.joiningDate ? new Date(emp.details.joiningDate) : startDate
            const weekends = calculateWeekends(year, month, daysInMonth, joiningDate, startDate)

            // Count approved leave DAYS using shared library
            const approvedLeaveRequests = await prisma.leaveRequest.findMany({
                where: {
                    userId: emp.id,
                    status: 'APPROVED',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                },
                select: {
                    startDate: true,
                    endDate: true
                }
            })

            const approvedLeaveDays = calculateApprovedLeaveDays(approvedLeaveRequests, startDate, endDate)

            // 4. Calculate Complete Payroll using shared library
            const payrollCalculation = calculateCompletePayroll({
                salary,
                attendanceCount,
                weekends,
                approvedLeaveDays,
                daysInMonth,
                otherDeductions: 0
            })

            // Delete old record for this month
            await prisma.payroll.deleteMany({
                where: { userId: emp.id, month: parseInt(month), year: parseInt(year) }
            })

            const newPayroll = await prisma.payroll.create({
                data: {
                    userId: emp.id,
                    month: parseInt(month),
                    year: parseInt(year),
                    
                    // Use calculated breakdown from shared library
                    ...payrollCalculation,
                    
                    status: 'GENERATED'
                }
            })
            
            // Send notification to employee
            const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            await notifyPayrollGenerated(emp.id, {
                month: monthName,
                netPay: payrollCalculation.netPay
            })

            payrolls.push({
                ...newPayroll,
                name: emp.details?.firstName + ' ' + emp.details?.lastName,
                employeeId: emp.employeeId
            })
        }
        
        // Audit log
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.PAYROLL_PROCESSED,
            resource: AuditResources.PAYROLL,
            resourceId: `${year}-${month}`,
            details: `Processed payroll for ${payrolls.length} employees for ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            request
        })

        return NextResponse.json({ 
            success: true, 
            payrolls,
            processed: payrolls.length,
            skipped: skippedEmployees.length,
            skippedEmployees: skippedEmployees.length > 0 ? skippedEmployees : undefined
        })

    } catch (e) {
        console.error("Payroll processing error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
