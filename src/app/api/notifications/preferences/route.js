import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch user's notification preferences
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId: payload.id }
        })

        // Create default preferences if not exists
        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId: payload.id }
            })
        }

        return NextResponse.json({ preferences })

    } catch (error) {
        console.error('Get preferences error:', error)
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }
}

// PUT: Update notification preferences
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const body = await request.json()
        
        // Only allow specific fields to be updated
        const allowedFields = [
            'emailLeaveUpdates',
            'emailPayrollGenerated',
            'emailAnnouncements',
            'emailAttendanceAlerts',
            'inAppLeaveUpdates',
            'inAppPayrollGenerated',
            'inAppAnnouncements',
            'inAppAttendanceAlerts'
        ]

        const updateData = {}
        for (const field of allowedFields) {
            if (typeof body[field] === 'boolean') {
                updateData[field] = body[field]
            }
        }

        const preferences = await prisma.notificationPreference.upsert({
            where: { userId: payload.id },
            create: {
                userId: payload.id,
                ...updateData
            },
            update: updateData
        })

        return NextResponse.json({ 
            success: true, 
            preferences 
        })

    } catch (error) {
        console.error('Update preferences error:', error)
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }
}
