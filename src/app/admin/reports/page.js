"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    FileText, Download, Calendar, Filter, Users, Clock, 
    DollarSign, CalendarDays, FileSpreadsheet, Loader2,
    TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle
} from "lucide-react"
import { useToast } from "@/components/Toast"
import { generatePDF, generateExcel, formatDate, formatCurrency } from "@/lib/reports"

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ReportsPage() {
    const toast = useToast()
    const [activeTab, setActiveTab] = useState('attendance')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [reportData, setReportData] = useState(null)
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [employees, setEmployees] = useState([])
    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [csrfToken, setCsrfToken] = useState(null)

    // Load CSRF token and employees
    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)

        fetchEmployees()
    }, [])

    // Fetch report when filters change
    useEffect(() => {
        fetchReport()
    }, [activeTab, month, year, selectedEmployee])

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.employees || [])
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                month: month.toString(),
                year: year.toString()
            })
            if (selectedEmployee) {
                params.append('employeeId', selectedEmployee)
            }

            const res = await fetch(`/api/admin/reports/${activeTab}?${params}`)
            if (res.ok) {
                const data = await res.json()
                setReportData(data.data)
                setSummary(data.summary)
            } else {
                toast.error('Failed to fetch report data')
            }
        } catch (error) {
            toast.error('Error loading report')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (format) => {
        if (!reportData || reportData.length === 0) {
            toast.warning('No data to export')
            return
        }

        setExporting(true)
        try {
            const title = getReportTitle()
            const subtitle = `${MONTHS[month - 1]} ${year}`
            const { columns, data } = getExportData()
            const filename = `${activeTab}_report_${MONTHS[month - 1]}_${year}`

            let blob
            if (format === 'pdf') {
                blob = await generatePDF({
                    title,
                    subtitle,
                    columns,
                    data,
                    filename,
                    orientation: activeTab === 'payroll' ? 'landscape' : 'portrait'
                })
            } else {
                blob = await generateExcel({
                    title,
                    columns,
                    data,
                    filename,
                    sheetName: activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                })
            }

            // Download file
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success(`${format.toUpperCase()} exported successfully!`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export report')
        } finally {
            setExporting(false)
        }
    }

    const getReportTitle = () => {
        switch (activeTab) {
            case 'attendance': return 'Attendance Report'
            case 'payroll': return 'Payroll Report'
            case 'leaves': return 'Leave Report'
            default: return 'Report'
        }
    }

    const getExportData = () => {
        switch (activeTab) {
            case 'attendance':
                return {
                    columns: ['Date', 'Employee ID', 'Name', 'Department', 'Check In', 'Check Out', 'Status', 'Hours'],
                    data: reportData.map(r => [
                        r.date, r.employeeId, r.employeeName, r.department,
                        r.checkIn, r.checkOut, r.status, r.workHours
                    ])
                }
            case 'payroll':
                return {
                    columns: ['Emp ID', 'Name', 'Dept', 'Basic', 'HRA', 'Medical', 'Transport', 'Special', 'Gross', 'Deductions', 'Net Salary', 'Status'],
                    data: reportData.map(r => [
                        r.employeeId, r.employeeName, r.department,
                        r.basicPay, r.hra, r.medicalAllowance, r.transportAllowance, r.specialAllowance,
                        r.grossSalary, r.deductions, r.netSalary, r.status
                    ])
                }
            case 'leaves':
                return {
                    columns: ['Employee ID', 'Name', 'Department', 'Type', 'From', 'To', 'Days', 'Status', 'Applied On'],
                    data: reportData.map(r => [
                        r.employeeId, r.employeeName, r.department, r.leaveType,
                        r.startDate, r.endDate, r.days, r.status, r.appliedAt
                    ])
                }
            default:
                return { columns: [], data: [] }
        }
    }

    const tabs = [
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'leaves', label: 'Leaves', icon: CalendarDays }
    ]

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-12"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
                            <p className="text-slate-500 mt-1">Generate comprehensive reports and export data</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Viewing</p>
                        <p className="text-sm font-bold text-blue-900">{MONTHS[month - 1]} {year}</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={item} className="bg-white rounded-2xl border-2 border-slate-200 p-2 shadow-sm">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500 p-2 rounded-lg">
                            <Filter className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">Filters</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors min-w-[200px]"
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.employeeId}>
                                    {emp.employeeId} - {emp.details?.firstName} {emp.details?.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={exporting || loading || !reportData?.length}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={exporting || loading || !reportData?.length}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            Export Excel
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            {summary && (
                <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeTab === 'attendance' && (
                        <>
                            <SummaryCard label="Total Records" value={summary.totalRecords} icon={FileText} />
                            <SummaryCard label="Present" value={summary.present} icon={CheckCircle} color="green" />
                            <SummaryCard label="Absent" value={summary.absent} icon={XCircle} color="red" />
                            <SummaryCard label="On Leave" value={summary.leave} icon={CalendarDays} color="amber" />
                        </>
                    )}
                    {activeTab === 'payroll' && (
                        <>
                            <SummaryCard label="Employees" value={summary.totalEmployees} icon={Users} />
                            <SummaryCard label="Total Gross" value={formatCurrency(summary.totalGrossSalary)} icon={TrendingUp} color="green" />
                            <SummaryCard label="Deductions" value={formatCurrency(summary.totalDeductions)} icon={TrendingDown} color="red" />
                            <SummaryCard label="Net Payable" value={formatCurrency(summary.totalNetSalary)} icon={DollarSign} color="blue" />
                        </>
                    )}
                    {activeTab === 'leaves' && (
                        <>
                            <SummaryCard label="Total Requests" value={summary.totalRequests} icon={FileText} />
                            <SummaryCard label="Approved" value={summary.approved} icon={CheckCircle} color="green" />
                            <SummaryCard label="Pending" value={summary.pending} icon={AlertCircle} color="amber" />
                            <SummaryCard label="Rejected" value={summary.rejected} icon={XCircle} color="red" />
                        </>
                    )}
                </motion.div>
            )}

            {/* Data Table */}
            <motion.div variants={item} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="bg-blue-100 p-4 rounded-2xl mb-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">Loading report data...</p>
                    </div>
                ) : !reportData || reportData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="bg-slate-100 p-5 rounded-2xl mb-4">
                            <FileText className="w-14 h-14 text-slate-400" />
                        </div>
                        <p className="text-lg font-bold text-slate-700 mb-1">No Data Found</p>
                        <p className="text-sm text-slate-500">No records for the selected period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'attendance' && <AttendanceTable data={reportData} />}
                        {activeTab === 'payroll' && <PayrollTable data={reportData} />}
                        {activeTab === 'leaves' && <LeavesTable data={reportData} />}
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}

