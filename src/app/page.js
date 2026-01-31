"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, CheckCircle2, Zap, Shield, Users, BarChart3, Globe } from "lucide-react"

export default function LandingPage() {
    const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 200])
    const y2 = useTransform(scrollY, [0, 500], [0, -150])

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    }

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-violet-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* Navbar */}
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/50 bg-white/70"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-gradient-to-vr from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-900/10">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Dayflow</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Solutions</a>
                        <a href="#about" className="hover:text-blue-600 transition-colors">Mission</a>
                        <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                            Log In
                        </Link>
                        <Link
                            href="/login"
                            className="group relative px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="relative flex items-center gap-2">
                                Get Started <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <main className="relative z-10 pt-44 pb-32 px-6">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto text-center"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        The Future of Work is Here
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]"
                    >
                        Unleash <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 animate-gradient-x">
                            Workforce Potential.
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed"
                    >
                        Dayflow isn't just HR software. It's the operating system for high-performance teams.
                        Manage payroll, attendance, and culture in one fluid motion.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
                        >
                            Start Free Trial
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Dashboard Visual */}
                <motion.div
                    style={{ y: y1, rotateX: 10 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-20 mb-20 max-w-6xl mx-auto relative perspective-1000"
                >
                    <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-20" />

                    <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-xl shadow-2xl">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                        {/* Mock UI Frame */}
                        <div className="border-b border-slate-100 bg-white/80 p-4 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="h-6 w-96 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 font-mono">dayflow.app/dashboard</div>
                            <div className="w-8" />
                        </div>

                        {/* Internal Dashboard Mock Content */}
                        <div className="p-8 grid grid-cols-12 gap-6 bg-slate-50/50">
                            <div className="col-span-2 space-y-4 hidden md:block">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center px-3 gap-3">
                                        <div className="w-5 h-5 rounded-md bg-slate-100" />
                                        <div className="w-20 h-2 rounded-full bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                            <div className="col-span-12 md:col-span-10 grid gap-6">
                                <div className="grid grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 rounded-2xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50" />
                                            <div className="w-16 h-4 rounded-full bg-slate-100" />
                                            <div className="w-24 h-6 rounded-full bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-64 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 font-medium">
                                    Interactive Analytics Graph
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Logo Ticker */}
            <div className="w-full py-10 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="flex w-full whitespace-nowrap">
                    <motion.div
                        animate={{ x: "-50%" }}
                        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                        className="flex items-center gap-16 px-16 opacity-40 grayscale"
                    >
                        {/* Mock Logos repeated */}
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-slate-800"></span>
                                ACME CORPS {i + 1}
                            </div>
                        ))}
                    </motion.div>
                    <motion.div
                        animate={{ x: "-50%" }}
                        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                        className="flex items-center gap-16 px-16 opacity-40 grayscale"
                    >
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-slate-800"></span>
                                ACME CORPS {i + 1}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Unique Workflow Section */}
            <section className="py-32 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-slate-900">Seamless Flow.</h2>
                            <p className="text-lg text-slate-500">From the moment they sign up to their first paycheck.</p>
                        </div>

                        {[
                            { title: "01. Onboard", desc: "Auto-generate IDs and Credentials." },
                            { title: "02. Contribute", desc: "Attendance and Leave tracking made zero-friction." },
                            { title: "03. Compensate", desc: "Payroll calculated instantly at month-end." }
                        ].map((step, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: i * 0.2 }}
                                key={i}
                                className="flex gap-6 group hover:bg-slate-50 p-6 rounded-2xl transition-colors cursor-default"
                            >
                                <div className="text-4xl font-mono font-light text-blue-200 group-hover:text-blue-600 transition-colors">
                                    {step.title.split('.')[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title.split('.')[1]}</h3>
                                    <p className="text-slate-500">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative h-[600px] bg-slate-100 rounded-[3rem] overflow-hidden shadow-inner hidden md:block">
                        {/* Abstract Representation of Flow */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full blur-[60px]"
                        />
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl flex items-center justify-center p-12">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-slate-100">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">JD</div>
                                    <div>
                                        <div className="font-bold text-slate-900">John Doe</div>
                                        <div className="text-xs text-slate-500">Software Engineer</div>
                                    </div>
                                    <div className="ml-auto text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">ACTIVE</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Attendance</span>
                                        <span className="font-medium text-slate-900">98%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full w-[98%]"></div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <span className="text-sm font-medium text-slate-600">Net Pay</span>
                                        <span className="font-bold text-slate-900">₹45,200</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section className="py-32 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-20">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything nice. <span className="text-slate-400">Nothing superfluous.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[300px]">
                        {/* Large Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 row-span-1 md:row-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Globe className="w-64 h-64 text-blue-600" />
                            </div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Total Team Visibility</h3>
                                    <p className="text-lg text-slate-500 max-w-md">
                                        From onboarding to offboarding, track every step of the employee lifecycle with granular precision.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                                    Explore Features <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative z-10">
                                <BarChart3 className="w-10 h-10 text-blue-300 mb-6" />
                                <h3 className="text-2xl font-bold mb-2">Payroll Autopilot</h3>
                                <p className="text-slate-400">Set structure once. We handle calculations forever.</p>
                            </div>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col justify-between"
                        >
                            <div>
                                <Shield className="w-10 h-10 text-emerald-500 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Security</h3>
                                <p className="text-slate-500">Role-based access control baked into the core.</p>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-20 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <span className="font-bold text-2xl tracking-tighter text-slate-900">Dayflow</span>
                        <p className="text-slate-400 mt-2">Crafted for the future.</p>
                    </div>
                    <div className="flex gap-8 text-slate-500">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
