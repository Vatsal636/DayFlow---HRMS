import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        const leaves = await prisma.leaveRequest.findMany({
            where: { userId: payload.id },
            orderBy: { appliedAt: 'desc' }
        })

        return NextResponse.json({ leaves })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const body = await request.json()
        const { type, startDate, endDate, reason } = body

        if (!type || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end < start) {
            return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 })
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                userId: payload.id,
                type,
                startDate: start,
                endDate: end,
                reason
            }
        })

        return NextResponse.json({ success: true, leave })

    } catch (e) {
        console.error("Leave application error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
