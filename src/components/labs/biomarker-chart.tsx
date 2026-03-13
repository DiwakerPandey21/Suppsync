'use client'

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
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
}

export function BiomarkerChart({ data }: BiomarkerChartProps) {
    // Recharts expects data sorted oldest to newest from left to right usually
    // Our SQL pulls newest first, so we reverse it for the chart
    const chartData = [...data]
        .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())
        .map(item => ({
            ...item,
            // Format date specifically for the X-axis readability
            formattedDate: new Date(item.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }))

    // If there's only 1 data point, a line chart can look weird, so we can handle it
    if (chartData.length < 2) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-medium">
                Log one more result to see a trend line.
            </div>
        )
    }

    // Determine domain. Use standard min/max + padding so the line doesn't hit the absolute edges
    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1

    return (
        <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#475569"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={5}
                    />
                    <YAxis
                        stroke="#475569"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[Math.max(0, min - padding), max + padding]}
                        tickFormatter={(val) => Math.round(val).toString()}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload as typeof chartData[0]
                                return (
                                    <div className="bg-[#0F172A] border border-slate-700 p-2 rounded-lg shadow-xl outline-none">
                                        <p className="text-xs text-slate-400 font-medium mb-1">{data.formattedDate}</p>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-lg font-bold text-white leading-none">{data.value}</span>
                                            <span className="text-[10px] text-slate-400">{data.unit}</span>
                                        </div>
                                        {data.notes && (
                                            <p className="text-xs text-slate-500 mt-1 italic max-w-[150px] truncate">
                                                "{data.notes}"
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0F172A', stroke: '#3b82f6', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
