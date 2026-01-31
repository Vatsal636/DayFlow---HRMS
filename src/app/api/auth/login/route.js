import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(request) {
    try {
        const { loginId, password } = await request.json()

        // LoginID can be email OR employeeId
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginId },
                    { employeeId: loginId }
                ]
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Generate Request
        const token = await signToken({
            id: user.id,
            role: user.role,
            firstLogin: user.firstLogin
        })

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                role: user.role,
                firstLogin: user.firstLogin,
                name: user.details?.firstName || 'User' // We might need to fetch details if not eager loaded (Prisma doesn't auto-fetch relations unless included)
            }
        })

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
