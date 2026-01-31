import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')

        // Fetch attendance records for today with User Details
        const records = await prisma.attendance.findMany({
            where: {
                date: today
            },
            include: {
                user: {
                    include: {
                        details: true
                    }
                }
            },
            orderBy: {
                checkIn: 'desc'
            }
        })

        const mappedRecords = records.map(record => ({
            id: record.id,
            employeeId: record.user.employeeId,
            name: record.user.details ? `${record.user.details.firstName} ${record.user.details.lastName}` : "Unknown",
            avatar: record.user.details?.profilePic,
            role: record.user.details?.jobTitle || "Employee",
            department: record.user.details?.department,
            checkInTime: record.checkIn,
            checkOutTime: record.checkOut,
            status: record.status // PRESENT, ABSENT etc.
        }))

        return NextResponse.json({ attendance: mappedRecords })

    } catch (error) {
        console.error('Fetch today attendance error:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
