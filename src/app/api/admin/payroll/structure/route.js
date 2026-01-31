import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { userId, wage } = body

        if (!userId || !wage) {
            return NextResponse.json({ error: 'Missing userId or wage' }, { status: 400 })
        }

        const wageVal = parseFloat(wage)

        // Calculation Logic
        const basic = wageVal * 0.50
        const hra = basic * 0.50
        const stdAllowance = 4167 // Fixed
        const pf = basic * 0.12
        const profTax = 200 // Fixed

        // Performance Bonus: 8.33% of Basic? Or Wage? Plan said Wage initially but industry often Basic.
        // Prompt flow assumes simple % calc. Let's use 8.33% of Basic as mostly standard for bonus calc base.
        // Re-reading plan: "8.33% of Wage (Assumption based on example relative to Wage, or Basic? Will clarify code-side, defaulting to % of Wage"
        // Let's stick to % of Wage if previously stated, or standard.
        // If Basic is 50% of wage, then 8.33% of Wage is equal to 16.66% of Basic.
        // Let's use 8.33% of Wage (Gross) to be generous/simple as per plan text.
        const performanceBonus = wageVal * 0.0833
        const lta = wageVal * 0.0833 // Similar assumption

        // Fixed Allowance as balancing figure
        // Total Components so far: Basic + HRA + StdAllow + PerfBonus + LTA
        const currentTotal = basic + hra + stdAllowance + performanceBonus + lta
        let fixedAllowance = wageVal - currentTotal

        // Safety check if wage is too low for fixed structure
        if (fixedAllowance < 0) fixedAllowance = 0;

        const totalEarnings = basic + hra + stdAllowance + performanceBonus + lta + fixedAllowance
        const totalDeductions = pf + profTax
        const netSalary = totalEarnings - totalDeductions

        const salaryStructure = await prisma.salaryStructure.upsert({
            where: { userId: parseInt(userId) },
            update: {
                wage: wageVal,
                basic,
                hra,
                stdAllowance,
                performanceBonus,
                lta,
                fixedAllowance,
                pf,
                profTax,
                netSalary
            },
            create: {
                userId: parseInt(userId),
                wage: wageVal,
                basic,
                hra,
                stdAllowance,
                performanceBonus,
                lta,
                fixedAllowance,
                pf,
                profTax,
                netSalary
            }
        })

        return NextResponse.json({ success: true, salaryStructure })

    } catch (e) {
        console.error("Salary structure update error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
