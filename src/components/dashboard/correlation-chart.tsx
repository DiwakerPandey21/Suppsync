'use client'

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    ComposedChart,
    Bar
} from 'recharts'
import { TrendingUp, Activity } from 'lucide-react'

export type CorrelationData = {
    date: string
    displayDate: string
    adherence: number // 0-100%
    energy: number | null // 1-10
}

interface CorrelationChartProps {
    data: CorrelationData[]
}

export function CorrelationChart({ data }: CorrelationChartProps) {
    if (!data || data.length === 0) return null

    return (
        <div className="w-full px-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center">
                            <Activity className="w-4 h-4 mr-1.5" />
                            Energy Correlation
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Stack adherence vs. your daily energy score.</p>
                    </div>
                    {/* Tiny Legend */}
                    <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center text-[10px] font-bold text-blue-400">
                            <div className="w-2 h-2 rounded bg-blue-500 mr-1.5 opacity-30" />
                            Adherence %
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-yellow-400">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
                            Energy (1-10)
                        </div>
                    </div>
                </div>

                <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                tickFormatter={(val, index) => index % 7 === 0 ? val : ''} // Only show some ticks
                            />
                            {/* Left Y Axis for Percentages (Bar) */}
                            <YAxis
                                yAxisId="left"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                                tickFormatter={(val) => `${val}%`}
                            />
                            {/* Right Y Axis for Energy Score (Line) */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 10]}
                                tickFormatter={(val) => val.toString()}
                            />

                            <Tooltip
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload as CorrelationData
                                        return (
                                            <div className="bg-[#0F172A] border border-slate-700 p-3 rounded-xl shadow-2xl">
                                                <p className="text-xs text-slate-400 font-bold mb-2">{d.displayDate}</p>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center space-x-6">
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase">Adherence</span>
                                                        <span className="text-sm font-black text-white">{d.adherence}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center space-x-6">
                                                        <span className="text-[10px] text-yellow-500 font-bold uppercase">Energy</span>
                                                        <span className="text-sm font-black text-white">{d.energy ? `${d.energy}/10` : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />

                            {/* Adherence is an area/bar in the background */}
                            <Bar
                                yAxisId="left"
                                dataKey="adherence"
                                fill="#3b82f6"
                                opacity={0.2}
                                radius={[4, 4, 0, 0]}
                                barSize={12}
                            />

                            {/* Energy Score is a bright line on top */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="energy"
                                stroke="#eab308"
                                strokeWidth={3}
                                connectNulls={true}
                                dot={{ r: 3, fill: '#0F172A', stroke: '#eab308', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
