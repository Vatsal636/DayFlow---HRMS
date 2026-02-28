"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calculator, DollarSign, TrendingDown, AlertCircle, RefreshCw, Calendar, Users, ArrowLeft } from "lucide-react"

export default function SalarySimulatorPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    // Salary Structure from API
    const [salary, setSalary] = useState(null)
    
    // Current Month Stats
    const [currentStats, setCurrentStats] = useState({
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        approvedLeaveDays: 0,
        weekendsSoFar: 0,
        totalWeekendsInMonth: 0,
        remainingWorkingDays: 0,
        estimatedPayableDays: 0,
        realisticPayableDays: 0,
        pessimisticPayableDays: 0,
        daysInMonth: 30,
        currentDay: 1,
        remainingDaysInMonth: 29,
        monthName: 'Current Month'
    })

    // Scenario selection: 'optimistic' | 'realistic' | 'pessimistic'
    const [scenario, setScenario] = useState('optimistic')
    
    // Backend-calculated breakdowns for all scenarios
    const [optimisticBreakdown, setOptimisticBreakdown] = useState(null)
    const [realisticBreakdown, setRealisticBreakdown] = useState(null)
    const [pessimisticBreakdown, setPessimisticBreakdown] = useState(null)
    
    // Simulation Inputs - Additional days to project (manual adjustment)
    const [additionalAbsent, setAdditionalAbsent] = useState(0)
    
    // Active breakdown (based on scenario and manual adjustments)
    const [breakdown, setBreakdown] = useState({
        grossEarnings: 0,
        earnedGross: 0,
        earnedPF: 0,
        earnedProfTax: 0,
        totalDeductions: 0,
        netPay: 0,
        payableDays: 0,
        totalAbsent: 0,
        lossOfPay: 0
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/payroll/simulator')
            if (res.ok) {
                const data = await res.json()
                setSalary(data.salary)
                setCurrentStats(data.currentStats)
                
                // Store backend-calculated breakdowns
                setOptimisticBreakdown(data.optimisticBreakdown)
                setRealisticBreakdown(data.realisticBreakdown)
                setPessimisticBreakdown(data.pessimisticBreakdown)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Real-time Calculation (Uses backend breakdowns + manual adjustments)
    useEffect(() => {
        if (!salary || !optimisticBreakdown || !realisticBreakdown || !pessimisticBreakdown) return
        calculateSalary()
    }, [salary, currentStats, optimisticBreakdown, realisticBreakdown, pessimisticBreakdown, scenario, additionalAbsent])

    const calculateSalary = () => {
        // Select base breakdown based on scenario
        let baseBreakdown
        switch (scenario) {
            case 'realistic':
                baseBreakdown = realisticBreakdown
                break
            case 'pessimistic':
                baseBreakdown = pessimisticBreakdown
                break
            case 'optimistic':
            default:
                baseBreakdown = optimisticBreakdown
                break
        }
        
        // If user added manual adjustments via slider, recalculate
        if (additionalAbsent > 0) {
            const { estimatedPayableDays, daysInMonth } = currentStats
            
            // Adjust payable days based on additional absences
            const adjustedPayableDays = Math.max(0, baseBreakdown.payableDays - additionalAbsent)
            const totalAbsent = currentStats.absentDays + additionalAbsent
            
            // Recalculate with adjusted payable days
            const grossEarnings = baseBreakdown.grossSalary
            const perDayGross = grossEarnings / daysInMonth
            const earnedGross = Math.round(perDayGross * adjustedPayableDays)
            
            const perDayPF = salary.pf / daysInMonth
            const earnedPF = Math.round(perDayPF * adjustedPayableDays)
            const earnedProfTax = adjustedPayableDays >= 20 ? salary.profTax : 0
            
            const totalDeductions = earnedPF + earnedProfTax
            const netPay = earnedGross - totalDeductions
            
            const fullMonthNet = grossEarnings - salary.pf - salary.profTax
            const lossOfPay = fullMonthNet - netPay
            
            setBreakdown({
                grossEarnings,
                earnedGross,
                earnedPF,
                earnedProfTax,
                totalDeductions,
                netPay,
                payableDays: adjustedPayableDays,
                totalAbsent,
                lossOfPay
            })
        } else {
            // Use backend breakdown directly
            setBreakdown({
                grossEarnings: baseBreakdown.grossSalary,
                earnedGross: baseBreakdown.earnedGross,
                earnedPF: baseBreakdown.pfDeduction,
                earnedProfTax: baseBreakdown.profTaxDeduction,
                totalDeductions: baseBreakdown.totalDeductions,
                netPay: baseBreakdown.netPay,
                payableDays: baseBreakdown.payableDays,
                totalAbsent: currentStats.absentDays,
                lossOfPay: baseBreakdown.lossOfPay
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-slate-500">Loading Simulator...</p>
                </div>
            </div>
        )
    }

    if (!salary) {
        return (
            <div className="text-center p-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-slate-600">Failed to load salary data</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Back Button */}
            <button
                onClick={() => router.push('/dashboard/payroll')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Payroll</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
                    <Calculator className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Salary Simulator</h1>
                    <p className="text-slate-500">Estimate your in-hand salary for {currentStats.monthName}</p>
                </div>
            </div>

            {/* Current Status Timeline - FIRST */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl">
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                        <p className="text-blue-900 font-semibold text-lg">Today is Day {currentStats.currentDay} of {currentStats.daysInMonth} days in {currentStats.monthName}</p>
                        <p className="text-blue-700 mt-1">You have <span className="font-bold">{currentStats.remainingDaysInMonth} days remaining</span> ({currentStats.remainingWorkingDays} working days, assuming present)</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SCENARIO SELECTOR - NEW */}
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Projection Mode</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setScenario('optimistic')}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    scenario === 'optimistic'
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-md'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <TrendingDown className={`w-5 h-5 ${scenario === 'optimistic' ? 'text-green-600' : 'text-slate-500'}`} />
                                    <span className={`font-bold text-sm ${scenario === 'optimistic' ? 'text-green-700' : 'text-slate-600'}`}>
                                        Best Case
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Perfect future attendance</p>
                            </button>
                            
                            <button
                                onClick={() => setScenario('realistic')}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    scenario === 'realistic'
                                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Calculator className={`w-5 h-5 ${scenario === 'realistic' ? 'text-blue-600' : 'text-slate-500'}`} />
                                    <span className={`font-bold text-sm ${scenario === 'realistic' ? 'text-blue-700' : 'text-slate-600'}`}>
                                        Realistic
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Based on your attendance rate</p>
                            </button>
                            
                            <button
                                onClick={() => setScenario('pessimistic')}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    scenario === 'pessimistic'
                                        ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400 shadow-md'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <AlertCircle className={`w-5 h-5 ${scenario === 'pessimistic' ? 'text-red-600' : 'text-slate-500'}`} />
                                    <span className={`font-bold text-sm ${scenario === 'pessimistic' ? 'text-red-700' : 'text-slate-600'}`}>
                                        Worst Case
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">No future attendance</p>
                            </button>
                        </div>
                    </div>

                    {/* SIMULATOR - Main Feature */}
                    <div className="bg-white border-2 border-blue-200 p-5 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg">
                                <Calculator className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">Salary Projection Simulator</h3>
                                <p className="text-slate-600 text-xs">Estimate your net pay for {currentStats.monthName}</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Slider Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="font-semibold text-slate-700 text-sm">Project Additional Absent Days</label>
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md">
                                        <span className="text-2xl font-bold">{additionalAbsent}</span>
                                        <span className="text-xs ml-1.5 opacity-90">days</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={currentStats.remainingWorkingDays}
                                    step="1"
                                    value={additionalAbsent}
                                    onChange={(e) => setAdditionalAbsent(parseInt(e.target.value))}
                                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                                    style={{
                                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(additionalAbsent / currentStats.remainingWorkingDays) * 100}%, #e2e8f0 ${(additionalAbsent / currentStats.remainingWorkingDays) * 100}%, #e2e8f0 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                    <span>0 (Best Case)</span>
                                    <span>Max: {currentStats.remainingWorkingDays} (Worst Case)</span>
                                </div>
                            </div>

                            {/* Comparison Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg">
                                    <p className="text-[11px] font-medium text-blue-700 mb-1">Currently Absent</p>
                                    <p className="text-2xl font-bold text-blue-600">{currentStats.absentDays}</p>
                                    <p className="text-[9px] text-blue-600 mt-0.5">days so far</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 p-3 rounded-lg">
                                    <p className="text-[11px] font-medium text-red-700 mb-1">Total If Applied</p>
                                    <p className="text-2xl font-bold text-red-600">{breakdown.totalAbsent}</p>
                                    <p className="text-[9px] text-red-600 mt-0.5">estimated total</p>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className={`border-l-4 p-3 rounded-r-lg ${
                                scenario === 'optimistic' ? 'bg-green-50 border-green-400' :
                                scenario === 'realistic' ? 'bg-blue-50 border-blue-400' :
                                'bg-red-50 border-red-400'
                            }`}>
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                        scenario === 'optimistic' ? 'text-green-600' :
                                        scenario === 'realistic' ? 'text-blue-600' :
                                        'text-red-600'
                                    }`} />
                                    <p className={`text-xs ${
                                        scenario === 'optimistic' ? 'text-green-900' :
                                        scenario === 'realistic' ? 'text-blue-900' :
                                        'text-red-900'
                                    }`}>
                                        {scenario === 'optimistic' && (
                                            <>Assumes remaining <strong>{currentStats.remainingWorkingDays} working days</strong> as present. Use slider to project additional absences.</>
                                        )}
                                        {scenario === 'realistic' && (
                                            <>Projects future attendance based on your <strong>current attendance rate</strong>. More accurate than best-case scenario.</>
                                        )}
                                        {scenario === 'pessimistic' && (
                                            <>Assumes <strong>no future attendance</strong>. Only counts days already completed. Worst-case scenario.</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Stats */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-4 text-sm">Current Month Status</h4>
                        <div className="grid grid-cols-5 gap-3">
                            <StatsCard label="Present" value={currentStats.presentDays} color="green" />
                            <StatsCard label="Late" value={currentStats.lateDays} color="orange" />
                            <StatsCard label="Leave" value={currentStats.approvedLeaveDays} color="purple" />
                            <StatsCard label="Absent" value={currentStats.absentDays} color="red" />
                            <StatsCard label="Weekends" value={currentStats.weekendsSoFar} color="slate" />
                        </div>
                    </div>

                    {/* Calculation Formula */}
                    <div className={`border p-5 rounded-xl ${
                        scenario === 'optimistic' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                        scenario === 'realistic' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
                        'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                        <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <span>📊</span> {
                                scenario === 'optimistic' ? 'Optimistic' :
                                scenario === 'realistic' ? 'Realistic' :
                                'Pessimistic'
                            } Payable Days Formula
                        </h4>
                        <div className="flex items-center justify-center gap-2 text-lg font-bold flex-wrap">
                            {scenario === 'optimistic' && (
                                <>
                                    <span className="text-green-600">{currentStats.presentDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-orange-600">{currentStats.lateDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-purple-600">{currentStats.approvedLeaveDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-blue-600">{currentStats.remainingWorkingDays} <span className="text-xs">(future)</span></span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-slate-600">{currentStats.totalWeekendsInMonth} <span className="text-xs">(weekends)</span></span>
                                    <span className="text-slate-400">=</span>
                                    <span className="bg-green-600 text-white px-4 py-2 rounded-lg">{currentStats.estimatedPayableDays}</span>
                                </>
                            )}
                            {scenario === 'realistic' && (
                                <>
                                    <span className="text-blue-600">{currentStats.presentDays + currentStats.lateDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-purple-600">{currentStats.approvedLeaveDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-indigo-600">~{currentStats.realisticPayableDays - (currentStats.presentDays + currentStats.lateDays + currentStats.approvedLeaveDays)} <span className="text-xs">(projected)</span></span>
                                    <span className="text-slate-400">=</span>
                                    <span className="bg-blue-600 text-white px-4 py-2 rounded-lg">{currentStats.realisticPayableDays}</span>
                                </>
                            )}
                            {scenario === 'pessimistic' && (
                                <>
                                    <span className="text-red-600">{currentStats.presentDays + currentStats.lateDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-purple-600">{currentStats.approvedLeaveDays}</span>
                                    <span className="text-slate-400">+</span>
                                    <span className="text-slate-600">{currentStats.weekendsSoFar} <span className="text-xs">(weekends)</span></span>
                                    <span className="text-slate-400">=</span>
                                    <span className="bg-red-600 text-white px-4 py-2 rounded-lg">{currentStats.pessimisticPayableDays}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CTC Display */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-5 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Your Monthly CTC
                        </h4>
                        <div className="text-3xl font-bold text-blue-600 mb-4">
                            ₹ {salary.wage.toLocaleString()}
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-slate-600 text-xs">Basic</p>
                                <p className="font-bold text-slate-800">₹ {salary.basic.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-slate-600 text-xs">HRA</p>
                                <p className="font-bold text-slate-800">₹ {salary.hra.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-slate-600 text-xs">Special</p>
                                <p className="font-bold text-slate-800">₹ {salary.stdAllowance.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-slate-600 text-xs">Other</p>
                                <p className="font-bold text-slate-800">₹ {((salary.performanceBonus || 0) + (salary.lta || 0) + (salary.fixedAllowance || 0)).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Salary Breakdown */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-2xl sticky top-6">
                        {/* Net Pay Display */}
                        <div className="mb-6 pb-6 border-b border-white/10 text-center">
                            <p className="text-blue-300 font-medium mb-2">Estimated Net Pay</p>
                            <div className="text-5xl font-bold text-white mb-2">
                                ₹ {breakdown.netPay.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-400">
                                for {breakdown.payableDays} payable days
                            </div>
                        </div>

                        {/* Earnings Breakdown */}
                        <div className="space-y-3 text-sm mb-6">
                            <p className="font-semibold text-green-300 mb-2">Earnings</p>
                            <div className="flex justify-between text-slate-300">
                                <span>Gross Earnings</span>
                                <span className="font-semibold">₹ {breakdown.grossEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-green-300 font-medium bg-green-500/10 p-2 rounded-lg">
                                <span>Earned This Month</span>
                                <span>₹ {breakdown.earnedGross.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Deductions Breakdown */}
                        <div className="space-y-3 text-sm mb-6 pb-6 border-b border-white/10">
                            <p className="font-semibold text-red-300 mb-2">Deductions</p>
                            <div className="flex justify-between text-slate-300">
                                <span>EPF (12% of Basic)</span>
                                <span>- ₹ {breakdown.earnedPF.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Professional Tax</span>
                                <span>- ₹ {breakdown.earnedProfTax.toLocaleString()}</span>
                            </div>
                            {breakdown.lossOfPay > 0 && (
                                <div className="flex justify-between font-bold text-red-400 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                                    <span>Loss of Pay (LOP)</span>
                                    <span>- ₹ {breakdown.lossOfPay.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="space-y-2 text-sm">
                            <p className="font-semibold text-blue-300 mb-3">Status Summary</p>
                            <div className="flex justify-between text-slate-400">
                                <span>Total Days in Month</span>
                                <span>{currentStats.daysInMonth}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Current Day</span>
                                <span>Day {currentStats.currentDay}</span>
                            </div>
                            <div className="flex justify-between text-green-300">
                                <span>Present (On-time)</span>
                                <span>{currentStats.presentDays}</span>
                            </div>
                            <div className="flex justify-between text-orange-300">
                                <span>Late Check-ins</span>
                                <span>{currentStats.lateDays}</span>
                            </div>
                            <div className="flex justify-between text-purple-300">
                                <span>Leave Days Taken</span>
                                <span>{currentStats.approvedLeaveDays}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Weekends So Far</span>
                                <span>{currentStats.weekendsSoFar}</span>
                            </div>
                            <div className="flex justify-between text-slate-300 font-medium">
                                <span>Total Weekends (Auto-paid)</span>
                                <span>{currentStats.totalWeekendsInMonth}</span>
                            </div>
                            <div className="h-px bg-white/20 my-3" />
                            <div className="flex justify-between text-blue-300">
                                <span>Estimated Payable</span>
                                <span>{currentStats.estimatedPayableDays}</span>
                            </div>
                            <div className="flex justify-between text-blue-200 text-xs">
                                <span className="italic">↳ Assumes {currentStats.remainingWorkingDays} future days present</span>
                            </div>
                            <div className="flex justify-between text-red-300">
                                <span>Actual Absent Days</span>
                                <span>{currentStats.absentDays}</span>
                            </div>
                            {additionalAbsent > 0 && (
                                <div className="flex justify-between text-red-400 font-bold bg-red-500/20 p-2 rounded-lg">
                                    <span>Projected Additional Absent</span>
                                    <span>+{additionalAbsent}</span>
                                </div>
                            )}
                            <div className="h-px bg-white/20 my-3" />
                            <div className="flex justify-between text-green-300 font-bold text-base">
                                <span>Final Payable Days</span>
                                <span>{breakdown.payableDays}</span>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="flex items-start gap-3 text-xs text-slate-400">
                                <AlertCircle className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                                <p>
                                    This simulator uses the <strong>same calculation engine</strong> as payroll generation. 
                                    Three projection modes available: <strong>Best Case</strong> (perfect attendance), 
                                    <strong>Realistic</strong> (based on your rate), and <strong>Worst Case</strong> (no future attendance). 
                                    Slider allows manual adjustments for specific scenarios.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatsCard({ label, value, color }) {
    const colors = {
        green: 'bg-green-50 border-green-200 text-green-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        slate: 'bg-slate-50 border-slate-200 text-slate-700'
    }

    return (
        <div className={`${colors[color]} p-3 rounded-lg border text-center`}>
            <p className="text-[10px] font-medium opacity-75 mb-0.5">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    )
}
