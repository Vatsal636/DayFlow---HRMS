"use client"

import { useState, useEffect } from "react"
import { Search, DollarSign, Save, Calculator, Banknote, Calendar as CalendarIcon, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminPayrollPage() {
    const [activeTab, setActiveTab] = useState("define") // define | process

    // Define Structure State
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [wageInput, setWageInput] = useState("")
    const [salaryStructure, setSalaryStructure] = useState(null)
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Process State
    const [processMonth, setProcessMonth] = useState(new Date().getMonth())
    const [processYear, setProcessYear] = useState(new Date().getFullYear())
    const [processedPayrolls, setProcessedPayrolls] = useState([])
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        // Fetch Users
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/employees')
                if (res.ok) {
                    const data = await res.json()
                    setUsers(data.employees || [])
                    if (data.employees?.length > 0) setSelectedUser(data.employees[0])
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoadingUsers(false)
            }
        }
        fetchUsers()
    }, [])

    useEffect(() => {
        if (!selectedUser || activeTab !== "define") return

        const fetchStructure = async () => {
            setSalaryStructure(null)
            setWageInput("")
            try {
                const res = await fetch(`/api/admin/payroll/structure/get?userId=${selectedUser.id}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.structure) {
                        setSalaryStructure(data.structure)
                        setWageInput(data.structure.wage.toString())
                    }
                }
            } catch (e) { console.error(e) }
        }
        fetchStructure()
    }, [selectedUser, activeTab])

    const handleCalculate = () => {
        const wage = parseFloat(wageInput)
        if (isNaN(wage)) return

        const basic = wage * 0.50
        const hra = basic * 0.50
        const stdAllowance = 4167
        const pf = basic * 0.12
        const profTax = 200
        const performanceBonus = wage * 0.0833
        const lta = wage * 0.0833

        let fixedAllowance = wage - (basic + hra + stdAllowance + performanceBonus + lta)
        if (fixedAllowance < 0) fixedAllowance = 0

        const earnings = basic + hra + stdAllowance + performanceBonus + lta + fixedAllowance
        const deductions = pf + profTax
        const net = earnings - deductions

        setSalaryStructure({
            wage,
            basic,
            hra,
            stdAllowance,
            performanceBonus,
            lta,
            fixedAllowance,
            pf,
            profTax,
            netSalary: net
        })
    }

    const handleSave = async () => {
        if (!selectedUser || !wageInput) return
        setSaving(true)
        try {
            const res = await fetch('/api/admin/payroll/structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, wage: wageInput })
            })
            if (res.ok) {
                const data = await res.json()
                setSalaryStructure(data.salaryStructure)
                alert("Salary structure saved successfully!")
            } else {
                alert("Failed to save salary.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleProcessPayroll = async () => {
        setProcessing(true)
        try {
            const res = await fetch('/api/admin/payroll/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: processMonth, year: processYear })
            })
            if (res.ok) {
                const data = await res.json()
                setProcessedPayrolls(data.payrolls)
            } else {
                alert("Failed to process payroll")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setProcessing(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setActiveTab("define")}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === "define" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Define Salary Structure
                    {activeTab === "define" && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab("process")}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === "process" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Process Monthly Payroll
                    {activeTab === "process" && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === "define" && (
                <div className="grid lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                    {/* Sidebar List */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                            <h2 className="text-lg font-bold text-slate-900 mb-3">Employees</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selectedUser?.id === user.id ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate ${selectedUser?.id === user.id ? 'text-blue-900' : 'text-slate-900'}`}>{user.name}</p>
                                        <p className={`text-xs truncate ${selectedUser?.id === user.id ? 'text-blue-600' : 'text-slate-500'}`}>{user.employeeId}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Structure Area */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-y-auto">
                        {selectedUser ? (
                            <div className="max-w-xl mx-auto">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden mb-4">
                                        {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h1>
                                    <p className="text-slate-500 mt-1">{selectedUser.role} • {selectedUser.employeeId}</p>
                                </div>

                                {/* Input Area */}
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Gross Wage (CTC)</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="number"
                                                value={wageInput}
                                                onChange={(e) => setWageInput(e.target.value)}
                                                placeholder="e.g. 50000"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCalculate}
                                            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                                        >
                                            <Calculator className="w-5 h-5" /> Calculate
                                        </button>
                                    </div>
                                </div>

                                {/* Breakdown */}
                                {salaryStructure && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                        <h3 className="font-bold text-slate-900 text-lg">Salary Breakdown</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Earnings</p>
                                                <p className="text-xl font-bold text-emerald-900">
                                                    ₹{(salaryStructure.netSalary + salaryStructure.pf + salaryStructure.profTax).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Deductions</p>
                                                <p className="text-xl font-bold text-amber-900">
                                                    ₹{(salaryStructure.pf + salaryStructure.profTax).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                            <div className="p-4 bg-slate-50 flex justify-between font-bold text-sm text-slate-800">
                                                <span>Component</span>
                                                <span>Amount</span>
                                            </div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">Basic Salary</span> <span className="font-semibold text-slate-900">₹{salaryStructure.basic?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">HRA</span> <span className="font-semibold text-slate-900">₹{salaryStructure.hra?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">Standard Allowance</span> <span className="font-semibold text-slate-900">₹{salaryStructure.stdAllowance?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">Performance Bonus</span> <span className="font-semibold text-slate-900">₹{salaryStructure.performanceBonus?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">LTA</span> <span className="font-semibold text-slate-900">₹{salaryStructure.lta?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-slate-700">Fixed Allowance</span> <span className="font-semibold text-slate-900">₹{salaryStructure.fixedAllowance?.toFixed(2)}</span></div>

                                            <div className="p-4 bg-red-50 flex justify-between font-bold text-sm text-slate-800 mt-2">
                                                <span>Deductions</span>
                                                <span></span>
                                            </div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-red-700">Provident Fund (PF)</span> <span className="font-semibold text-red-900">- ₹{salaryStructure.pf?.toFixed(2)}</span></div>
                                            <div className="p-4 flex justify-between text-sm"><span className="font-medium text-red-700">Professional Tax</span> <span className="font-semibold text-red-900">- ₹{salaryStructure.profTax?.toFixed(2)}</span></div>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200/50">
                                            <div>
                                                <p className="text-slate-400 text-sm font-medium">Net Monthly Salary</p>
                                                <p className="text-3xl font-bold">₹{salaryStructure.netSalary?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                <Save className="w-5 h-5" />
                                                {saving ? 'Saving...' : 'Save Structure'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select an employee to define their salary structure.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "process" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Process Payroll</h2>
                                <p className="text-slate-500 mt-1">Generate monthly payslips based on attendance data</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Period</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={processMonth}
                                            onChange={(e) => setProcessMonth(parseInt(e.target.value))}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 focus:outline-none"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={processYear}
                                            onChange={(e) => setProcessYear(parseInt(e.target.value))}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 focus:outline-none"
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleProcessPayroll}
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                                >
                                    <Banknote className="w-5 h-5" />
                                    {processing ? 'Processing...' : 'Run Payroll'}
                                </button>
                            </div>
                        </div>

                        {processedPayrolls.length > 0 ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800 mb-6">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    <span className="font-medium">Success! Generated payroll for {processedPayrolls.length} employees.</span>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                                                <th className="px-6 py-4">Employee</th>
                                                <th className="px-6 py-4 text-center">Payable Days</th>
                                                <th className="px-6 py-4 text-right">Gross Wage</th>
                                                <th className="px-6 py-4 text-right">Deductions</th>
                                                <th className="px-6 py-4 text-right">Net Pay</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {processedPayrolls.map(payroll => (
                                                <tr key={payroll.id}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{payroll.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{payroll.employeeId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                            {payroll.payableDays} / {payroll.daysInMonth}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-600">
                                                        ₹{payroll.baseWage?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                        -₹{payroll.totalDeductions?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 text-lg">
                                                        ₹{payroll.netPay?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                            {payroll.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            !processing && (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                        <CalendarIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold mb-1">Ready to Process</h3>
                                    <p className="text-slate-500">Select a month and click "Run Payroll" to calculate salaries.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
