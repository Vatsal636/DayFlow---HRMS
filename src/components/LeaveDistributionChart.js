"use client"

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PieChartIcon } from 'lucide-react'

const COLORS = {
    'Sick Leave': '#ef4444',
    'Paid Leave': '#10b981',
    'Unpaid Leave': '#f59e0b'
}

export default function LeaveDistributionChart() {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/dashboard/leave-distribution')
                if (res.ok) {
                    const result = await res.json()
                    setData(result.distribution)
                    setTotal(result.total)
                }
            } catch (error) {
                console.error('Failed to fetch leave distribution:', error)
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

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-600" />
                            Leave Distribution
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Breakdown by leave type</p>
                    </div>
                </div>
                <div className="h-64 flex items-center justify-center text-slate-400">
                    No leave data for this year
                </div>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            const percentage = ((data.value / total) * 100).toFixed(1)
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-bold text-slate-900">{data.name}</p>
                    <p className="text-sm text-slate-600">{data.value} days ({percentage}%)</p>
                </div>
            )
        }
        return null
    }

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

        if (percent < 0.08) return null

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                className="text-sm font-bold"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-purple-600" />
                        Leave Distribution
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Breakdown by leave type ({total} total days)</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8b5cf6'} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
