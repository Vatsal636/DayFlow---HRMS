
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Filter, MoreHorizontal, User, Mail, Phone, MapPin, Trash2, Edit, ShieldCheck, ShieldAlert, Send, Loader2 } from "lucide-react"
import EditEmployeeModal from "@/components/EditEmployeeModal"
import { useToast } from "@/components/Toast"

function EmployeesContent() {
    const toast = useToast()
    const searchParams = useSearchParams()
    const initialFilter = searchParams.get('filter') === 'unverified' ? 'UNVERIFIED' : 'ALL'
    
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingEmployee, setEditingEmployee] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterActive, setFilterActive] = useState(initialFilter)
    const [csrfToken, setCsrfToken] = useState(null)
    const [resendingFor, setResendingFor] = useState(null)

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.employees || [])
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchEmployees()
    }, [])

    const handleResendVerification = async (email, empId) => {
        setResendingFor(empId)
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            if (res.ok) {
                toast.success('Verification email resent successfully!')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to resend verification email')
            }
        } catch (e) {
            console.error(e)
            toast.error('Error sending verification email')
        } finally {
            setResendingFor(null)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/employees/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) fetchEmployees()
            else toast.error("Failed to delete employee")
        } catch (e) {
            console.error(e)
            toast.error("Error deleting employee")
        }
    }

    return (
        <div className="space-y-8">
            <EditEmployeeModal
                isOpen={!!editingEmployee}
                onClose={() => setEditingEmployee(null)}
                employee={editingEmployee}
                onRefresh={fetchEmployees}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employees</h1>
                    <p className="text-slate-500 mt-1">View and manage all organization members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 text-slate-900 placeholder:text-slate-400 font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['ALL', 'VERIFIED', 'UNVERIFIED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterActive(f)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                                    filterActive === f
                                        ? f === 'UNVERIFIED' 
                                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                                            : 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {f === 'ALL' && 'All'}
                                {f === 'VERIFIED' && (
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Verified
                                    </span>
                                )}
                                {f === 'UNVERIFIED' && (
                                    <span className="flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Unverified
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Role & Dept</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : (() => {
                                const filtered = employees.filter(emp => {
                                    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                                    const matchesFilter = filterActive === "ALL" ||
                                        (filterActive === "VERIFIED" && emp.emailVerified) ||
                                        (filterActive === "UNVERIFIED" && !emp.emailVerified)
                                    return matchesSearch && matchesFilter
                                })
                                return filtered.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No employees found.</td></tr>
                                ) : filtered.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                    {emp.avatar ? (
                                                        <img src={emp.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        emp.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{emp.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{emp.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800">{emp.role}</p>
                                            <p className="text-xs text-slate-500">{emp.department}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3" />
                                                    {emp.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {emp.emailVerified ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Pending
                                                    </span>
                                                    <button
                                                        onClick={() => handleResendVerification(emp.email, emp.id)}
                                                        disabled={resendingFor === emp.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                                                        title="Resend verification email"
                                                    >
                                                        {resendingFor === emp.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Send className="w-3 h-3" />
                                                        )}
                                                        Resend
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingEmployee(emp)}
                                                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            })()}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-700 font-medium">
                    <span>Showing {employees.filter(emp => {
                        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
                        const matchesFilter = filterActive === "ALL" ||
                            (filterActive === "VERIFIED" && emp.emailVerified) ||
                            (filterActive === "UNVERIFIED" && !emp.emailVerified)
                        return matchesSearch && matchesFilter
                    }).length} of {employees.length} employees</span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors text-slate-700" disabled>Previous</button>
                        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors text-slate-700" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function EmployeesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <EmployeesContent />
        </Suspense>
    )
}
