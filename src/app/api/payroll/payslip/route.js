import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch payslip data for a specific employee and month
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month'))
        const year = parseInt(searchParams.get('year'))
        let userId = parseInt(searchParams.get('userId'))

        if (!month || !year) {
            return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
        }

        // If not admin, can only view own payslip
        if (payload.role !== 'ADMIN') {
            userId = payload.id
        } else if (!userId) {
            return NextResponse.json({ error: 'userId is required for admin' }, { status: 400 })
        }

        // Fetch payroll record
        const payroll = await prisma.payroll.findFirst({
            where: {
                userId,
                month,
                year
            }
        })

        if (!payroll) {
            return NextResponse.json({ error: 'Payslip not found for the specified period' }, { status: 404 })
        }

        // Fetch employee details
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                employeeId: true,
                details: {
                    select: {
                        firstName: true,
                        lastName: true,
                        department: true,
                        jobTitle: true
                    }
                },
                salary: true
            }
        })

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            employee,
            payroll,
            salary: employee.salary || {},
            month,
            year
        })

    } catch (error) {
        console.error('Payslip fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
