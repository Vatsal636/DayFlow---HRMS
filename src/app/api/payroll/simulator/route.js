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
        const currentDay = now.getDate()

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
        // Match EXACT payroll logic: count PRESENT/HALF_DAY status records
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate // Query full month like payroll does
                },
                status: { in: ['PRESENT', 'HALF_DAY'] }
            },
            select: {
                checkIn: true,
                date: true
            },
            orderBy: { date: 'asc' }
        })

        // Count present days (on-time) and late days
        // Only count records up to TODAY
        let presentDays = 0
        let lateDays = 0
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today
        
        attendanceRecords.forEach(record => {
            const recordDate = new Date(record.date)
            // Only count if record is today or earlier
            if (recordDate <= today) {
                if (record.checkIn) {
                    const checkIn = new Date(record.checkIn)
                    const threshold = new Date(record.checkIn)
                    threshold.setHours(9, 30, 0, 0)
                    
                    if (checkIn > threshold) {
                        lateDays++
                    } else {
                        presentDays++
                    }
                } else {
                    presentDays++ // No checkIn time, count as present
                }
            }
        })

        const absentDays = await prisma.attendance.count({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: today
                },
                status: 'ABSENT'
            }
        })

        // Count approved leave DAYS (not requests) - calculate actual days up to today
        const approvedLeaveRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: 'APPROVED',
                startDate: { lte: today },
                endDate: { gte: startDate }
            },
            select: {
                startDate: true,
                endDate: true
            }
        })

        // Calculate actual number of leave days in current month up to today
        let approvedLeaveDays = 0
        approvedLeaveRequests.forEach(leave => {
            const leaveStart = new Date(leave.startDate) > startDate ? new Date(leave.startDate) : startDate
            const leaveEnd = new Date(leave.endDate) < today ? new Date(leave.endDate) : today
            
            // Count days between leaveStart and leaveEnd (inclusive)
            const daysDiff = Math.floor((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1
            approvedLeaveDays += Math.max(0, daysDiff)
        })

        // Count weekends in FULL month (payroll counts all weekends, not just past ones)
        let totalWeekendsInMonth = 0
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) totalWeekendsInMonth++
        }

        // Also count weekends that have occurred so far for display
        let weekendsSoFar = 0
        for (let d = 1; d <= currentDay; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) weekendsSoFar++
        }

        // Calculate current day and remaining days
        const remainingDays = daysInMonth - currentDay

        // Calculate ACTUAL payable days using EXACT payroll formula
        // Formula: attendanceCount + weekends + approvedLeaveDays
        const attendanceCount = presentDays + lateDays
        const actualPayableDays = Math.min(attendanceCount + totalWeekendsInMonth + approvedLeaveDays, daysInMonth)

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
                presentDays,
                lateDays,
                absentDays,
                approvedLeaveDays, // Actual leave days taken
                weekendsSoFar, // Weekends that have occurred
                totalWeekendsInMonth, // Total weekends in month (used in calculation)
                actualPayableDays, // Actual payable days from payroll formula
                daysInMonth,
                currentDay,
                remainingDays,
                monthName: startDate.toLocaleString('default', { month: 'long', year: 'numeric' })
            },
            leaveBalance
        })

    } catch (e) {
        console.error('Simulator API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
