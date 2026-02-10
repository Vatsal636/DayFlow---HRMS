import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// PUT: Mark all notifications as read
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const result = await prisma.notification.updateMany({
            where: {
                userId: payload.id,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        })

        return NextResponse.json({ 
            success: true, 
            count: result.count 
        })

    } catch (error) {
        console.error('Mark all read error:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }
}
