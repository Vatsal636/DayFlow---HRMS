"use client"


import { useState, useEffect } from "react"
import AttendanceCalendar from "@/components/AttendanceCalendar"

export default function AttendancePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState([])
    const [joiningDate, setJoiningDate] = useState(null)
    const [loading, setLoading] = useState(true)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/attendance/history?month=${month}&year=${year}`)
            if (res.ok) {
                const data = await res.json()
                setAttendanceData(data.attendance || [])
                setJoiningDate(data.joiningDate)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [currentDate])

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
                <p className="text-slate-500">Track your monthly attendance</p>
            </div>

            <AttendanceCalendar
                currentDate={currentDate}
                attendanceData={attendanceData}
                joiningDate={joiningDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                loading={loading}
            />
        </div>
    )
}
