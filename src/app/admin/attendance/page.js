"use client"

import { useState, useEffect } from "react"
import AttendanceCalendar from "@/components/AttendanceCalendar"
import { Search, User } from "lucide-react"

export default function AdminAttendancePage() {
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState([])
    const [leavesData, setLeavesData] = useState([])
    const [joiningDate, setJoiningDate] = useState(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        // Fetch Users for selector
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/employees')
                if (res.ok) {
                    const data = await res.json()
                    setUsers(data.employees || [])
                    if (data.employees?.length > 0) {
                        setSelectedUser(data.employees[0])
                    }
                }
            } catch (e) {
                console.error("Failed to fetch users", e)
            }
        }
        fetchUsers()
    }, [])

    useEffect(() => {
        if (!selectedUser) return

        const fetchHistory = async () => {
            setLoadingHistory(true)
            try {
                const month = currentDate.getMonth()
                const year = currentDate.getFullYear()
                const res = await fetch(`/api/admin/attendance/history?userId=${selectedUser.id}&month=${month}&year=${year}`)
                if (res.ok) {
                    const data = await res.json()
                    setAttendanceData(data.attendance || [])
                    setLeavesData(data.leaves || [])
                    setJoiningDate(data.joiningDate)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoadingHistory(false)
            }
        }
        fetchHistory()
    }, [selectedUser, currentDate])

    const handlePrevMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
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
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No employees found.</div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => {
                                    setSelectedUser(user)
                                    setCurrentDate(new Date()) // Reset to today when switching user? Or keep month? Let's keep month context or reset? Reset is safer to avoid empty months.
                                }}
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
                        ))
                    )}
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-y-auto">
                {selectedUser ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden">
                                {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h1>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <span>{selectedUser.employeeId}</span>
                                    <span>•</span>
                                    <span>{selectedUser.role}</span>
                                </div>
                            </div>
                        </div>

                        <AttendanceCalendar
                            currentDate={currentDate}
                            attendanceData={attendanceData}
                            leavesData={leavesData}
                            joiningDate={joiningDate}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            loading={loadingHistory}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <User className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select an employee to view their attendance history.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
