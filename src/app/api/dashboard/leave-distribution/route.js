import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const userId = payload.id

        // Get current year's approved leaves
        const currentYear = new Date().getFullYear()
        const yearStart = new Date(currentYear, 0, 1)
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

        const leaves = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: 'APPROVED',
                startDate: {
                    gte: yearStart,
                    lte: yearEnd
                }
            },
            select: {
                type: true,
                startDate: true,
                endDate: true
            }
        })

        // Count days per leave type
        const distribution = {
            'Sick Leave': 0,
            'Paid Leave': 0,
            'Unpaid Leave': 0
        }

        leaves.forEach(leave => {
            const start = new Date(leave.startDate)
            const end = new Date(leave.endDate)
            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1

            // Normalize leave type (case-insensitive matching)
            const type = (leave.type || '').toLowerCase()
            
            // Check unpaid BEFORE paid (since "unpaid" contains "paid")
            if (type.includes('sick')) {
                distribution['Sick Leave'] += days
            } else if (type.includes('unpaid')) {
                distribution['Unpaid Leave'] += days
            } else if (type.includes('paid')) {
                distribution['Paid Leave'] += days
            }
        })

        // Convert to array format for charts
        const chartData = Object.entries(distribution)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value }))

        return NextResponse.json({ 
            distribution: chartData,
            total: Object.values(distribution).reduce((a, b) => a + b, 0)
        })

    } catch (e) {
        console.error('Leave Distribution API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
