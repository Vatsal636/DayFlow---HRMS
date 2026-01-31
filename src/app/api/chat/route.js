import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        const messages = await prisma.message.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    include: {
                        details: true
                    }
                }
            }
        })

        const sortedMessages = messages.reverse().map(msg => ({
            id: msg.id,
            content: msg.content,
            userId: msg.userId,
            senderName: msg.user.role === 'ADMIN'
                ? 'Admin'
                : (msg.user.details ? `${msg.user.details.firstName} ${msg.user.details.lastName}` : 'Unknown'),
            senderRole: msg.user.role,
            avatar: msg.user.details?.profilePic,
            createdAt: msg.createdAt,
            isEdited: msg.isEdited,
            editedAt: msg.editedAt,
            readBy: msg.readBy || [],
            isMe: msg.userId === payload.id
        }))

        console.log('Messages with readBy:', sortedMessages.map(m => ({ id: m.id, readBy: m.readBy, isMe: m.isMe })))

        return NextResponse.json({ 
            messages: sortedMessages,
            currentUserId: payload.id
        })

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
        const { content } = body

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                userId: payload.id
            },
            include: {
                user: {
                    include: { details: true }
                }
            }
        })

        const formattedMessage = {
            id: message.id,
            content: message.content,
            userId: message.userId,
            senderName: message.user.role === 'ADMIN'
                ? 'Admin'
                : (message.user.details ? `${message.user.details.firstName} ${message.user.details.lastName}` : 'Unknown'),
            senderRole: message.user.role,
            avatar: message.user.details?.profilePic,
            createdAt: message.createdAt
        }

        return NextResponse.json({ success: true, message: formattedMessage })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const body = await request.json()
        const { messageId, content } = body

        if (!messageId || !content || !content.trim()) {
            return NextResponse.json({ error: 'Message ID and content required' }, { status: 400 })
        }

        // Check if message belongs to user
        const existingMessage = await prisma.message.findUnique({
            where: { id: messageId }
        })

        if (!existingMessage) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 })
        }

        if (existingMessage.userId !== payload.id) {
            return NextResponse.json({ error: 'Cannot edit others messages' }, { status: 403 })
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { 
                content: content.trim(),
                isEdited: true,
                editedAt: new Date()
            },
            include: {
                user: {
                    include: { details: true }
                }
            }
        })

        return NextResponse.json({ success: true, message: updatedMessage })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const { searchParams } = new URL(request.url)
        const messageId = parseInt(searchParams.get('id'))

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
        }

        const existingMessage = await prisma.message.findUnique({
            where: { id: messageId }
        })

        if (!existingMessage) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 })
        }

        if (existingMessage.userId !== payload.id && payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Cannot delete others messages' }, { status: 403 })
        }

        await prisma.message.delete({
            where: { id: messageId }
        })

        return NextResponse.json({ success: true })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
