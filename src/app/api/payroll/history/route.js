import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        // Get user with joining date
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: { details: true }
        })

        if (!user?.details?.joiningDate) {
            return NextResponse.json({ payrolls: [] })
        }

        const joiningDate = new Date(user.details.joiningDate)
        const joiningYear = joiningDate.getFullYear()
        const joiningMonth = joiningDate.getMonth() // 0-indexed

        // Fetch payrolls from database
        const allPayrolls = await prisma.payroll.findMany({
            where: { userId: payload.id },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        })

        // Filter payrolls to only show those after joining date
        const payrolls = allPayrolls.filter(p => {
            if (p.year > joiningYear) return true
            if (p.year === joiningYear && p.month >= joiningMonth) return true
            return false
        })

        // Get salary structure for detailed breakdown
        const salary = await prisma.salaryStructure.findUnique({
            where: { userId: payload.id }
        })

        return NextResponse.json({ 
            payrolls,
            user: {
                employeeId: user.employeeId,
                name: user.details ? `${user.details.firstName} ${user.details.lastName}` : 'Employee',
                department: user.details?.department,
                jobTitle: user.details?.jobTitle
            },
            salaryStructure: salary
        })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
