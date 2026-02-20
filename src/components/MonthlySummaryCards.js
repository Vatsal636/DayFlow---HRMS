"use client"

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

export default function MonthlySummaryCards() {
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/dashboard/monthly-summary')
                if (res.ok) {
                    const result = await res.json()
                    setSummary(result)
                }
            } catch (error) {
                console.error('Failed to fetch monthly summary:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm h-32 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                ))}
            </div>
        )
    }

    const cards = [
        {
            title: 'Days Present',
            value: summary?.present.value || 0,
            trend: summary?.present.trend || 0,
            icon: CheckCircle2,
            color: 'green',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            trendGood: true
        },
        {
            title: 'Late Arrivals',
            value: summary?.late.value || 0,
            trend: summary?.late.trend || 0,
            icon: Clock,
            color: 'orange',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            trendGood: false
        },
        {
            title: 'Leave Days',
            value: summary?.leaves.value || 0,
            trend: summary?.leaves.trend || 0,
            icon: Calendar,
            color: 'purple',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
            trendGood: false
        },
        {
            title: 'Total Hours',
            value: summary?.hours.value || 0,
            trend: summary?.hours.trend || 0,
            icon: Clock,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trendGood: true,
            suffix: 'h'
        }
    ]

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon
                const isPositiveTrend = card.trend > 0
                const isTrendGood = card.trendGood ? isPositiveTrend : !isPositiveTrend
                const trendColor = card.trend === 0 ? 'text-slate-400' : isTrendGood ? 'text-green-600' : 'text-red-600'
                const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown

                return (
                    <div key={card.title} className={`${card.bgColor} rounded-xl p-5 border border-${card.color}-100 shadow-sm hover:shadow-md transition-all`}>
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${card.bgColor} border border-${card.color}-200`}>
                                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                            {card.trend !== 0 && (
                                <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
                                    <TrendIcon className="w-3 h-3" />
                                    {Math.abs(card.trend)}%
                                </div>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
                        <p className={`text-3xl font-bold ${card.iconColor.replace('text-', 'text-')}`}>
                            {card.value}{card.suffix || ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">vs last month</p>
                    </div>
                )
            })}
        </div>
    )
}
