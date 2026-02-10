import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { notifyLeaveApproved, notifyLeaveRejected } from '@/lib/notifications'

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

            // Loop through each leave date and mark attendance as LEAVE
            // Use UTC dates to avoid timezone offset issues with @db.Date
            const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
            const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

            while (current <= endUTC) {
                const dateKey = new Date(current) // Already at UTC midnight

                const existing = await prisma.attendance.findFirst({
                    where: { userId, date: dateKey }
                })

                if (existing) {
                    await prisma.attendance.update({
                        where: { id: existing.id },
                        data: { status: 'LEAVE', checkIn: null, checkOut: null }
                    })
                } else {
                    await prisma.attendance.create({
                        data: { userId, date: dateKey, status: 'LEAVE' }
                    })
                }

                current.setUTCDate(current.getUTCDate() + 1)
            }
        }
        
        // Get employee name for audit log
        const employee = await prisma.user.findUnique({
            where: { id: updatedLeave.userId },
            include: { details: true }
        })
        
        const employeeName = employee?.details 
            ? `${employee.details.firstName} ${employee.details.lastName}`
            : employee?.employeeId || 'Unknown'
        
        // Audit log
        const auditAction = status === 'APPROVED' 
            ? AuditActions.LEAVE_APPROVED 
            : status === 'REJECTED' 
            ? AuditActions.LEAVE_REJECTED 
            : 'LEAVE_UPDATED'
        
        await createAuditLog({
            userId: payload.id,
            action: auditAction,
            resource: AuditResources.LEAVE,
            resourceId: id.toString(),
            details: `${status} leave for ${employeeName} from ${new Date(updatedLeave.startDate).toLocaleDateString()} to ${new Date(updatedLeave.endDate).toLocaleDateString()}`,
            request
        })
        
        // Send notification to employee
        const leaveDetails = {
            type: updatedLeave.type,
            startDate: new Date(updatedLeave.startDate).toLocaleDateString(),
            endDate: new Date(updatedLeave.endDate).toLocaleDateString(),
            comments: comments || null
        }
        
        if (status === 'APPROVED') {
            await notifyLeaveApproved(updatedLeave.userId, leaveDetails)
        } else if (status === 'REJECTED') {
            await notifyLeaveRejected(updatedLeave.userId, leaveDetails)
        }

        return NextResponse.json({ success: true, leave: updatedLeave })

    } catch (e) {
        console.error("Leave update error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
