import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const userId = payload.id

        // Get last 30 days of attendance
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        thirtyDaysAgo.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(23, 59, 59, 999)

        const attendance = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: thirtyDaysAgo,
                    lte: today
                }
            },
            select: {
                date: true,
                status: true,
                checkIn: true
            },
            orderBy: { date: 'asc' }
        })

        // Create a map of all dates with counts
        const trendData = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

            const dateStr = date.toISOString().split('T')[0]
            const dayAttendance = attendance.find(a => {
                const aDate = new Date(a.date)
                aDate.setHours(0, 0, 0, 0)
                return aDate.toISOString().split('T')[0] === dateStr
            })

            let status = 'Absent'
            if (isWeekend) {
                status = 'Weekend'
            } else if (dayAttendance) {
                if (dayAttendance.status === 'LEAVE') {
                    status = 'Leave'
                } else if (dayAttendance.status === 'PRESENT' || dayAttendance.status === 'HALF_DAY') {
                    // Check if late
                    const checkIn = new Date(dayAttendance.checkIn)
                    const threshold = new Date(dayAttendance.checkIn)
                    threshold.setHours(9, 30, 0, 0)
                    status = checkIn > threshold ? 'Late' : 'Present'
                } else if (dayAttendance.status === 'ABSENT') {
                    status = 'Absent'
                }
            }

            trendData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: dateStr,
                Present: status === 'Present' ? 1 : 0,
                Late: status === 'Late' ? 1 : 0,
                Absent: status === 'Absent' ? 1 : 0,
                Leave: status === 'Leave' ? 1 : 0,
                Weekend: status === 'Weekend' ? 1 : 0,
                status
            })
        }

        return NextResponse.json({ trendData })

    } catch (e) {
        console.error('Attendance Trend API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
