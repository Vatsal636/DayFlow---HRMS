"use client"

import FloatingNavbar from "@/components/FloatingNavbar"
import { LayoutDashboard, CalendarCheck, FileText, User, Banknote, MessageCircle, Trophy } from "lucide-react"

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

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Main Content Area */}
            <main className="relative pt-8 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
                {children}
            </main>

            <FloatingNavbar items={navItems} />
        </div>
    )
}
