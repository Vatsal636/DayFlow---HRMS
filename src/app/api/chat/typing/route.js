import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// In-memory store for typing status (for simplicity)
// In production, use Redis or similar
const typingUsers = new Map()

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const body = await request.json()
        const { isTyping } = body

        if (isTyping) {
            typingUsers.set(payload.id, {
                id: payload.id,
                name: payload.role === 'ADMIN' ? 'Admin' : 'User',
                timestamp: Date.now()
            })
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                typingUsers.delete(payload.id)
            }, 3000)
        } else {
            typingUsers.delete(payload.id)
        }

        return NextResponse.json({ success: true })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        // Clean up stale typing indicators (older than 5 seconds)
        const now = Date.now()
        for (const [userId, data] of typingUsers.entries()) {
            if (now - data.timestamp > 5000) {
                typingUsers.delete(userId)
            }
        }

        // Return typing users except current user
        const typing = Array.from(typingUsers.values())
            .filter(user => user.id !== payload.id)

        return NextResponse.json({ typing })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
