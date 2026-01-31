import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const { newPassword } = await request.json()
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: payload.id },
            data: {
                password: hashedPassword,
                firstLogin: false
            }
        })

        return NextResponse.json({ success: true, message: 'Password updated' })

    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }
}
