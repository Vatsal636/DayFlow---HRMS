import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { 
    getDefaultSalaryStructure,
    calculateWeekends,
    calculateApprovedLeaveDays,
    calculateRemainingDays,
    calculateOptimisticPayableDays,
    calculateRealisticPayableDays,
    calculatePessimisticPayableDays,
    calculateCompletePayroll,
    isLateCheckIn,
    countWorkingDays
} from '@/lib/payroll-calculator'

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
            salary = getDefaultSalaryStructure()
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
                    // Use shared library function for late detection
                    if (isLateCheckIn(new Date(record.checkIn))) {
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
        const approvedLeaveDaysFromRequests = calculateApprovedLeaveDays(approvedLeaveRequests, startDate, today)
        
        // Use the leave days count from attendance table (more accurate as it's actual marked days)
        // If attendance table doesn't have leave records, fall back to calculated from requests
        const approvedLeaveDays = leaveDays > 0 ? leaveDays : approvedLeaveDaysFromRequests

        // Count weekends using shared library
        const joiningDate = user?.details?.joiningDate ? new Date(user.details.joiningDate) : startDate
        const totalWeekendsInMonth = calculateWeekends(year, month, daysInMonth, joiningDate, startDate)

        // Also count weekends that have occurred so far for display
        let weekendsSoFar = 0
        for (let d = 1; d <= currentDay; d++) {
            const date = new Date(year, month, d)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) weekendsSoFar++
        }

        // Calculate current day and remaining days using shared library
        const remainingDaysInMonth = daysInMonth - currentDay
        const attendanceCount = presentDays + lateDays
        
        const { remainingWorkingDays, remainingWeekends } = calculateRemainingDays(
            year, 
            month, 
            currentDay, 
            daysInMonth
        )
        
        // Calculate OPTIMISTIC payable days using shared library
        const estimatedPayableDays = calculateOptimisticPayableDays(
            attendanceCount,
            approvedLeaveDays,
            remainingWorkingDays,
            totalWeekendsInMonth
        )
        
        // Calculate REALISTIC payable days using attendance rate projection
        const realisticPayableDays = calculateRealisticPayableDays(
            attendanceCount,
            approvedLeaveDays,
            totalWorkingDaysSoFar,
            remainingWorkingDays,
            totalWeekendsInMonth
        )
        
        // Calculate PESSIMISTIC payable days (worst case)
        const pessimisticPayableDays = calculatePessimisticPayableDays(
            attendanceCount,
            approvedLeaveDays,
            weekendsSoFar
        )
        
        // Calculate complete breakdowns for all three scenarios
        // OPTIMISTIC: Assumes perfect future attendance
        const optimisticBreakdown = calculateCompletePayroll({
            salary,
            attendanceCount: attendanceCount + remainingWorkingDays, // Current + assumed future
            weekends: totalWeekendsInMonth,
            approvedLeaveDays,
            daysInMonth
        })
        
        // REALISTIC: Based on current attendance rate
        const attendanceRate = totalWorkingDaysSoFar > 0 ? attendanceCount / totalWorkingDaysSoFar : 1
        const projectedFutureAttendance = Math.round(remainingWorkingDays * attendanceRate)
        const realisticBreakdown = calculateCompletePayroll({
            salary,
            attendanceCount: attendanceCount + projectedFutureAttendance,
            weekends: totalWeekendsInMonth,
            approvedLeaveDays,
            daysInMonth
        })
        
        // PESSIMISTIC: No future attendance assumed
        const pessimisticBreakdown = calculateCompletePayroll({
            salary,
            attendanceCount: attendanceCount,
            weekends: weekendsSoFar,
            approvedLeaveDays,
            daysInMonth
        })

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
                realisticPayableDays, // Estimated based on attendance rate
                pessimisticPayableDays, // Worst case (no future attendance)
                daysInMonth,
                currentDay,
                remainingDaysInMonth,
                monthName: startDate.toLocaleString('default', { month: 'long', year: 'numeric' })
            },
            // Add calculated breakdowns for all three scenarios
            optimisticBreakdown,
            realisticBreakdown,
            pessimisticBreakdown,
            leaveBalance
        })

    } catch (e) {
        console.error('Simulator API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
