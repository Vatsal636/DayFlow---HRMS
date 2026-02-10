import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { notifyPayrollGenerated } from '@/lib/notifications'

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
                const wage = 50000
                const basic = wage * 0.5 // 50% Basic
                const hra = wage * 0.3 // 30% HRA
                const stdAllowance = wage * 0.1 // 10% Special Allowance
                const fixedAllowance = wage * 0.1 // 10% Fixed Allowance
                const pf = basic * 0.12 // 12% of Basic
                const profTax = 200 // Standard Professional Tax
                
                salary = {
                    wage: wage,
                    basic: basic,
                    hra: hra,
                    stdAllowance: stdAllowance,
                    fixedAllowance: fixedAllowance,
                    pf: pf,
                    profTax: profTax,
                    netSalary: wage - pf - profTax
                }
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

            // 3. Count Sundays and Approved Leaves (Auto-paid)
            let sundays = 0
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month, d)
                if (date.getDay() === 0) sundays++
            }

            // Count approved leaves
            const approvedLeaves = await prisma.leaveRequest.count({
                where: {
                    userId: emp.id,
                    status: 'APPROVED',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                }
            })

            const payableDays = Math.min(attendanceCount + sundays + approvedLeaves, daysInMonth)

            // 4. Calculate Payout using Industry Standard Formula
            // Gross Salary = Basic + HRA + Allowances
            const grossSalary = salary.basic + salary.hra + salary.stdAllowance + (salary.fixedAllowance || 0) + 
                               (salary.performanceBonus || 0) + (salary.lta || 0)
            
            // Pro-rated calculation based on attendance
            const perDayGross = grossSalary / daysInMonth
            const earnedGross = Math.round(perDayGross * payableDays)
            
            // Deductions (pro-rated)
            const perDayPF = salary.pf / daysInMonth
            const earnedPF = Math.round(perDayPF * payableDays)
            const earnedProfTax = payableDays >= 20 ? salary.profTax : 0 // Professional tax only if >= 20 days
            
            const totalDeductions = earnedPF + earnedProfTax
            const netPay = earnedGross - totalDeductions

            // Delete old record for this month
            await prisma.payroll.deleteMany({
                where: { userId: emp.id, month: parseInt(month), year: parseInt(year) }
            })

            const newPayroll = await prisma.payroll.create({
                data: {
                    userId: emp.id,
                    month: parseInt(month),
                    year: parseInt(year),
                    baseWage: salary.wage,
                    totalEarnings: earnedGross,
                    totalDeductions: totalDeductions,
                    netPay: netPay,
                    status: 'GENERATED'
                }
            })
            
            // Send notification to employee
            const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            await notifyPayrollGenerated(emp.id, {
                month: monthName,
                netPay: netPay
            })

            payrolls.push({
                ...newPayroll,
                name: emp.details?.firstName + ' ' + emp.details?.lastName,
                employeeId: emp.employeeId,
                payableDays,
                daysInMonth
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
