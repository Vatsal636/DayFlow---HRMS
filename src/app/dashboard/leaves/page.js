"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function LeavePage() {
    const [leaves, setLeaves] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        type: 'SICK',
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchLeaves()
    }, [])

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves')
            if (res.ok) {
                const data = await res.json()
                setLeaves(data.leaves || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowForm(false)
                setFormData({ type: 'SICK', startDate: '', endDate: '', reason: '' })
                fetchLeaves() // Refresh list
            } else {
                alert("Failed to apply for leave")
            }
        } catch (e) {
            console.error(e)
            alert("Error applying for leave")
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            default: return 'bg-amber-100 text-amber-700'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4" />
            case 'REJECTED': return <XCircle className="w-4 h-4" />
            default: return <Clock className="w-4 h-4" />
        }
    }

    return (
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

            {/* Form Section (Sidebar or Modal feel) */}
            <div className={`lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden transition-all ${showForm ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
                        <p className="text-slate-600 text-sm font-medium">Request time off</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">Leave Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900"
                            >
                                <option value="SICK">Sick Leave</option>
                                <option value="PAID">Paid Leave (Casual)</option>
                                <option value="UNPAID">Unpaid Leave</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">Reason</label>
                            <textarea
                                required
                                rows="3"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="State your reason..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? 'Submitting...' : <><Plus className="w-5 h-5" /> Submit Request</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* History List */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-500" />
                        My Leave History
                    </h1>

                    {leaves.length > 0 ? (
                        <div className="space-y-4">
                            {leaves.map(leave => {
                                const start = new Date(leave.startDate).toLocaleDateString()
                                const end = new Date(leave.endDate).toLocaleDateString()
                                const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1

                                return (
                                    <div key={leave.id} className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600`}>{leave.type}</span>
                                                    <span className="text-slate-400 text-xs font-medium">• {days} Day{days > 1 ? 's' : ''}</span>
                                                </div>
                                                <h3 className="font-semibold text-slate-900">{start} - {end}</h3>
                                            </div>
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(leave.status)}`}>
                                                {getStatusIcon(leave.status)}
                                                {leave.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">{leave.reason}</p>
                                        {leave.adminComments && (
                                            <div className="mt-2 text-xs text-slate-500 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                                <span>Admin: {leave.adminComments}</span>
                                            </div>
                                        )}
                                        <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                                            Applied on {new Date(leave.appliedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-slate-900 font-bold mb-1">No Leave Records</h3>
                            <p className="text-slate-500">You haven't applied for any leaves yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
