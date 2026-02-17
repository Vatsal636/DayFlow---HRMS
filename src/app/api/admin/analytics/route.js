import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '30')
        
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        
        // Get attendance trends
        const attendanceTrends = await prisma.attendance.groupBy({
            by: ['status', 'date'],
            where: {
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
        
        // Get department-wise attendance
        const departmentStats = await prisma.$queryRaw`
            SELECT 
                ed."department",
                COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent,
                COUNT(CASE WHEN a.status = 'LEAVE' THEN 1 END) as on_leave,
                COUNT(a.id) as total
            FROM "EmployeeDetails" ed
            LEFT JOIN "User" u ON u.id = ed."userId"
            LEFT JOIN "Attendance" a ON a."userId" = u.id 
                AND a.date >= ${startDate}
            GROUP BY ed."department"
        `
        
        // Get leave statistics
        const leaveStats = await prisma.leaveRequest.groupBy({
            by: ['type', 'status'],
            where: {
                startDate: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            }
        })
        
        // Get monthly payroll trends (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        const payrollTrends = await prisma.payroll.groupBy({
            by: ['month', 'year'],
            where: {
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            _sum: {
                netSalary: true,
                grossSalary: true,
                totalDeductions: true
            },
            _count: {
                id: true
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        })
        
        // Get employee growth
        const employeeGrowth = await prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
        
        // Top performers (by attendance)
        const topPerformers = await prisma.$queryRaw`
            SELECT 
                u."employeeId",
                ed."firstName" || ' ' || ed."lastName" as name,
                ed."department",
                COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_days,
                COUNT(a.id) as total_days,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END)::NUMERIC / 
                    NULLIF(COUNT(a.id), 0) * 100), 2
                ) as attendance_percentage
            FROM "User" u
            JOIN "EmployeeDetails" ed ON ed."userId" = u.id
            LEFT JOIN "Attendance" a ON a."userId" = u.id 
                AND a.date >= ${startDate}
            WHERE u.role = 'EMPLOYEE'
            GROUP BY u.id, u."employeeId", ed."firstName", ed."lastName", ed."department"
            HAVING COUNT(a.id) > 0
            ORDER BY attendance_percentage DESC
            LIMIT 5
        `
        
        return NextResponse.json({
            attendanceTrends,
            departmentStats,
            leaveStats,
            payrollTrends,
            employeeGrowth,
            topPerformers,
            period: {
                days,
                startDate: startDate.toISOString(),
                endDate: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Error fetching admin analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        )
    }
}
