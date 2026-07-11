'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'

type Biomarker = {
    id: string
    name: string
    value: number
    unit: string
    record_date: string
    notes: string | null
}

interface BiomarkerChartProps {
    data: Biomarker[]
    timeRange: 'W' | 'M' | 'Q' | 'Y' | 'ALL'
}

export function BiomarkerChart({ data, timeRange }: BiomarkerChartProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const chartData = useMemo(() => {
        // Sort oldest to newest
        const sorted = [...data].sort(
            (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
        )

        // Filter based on time range
        const now = new Date()
        const filtered = sorted.filter(item => {
            const date = new Date(item.record_date)
            const diffTime = Math.abs(now.getTime() - date.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (timeRange === 'W') return diffDays <= 7
            if (timeRange === 'M') return diffDays <= 30
            if (timeRange === 'Q') return diffDays <= 90
            if (timeRange === 'Y') return diffDays <= 365
            return true // ALL
        })

        return filtered.map(item => ({
            ...item,
            formattedDate: new Date(item.record_date).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
            })
        }))
    }, [data, timeRange])

    if (!isMounted) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] uppercase font-bold tracking-wider italic">
                No logs in this range.
            </div>
        )
    }

    if (chartData.length < 2) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider text-center p-4">
                Log one more result to see a trend.
            </div>
        )
    }

    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.15 || max * 0.15

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="rgba(255, 255, 255, 0.25)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        fontFamily="monospace"
                    />
                    <YAxis
                        stroke="rgba(255, 255, 255, 0.25)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        domain={[Math.max(0, min - padding), max + padding]}
                        tickFormatter={(val) => Math.round(val).toString()}
                        fontFamily="monospace"
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload as typeof chartData[0]
                                return (
                                    <div className="bg-[#0b0c1e] border border-white/[0.08] p-3 rounded-2xl shadow-2xl backdrop-blur-md outline-none">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{d.formattedDate}</p>
                                        <div className="flex items-baseline space-x-1.5">
                                            <span className="text-xl font-black text-white leading-none">{d.value}</span>
                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">{d.unit}</span>
                                        </div>
                                        {d.notes && (
                                            <p className="text-[9px] text-slate-400 mt-1.5 italic max-w-[160px] leading-normal border-t border-white/[0.05] pt-1.5">
                                                "{d.notes}"
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartGlow)"
                        dot={{ r: 3, fill: '#05050C', stroke: '#3b82f6', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
