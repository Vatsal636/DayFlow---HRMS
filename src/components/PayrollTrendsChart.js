"use client"

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DollarSign } from 'lucide-react'

export default function PayrollTrendsChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/dashboard/payroll-trends')
                if (res.ok) {
                    const result = await res.json()
                    setData(result.trends)
                }
            } catch (error) {
                console.error('Failed to fetch payroll trends:', error)
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border-2 border-slate-300 rounded-xl shadow-2xl">
                    <p className="font-bold text-slate-900 mb-3 text-base">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-6 mb-2">
                            <span className="font-semibold text-slate-700 text-sm">{entry.name}:</span>
                            <span className="font-bold text-slate-900 text-base">₹{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                    {payload[0]?.payload?.payableDays && (
                        <div className="mt-3 pt-2 border-t-2 border-slate-200">
                            <span className="text-sm font-semibold text-slate-700">Payable Days: </span>
                            <span className="text-sm font-bold text-slate-900">{payload[0].payload.payableDays}</span>
                        </div>
                    )}
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
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Payroll Trends (Last 6 Months)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Monthly salary breakdown</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="month" 
                        stroke="#475569" 
                        fontSize={13}
                        fontWeight={600}
                        tickLine={false}
                    />
                    <YAxis 
                        stroke="#475569" 
                        fontSize={13}
                        fontWeight={600}
                        tickLine={false}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        wrapperStyle={{ fontSize: '13px', fontWeight: '600', paddingTop: '20px' }}
                        iconType="circle"
                    />
                    <Bar 
                        dataKey="grossPay" 
                        name="Gross Pay"
                        fill="#3b82f6" 
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                        dataKey="deductions" 
                        name="Deductions"
                        fill="#ef4444" 
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                        dataKey="netPay" 
                        name="Net Pay"
                        fill="#10b981" 
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
