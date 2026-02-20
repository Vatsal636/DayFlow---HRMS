"use client"

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

export default function AttendanceTrendChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/dashboard/attendance-trend')
                if (res.ok) {
                    const result = await res.json()
                    setData(result.trendData)
                }
            } catch (error) {
                console.error('Failed to fetch attendance trend:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-96 flex items-center justify-center">
                <div className="text-slate-400">Loading chart...</div>
            </div>
        )
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const status = payload[0].payload.status
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-bold text-slate-900">{label}</p>
                    <p className={`text-sm font-medium ${
                        status === 'Present' ? 'text-green-600' :
                        status === 'Late' ? 'text-orange-600' :
                        status === 'Leave' ? 'text-purple-600' :
                        status === 'Absent' ? 'text-red-600' :
                        'text-slate-600'
                    }`}>
                        {status}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Attendance Trend (Last 30 Days)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Your daily attendance pattern</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        domain={[0, 1]}
                        ticks={[0, 1]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        iconType="circle"
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Present" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="url(#colorPresent)" 
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Late" 
                        stackId="1"
                        stroke="#f59e0b" 
                        fill="url(#colorLate)" 
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Leave" 
                        stackId="1"
                        stroke="#a855f7" 
                        fill="url(#colorLeave)" 
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Absent" 
                        stackId="1"
                        stroke="#ef4444" 
                        fill="url(#colorAbsent)" 
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
