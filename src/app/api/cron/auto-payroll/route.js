import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { notifyPayrollGenerated } from '@/lib/notifications'

/**
 * Automatic Monthly Payroll Generation
 * This endpoint is triggered by a cron job at the end of each month
 * It checks if payroll is already generated, and if not, generates it for all employees
 */
export async function GET(request) {
    try {
        // Verify cron authorization (Vercel Cron sends this header)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET || 'dayflow-cron-secret-2026'
        
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const currentDay = now.getDate()

        // Check if today is the last day of the month
        if (currentDay !== lastDayOfMonth) {
            return NextResponse.json({ 
                message: 'Not the last day of month',
                currentDay,
                lastDayOfMonth,
                skipped: true 
            })
        }

        console.log(`🤖 Auto Payroll: Running for ${currentMonth + 1}/${currentYear}`)

        // Check if payroll is already generated for this month
        const existingPayrolls = await prisma.payroll.count({
            where: {
                month: currentMonth,
                year: currentYear
            }
        })

        if (existingPayrolls > 0) {
            console.log(`✅ Payroll already generated for ${currentMonth + 1}/${currentYear}`)
            return NextResponse.json({ 
                message: 'Payroll already generated for this month',
                month: currentMonth + 1,
                year: currentYear,
                count: existingPayrolls,
                skipped: true
            })
        }

        // Generate payroll for all employees
        const result = await generateMonthlyPayroll(currentMonth, currentYear, request)

        console.log(`✅ Auto Payroll Generated: ${result.generated} employees`)

        // Create system audit log
        await createAuditLog({
            userId: 1, // System user (you can create a dedicated system user ID)
            action: AuditActions.PAYROLL_PROCESSED,
            resource: AuditResources.PAYROLL,
            resourceId: `${currentMonth}-${currentYear}`,
            details: `Automatic payroll generation for ${new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Generated: ${result.generated}, Skipped: ${result.skipped}`,
            request
        })

        return NextResponse.json({
            success: true,
            message: 'Monthly payroll auto-generated successfully',
            month: currentMonth + 1,
            year: currentYear,
            generated: result.generated,
            skipped: result.skipped,
            skippedEmployees: result.skippedEmployees
        })

    } catch (error) {
        console.error('❌ Auto Payroll Error:', error)
        return NextResponse.json({ 
            error: 'Failed to generate automatic payroll',
            details: error.message 
        }, { status: 500 })
    }
}

/**
 * Generate payroll for all employees
 * This is the same logic as the manual payroll generation
 */
async function generateMonthlyPayroll(month, year, request) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    const daysInMonth = endDate.getDate()

    // Fetch all active employees
    const employees = await prisma.user.findMany({
        where: { 
            role: 'EMPLOYEE',
            isActive: true
        },
        include: {
            salary: true,
            details: true
        }
    })

    const payrolls = []
    const skippedEmployees = []
    let generatedCount = 0

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
            const basic = wage * 0.5
            const hra = wage * 0.3
            const stdAllowance = wage * 0.1
            const fixedAllowance = wage * 0.1
            const pf = basic * 0.12
            const profTax = 200
            
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

        // Fetch attendance count
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

        // Count weekends (Saturday & Sunday - both auto-paid)
        let weekends = 0
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) weekends++
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

        const payableDays = Math.min(attendanceCount + weekends + approvedLeaves, daysInMonth)

        // Calculate payout
        const grossSalary = salary.basic + salary.hra + salary.stdAllowance + (salary.fixedAllowance || 0) + 
                           (salary.performanceBonus || 0) + (salary.lta || 0)
        
        const perDayGross = grossSalary / daysInMonth
        const earnedGross = Math.round(perDayGross * payableDays)
        
        const perDayPF = salary.pf / daysInMonth
        const earnedPF = Math.round(perDayPF * payableDays)
        const earnedProfTax = payableDays >= 20 ? salary.profTax : 0
        
        const totalDeductions = earnedPF + earnedProfTax
        const netPay = earnedGross - totalDeductions

        // Create payroll record
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
        
        payrolls.push(newPayroll)
        generatedCount++

        // Send notification to employee
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        await notifyPayrollGenerated(emp.id, {
            month: monthName,
            netPay: netPay
        })
    }

    return {
        generated: generatedCount,
        skipped: skippedEmployees.length,
        skippedEmployees,
        payrolls
    }
}
