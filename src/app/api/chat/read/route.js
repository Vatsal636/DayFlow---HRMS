import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const body = await request.json()
        const { messageId } = body

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
        }

        // Get the message
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        })

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 })
        }

        // Don't mark own messages as read by self
        if (message.userId === payload.id) {
            return NextResponse.json({ success: true })
        }

        // Add current user to readBy if not already there
        if (!message.readBy.includes(payload.id)) {
            // Use set with unique values and ensure sender is never included
            const uniqueReadBy = [...new Set([...message.readBy, payload.id])]
                .filter(id => id !== message.userId) // Ensure sender is never in readBy
            
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    readBy: { set: uniqueReadBy }
                }
            })
        }

        return NextResponse.json({ success: true })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Mark all messages as read for current user
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        // Get all messages not sent by current user
        const messages = await prisma.message.findMany({
            where: {
                userId: { not: payload.id }
            }
        })

        // Update all messages to add current user to readBy if not already there
        const updatePromises = messages
            .filter(msg => !msg.readBy.includes(payload.id))
            .map(msg => {
                // Use set to ensure uniqueness and exclude sender
                const uniqueReadBy = [...new Set([...msg.readBy, payload.id])]
                    .filter(id => id !== msg.userId) // Ensure sender is never in readBy
                
                return prisma.message.update({
                    where: { id: msg.id },
                    data: {
                        readBy: { set: uniqueReadBy }
                    }
                })
            })

        await Promise.all(updatePromises)

        return NextResponse.json({ success: true, count: updatePromises.length })

    } catch (e) {
        console.error('Read receipt error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Get unread message count for current user
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        // Count messages not sent by current user and not read by them
        const unreadCount = await prisma.message.count({
            where: {
                userId: { not: payload.id },
                NOT: {
                    readBy: {
                        has: payload.id
                    }
                }
            }
        })

        return NextResponse.json({ unreadCount })

    } catch (e) {
        console.error('Unread count error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// DELETE - Cleanup endpoint: Remove sender from their own readBy arrays
export async function DELETE(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await verifyToken(token)

        // Get all messages where sender is in their own readBy array
        const messages = await prisma.message.findMany()
        
        let cleanedCount = 0
        for (const msg of messages) {
            if (msg.readBy.includes(msg.userId)) {
                // Remove sender from readBy array
                const cleanedReadBy = msg.readBy.filter(id => id !== msg.userId)
                await prisma.message.update({
                    where: { id: msg.id },
                    data: { readBy: { set: cleanedReadBy } }
                })
                cleanedCount++
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cleaned ${cleanedCount} messages`,
            cleanedCount 
        })

    } catch (e) {
        console.error('Cleanup error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
