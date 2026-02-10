import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { firstName, lastName, phone, address, jobTitle, department } = body
        
        const token = request.cookies.get('token')?.value
        const payload = token ? await verifyToken(token) : null

        // Update details (and User if needed, though mostly details here)
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                details: {
                    update: {
                        firstName,
                        lastName,
                        phone,
                        address,
                        jobTitle,
                        department
                    }
                }
            },
            include: {
                details: true
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: payload?.id,
            action: AuditActions.EMPLOYEE_UPDATED,
            resource: AuditResources.EMPLOYEE,
            resourceId: id,
            details: `Updated employee: ${firstName} ${lastName}`,
            request
        })

        return NextResponse.json({ success: true, user: updatedUser })
    } catch (error) {
        console.error('Update employee error:', error)
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        const userId = parseInt(id)
        
        const token = request.cookies.get('token')?.value
        const payload = token ? await verifyToken(token) : null
        
        // Get employee name before deletion
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            include: { details: true }
        })
        
        const employeeName = employee?.details 
            ? `${employee.details.firstName} ${employee.details.lastName}`
            : employee?.employeeId || 'Unknown'

        // Delete all related records first (in correct order due to foreign key constraints)
        // Delete in a transaction to ensure all-or-nothing
        await prisma.$transaction(async (tx) => {
            // 1. Delete attendance records
            await tx.attendance.deleteMany({ where: { userId } })
            
            // 2. Delete leave requests
            await tx.leaveRequest.deleteMany({ where: { userId } })
            
            // 3. Delete payroll records
            await tx.payroll.deleteMany({ where: { userId } })
            
            // 4. Delete messages
            await tx.message.deleteMany({ where: { userId } })
            
            // 5. Delete salary structure (1-to-1, might not exist)
            await tx.salaryStructure.deleteMany({ where: { userId } })
            
            // 6. Delete employee details (1-to-1, might not exist)
            // Use deleteMany instead of delete to handle missing records gracefully
            await tx.employeeDetails.deleteMany({ where: { userId } })
            
            // 7. Delete sessions and audit logs
            await tx.session.deleteMany({ where: { userId } })
            await tx.auditLog.deleteMany({ where: { userId } })
            
            // 8. Finally delete user
            await tx.user.delete({ where: { id: userId } })
        })
        
        // Audit log (after deletion completes)
        await createAuditLog({
            userId: payload?.id,
            action: AuditActions.EMPLOYEE_DELETED,
            resource: AuditResources.EMPLOYEE,
            resourceId: id,
            details: `Deleted employee: ${employeeName} (ID: ${userId})`,
            request
        })

        return NextResponse.json({ success: true, message: 'Employee deleted successfully' })
    } catch (error) {
        console.error('Delete employee error:', error)
        return NextResponse.json({ 
            error: 'Failed to delete employee', 
            details: error.message 
        }, { status: 500 })
    }
}
