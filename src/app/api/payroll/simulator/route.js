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
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(year, month + 1, 0)
        const daysInMonth = endDate.getDate()
        const currentDay = now.getDate()
        
        // Create "today" date at end of day for comparison (include full today)
        const today = new Date(year, month, currentDay)
        today.setHours(23, 59, 59, 999)

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

        // Fetch ALL attendance records for current month up to today
        const allAttendanceRecords = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: today // Only up to TODAY, not end of month
                }
            },
            select: {
                checkIn: true,
                checkOut: true,
                date: true,
                status: true
            },
            orderBy: { date: 'asc' }
        })

        // Count present days (on-time), late days, and absent days
        let presentDays = 0
        let lateDays = 0
        let absentDays = 0
        let leaveDays = 0 // From attendance records
        let skippedWeekends = 0
        
        allAttendanceRecords.forEach(record => {
            const recordDate = new Date(record.date)
            const dayOfWeek = recordDate.getDay()
            
            // Check if it's a weekend
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6)
            
            if (isWeekend) {
                skippedWeekends++
                return
            }

            if (record.status === 'ABSENT') {
                absentDays++
            } else if (record.status === 'LEAVE') {
                leaveDays++
            } else if (record.status === 'PRESENT' || record.status === 'HALF_DAY') {
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
                    // No checkIn time but marked present - count as present
                    presentDays++
                }
            }
        })
        
        // Calculate total working days up to today (excluding weekends)
        let totalWorkingDaysSoFar = 0
        for (let d = 1; d <= currentDay; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                totalWorkingDaysSoFar++
            }
        }
        
        // Calculate ACTUAL absent days (working days with no attendance record)
        const calculatedAbsentDays = totalWorkingDaysSoFar - (presentDays + lateDays + leaveDays)
        absentDays = Math.max(0, calculatedAbsentDays) // Can't be negative

        // Count approved leave DAYS from LeaveRequest table (for verification)
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
        let approvedLeaveDaysFromRequests = 0
        approvedLeaveRequests.forEach(leave => {
            const leaveStart = new Date(leave.startDate) > startDate ? new Date(leave.startDate) : startDate
            const leaveEnd = new Date(leave.endDate) < today ? new Date(leave.endDate) : today
            
            // Count days between leaveStart and leaveEnd (inclusive)
            const daysDiff = Math.floor((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1
            approvedLeaveDaysFromRequests += Math.max(0, daysDiff)
        })
        
        // Use the leave days count from attendance table (more accurate as it's actual marked days)
        // If attendance table doesn't have leave records, fall back to calculated from requests
        const approvedLeaveDays = leaveDays > 0 ? leaveDays : approvedLeaveDaysFromRequests

        // Count weekends in FULL month (or from joining date)
        // Critical Fix: Mid-month joiners should only count weekends AFTER joining
        const joiningDate = user?.details?.joiningDate ? new Date(user.details.joiningDate) : startDate
        const effectiveStartDate = joiningDate > startDate ? joiningDate : startDate
        const effectiveStartDay = effectiveStartDate.getDate()
        
        let totalWeekendsInMonth = 0
        for (let d = effectiveStartDay; d <= daysInMonth; d++) {
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
        const remainingDaysInMonth = daysInMonth - currentDay

        // Calculate OPTIMISTIC payable days (assume remaining days as present)
        const attendanceCount = presentDays + lateDays
        
        // Calculate remaining working days (exclude remaining weekends)
        const remainingDays = daysInMonth - currentDay
        let remainingWeekends = 0
        for (let d = currentDay + 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) remainingWeekends++
        }
        const remainingWorkingDays = remainingDays - remainingWeekends
        
        // Critical Fix: Apply same zero-attendance business rule as payroll
        // Estimated payable = current actual + remaining working days (assumed present) + all weekends
        // BUT if attendance and approved leaves are zero, weekends should NOT be counted
        let estimatedPayableDays = 0
        if (attendanceCount === 0 && approvedLeaveDays === 0) {
            // No attendance or approved leave - no weekend payment
            // Optimistic projection: assume future perfect attendance + future weekends
            estimatedPayableDays = remainingWorkingDays + remainingWeekends
        } else {
            // Normal calculation with weekends
            estimatedPayableDays = attendanceCount + approvedLeaveDays + remainingWorkingDays + totalWeekendsInMonth
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
                presentDays,
                lateDays,
                absentDays,
                approvedLeaveDays, // Actual leave days taken
                weekendsSoFar, // Weekends that have occurred
                totalWeekendsInMonth, // Total weekends in month (used in calculation)
                remainingWorkingDays, // Working days remaining (assumed present)
                estimatedPayableDays, // Estimated payable with optimistic assumption
                daysInMonth,
                currentDay,
                remainingDaysInMonth,
                monthName: startDate.toLocaleString('default', { month: 'long', year: 'numeric' })
            },
            leaveBalance
        })

    } catch (e) {
        console.error('Simulator API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
