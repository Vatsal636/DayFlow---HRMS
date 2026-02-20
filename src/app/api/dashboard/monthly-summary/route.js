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
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

        // Current month
        const currentStart = new Date(currentYear, currentMonth, 1)
        const currentEnd = new Date(currentYear, currentMonth + 1, 0)

        // Last month
        const lastStart = new Date(lastMonthYear, lastMonth, 1)
        const lastEnd = new Date(lastMonthYear, lastMonth + 1, 0)

        // Fetch both months
        const [currentAttendance, lastAttendance] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    userId,
                    date: { gte: currentStart, lte: currentEnd }
                }
            }),
            prisma.attendance.findMany({
                where: {
                    userId,
                    date: { gte: lastStart, lte: lastEnd }
                }
            })
        ])

        // Calculate stats
        const calculateStats = (records) => {
            let present = 0, late = 0, absent = 0, leaves = 0
            let totalHours = 0

            records.forEach(r => {
                const dayOfWeek = new Date(r.date).getDay()
                if (dayOfWeek === 0 || dayOfWeek === 6) return

                if (r.status === 'LEAVE') {
                    leaves++
                } else if (r.status === 'PRESENT' || r.status === 'HALF_DAY') {
                    if (r.checkIn) {
                        const checkIn = new Date(r.checkIn)
                        const threshold = new Date(r.checkIn)
                        threshold.setHours(9, 30, 0, 0)
                        if (checkIn > threshold) late++
                        else present++
                    } else {
                        present++
                    }

                    // Calculate hours
                    if (r.checkIn && r.checkOut) {
                        const hours = (new Date(r.checkOut) - new Date(r.checkIn)) / (1000 * 60 * 60)
                        totalHours += hours
                    }
                }
            })

            return { present, late, absent, leaves, totalHours: Math.round(totalHours) }
        }

        const current = calculateStats(currentAttendance)
        const last = calculateStats(lastAttendance)

        // Calculate trends (percentage change)
        const calcTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0
            return Math.round(((curr - prev) / prev) * 100)
        }

        return NextResponse.json({
            present: {
                value: current.present,
                trend: calcTrend(current.present, last.present)
            },
            late: {
                value: current.late,
                trend: calcTrend(current.late, last.late)
            },
            leaves: {
                value: current.leaves,
                trend: calcTrend(current.leaves, last.leaves)
            },
            hours: {
                value: current.totalHours,
                trend: calcTrend(current.totalHours, last.totalHours)
            }
        })

    } catch (e) {
        console.error('Monthly Summary API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
