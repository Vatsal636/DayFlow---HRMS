import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch payroll report data
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

        // Build where clause
        const whereClause = {
            month,
            year
        }

        if (employeeId) {
            const user = await prisma.user.findFirst({
                where: { employeeId }
            })
            if (user) {
                whereClause.userId = user.id
            }
        }

        // Fetch payroll records with user and salary details
        const payrolls = await prisma.payroll.findMany({
            where: whereClause,
            include: {
                user: {
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
                }
            },
            orderBy: { user: { employeeId: 'asc' } }
        })

        // Calculate summary stats
        const summary = {
            totalEmployees: payrolls.length,
            totalGrossSalary: payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
            totalDeductions: payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0),
            totalNetSalary: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0)
        }

        // Format data for export
        const reportData = payrolls.map(record => ({
            employeeId: record.user.employeeId,
            employeeName: `${record.user.details?.firstName || ''} ${record.user.details?.lastName || ''}`.trim(),
            department: record.user.details?.department || 'N/A',
            designation: record.user.details?.jobTitle || 'N/A',
            basicPay: record.user.salary?.basicPay || 0,
            hra: record.user.salary?.hra || 0,
            medicalAllowance: record.user.salary?.medicalAllowance || 0,
            transportAllowance: record.user.salary?.transportAllowance || 0,
            specialAllowance: record.user.salary?.specialAllowance || 0,
            grossSalary: record.grossSalary || 0,
            workingDays: record.workingDays || 0,
            presentDays: record.presentDays || 0,
            deductions: record.deductions || 0,
            netSalary: record.netSalary || 0,
            status: record.status,
            paidAt: record.paidAt ? new Date(record.paidAt).toLocaleDateString('en-IN') : '-'
        }))

        return NextResponse.json({
            success: true,
            month,
            year,
            summary,
            data: reportData
        })

    } catch (error) {
        console.error('Payroll report error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
