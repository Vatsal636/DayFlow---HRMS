"use client"

import { useState, useEffect } from "react"
import { Calculator, DollarSign, Sliders, AlertCircle, RefreshCw } from "lucide-react"

export default function SalarySimulatorPage() {
    const [loading, setLoading] = useState(true)

    // Inputs
    const [grossSalary, setGrossSalary] = useState(50000)
    const [sliders, setSliders] = useState({
        paidLeaves: 0,
        unpaidLeaves: 0,
        sickLeaves: 0
    })

    // Base Stats (Actuals from DB)
    const [baseStats, setBaseStats] = useState({
        unpaidLeavesTaken: 0,
        paidLeavesTaken: 0,
        daysInMonth: 30,
        monthName: 'Current Month'
    })

    // Breakdown
    const [breakdown, setBreakdown] = useState({
        basic: 0,
        hra: 0,
        da: 0,
        pf: 0,
        profTax: 0,
        totalDeductions: 0,
        netPay: 0,
        lossOfPay: 0,
        payableDays: 0
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/payroll/simulator')
            if (res.ok) {
                const data = await res.json()
                setGrossSalary(data.grossSalary)
                setBaseStats(data.stats)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Real-time Calculation Effect
    useEffect(() => {
        calculateSalary()
    }, [grossSalary, sliders, baseStats])

    const calculateSalary = () => {
        const { daysInMonth, unpaidLeavesTaken } = baseStats

        // Total Unpaid Days = Actual Unpaid + Projected Unpaid sliders
        const totalUnpaidDays = unpaidLeavesTaken + parseInt(sliders.unpaidLeaves)

        // Sundays (Auto assume 4)
        const sundays = 4

        // Payable Days Calculation
        // Easiest Logic: TotDays - Unpaid
        const payableDays = Math.max(0, daysInMonth - totalUnpaidDays)

        // Breakdown Logic (Matches Backend)
        const basic = Math.round(grossSalary * 0.5)
        const hra = Math.round(grossSalary * 0.2) // Assumption
        const da = Math.round(grossSalary * 0.1)  // Assumption
        const otherAllowances = grossSalary - (basic + hra + da)

        const pf = Math.round(basic * 0.12)
        const profTax = 200

        // Base Net (Before LoP)
        const baseNet = grossSalary - (pf + profTax)

        // Per Day Pay
        const perDayPay = baseNet / daysInMonth

        // Loss of Pay
        const lossOfPay = Math.round(perDayPay * totalUnpaidDays)

        // Final In-Hand
        const netPay = Math.max(0, baseNet - lossOfPay)

        setBreakdown({
            basic,
            hra,
            da,
            pf,
            profTax,
            totalDeductions: pf + profTax + lossOfPay,
            netPay,
            lossOfPay,
            payableDays
        })
    }

    const handleSliderChange = (e) => {
        const { name, value } = e.target
        setSliders(prev => ({ ...prev, [name]: parseInt(value) }))
    }

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Simulator...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Calculator className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Salary Simulator</h1>
                    <p className="text-slate-500">Estimate your in-hand salary for {baseStats.monthName}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Salary Input Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Gross Salary (₹)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="number"
                                value={grossSalary}
                                onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Sliders Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-blue-500" />
                            Project Additional Leaves
                        </h3>

                        {/* Unpaid Leaves Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="font-medium text-slate-700">Extra Unpaid Leaves</label>
                                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{sliders.unpaidLeaves} Days</span>
                            </div>
                            <input
                                type="range"
                                name="unpaidLeaves"
                                min="0"
                                max="15"
                                step="1"
                                value={sliders.unpaidLeaves}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-xs text-slate-400">
                                This will directly simulate deduction (LOP). You have already taken <span className="font-bold text-slate-700">{baseStats.unpaidLeavesTaken}</span> unpaid/absent days so far.
                            </p>
                        </div>

                        {/* Paid Leaves Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="font-medium text-slate-700">Extra Paid Leaves</label>
                                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{sliders.paidLeaves} Days</span>
                            </div>
                            <input
                                type="range"
                                name="paidLeaves"
                                min="0"
                                max="10"
                                step="1"
                                value={sliders.paidLeaves}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <p className="text-xs text-slate-400">Assumes you have balance. Does not affect salary unless balance is 0.</p>
                        </div>

                        {/* Sick Leaves Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="font-medium text-slate-700">Sick Leaves</label>
                                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{sliders.sickLeaves} Days</span>
                            </div>
                            <input
                                type="range"
                                name="sickLeaves"
                                min="0"
                                max="10"
                                step="1"
                                value={sliders.sickLeaves}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <p className="text-xs text-slate-400">Usually paid.</p>
                        </div>
                    </div>
                </div>

                {/* Right: Breakdown */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl sticky top-6">
                        <div className="mb-6 pb-6 border-b border-white/10 text-center">
                            <p className="text-blue-300 font-medium mb-1">Estimated In-Hand Salary</p>
                            <div className="text-4xl font-bold">₹ {breakdown.netPay.toLocaleString()}</div>
                            <div className="text-sm text-slate-400 mt-2">
                                for {breakdown.payableDays} Payable Days
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between text-slate-300">
                                <span>Basic Pay (50%)</span>
                                <span>₹ {breakdown.basic.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>HRA (20%)</span>
                                <span>₹ {breakdown.hra.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>DA (10%)</span>
                                <span>₹ {breakdown.da.toLocaleString()}</span>
                            </div>

                            <div className="h-px bg-white/10 my-4" />

                            <div className="flex justify-between text-red-300">
                                <span>PF (12% of Basic)</span>
                                <span>- ₹ {breakdown.pf.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-red-300">
                                <span>Prof. Tax</span>
                                <span>- ₹ {breakdown.profTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-red-400 bg-red-500/10 p-2 rounded-lg">
                                <span>Loss of Pay (LOP)</span>
                                <span>- ₹ {breakdown.lossOfPay.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-start gap-3 bg-white/5 p-4 rounded-xl text-xs text-slate-400">
                            <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
                            <p>This is a simulation. Actual tax deductions (TDS) and policies might vary. LOP is calculated based on Base Net / Days in Month.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
