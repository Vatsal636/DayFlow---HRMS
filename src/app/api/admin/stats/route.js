import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        // Parallelize queries for speed
        const [employeeCount, activeNow, pendingLeaves] = await Promise.all([
            prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
            prisma.attendance.count({
                where: {
                    date: new Date(), // Today
                    status: 'PRESENT'
                }
            }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } })
        ])

        return NextResponse.json({
            stats: [
                { label: 'Total Employees', value: employeeCount, change: '+2 this month', icon: 'Users' },
                { label: 'Present Today', value: activeNow, change: `${Math.round((activeNow / employeeCount) * 100 || 0)}% attendance`, icon: 'UserCheck' },
                { label: 'Pending Leaves', value: pendingLeaves, change: 'Action required', icon: 'Clock' },
                { label: 'Payroll Status', value: 'Pending', change: 'Due in 5 days', icon: 'Banknote' },
            ]
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
