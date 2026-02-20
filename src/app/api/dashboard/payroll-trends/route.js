import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const userId = payload.id

        // Get last 6 months of payroll data
        const trends = []
        for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const month = date.getMonth()
            const year = date.getFullYear()

            const startDate = new Date(year, month, 1)
            const endDate = new Date(year, month + 1, 0)

            // Fetch attendance for the month
            const attendance = await prisma.attendance.findMany({
                where: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            })

            // Get salary structure
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { salary: true }
            })

            const salary = user?.salary
            if (!salary) continue

            // Calculate payable days (simplified)
            let presentDays = 0
            let lateDays = 0
            let leaveDays = 0

            attendance.forEach(record => {
                const dayOfWeek = new Date(record.date).getDay()
                if (dayOfWeek === 0 || dayOfWeek === 6) return

                if (record.status === 'LEAVE') {
                    leaveDays++
                } else if (record.status === 'PRESENT' || record.status === 'HALF_DAY') {
                    if (record.checkIn) {
                        const checkIn = new Date(record.checkIn)
                        const threshold = new Date(record.checkIn)
                        threshold.setHours(9, 30, 0, 0)
                        if (checkIn > threshold) {
                            lateDays++
                        } else {
                            presentDays++
                        }
                    } else {
                        presentDays++
                    }
                }
            })

            const daysInMonth = endDate.getDate()
            let weekends = 0
            for (let d = 1; d <= daysInMonth; d++) {
                const dayOfWeek = new Date(year, month, d).getDay()
                if (dayOfWeek === 0 || dayOfWeek === 6) weekends++
            }

            const payableDays = presentDays + lateDays + leaveDays + weekends
            const perDayWage = salary.wage / daysInMonth
            const grossPay = perDayWage * payableDays

            const deductions = salary.pf + salary.profTax
            const netPay = grossPay - deductions

            trends.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                grossPay: Math.round(grossPay),
                deductions: Math.round(deductions),
                netPay: Math.round(netPay),
                payableDays
            })
        }

        return NextResponse.json({ trends })

    } catch (e) {
        console.error('Payroll Trends API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
