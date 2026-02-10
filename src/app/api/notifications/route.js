import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch user's notifications
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit')) || 20
        const offset = parseInt(searchParams.get('offset')) || 0
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const where = {
            userId: payload.id,
            ...(unreadOnly && { isRead: false })
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: {
                    userId: payload.id,
                    isRead: false
                }
            })
        ])

        return NextResponse.json({
            notifications,
            total,
            unreadCount,
            hasMore: offset + notifications.length < total
        })

    } catch (error) {
        console.error('Get notifications error:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}
