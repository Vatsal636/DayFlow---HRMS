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
                    <h1 className="text-2xl font-bold text-slate-900">Reports & Export</h1>
                    <p className="text-slate-500">Generate and export detailed reports</p>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={item} className="flex gap-2 border-b border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-[2px] ${
                            activeTab === tab.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Filters:</span>
                    </div>

                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.employeeId}>
                                {emp.employeeId} - {emp.details?.firstName} {emp.details?.lastName}
                            </option>
                        ))}
                    </select>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={exporting || loading || !reportData?.length}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={exporting || loading || !reportData?.length}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            Excel
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
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : !reportData || reportData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FileText className="w-12 h-12 mb-3" />
                        <p>No data found for the selected period</p>
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
        slate: 'bg-slate-50 text-slate-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600'
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-xl font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    )
}

function AttendanceTable({ data }) {
    const statusColors = {
        PRESENT: 'bg-green-100 text-green-700',
        ABSENT: 'bg-red-100 text-red-700',
        LEAVE: 'bg-amber-100 text-amber-700',
        LATE: 'bg-orange-100 text-orange-700'
    }

    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Check In</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Check Out</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Hours</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900">{row.date}</td>
                        <td className="px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.department}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{row.checkIn}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{row.checkOut}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-900 font-medium">{row.workHours}</td>
                        <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>
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
        PROCESSED: 'bg-green-100 text-green-700',
        PENDING: 'bg-amber-100 text-amber-700',
        PAID: 'bg-blue-100 text-blue-700'
    }

    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Dept</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Basic</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">HRA</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Allowances</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Deductions</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Net Salary</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.department}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(row.basicPay)}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(row.hra)}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">
                            {formatCurrency(row.medicalAllowance + row.transportAllowance + row.specialAllowance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{formatCurrency(row.grossSalary)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(row.deductions)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{formatCurrency(row.netSalary)}</td>
                        <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>
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
        APPROVED: 'bg-green-100 text-green-700',
        PENDING: 'bg-amber-100 text-amber-700',
        REJECTED: 'bg-red-100 text-red-700'
    }

    const typeColors = {
        PAID: 'bg-blue-100 text-blue-700',
        SICK: 'bg-purple-100 text-purple-700',
        UNPAID: 'bg-slate-100 text-slate-700',
        CASUAL: 'bg-cyan-100 text-cyan-700'
    }

    return (
        <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">From</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">To</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{row.employeeName}</p>
                                <p className="text-xs text-slate-500">{row.employeeId}</p>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.department}</td>
                        <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[row.leaveType] || 'bg-slate-100 text-slate-600'}`}>
                                {row.leaveType}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{row.startDate}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{row.endDate}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-slate-900">{row.days}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={row.reason}>{row.reason}</td>
                        <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
