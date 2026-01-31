import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await verifyToken(token)

        const { searchParams } = new URL(request.url)
        console.log("Search params:", searchParams.toString());
        const month = parseInt(searchParams.get('month') || new Date().getMonth())
        const year = parseInt(searchParams.get('year') || new Date().getFullYear())

        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)

        console.log(`Calculating Leaderboard for ${startDate.toDateString()} to ${endDate.toDateString()}`)

        // Fetch all attendance for the period
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                user: { role: 'EMPLOYEE' } // Only employees compete
            },
            include: {
                user: {
                    include: { details: true }
                }
            }
        })

        // Fetch all Employees (for Gulli Master / Absenteeism, we need full list)
        const allEmployees = await prisma.user.findMany({
            where: { role: 'EMPLOYEE' },
            include: { details: true }
        })

        // --- Logic Processing ---

        const earlyBirdMap = {} // userId -> wins
        const ironManMap = {}   // userId -> milliseconds
        const lateLatifMap = {} // userId -> count
        const gulliMasterMap = {} // userId -> count (Leaves/Absents)


        // 1. Early Bird (Daily Winner)
        // Group by Date
        const recordsByDate = {}
        attendanceRecords.forEach(r => {
            const dateStr = new Date(r.date).toDateString()
            if (!recordsByDate[dateStr]) recordsByDate[dateStr] = []
            if (r.checkIn) recordsByDate[dateStr].push(r)
        })

        Object.values(recordsByDate).forEach(dailyRecords => {
            // Find earliest checkIn
            dailyRecords.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
            if (dailyRecords.length > 0) {
                const winner = dailyRecords[0]
                earlyBirdMap[winner.userId] = (earlyBirdMap[winner.userId] || 0) + 1
            }
        })

        // 2, 3. Iron Man & Late Latif
        const LATE_HOUR_THRESHOLD = 10 // 10 AM

        attendanceRecords.forEach(r => {
            // Iron Man
            if (r.checkIn && r.checkOut) {
                const duration = new Date(r.checkOut) - new Date(r.checkIn)
                if (duration > 0) {
                    ironManMap[r.userId] = (ironManMap[r.userId] || 0) + duration
                }
            }

            // Late Latif
            if (r.checkIn) {
                const checkInDate = new Date(r.checkIn)
                if (checkInDate.getHours() >= 10) {
                    // Check minutes? If 10:01.
                    if (checkInDate.getHours() > 10 || (checkInDate.getHours() === 10 && checkInDate.getMinutes() > 0)) {
                        lateLatifMap[r.userId] = (lateLatifMap[r.userId] || 0) + 1
                    }
                }
            }

            // Gulli Master (Explicit Leaves)
            if (r.status === 'LEAVE' || r.status === 'ABSENT') {
                gulliMasterMap[r.userId] = (gulliMasterMap[r.userId] || 0) + 1
            }
        })

        // Helper to get formatted list
        const getRankedList = (map, isDuration = false) => {
            return Object.entries(map)
                .sort(([, a], [, b]) => b - a) // Descending
                .map(([userId, val], index) => {
                    const user = allEmployees.find(u => u.id === parseInt(userId))
                    return {
                        rank: index + 1,
                        name: user?.details ? `${user.details.firstName} ${user.details.lastName}` : 'Unknown',
                        title: user?.details?.jobTitle,
                        avatar: user?.details?.profilePic,
                        score: isDuration ? (val / (1000 * 60 * 60)).toFixed(1) + ' Hrs' : val + ' times', // Stat
                        rawValue: val
                    }
                })
        }

        const leaderboard = [
            {
                id: 'early_bird',
                title: 'The Early Bird',
                description: 'First to check-in most often',
                icon: 'sun',
                rankings: getRankedList(earlyBirdMap)
            },
            {
                id: 'iron_man',
                title: 'The Iron Man',
                description: 'Most hours clocked in',
                icon: 'dumbbell',
                rankings: getRankedList(ironManMap, true)
            },
            {
                id: 'late_latif',
                title: 'The Late Latif',
                description: 'Most frequent late arrivals',
                icon: 'clock',
                rankings: getRankedList(lateLatifMap)
            },
            {
                id: 'gulli_master',
                title: 'The Gulli Master',
                description: 'Most leaves taken',
                icon: 'plane',
                rankings: getRankedList(gulliMasterMap)
            }
        ]

        return NextResponse.json({ leaderboard })

    } catch (e) {
        console.error("Leaderboard Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
