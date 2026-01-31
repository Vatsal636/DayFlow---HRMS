import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month'))
        const year = parseInt(searchParams.get('year'))

        if (isNaN(month) || isNaN(year)) {
            return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 })
        }

        const startDate = new Date(year, month, 1) // Start of month
        const endDate = new Date(year, month + 1, 0) // End of month
        endDate.setHours(23, 59, 59, 999)

        // Fetch User with Joining Date to handle range limits if needed
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: { details: true }
        })

        const attendance = await prisma.attendance.findMany({
            where: {
                userId: payload.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        return NextResponse.json({
            attendance,
            joiningDate: user?.details?.joiningDate || new Date()
        })

    } catch (e) {
        console.error("Attendance history error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
