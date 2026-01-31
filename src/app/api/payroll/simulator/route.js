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
        const month = now.getMonth()
        const year = now.getFullYear()

        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)
        const daysInMonth = endDate.getDate()

        // Fetch Salary Structure
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { salary: true }
        })

        const grossSalary = user?.salary?.wage || 50000 // Default fallback

        // Fetch Attendance Stats for Current Month
        const records = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        let unpaidLeavesTaken = 0
        let paidLeavesTaken = 0 // Assuming 'LEAVE' is paid unless specified otherwise? 
        // For simplicity: 'LEAVE' = Paid, 'ABSENT' = Unpaid.
        // The prompt says "amount of times they were absent".

        records.forEach(r => {
            if (r.status === 'ABSENT') unpaidLeavesTaken++
            if (r.status === 'LEAVE') paidLeavesTaken++
            // 'LATE' doesn't deduct salary usually unless threshold logic, skipping for now.
        })

        return NextResponse.json({
            grossSalary,
            stats: {
                unpaidLeavesTaken,
                paidLeavesTaken,
                daysInMonth,
                monthName: startDate.toLocaleString('default', { month: 'long' })
            }
        })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
