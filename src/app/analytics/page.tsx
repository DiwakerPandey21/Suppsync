'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'
import Link from 'next/link'

type DayData = {
    date: string
    adherence: number
    energy: number
    focus: number
    sleep: number
}

export default function AnalyticsPage() {
    const supabase = createClient()
    const [data, setData] = useState<DayData[]>([])
    const [range, setRange] = useState<30 | 90>(30)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [range])

    const fetchData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - range)
        const startStr = startDate.toLocaleDateString('en-CA')

        // Fetch logs for adherence
        const { data: logs } = await supabase
            .from('logs')
            .select('log_date, status')
            .eq('user_id', user.id)
            .gte('log_date', startStr)

        // Fetch subjective scores
        const { data: scores } = await supabase
            .from('subjective_scores')
            .select('record_date, energy_score, focus_score, sleep_score')
            .eq('user_id', user.id)
            .gte('record_date', startStr)

        // Build day-by-day map
        const dayMap = new Map<string, DayData>()

        for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString('en-CA')
            dayMap.set(dateStr, { date: dateStr, adherence: 0, energy: 0, focus: 0, sleep: 0 })
        }

        // Calculate daily adherence
        const logsByDay = new Map<string, { taken: number; total: number }>()
        logs?.forEach(l => {
            const existing = logsByDay.get(l.log_date) || { taken: 0, total: 0 }
            existing.total += 1
            if (l.status === 'taken') existing.taken += 1
            logsByDay.set(l.log_date, existing)
        })

        logsByDay.forEach((counts, date) => {
            const day = dayMap.get(date)
            if (day) {
                day.adherence = counts.total > 0 ? Math.round((counts.taken / counts.total) * 100) : 0
            }
        })

        // Add scores
        scores?.forEach(s => {
            const day = dayMap.get(s.record_date)
            if (day) {
                day.energy = s.energy_score || 0
                day.focus = s.focus_score || 0
                day.sleep = s.sleep_score || 0
            }
        })

        setData(Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)))
        setIsLoading(false)
    }

    const avg = (key: keyof DayData) => {
        const nonZero = data.filter(d => typeof d[key] === 'number' && (d[key] as number) > 0)
        if (nonZero.length === 0) return 0
        return Math.round(nonZero.reduce((a, d) => a + (d[key] as number), 0) / nonZero.length)
    }

    const customTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs">
                <p className="text-slate-400 mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-semibold">
                        {p.name}: {p.value}{p.name === 'Adherence' ? '%' : '/10'}
                    </p>
                ))}
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            <Link href="/dashboard" className="text-slate-500 text-sm flex items-center mb-3 hover:text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Link>

            <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
            </div>
            <p className="text-slate-500 text-sm mb-6">Deep dive into your supplement trends.</p>

            {/* Range Selector */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-6">
                {([30, 90] as const).map(r => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            range === r ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {r} Days
                    </button>
                ))}
            </div>

            {/* Stat Summary */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                    { label: 'Adherence', value: `${avg('adherence')}%`, color: 'text-green-400' },
                    { label: 'Energy', value: `${avg('energy')}`, color: 'text-amber-400' },
                    { label: 'Focus', value: `${avg('focus')}`, color: 'text-blue-400' },
                    { label: 'Sleep', value: `${avg('sleep')}`, color: 'text-purple-400' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Adherence Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-2" /> Adherence Trend
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d.slice(5)} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <Tooltip content={customTooltip} />
                        <Area type="monotone" dataKey="adherence" stroke="#22c55e" fill="url(#adherenceGrad)" strokeWidth={2} name="Adherence" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Scores Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Subjective Scores</h3>
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data}>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d.slice(5)} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <Tooltip content={customTooltip} />
                        <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={false} name="Energy" />
                        <Line type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={2} dot={false} name="Focus" />
                        <Line type="monotone" dataKey="sleep" stroke="#a855f7" strokeWidth={2} dot={false} name="Sleep" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
