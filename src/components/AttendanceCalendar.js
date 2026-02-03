"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

export default function AttendanceCalendar({
    currentDate,
    attendanceData = [],
    leavesData = [],
    joiningDate,
    onPrevMonth,
    onNextMonth,
    loading
}) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Navigation Logic
    const canGoPrev = (() => {
        if (!joiningDate) return true
        const prevMonthDate = new Date(year, month - 1, 1)
        const joinDateObj = new Date(joiningDate)
        const joinMonthStart = new Date(joinDateObj.getFullYear(), joinDateObj.getMonth(), 1)
        return prevMonthDate >= joinMonthStart
    })()

    const canGoNext = (() => {
        const nextMonthDate = new Date(year, month + 1, 1)
        const today = new Date()
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return nextMonthDate <= currentMonthStart
    })()

    // Generate Calendar Grid
    const generateCalendarDays = () => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startDayIndex = firstDay.getDay() // 0 = Sunday

        const days = []
        for (let i = 0; i < startDayIndex; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
        return days
    }

    const days = generateCalendarDays()

    // Color Logic
    const getDayStatus = (date) => {
        if (!date) return null

        // Convert calendar date to YYYY-MM-DD format for comparison
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        // Check if date falls within an approved leave
        const isOnLeave = leavesData.some(leave => {
            const startDate = new Date(leave.startDate)
            const endDate = new Date(leave.endDate)
            
            // Set time to midnight for accurate date comparison
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999)
            const checkDate = new Date(date)
            checkDate.setHours(0, 0, 0, 0)
            
            return checkDate >= startDate && checkDate <= endDate
        })

        if (isOnLeave) {
            return { color: 'bg-purple-100 text-purple-700', status: 'Leave', record: null }
        }

        // Find matching attendance record
        const record = attendanceData.find(a => {
            const recordDate = new Date(a.date)
            const recYear = recordDate.getUTCFullYear()
            const recMonth = String(recordDate.getUTCMonth() + 1).padStart(2, '0')
            const recDay = String(recordDate.getUTCDate()).padStart(2, '0')
            const recDateStr = `${recYear}-${recMonth}-${recDay}`
            return recDateStr === dateStr
        })

        if (record) {
            const checkIn = new Date(record.checkIn)
            const threshold = new Date(record.checkIn)
            threshold.setHours(9, 30, 0, 0)

            if (checkIn > threshold) return { color: 'bg-orange-100 text-orange-700', status: 'Late', record }
            return { color: 'bg-green-100 text-green-700', status: 'Present', record }
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (date > today) return { color: 'bg-white', status: '', record: null }
        if (date.getDay() === 0) return { color: 'bg-slate-50 text-slate-400', status: 'Weekend', record: null }

        if (joiningDate && date < new Date(joiningDate)) return { color: 'bg-white text-slate-300', status: '-', record: null }

        return { color: 'bg-red-50 text-red-600', status: 'Absent', record: null }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={onPrevMonth}
                        disabled={!canGoPrev || loading}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNextMonth}
                        disabled={!canGoNext || loading}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-7 gap-4 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-slate-400 uppercase tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {days.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} className="h-24" />

                        const { color, status, record } = getDayStatus(day)

                        return (
                            <motion.div
                                key={day.toISOString()}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.01 }} // Faster staggering
                                className={`h-24 rounded-xl border border-slate-100 p-3 flex flex-col justify-between transition-colors ${color}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`font-bold ${status === 'Absent' ? 'text-red-400' : 'text-slate-700'}`}>{day.getDate()}</span>
                                    {status && <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{status}</span>}
                                </div>

                                {record && (
                                    <div className="text-xs font-medium opacity-80">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-4 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                    <span className="text-sm text-slate-600">On Time</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div>
                    <span className="text-sm text-slate-600">Late (Arrived after 9:30 AM)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
                    <span className="text-sm text-slate-600">Absent</span>
                </div>
            </div>
        </div>
    )
}
