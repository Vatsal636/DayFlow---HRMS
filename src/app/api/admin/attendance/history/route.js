import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        // 1. Auth Check (Admin)
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const userId = parseInt(searchParams.get('userId'))
        const month = parseInt(searchParams.get('month'))
        const year = parseInt(searchParams.get('year'))

        if (isNaN(userId) || isNaN(month) || isNaN(year)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
        }

        const startDate = new Date(year, month, 1) // Start of month
        const endDate = new Date(year, month + 1, 0) // End of month
        endDate.setHours(23, 59, 59, 999)

        // Fetch Target User with Joining Date
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { details: true }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const attendance = await prisma.attendance.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        return NextResponse.json({
            attendance,
            joiningDate: targetUser?.details?.joiningDate || new Date()
        })

    } catch (e) {
        console.error("Admin attendance history error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
