"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"

export default function EditEmployeeModal({ isOpen, onClose, employee, onRefresh }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        jobTitle: "",
        department: "",
        phone: "",
        address: ""
    })

    useEffect(() => {
        if (employee) {
            // split name fallback
            const parts = employee.name.split(" ")
            setFormData({
                firstName: parts[0] || "",
                lastName: parts.slice(1).join(" ") || "",
                jobTitle: employee.role || "",
                department: employee.department || "",
                phone: employee.phone || "", // Employee API might need to return this
                address: employee.address || ""
            })
        }
    }, [employee])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch(`/api/admin/employees/${employee.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error("Failed to update")

            onRefresh && onRefresh()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden relative z-10"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Edit Employee</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-slate-900" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Last Name</label>
                                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-slate-900" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Job Title</label>
                                <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-slate-900" required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
                                <input name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-slate-900" required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex justify-end pt-4 gap-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
