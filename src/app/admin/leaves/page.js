"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, CheckCircle, XCircle, Clock, Filter, MessageSquare } from "lucide-react"

export default function AdminLeavesPage() {
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('ALL') // ALL, PENDING, APPROVED, REJECTED
    const [searchQuery, setSearchQuery] = useState("")
    const [processingId, setProcessingId] = useState(null)

    useEffect(() => {
        fetchLeaves()
    }, [])

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/admin/leaves')
            if (res.ok) {
                const data = await res.json()
                setLeaves(data.leaves || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, status) => {
        const comment = prompt(status === 'REJECTED' ? "Reason for rejection:" : "Optional comments:")
        if (status === 'REJECTED' && !comment) return // Require comment for rejection

        setProcessingId(id)
        try {
            const res = await fetch('/api/admin/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, comments: comment || "" })
            })
            if (res.ok) {
                // Update local state
                setLeaves(leaves.map(l => l.id === id ? { ...l, status, adminComments: comment } : l))
            } else {
                alert("Failed to update status")
            }
        } catch (e) {
            console.error(e)
            alert("Error updating status")
        } finally {
            setProcessingId(null)
        }
    }

    const filteredLeaves = leaves.filter(leave => {
        const matchesSearch = leave.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            leave.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'ALL' || leave.status === filterStatus
        return matchesSearch && matchesFilter
    })

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            default: return 'bg-amber-100 text-amber-700'
        }
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Leave Requests</h1>
                    <p className="text-slate-500 text-sm">Manage employee time-off requests</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 text-slate-900 placeholder:text-slate-400 font-medium"
                        />
                    </div>
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === status ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Detailed Request</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLeaves.map(leave => {
                            const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1
                            return (
                                <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold overflow-hidden text-slate-500">
                                                {leave.avatar ? <img src={leave.avatar} className="w-full h-full object-cover" /> : leave.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{leave.name}</div>
                                                <div className="text-xs text-slate-500">{leave.role} • {leave.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">{leave.type}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 truncate">{leave.reason}</p>
                                        {leave.adminComments && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" /> {leave.adminComments}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">
                                            {days} Day{days > 1 ? 's' : ''} Duration
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {leave.status === 'PENDING' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction(leave.id, 'APPROVED')}
                                                    disabled={processingId === leave.id}
                                                    className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(leave.id, 'REJECTED')}
                                                    disabled={processingId === leave.id}
                                                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredLeaves.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                    No leave requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
