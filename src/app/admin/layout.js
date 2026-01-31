import FloatingNavbar from "@/components/FloatingNavbar"

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50 relative pb-24">
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <FloatingNavbar />
        </div>
    )
}
