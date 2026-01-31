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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        })

        let presentDays = 0
        let lateDays = 0
        let totalMs = 0

        attendanceRecords.forEach(r => {
            if (r.status === 'PRESENT' || r.checkIn) presentDays++

            if (r.checkIn) {
                const checkInTime = new Date(r.checkIn)
                if (checkInTime.getHours() >= 10) {
                    if (checkInTime.getHours() > 10 || checkInTime.getMinutes() > 0) {
                        lateDays++
                    }
                }

                if (r.checkOut) {
                    totalMs += (new Date(r.checkOut) - new Date(r.checkIn))
                }
            }
        })

        const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(1)

        // Mock Leave Balance for now (or fetch if Leave model has balance)
        // We really should store leave balance in User or EmployeeDetails. 
        // For now, let's just return a static value or calculate slightly.
        const leaveBalance = 12 // Placeholder

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
