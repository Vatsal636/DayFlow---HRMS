"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Users, TrendingUp, Calendar, DollarSign, Award, RefreshCw } from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AddEmployeeModal from "@/components/AddEmployeeModal"
import Link from "next/link"

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminDashboard() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        pendingLeaves: 0,
        monthlyPayroll: 0
    })
    const [analytics, setAnalytics] = useState(null)
    const [filterDays, setFilterDays] = useState(30)

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats')
            if (res.ok) {
                const data = await res.json()
                setStats({
                    totalEmployees: data.stats[0]?.value || 0,
                    presentToday: data.stats[1]?.value || 0,
                    pendingLeaves: data.stats[2]?.value || 0,
                    monthlyPayroll: data.stats[3]?.value || 0
                })
            }
        } catch (e) {
            console.error('Error fetching stats:', e)
        }
    }

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/analytics?days=${filterDays}`)
            if (res.ok) {
                const data = await res.json()
                setAnalytics(data)
            }
        } catch (e) {
            console.error('Error fetching analytics:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        fetchAnalytics()
    }, [filterDays])

    // Prepare chart data
    const prepareAttendanceChartData = () => {
        if (!analytics?.attendanceTrends) return []
        
        const groupedByDate = {}
        analytics.attendanceTrends.forEach(item => {
            const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (!groupedByDate[date]) {
                groupedByDate[date] = { date, PRESENT: 0, ABSENT: 0, LEAVE: 0, LATE: 0 }
            }
            groupedByDate[date][item.status] = item._count.id
        })
        
        return Object.values(groupedByDate).slice(-filterDays)
    }

    const prepareDepartmentChartData = () => {
        if (!analytics?.departmentStats) return []
        return analytics.departmentStats.map(dept => ({
            department: dept.department,
            present: Number(dept.present),
            absent: Number(dept.absent),
            leave: Number(dept.on_leave)
        }))
    }

    const prepareLeaveChartData = () => {
        if (!analytics?.leaveStats) return []
        const leaveTypes = {}
        analytics.leaveStats.forEach(item => {
            if (!leaveTypes[item.type]) {
                leaveTypes[item.type] = 0
            }
            leaveTypes[item.type] += item._count.id
        })
        return Object.entries(leaveTypes).map(([name, value]) => ({ name, value }))
    }

    const preparePayrollChartData = () => {
        if (!analytics?.payrollTrends) return []
        return analytics.payrollTrends.map(item => ({
            month: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item.month - 1]} ${item.year}`,
            netSalary: item._sum.netSalary || 0,
            deductions: item._sum.totalDeductions || 0
        }))
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    const attendanceData = prepareAttendanceChartData()
    const departmentData = prepareDepartmentChartData()
    const leaveData = prepareLeaveChartData()
    const payrollData = preparePayrollChartData()

    return (
        <div className="space-y-8">
            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onRefresh={() => {
                    fetchStats()
                    fetchAnalytics()
                }}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Analytics</h1>
                    <p className="text-slate-500 mt-1">Overview of your organization's performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterDays}
                        onChange={(e) => setFilterDays(Number(e.target.value))}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white text-slate-900"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={15}>Last 15 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button
                        onClick={fetchAnalytics}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={item} className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                            <h3 className="text-4xl font-bold mt-1">{stats.totalEmployees}</h3>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <Link href="/admin/employees" className="text-xs text-blue-100 hover:text-white font-medium">View all →</Link>
                </motion.div>

                <motion.div variants={item} className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Present Today</p>
                            <h3 className="text-4xl font-bold mt-1">{stats.presentToday}</h3>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <Link href="/admin/attendance" className="text-xs text-green-100 hover:text-white font-medium">View attendance →</Link>
                </motion.div>

                <motion.div variants={item} className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">Pending Leaves</p>
                            <h3 className="text-4xl font-bold mt-1">{stats.pendingLeaves}</h3>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <Link href="/admin/leaves" className="text-xs text-amber-100 hover:text-white font-medium">Manage leaves →</Link>
                </motion.div>

                <motion.div variants={item} className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Monthly Payroll</p>
                            <h3 className="text-4xl font-bold mt-1">₹{(stats.monthlyPayroll / 100000).toFixed(1)}L</h3>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                    <Link href="/admin/payroll" className="text-xs text-purple-100 hover:text-white font-medium">View payroll →</Link>
                </motion.div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Trend */}
                        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Attendance Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={attendanceData}>
                                    <defs>
                                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="PRESENT" stroke="#10B981" fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                                    <Area type="monotone" dataKey="ABSENT" stroke="#EF4444" fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
                                    <Area type="monotone" dataKey="LEAVE" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} name="On Leave" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Department Wise */}
                        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Department-wise Attendance</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={departmentData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="department" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="present" fill="#10B981" name="Present" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="leave" fill="#F59E0B" name="On Leave" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Leave Statistics */}
                        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Leave Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={leaveData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {leaveData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Payroll Trends */}
                        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Payroll Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={payrollData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(1)}K`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="netSalary" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5 }} name="Net Salary" />
                                    <Line type="monotone" dataKey="deductions" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Deductions" />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    {/* Top Performers */}
                    {analytics?.topPerformers && analytics.topPerformers.length > 0 && (
                        <motion.div variants={item} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    <h3 className="text-lg font-bold text-slate-900">Top Performers</h3>
                                </div>
                                <span className="text-sm text-slate-500">Based on attendance</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {analytics.topPerformers.map((performer, index) => (
                                    <div key={index} className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                                        {index === 0 && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                1
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-2">
                                                {performer.name.charAt(0)}
                                            </div>
                                            <p className="font-semibold text-slate-900 text-sm">{performer.name}</p>
                                            <p className="text-xs text-slate-500 mb-2">{performer.department}</p>
                                            <div className="bg-white rounded-lg p-2 mt-2">
                                                <p className="text-2xl font-bold text-green-600">{performer.attendance_percentage}%</p>
                                                <p className="text-xs text-slate-500">Attendance</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    )
}
