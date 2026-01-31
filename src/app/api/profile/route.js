import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                details: true
            }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json({
            user: {
                employeeId: user.employeeId,
                email: user.email,
                role: user.role,
                ...user.details
            }
        })

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

        // Validation: Only allow specific fields
        const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'profilePic']
        const dataToUpdate = {}

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                dataToUpdate[field] = body[field]
            }
        })

        // Upsert details (create if not exists)
        const details = await prisma.employeeDetails.upsert({
            where: { userId: payload.id },
            create: {
                userId: payload.id,
                ...dataToUpdate,
                // Default placeholders if creating for first time without these
                jobTitle: 'Employee',
                department: 'General',
                joiningDate: new Date()
            },
            update: dataToUpdate
        })

        return NextResponse.json({ success: true, details })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
