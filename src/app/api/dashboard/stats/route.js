import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const userId = payload.id

        // Get current month date range (use local timezone to match calendar display)
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        
        // Create dates in local timezone to match attendance history API
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        let presentDays = 0
        let lateDays = 0
        let totalMs = 0

        // Get today's date for checking if currently checked in
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        attendanceRecords.forEach(r => {
            // Only count weekdays (Monday-Friday), exclude weekends
            const dayOfWeek = r.date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
            
            if (isWeekend) return // Skip weekend records
            
            // Count present days - only weekdays where employee checked in
            if (r.status === 'PRESENT' && r.checkIn) {
                presentDays++
            }

            // Check if late (check-in after 9:30 AM in local time)
            if (r.checkIn) {
                const checkInTime = new Date(r.checkIn)
                const hours = checkInTime.getHours()
                const minutes = checkInTime.getMinutes()
                
                // Late if check-in is after 9:30 AM
                // 9:31 AM or later = LATE
                if (hours > 9 || (hours === 9 && minutes > 30)) {
                    lateDays++
                }

                // Calculate total working hours
                if (r.checkOut) {
                    // Completed session - count actual hours
                    const checkOutTime = new Date(r.checkOut)
                    totalMs += (checkOutTime - checkInTime)
                } else {
                    // No check-out yet
                    const recordDateStr = r.date.toISOString().split('T')[0]
                    
                    // If this is today's record and user is currently checked in, add elapsed time
                    if (recordDateStr === todayStr) {
                        const currentTime = new Date()
                        const elapsed = currentTime - checkInTime
                        // Only add if elapsed time is positive and reasonable (< 24 hours)
                        if (elapsed > 0 && elapsed < 24 * 60 * 60 * 1000) {
                            totalMs += elapsed
                        }
                    }
                    // For past days without checkout, don't count hours
                    // This maintains accurate records
                }
            }
        })

        const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(1)

        // Calculate leave balance
        // Assuming annual leave quota = 24 days (can be made configurable later)
        const annualLeaveQuota = 24
        
        // Get all approved leaves for current year
        const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
        const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
        
        const approvedLeaves = await prisma.leaveRequest.findMany({
            where: {
                userId: userId,
                status: 'APPROVED',
                startDate: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            select: {
                startDate: true,
                endDate: true
            }
        })
        
        // Calculate total leave days taken (excluding weekends)
        let leaveDaysTaken = 0
        approvedLeaves.forEach(leave => {
            const start = new Date(leave.startDate)
            const end = new Date(leave.endDate)
            const diffTime = Math.abs(end - start)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end
            
            // Count weekdays only (excluding Saturdays and Sundays)
            let workingDays = 0
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay()
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    workingDays++
                }
            }
            leaveDaysTaken += workingDays
        })
        
        const leaveBalance = annualLeaveQuota - leaveDaysTaken

        return NextResponse.json({
            stats: {
                presentDays,
                lateDays,
                totalHours,
                leaveBalance
            }
        })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
