import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (userId) {
            const structure = await prisma.salaryStructure.findUnique({
                where: { userId: parseInt(userId) }
            })
            return NextResponse.json({ structure })
        }

        // List all structures? Or just return null. Main usage is by ID.
        return NextResponse.json({ structure: null })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
