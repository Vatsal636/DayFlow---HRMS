import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch attendance report data
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
        const employeeId = searchParams.get('employeeId') // Optional filter

        // Date range for the month
        const startDate = new Date(Date.UTC(year, month - 1, 1))
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

        // Build where clause
        const whereClause = {
            date: {
                gte: startDate,
                lte: endDate
            }
        }

        if (employeeId) {
            const user = await prisma.user.findFirst({
                where: { employeeId }
            })
            if (user) {
                whereClause.userId = user.id
            }
        }

        // Fetch attendance records with user details
        const attendance = await prisma.attendance.findMany({
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
                { date: 'asc' },
                { userId: 'asc' }
            ]
        })

        // Calculate summary stats
        const summary = {
            totalRecords: attendance.length,
            present: attendance.filter(a => a.status === 'PRESENT').length,
            absent: attendance.filter(a => a.status === 'ABSENT').length,
            leave: attendance.filter(a => a.status === 'LEAVE').length,
            late: attendance.filter(a => a.status === 'LATE').length
        }

        // Format data for export
        const reportData = attendance.map(record => ({
            date: record.date.toISOString().split('T')[0],
            employeeId: record.user.employeeId,
            employeeName: `${record.user.details?.firstName || ''} ${record.user.details?.lastName || ''}`.trim(),
            department: record.user.details?.department || 'N/A',
            checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: record.status,
            workHours: record.checkIn && record.checkOut 
                ? ((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60)).toFixed(2)
                : '-'
        }))

        return NextResponse.json({
            success: true,
            month,
            year,
            summary,
            data: reportData
        })

    } catch (error) {
        console.error('Attendance report error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
