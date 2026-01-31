"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Mail, Phone, MoreHorizontal, Users } from "lucide-react"
import AddEmployeeModal from "@/components/AddEmployeeModal"

export default function AdminDashboard() {
    const [employees, setEmployees] = useState([])
    const [attendanceList, setAttendanceList] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const [stats, setStats] = useState([
        { label: 'Total Employees', value: '-', change: '...', icon: Users },
        { label: 'Present Today', value: '-', change: '...', icon: Phone }, // reusing Phone icon as placeholder if UserCheck not imported, will fix imports
        { label: 'Pending Leaves', value: '-', change: '...', icon: Mail },
        { label: 'Payroll Status', value: '-', change: '...', icon: MoreHorizontal },
    ])

    // Mock data for initial render if API fails or empty
    const mockEmployees = [
        { id: 1, name: "Alice Johnson", role: "Software Engineer", employeeId: "OIJO2022001", avatar: null, department: "Engineering" },
        { id: 2, name: "Bob Smith", role: "Product Manager", employeeId: "OIBS2022002", avatar: null, department: "Product" },
        { id: 3, name: "Charlie Davis", role: "Designer", employeeId: "OICD2022003", avatar: null, department: "Design" },
    ]

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.employees || [])
            } else {
                setEmployees(mockEmployees) // Fallback for demo
            }
        } catch (e) {
            setEmployees(mockEmployees)
        } finally {
            setLoading(false)
        }
    }

    const fetchAttendance = async () => {
        try {
            const res = await fetch('/api/admin/attendance/today')
            if (res.ok) {
                const data = await res.json()
                setAttendanceList(data.attendance || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats')
                if (res.ok) {
                    const data = await res.json()
                    // Map string icons to components if dynamic, or just map values
                    setStats(prev => prev.map((s, i) => ({ ...s, ...data.stats[i] })))
                }
            } catch (e) {
                console.error(e)
            }
        }

        // ... existing fetchEmployees call
        fetchEmployees()
        fetchStats()
        fetchAttendance()
    }, [])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <div className="space-y-8">
            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onRefresh={fetchEmployees}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Welcome back, Admin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                {/* Icon placeholder logic or static mapping */}
                                {i === 0 && <Users className="w-5 h-5" />}
                                {i === 1 && <div className="w-5 h-5 flex items-center justify-center font-bold">P</div>}
                                {i === 2 && <Mail className="w-5 h-5" />}
                                {i === 3 && <div className="w-5 h-5 font-bold">$</div>}
                            </div>
                        </div>
                        <div className="text-xs text-slate-400 font-medium bg-slate-50 inline-block px-2 py-1 rounded-md">
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area: Today's Attendance Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Today's Attendance</h2>
                        <p className="text-sm text-slate-500">Real-time check-in updates</p>
                    </div>
                    <div className="flex gap-2">

                        <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">View All History</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendanceList.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No attendance records found for today.
                                    </td>
                                </tr>
                            ) : (
                                attendanceList.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden text-sm">
                                                    {record.avatar ? <img src={record.avatar} className="w-full h-full object-cover" /> : record.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{record.name}</p>
                                                    <p className="text-xs text-slate-500">{record.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                            {record.employeeId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                {record.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.checkOutTime ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    Checked Out
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Present
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                            {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
