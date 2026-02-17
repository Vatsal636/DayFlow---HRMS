import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const userId = payload.id

        const now = new Date()
        const month = now.getMonth()
        const year = now.getFullYear()

        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)
        const daysInMonth = endDate.getDate()

        // Fetch Salary Structure
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                salary: true,
                details: true
            }
        })

        // Use actual salary structure or default
        let salary = user?.salary
        if (!salary) {
            const wage = 50000
            const basic = wage * 0.5
            salary = {
                wage: wage,
                basic: basic,
                hra: basic * 0.5,
                stdAllowance: 4167,
                performanceBonus: wage * 0.0833,
                lta: wage * 0.0833,
                fixedAllowance: 4003,
                pf: basic * 0.12,
                profTax: 200
            }
        }

        // Fetch Current Month Attendance Stats
        const attendanceRecords = await prisma.attendance.count({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['PRESENT', 'HALF_DAY'] }
            }
        })

        const absentDays = await prisma.attendance.count({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'ABSENT'
            }
        })

        // Count approved leaves for current month
        const approvedLeaves = await prisma.leaveRequest.count({
            where: {
                userId,
                status: 'APPROVED',
                startDate: { lte: endDate },
                endDate: { gte: startDate }
            }
        })

        // Count weekends in current month
        let weekends = 0
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) weekends++
        }

        // Calculate leave balance (Annual limit 12 - approved leaves this year)
        const totalApprovedLeavesThisYear = await prisma.leaveRequest.count({
            where: {
                userId,
                status: 'APPROVED',
                startDate: {
                    gte: new Date(year, 0, 1), // Start of current year
                    lte: new Date(year, 11, 31) // End of current year
                }
            }
        })
        const leaveBalance = Math.max(0, 12 - totalApprovedLeavesThisYear)

        return NextResponse.json({
            salary: {
                wage: salary.wage,
                basic: salary.basic,
                hra: salary.hra,
                stdAllowance: salary.stdAllowance,
                performanceBonus: salary.performanceBonus || 0,
                lta: salary.lta || 0,
                fixedAllowance: salary.fixedAllowance || 0,
                pf: salary.pf,
                profTax: salary.profTax
            },
            currentStats: {
                presentDays: attendanceRecords,
                absentDays,
                approvedLeaves,
                weekends,
                daysInMonth,
                monthName: startDate.toLocaleString('default', { month: 'long', year: 'numeric' })
            },
            leaveBalance
        })

    } catch (e) {
        console.error('Simulator API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
