import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch leave report data
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear()
        const status = searchParams.get('status') // PENDING, APPROVED, REJECTED
        const employeeId = searchParams.get('employeeId') // Optional filter

        // Date range for the month
        const startDate = new Date(Date.UTC(year, month - 1, 1))
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

        // Build where clause
        const whereClause = {
            OR: [
                {
                    startDate: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                {
                    endDate: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                {
                    AND: [
                        { startDate: { lte: startDate } },
                        { endDate: { gte: endDate } }
                    ]
                }
            ]
        }

        if (status) {
            whereClause.status = status
        }

        if (employeeId) {
            const user = await prisma.user.findFirst({
                where: { employeeId }
            })
            if (user) {
                whereClause.userId = user.id
            }
        }

        // Fetch leave records with user details
        const leaves = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        employeeId: true,
                        details: {
                            select: {
                                firstName: true,
                                lastName: true,
                                department: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { appliedAt: 'desc' }
            ]
        })

        // Calculate days between dates
        const calculateDays = (start, end) => {
            const startD = new Date(start)
            const endD = new Date(end)
            return Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1
        }

        // Calculate summary stats
        const summary = {
            totalRequests: leaves.length,
            pending: leaves.filter(l => l.status === 'PENDING').length,
            approved: leaves.filter(l => l.status === 'APPROVED').length,
            rejected: leaves.filter(l => l.status === 'REJECTED').length,
            totalDays: leaves.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0),
            byType: {
                PAID: leaves.filter(l => l.type === 'PAID' && l.status === 'APPROVED').length,
                SICK: leaves.filter(l => l.type === 'SICK' && l.status === 'APPROVED').length,
                UNPAID: leaves.filter(l => l.type === 'UNPAID' && l.status === 'APPROVED').length,
                CASUAL: leaves.filter(l => l.type === 'CASUAL' && l.status === 'APPROVED').length
            }
        }

        // Format data for export
        const reportData = leaves.map(record => ({
            employeeId: record.user.employeeId,
            employeeName: `${record.user.details?.firstName || ''} ${record.user.details?.lastName || ''}`.trim(),
            department: record.user.details?.department || 'N/A',
            leaveType: record.type,
            startDate: new Date(record.startDate).toLocaleDateString('en-IN'),
            endDate: new Date(record.endDate).toLocaleDateString('en-IN'),
            days: calculateDays(record.startDate, record.endDate),
            reason: record.reason || '-',
            status: record.status,
            adminComments: record.adminComments || '-',
            appliedAt: new Date(record.appliedAt).toLocaleDateString('en-IN')
        }))

        return NextResponse.json({
            success: true,
            month,
            year,
            summary,
            data: reportData
        })

    } catch (error) {
        console.error('Leave report error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
