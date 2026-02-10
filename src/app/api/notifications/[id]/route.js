import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// PUT: Mark a notification as read
export async function PUT(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const { id } = await params
        const notificationId = parseInt(id)

        const result = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: payload.id // Ensure user owns this notification
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Mark notification read error:', error)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }
}

// DELETE: Delete a notification
export async function DELETE(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const { id } = await params
        const notificationId = parseInt(id)

        const result = await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: payload.id
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Delete notification error:', error)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }
}
