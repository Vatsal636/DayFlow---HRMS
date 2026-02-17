import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
    try {
        const authResult = await verifyAuth(request)
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const userId = authResult.user.id
        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months') || '6')
        
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)
        
        // Get personal attendance trend
        const attendanceTrend = await prisma.attendance.groupBy({
            by: ['status', 'date'],
            where: {
                userId,
                date: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                date: 'asc'
            }
        })
        
        // Get monthly attendance summary
        const monthlyAttendance = await prisma.$queryRaw`
            SELECT 
                EXTRACT(YEAR FROM date) as year,
                EXTRACT(MONTH FROM date) as month,
                COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
                COUNT(CASE WHEN status = 'LEAVE' THEN 1 END) as on_leave,
                COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late
            FROM "Attendance"
            WHERE "userId" = ${userId}
                AND date >= ${startDate}
            GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
            ORDER BY year, month
        `
        
        // Get leave balance and usage
        const leaveBalance = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                leaveBalance: true,
                leaves: {
                    where: {
                        startDate: {
                            gte: startDate
                        }
                    },
                    select: {
                        type: true,
                        status: true,
                        daysCount: true,
                        startDate: true
                    },
                    orderBy: {
                        startDate: 'asc'
                    }
                }
            }
        })
        
        // Get salary history
        const salaryHistory = await prisma.payroll.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                month: true,
                year: true,
                netSalary: true,
                grossSalary: true,
                totalDeductions: true,
                bonus: true,
                overtime: true
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        })
        
        // Calculate attendance stats
        const totalDays = attendanceTrend.reduce((sum, item) => sum + item._count.id, 0)
        const presentDays = attendanceTrend
            .filter(item => item.status === 'PRESENT')
            .reduce((sum, item) => sum + item._count.id, 0)
        const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
        
        return NextResponse.json({
            attendanceTrend,
            monthlyAttendance,
            leaveBalance: leaveBalance?.leaveBalance || 0,
            leaveUsage: leaveBalance?.leaves || [],
            salaryHistory,
            stats: {
                totalDays,
                presentDays,
                attendanceRate: parseFloat(attendanceRate)
            },
            period: {
                months,
                startDate: startDate.toISOString(),
                endDate: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Error fetching employee analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        )
    }
}
