"use client"

import { useState, useEffect } from "react"
import FloatingNavbar from "@/components/FloatingNavbar"
import NotificationBell from "@/components/NotificationBell"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminLayout({ children }) {
    const router = useRouter()
    const [csrfToken, setCsrfToken] = useState(null)
    
    useEffect(() => {
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
        <div className="min-h-screen bg-slate-50 relative pb-24">
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>

            {/* Header with notifications and logout */}
            <header className="relative z-30 flex items-center justify-end gap-4 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
                <NotificationBell csrfToken={csrfToken} />
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {children}
            </main>

            <FloatingNavbar />
        </div>
    )
}
