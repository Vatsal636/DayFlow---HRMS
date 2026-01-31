"use client"

import { useState, useEffect } from "react"
import { Trophy, Clock, Plane, Sun, Dumbbell, Calendar as CalIcon, Medal } from "lucide-react"

export default function LeaderboardPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [activeTab, setActiveTab] = useState('early_bird')

    useEffect(() => {
        fetchLeaderboard()
    }, [selectedDate])

    const fetchLeaderboard = async () => {
        setLoading(true)
        try {
            const month = selectedDate.getMonth()
            const year = selectedDate.getFullYear()
            const res = await fetch(`/api/leaderboard?month=${month}&year=${year}`)
            if (res.ok) {
                const data = await res.json()
                setCategories(data.leaderboard || [])
                // Set default active tab if not set
                if (!activeTab && data.leaderboard.length > 0) {
                    setActiveTab(data.leaderboard[0].id)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(newDate.getMonth() + offset)
        setSelectedDate(newDate)
    }

    const getIcon = (iconName, className) => {
        switch (iconName) {
            case 'sun': return <Sun className={className} />
            case 'dumbbell': return <Dumbbell className={className} />
            case 'clock': return <Clock className={className} />
            case 'plane': return <Plane className={className} />
            default: return <Trophy className={className} />
        }
    }

    const getGradient = (id) => {
        switch (id) {
            case 'early_bird': return 'from-amber-400 to-orange-500'
            case 'iron_man': return 'from-red-500 to-rose-600'
            case 'late_latif': return 'from-purple-500 to-indigo-600'
            case 'gulli_master': return 'from-blue-400 to-cyan-500'
            default: return 'from-gray-500 to-slate-600'
        }
    }

    const activeCategory = categories.find(c => c.id === activeTab) || categories[0]

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Monthly Leaderboard
                    </h1>
                    <p className="text-slate-500 mt-1">Recognizing our stars (and slowpokes) of the month.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">←</button>
                    <div className="flex items-center gap-2 px-2 font-bold text-slate-700 w-32 justify-center">
                        <CalIcon className="w-4 h-4 text-blue-500" />
                        {selectedDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">→</button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${activeTab === cat.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${activeTab === cat.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {getIcon(cat.icon, "w-5 h-5")}
                            </div>
                            <span className="font-bold">{cat.title}</span>
                        </div>
                        <p className={`text-xs ${activeTab === cat.id ? 'text-slate-300' : 'text-slate-400'}`}>{cat.description}</p>
                    </button>
                ))}
            </div>

            {/* Main Leaderboard View */}
            {activeCategory && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
                    {/* Left: Top 3 Visuals */}
                    <div className={`w-full md:w-5/12 p-8 bg-gradient-to-br ${getGradient(activeCategory.id)} text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 p-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <h2 className="text-2xl font-bold mb-10 flex items-center justify-center gap-2">
                                {getIcon(activeCategory.icon, "w-6 h-6")}
                                {activeCategory.title}
                            </h2>

                            {/* Podium */}
                            <div className="flex justify-center items-end gap-4 mb-8">
                                {[2, 1, 3].map(rank => {
                                    const winner = activeCategory.rankings.find(r => r.rank === rank)
                                    if (!winner) return <div key={rank} className="w-20" /> // Placeholder

                                    const isFirst = rank === 1
                                    return (
                                        <div key={rank} className={`flex flex-col items-center ${isFirst ? '-mt-8' : ''}`}>
                                            <div className="relative mb-2">
                                                <div className={`rounded-full border-4 border-white/30 overflow-hidden shadow-lg ${isFirst ? 'w-24 h-24' : 'w-16 h-16 bg-white/10'}`}>
                                                    {winner.avatar ? (
                                                        <img src={winner.avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-white/20">
                                                            {winner.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full ${isFirst ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-800 text-white'}`}>
                                                    #{rank}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-bold truncate w-24 ${isFirst ? 'text-lg' : 'text-sm opacity-90'}`}>{winner.name}</div>
                                                <div className="text-xs font-bold bg-white/20 inline-block px-2 py-0.5 rounded-full mt-1">{winner.score}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Full List */}
                    <div className="flex-1 p-0 md:p-6 overflow-y-auto max-h-[600px] bg-slate-50/50">
                        <div className="space-y-2">
                            {activeCategory.rankings.length > 0 ? (
                                activeCategory.rankings.map((user) => (
                                    <div
                                        key={user.rank}
                                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${user.rank <= 3 ? 'bg-white shadow-sm border border-blue-100/50' : 'hover:bg-white hover:shadow-sm border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                user.rank === 2 ? 'bg-slate-200 text-slate-700' :
                                                    user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                                        'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.rank}
                                        </div>

                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : null}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 truncate">{user.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{user.title}</p>
                                        </div>

                                        <div className="font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm">
                                            {user.score}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-400">
                                    No data available for this month.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
