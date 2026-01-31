import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch today's status
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        // Get today's date in YYYY-MM-DD format (local timezone)
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId: payload.id,
                date: today
            }
        })

        return NextResponse.json({
            checkedIn: !!attendance?.checkIn,
            checkedOut: !!attendance?.checkOut,
            checkInTime: attendance?.checkIn,
            checkOutTime: attendance?.checkOut
        })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Check In
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')
        const checkInTime = new Date() // Current time with timezone

        // Check if already checked in
        const existing = await prisma.attendance.findFirst({
            where: { userId: payload.id, date: today }
        })

        if (existing) {
            return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId: payload.id,
                date: today,
                checkIn: checkInTime,
                status: 'PRESENT'
            }
        })

        return NextResponse.json({ success: true, attendance })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// PUT: Check Out
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')
        const checkOutTime = new Date() // Current time with timezone

        const existing = await prisma.attendance.findFirst({
            where: { userId: payload.id, date: today }
        })

        if (!existing) {
            return NextResponse.json({ error: 'No check-in record found for today' }, { status: 400 })
        }

        if (existing.checkOut) {
            return NextResponse.json({ error: 'Already checked out' }, { status: 400 })
        }

        const attendance = await prisma.attendance.update({
            where: { id: existing.id },
            data: {
                checkOut: checkOutTime,
                // Logic for HALF_DAY can be added later here based on hours
            }
        })

        return NextResponse.json({ success: true, attendance })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
