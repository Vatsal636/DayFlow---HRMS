"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LayoutDashboard, Users, Clock, Calendar, Banknote, FileText, LogOut, MessageCircle, Trophy, FileBarChart } from "lucide-react"

const defaultAdminItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Attendance", href: "/admin/attendance", icon: Clock },
    { name: "Payroll", href: "/admin/payroll", icon: Banknote },
    { name: "Reports", href: "/admin/reports", icon: FileBarChart },
    { name: "Chat", href: "/admin/chat", icon: MessageCircle },
    { name: "Leaves", href: "/admin/leaves", icon: Calendar },
]

export default function FloatingNavbar({ items }) {
    const pathname = usePathname()
    const navLinks = items || defaultAdminItems
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch('/api/chat/read')
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (e) {
            console.error('Failed to fetch unread count:', e)
        }
    }

    useEffect(() => {
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 5000) // Poll every 5 seconds
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="bg-slate-900/90 backdrop-blur-lg border border-white/10 text-white p-2 rounded-full shadow-2xl flex items-center gap-1 overflow-hidden"
            >
                {navLinks.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href))
                    const label = item.name || item.label // Handle both casing

                    return (
                        <Link
                            key={label}
                            href={item.href}
                            className="relative flex items-center"
                        >
                            <motion.div
                                className={`relative px-4 py-3 rounded-full flex items-center transition-colors ${isActive ? "" : "hover:bg-white/10"}`}
                                initial="initial"
                                whileHover="hover"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/20 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className="relative">
                                    <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "text-blue-200" : "text-slate-400"}`} />
                                    {item.icon === MessageCircle && unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </motion.span>
                                    )}
                                </div>

                                <motion.span
                                    variants={{
                                        initial: { width: 0, opacity: 0, marginLeft: 0 },
                                        hover: { width: "auto", opacity: 1, marginLeft: 8 }
                                    }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
                                >
                                    {label}
                                </motion.span>
                            </motion.div>
                        </Link>
                    )
                })}

                <div className="w-px h-8 bg-white/10 mx-2" />

                <button
                    onClick={() => {
                        // Logout logic
                        document.cookie = 'token=; Max-Age=0; path=/;'
                        window.location.href = '/'
                    }}
                    className="px-4 py-3 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </motion.nav>
        </div>
    )
}
