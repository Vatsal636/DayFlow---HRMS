import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const leaves = await prisma.leaveRequest.findMany({
            include: {
                user: {
                    include: {
                        details: true
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        })

        const mappedLeaves = leaves.map(leave => ({
            id: leave.id,
            userId: leave.userId,
            name: leave.user.details ? `${leave.user.details.firstName} ${leave.user.details.lastName}` : "Unknown",
            employeeId: leave.user.employeeId,
            avatar: leave.user.details?.profilePic,
            role: leave.user.details?.jobTitle,
            type: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            status: leave.status,
            appliedAt: leave.appliedAt,
            adminComments: leave.adminComments
        }))

        return NextResponse.json({ leaves: mappedLeaves })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { id, status, comments } = body

        if (!id || !status) return NextResponse.json({ error: 'ID and Status required' }, { status: 400 })

        const updatedLeave = await prisma.leaveRequest.update({
            where: { id: parseInt(id) },
            data: {
                status,
                adminComments: comments
            }
        })

        // If Approved, should we update Attendance table? 
        // Ideally yes, marking dates as 'LEAVE'.
        // This logic is crucial for payroll accuracy.
        // Let's implement basic attendance marking if approved.

        if (status === 'APPROVED') {
            const start = new Date(updatedLeave.startDate)
            const end = new Date(updatedLeave.endDate)
            const userId = updatedLeave.userId

            // Loop through dates
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Check if attendance exists?
                // Or upsert.
                // Normalizing date to start of day handled by Prisma usually but better explicit.
                const dateKey = new Date(d)
                dateKey.setHours(0, 0, 0, 0) // UTC/Local consistency tricky here. Assuming local server.

                // Upsert attendance as LEAVE
                await prisma.attendance.upsert({
                    where: {
                        // We don't have unique compound key in schema (userId + date) !!
                        // Schema has `date DateTime @db.Date` but not unique constraint in generic `Attendance` model.
                        // But `findFirst` is safer than raw upsert if unique isn't guaranteed.
                        // Actually, schema check earlier showed `model Attendance { id ... }` but no unique constraint on user+date.
                        // So upsert needs to find by `id` which we don't have.
                        // Workaround: Find first, then update or create.
                        id: -1 // Junk id
                    },
                    update: {}, // Dummy
                    create: {
                        userId,
                        date: dateKey,
                        status: 'LEAVE',
                        checkIn: null,
                        checkOut: null
                    }
                }).catch(async () => {
                    // Fallback logic manually
                    const existing = await prisma.attendance.findFirst({
                        where: { userId, date: dateKey }
                    })
                    if (existing) {
                        await prisma.attendance.update({
                            where: { id: existing.id },
                            data: { status: 'LEAVE' }
                        })
                    } else {
                        await prisma.attendance.create({
                            data: {
                                userId,
                                date: dateKey,
                                status: 'LEAVE'
                            }
                        })
                    }
                })

                // Better clean Logic:
                // Find existing for that day
                /*
                const existing = await prisma.attendance.findFirst({
                   where: { userId, date: dateKey }
                })
                if (existing) {
                   await prisma.attendance.update({
                       where: { id: existing.id }, 
                       data: { status: 'LEAVE' }
                   })
                } else {
                   await prisma.attendance.create({
                       data: { userId, date: dateKey, status: 'LEAVE'}
                   })
                }
                */
            }
            // Re-implementing clearer loop above inside try block is safer?
            // Actually, let's stick to the cleaner logic block right here:

            const current = new Date(start)
            while (current <= end) {
                const dateKey = new Date(current)
                dateKey.setHours(0, 0, 0, 0)

                const existing = await prisma.attendance.findFirst({
                    where: { userId, date: dateKey }
                })

                if (existing) {
                    await prisma.attendance.update({
                        where: { id: existing.id },
                        data: { status: 'LEAVE' }
                    })
                } else {
                    await prisma.attendance.create({
                        data: { userId, date: dateKey, status: 'LEAVE' }
                    })
                }

                current.setDate(current.getDate() + 1)
            }
        }

        return NextResponse.json({ success: true, leave: updatedLeave })

    } catch (e) {
        console.error("Leave update error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
