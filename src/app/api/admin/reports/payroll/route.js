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

        // Convert month from 1-indexed (frontend) to 0-indexed (database)
        // Frontend: January=1, Backend: January=0
        const dbMonth = month - 1

        // Build where clause
        const whereClause = {
            month: dbMonth,
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
            totalGrossSalary: payrolls.reduce((sum, p) => sum + (p.totalEarnings || 0), 0),
            totalDeductions: payrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
            totalNetSalary: payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)
        }

        // Format data for export
        const reportData = payrolls.map(record => {
            const salary = record.user.salary
            return {
                employeeId: record.user.employeeId,
                employeeName: `${record.user.details?.firstName || ''} ${record.user.details?.lastName || ''}`.trim(),
                department: record.user.details?.department || 'N/A',
                designation: record.user.details?.jobTitle || 'N/A',
                basicPay: salary?.basic || 0,
                hra: salary?.hra || 0,
                medicalAllowance: salary?.stdAllowance || 0,
                transportAllowance: salary?.performanceBonus || 0,
                specialAllowance: salary?.lta || 0,
                grossSalary: record.totalEarnings || 0,
                deductions: record.totalDeductions || 0,
                netSalary: record.netPay || 0,
                status: record.status
            }
        })

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