function SummaryCard({ label, value, icon: Icon, color = 'slate' }) {
    const colors = {
        slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
    }

    const colorScheme = colors[color]

    return (
        <div className={`${colorScheme.bg} rounded-xl border-2 ${colorScheme.border} p-5 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                    <p className={`text-3xl font-bold ${colorScheme.text}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorScheme.bg} border-2 ${colorScheme.border}`}>
                    <Icon className={`w-6 h-6 ${colorScheme.text}`} />
                </div>
            </div>
        </div>
    )
}

function AttendanceTable({ data }) {
    const statusColors = {
        PRESENT: 'bg-green-100 text-green-800 border-green-200',
        ABSENT: 'bg-red-100 text-red-800 border-red-200',
        LEAVE: 'bg-amber-100 text-amber-800 border-amber-200',
        LATE: 'bg-orange-100 text-orange-800 border-orange-200'
    }

    return (
        <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white">
                {data.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.date}</td>
                        <td className="px-6 py-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500 font-medium">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.department}</td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-slate-700">{row.checkIn}</td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-slate-700">{row.checkOut}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-slate-900">{row.workHours}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusColors[row.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function PayrollTable({ data }) {
    const statusColors = {
        PROCESSED: 'bg-green-100 text-green-800 border-green-200',
        PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
        PAID: 'bg-blue-100 text-blue-800 border-blue-200'
    }

    return (
        <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Dept</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Basic</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">HRA</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Allowances</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Gross</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white">
                {data.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-6 py-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500 font-medium">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.department}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">{formatCurrency(row.basicPay)}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">{formatCurrency(row.hra)}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                            {formatCurrency(row.medicalAllowance + row.transportAllowance + row.specialAllowance)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 text-base">{formatCurrency(row.grossSalary)}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">{formatCurrency(row.deductions)}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-blue-700 text-base">{formatCurrency(row.netSalary)}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusColors[row.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function LeavesTable({ data }) {
    const statusColors = {
        APPROVED: 'bg-green-100 text-green-800 border-green-200',
        PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
        REJECTED: 'bg-red-100 text-red-800 border-red-200'
    }

    const typeColors = {
        PAID: 'bg-blue-100 text-blue-800 border-blue-200',
        SICK: 'bg-purple-100 text-purple-800 border-purple-200',
        UNPAID: 'bg-slate-100 text-slate-800 border-slate-300',
        CASUAL: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }

    return (
        <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">From</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">To</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Days</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white">
                {data.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-6 py-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500 font-medium">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.department}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${typeColors[row.leaveType] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {row.leaveType}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900">{row.startDate}</td>
                        <td className="px-6 py-4 text-sm text-center font-semibold text-slate-900">{row.endDate}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-slate-900 text-base">{row.days}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-[250px] truncate font-medium" title={row.reason}>{row.reason}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusColors[row.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
