"use client"

import { useState, useEffect } from "react"
import FloatingNavbar from "@/components/FloatingNavbar"
import NotificationBell from "@/components/NotificationBell"
import { LayoutDashboard, CalendarCheck, FileText, User, Banknote, MessageCircle, Trophy, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

// Reuse the Floating Navbar logic but with Employee links
const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" }, // Planned
    { label: "Payroll", icon: Banknote, href: "/dashboard/payroll" },
    { label: "Chat", icon: MessageCircle, href: "/dashboard/chat" },
    { label: "Awards", icon: Trophy, href: "/dashboard/leaderboard" },
    { label: "Leaves", icon: FileText, href: "/dashboard/leaves" }, // Planned
    { label: "Profile", icon: User, href: "/dashboard/profile" }, // Planned
]

export default function EmployeeLayout({ children }) {
    const router = useRouter()
    const [csrfToken, setCsrfToken] = useState(null)
    
    useEffect(() => {
        // Get CSRF token from localStorage (set during login)
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
    }, [])
    
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
        } catch (e) {
            console.error('Logout error:', e)
        } finally {
            localStorage.removeItem('csrfToken')
            router.push('/login')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Header with notifications and logout */}
            <header className="relative z-30 flex items-center justify-end gap-4 px-4 md:px-8 pt-4 max-w-7xl mx-auto">
                <NotificationBell csrfToken={csrfToken} />
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="relative pt-4 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
                {children}
            </main>

            <FloatingNavbar items={navItems} />
        </div>
    )
}
