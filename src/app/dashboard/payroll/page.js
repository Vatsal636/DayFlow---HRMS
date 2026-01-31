"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DollarSign, Calendar, Download, ChevronRight, FileText, Calculator, Building2, User, Briefcase } from "lucide-react"

export default function PayrollPage() {
    const [payrolls, setPayrolls] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPayroll, setSelectedPayroll] = useState(null)
    const [userInfo, setUserInfo] = useState(null)
    const [salaryStructure, setSalaryStructure] = useState(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        const fetchPayrolls = async () => {
            try {
                const res = await fetch('/api/payroll/history')
                if (res.ok) {
                    const data = await res.json()
                    setPayrolls(data.payrolls || [])
                    setUserInfo(data.user)
                    setSalaryStructure(data.salaryStructure)
                    // Auto-select most recent
                    if (data.payrolls?.length > 0) setSelectedPayroll(data.payrolls[0])
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchPayrolls()
    }, [])

    const downloadPDF = () => {
        if (!selectedPayroll || !userInfo) return
        
        setDownloading(true)
        
        // Create printable content
        const date = new Date(selectedPayroll.year, selectedPayroll.month)
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' })
        
        const printWindow = window.open('', '', 'height=800,width=800')
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${monthName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e293b; padding-bottom: 20px; }
                    .company-name { font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 5px; }
                    .payslip-title { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
                    .info-block { flex: 1; }
                    .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
                    .info-value { font-size: 14px; color: #1e293b; font-weight: 600; }
                    .summary { display: flex; justify-content: space-between; background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0; }
                    .summary-item { text-align: center; flex: 1; }
                    .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
                    .summary-value { font-size: 24px; font-weight: bold; }
                    .earnings-color { color: #059669; }
                    .deductions-color { color: #dc2626; }
                    .netpay-color { color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
                    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                    .amount { text-align: right; font-weight: 600; }
                    .total-row { background: #f8fafc; font-weight: bold; font-size: 14px; }
                    .net-pay-row { background: #dbeafe; font-weight: bold; font-size: 16px; color: #1e40af; }
                    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
                    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-size: 12px; color: #92400e; }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">DAYFLOW</div>
                    <div class="payslip-title">Salary Slip for ${monthName}</div>
                </div>

                <div class="info-section">
                    <div class="info-block">
                        <div class="info-label">Employee ID</div>
                        <div class="info-value">${userInfo.employeeId}</div>
                    </div>
                    <div class="info-block">
                        <div class="info-label">Employee Name</div>
                        <div class="info-value">${userInfo.name}</div>
                    </div>
                    <div class="info-block">
                        <div class="info-label">Department</div>
                        <div class="info-value">${userInfo.department || 'N/A'}</div>
                    </div>
                    <div class="info-block">
                        <div class="info-label">Designation</div>
                        <div class="info-value">${userInfo.jobTitle || 'N/A'}</div>
                    </div>
                </div>

                <div class="summary">
                    <div class="summary-item">
                        <div class="summary-label">Gross Earnings</div>
                        <div class="summary-value earnings-color">₹${selectedPayroll.totalEarnings.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Total Deductions</div>
                        <div class="summary-value deductions-color">₹${selectedPayroll.totalDeductions.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Net Pay</div>
                        <div class="summary-value netpay-color">₹${selectedPayroll.netPay.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th colspan="2">EARNINGS</th>
                            <th colspan="2">DEDUCTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salaryStructure ? `
                        <tr>
                            <td>Basic Salary</td>
                            <td class="amount">₹${Math.round(salaryStructure.basic).toLocaleString('en-IN')}</td>
                            <td>Employee PF (12%)</td>
                            <td class="amount">₹${Math.round(salaryStructure.pf).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>HRA (30%)</td>
                            <td class="amount">₹${Math.round(salaryStructure.hra).toLocaleString('en-IN')}</td>
                            <td>Professional Tax</td>
                            <td class="amount">₹${salaryStructure.profTax.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>Special Allowance</td>
                            <td class="amount">₹${Math.round(salaryStructure.stdAllowance).toLocaleString('en-IN')}</td>
                            <td>Loss of Pay (LOP)</td>
                            <td class="amount">₹${(selectedPayroll.baseWage - selectedPayroll.totalEarnings - selectedPayroll.totalDeductions).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>Fixed Allowance</td>
                            <td class="amount">₹${Math.round(salaryStructure.fixedAllowance).toLocaleString('en-IN')}</td>
                            <td></td>
                            <td></td>
                        </tr>
                        ` : `
                        <tr>
                            <td>Base Wage (CTC)</td>
                            <td class="amount">₹${selectedPayroll.baseWage.toLocaleString('en-IN')}</td>
                            <td>Deductions</td>
                            <td class="amount">₹${selectedPayroll.totalDeductions.toLocaleString('en-IN')}</td>
                        </tr>
                        `}
                        <tr class="total-row">
                            <td>GROSS EARNINGS</td>
                            <td class="amount">₹${selectedPayroll.totalEarnings.toLocaleString('en-IN')}</td>
                            <td>TOTAL DEDUCTIONS</td>
                            <td class="amount">₹${selectedPayroll.totalDeductions.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr class="net-pay-row">
                            <td colspan="3">NET PAY (Take Home)</td>
                            <td class="amount">₹${selectedPayroll.netPay.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="note">
                    <strong>Note:</strong> This is a computer-generated payslip and does not require a signature. 
                    Gross earnings are calculated based on attendance. PF contribution is 12% of Basic Salary.
                </div>

                <div class="footer">
                    <p><strong>DAYFLOW</strong> - Employee Management System</p>
                    <p style="margin-top: 5px;">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>

                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="background: #2563eb; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;">
                        Print / Save as PDF
                    </button>
                    <button onclick="window.close()" style="background: #64748b; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; margin-left: 10px;">
                        Close
                    </button>
                </div>
            </body>
            </html>
        `)
        
        printWindow.document.close()
        printWindow.focus()
        
        setTimeout(() => setDownloading(false), 500)
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading payroll history...</div>

    return (
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
            {/* Sidebar List */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Payslips</h2>
                        <p className="text-slate-500 text-sm">Monthly salary statements</p>
                    </div>
                    <Link href="/dashboard/payroll/simulator" className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-md hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm">Salary Simulator</p>
                                <p className="text-xs text-blue-100">Predict your in-hand</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {payrolls.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No payslips found.</div>
                    ) : (
                        payrolls.map(slip => {
                            const date = new Date(slip.year, slip.month)
                            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' })
                            const isSelected = selectedPayroll?.id === slip.id

                            return (
                                <button
                                    key={slip.id}
                                    onClick={() => setSelectedPayroll(slip)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${isSelected ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{monthName}</p>
                                        <p className={`text-xs truncate ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>Net Pay: ₹{slip.netPay.toLocaleString('en-IN')}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-300'}`} />
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Detail View (Payslip) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-y-auto">
                {selectedPayroll ? (
                    <div className="max-w-3xl mx-auto border border-slate-200 rounded-xl overflow-hidden bg-white shadow-md">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">Payslip</h1>
                                    <p className="text-slate-300 font-medium text-sm mt-1">
                                        {new Date(selectedPayroll.year, selectedPayroll.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Net Pay</p>
                                    <p className="text-3xl font-bold text-emerald-400">₹{selectedPayroll.netPay.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            
                            {/* Employee Info */}
                            {userInfo && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Employee ID
                                        </p>
                                        <p className="text-sm font-semibold text-white">{userInfo.employeeId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Name
                                        </p>
                                        <p className="text-sm font-semibold text-white">{userInfo.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Department
                                        </p>
                                        <p className="text-sm font-semibold text-white">{userInfo.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" /> Designation
                                        </p>
                                        <p className="text-sm font-semibold text-white">{userInfo.jobTitle || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Gross Earnings</p>
                                    <p className="text-2xl font-bold text-emerald-700">₹{selectedPayroll.totalEarnings.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Deductions</p>
                                    <p className="text-2xl font-bold text-red-700">₹{selectedPayroll.totalDeductions.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Net Pay</p>
                                    <p className="text-2xl font-bold text-blue-700">₹{selectedPayroll.netPay.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid md:grid-cols-2 gap-6">
                                
                                {/* Earnings */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-emerald-500">
                                        Earnings
                                    </h3>
                                    <div className="space-y-3">
                                        {salaryStructure ? (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Basic Salary (50%)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.basic).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">HRA (30%)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.hra).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Special Allowance (10%)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.stdAllowance).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Fixed Allowance (10%)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.fixedAllowance).toLocaleString('en-IN')}</span>
                                                </div>
                                                {salaryStructure.performanceBonus > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Performance Bonus</span>
                                                        <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.performanceBonus).toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Base Wage (CTC)</span>
                                                <span className="font-semibold text-slate-900">₹{selectedPayroll.baseWage.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-slate-200">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-emerald-700">Gross Earnings</span>
                                                <span className="text-emerald-700">₹{selectedPayroll.totalEarnings.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-red-500">
                                        Deductions
                                    </h3>
                                    <div className="space-y-3">
                                        {salaryStructure ? (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">EPF (12% of Basic)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.round(salaryStructure.pf).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Professional Tax</span>
                                                    <span className="font-semibold text-slate-900">₹{salaryStructure.profTax.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Loss of Pay (LOP)</span>
                                                    <span className="font-semibold text-slate-900">₹{Math.max(0, selectedPayroll.baseWage - selectedPayroll.totalEarnings - selectedPayroll.totalDeductions).toLocaleString('en-IN')}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Total Deductions</span>
                                                <span className="font-semibold text-slate-900">₹{selectedPayroll.totalDeductions.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-slate-200">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-red-700">Total Deductions</span>
                                                <span className="text-red-700">₹{selectedPayroll.totalDeductions.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay Calculation */}
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Take Home Salary</p>
                                        <p className="text-sm text-blue-700">Gross Earnings - Total Deductions</p>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700">₹{selectedPayroll.netPay.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                                <p className="text-xs font-bold text-amber-900 mb-1">Note:</p>
                                <p className="text-xs text-amber-800">
                                    This payslip is calculated based on your attendance for the month. 
                                    EPF contribution is 12% of Basic Salary. Employer also contributes 12% (not shown here).
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Status: <span className={selectedPayroll.status === 'PAID' ? 'text-emerald-600' : 'text-blue-600'}>{selectedPayroll.status}</span>
                                    </span>
                                    <p className="text-xs text-slate-500 mt-1">Generated on {new Date().toLocaleDateString('en-IN')}</p>
                                </div>
                                <button 
                                    onClick={downloadPDF}
                                    disabled={downloading}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4" />
                                    {downloading ? 'Preparing...' : 'Download PDF'}
                                </button>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a month to view payslip.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
