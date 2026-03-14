'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles, TrendingUp, AlertCircle, Loader2, RefreshCw, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

type Insight = { title: string; body: string; type: 'positive' | 'suggestion' | 'warning' }

export default function InsightsPage() {
    const supabase = createClient()
    const [insights, setInsights] = useState<Insight[]>([])
    const [isLoadingText, setIsLoadingText] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)

    // Chart Data
    const [scoreData, setScoreData] = useState<any[]>([])
    const [adherenceData, setAdherenceData] = useState<any[]>([])
    const [isLoadingCharts, setIsLoadingCharts] = useState(true)

    useEffect(() => { loadChartData() }, [])

    const loadChartData = async () => {
        setIsLoadingCharts(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const daysToLoad = 14
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - daysToLoad)
        const startStr = dateLimit.toLocaleDateString('en-CA')

        const [scoresRes, logsRes] = await Promise.all([
            supabase.from('subjective_scores').select('record_date, energy_score, focus_score, sleep_score').eq('user_id', user.id).gte('record_date', startStr).order('record_date', { ascending: true }),
            supabase.from('logs').select('log_date, status').eq('user_id', user.id).gte('log_date', startStr)
        ])

        // Format Scores Data
        if (scoresRes.data) {
            const formattedScores = scoresRes.data.map(s => ({
                date: new Date(s.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                Energy: s.energy_score,
                Focus: s.focus_score,
                Sleep: s.sleep_score
            }))
            setScoreData(formattedScores)
        }

        // Format Adherence Data
        if (logsRes.data) {
            const grouped = logsRes.data.reduce((acc: any, log: any) => {
                const date = new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (!acc[date]) acc[date] = { date, Taken: 0, Missed: 0 }
                if (log.status === 'taken') acc[date].Taken += 1
                else acc[date].Missed += 1
                return acc
            }, {})
            setAdherenceData(Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        }

        setIsLoadingCharts(false)
    }

    const generateInsights = async () => {
        setIsLoadingText(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const suppsRes = await supabase.from('supplements').select('name').eq('user_id', user.id)
            const supps = suppsRes.data || []
            
            const totalTaken = adherenceData.reduce((acc, d) => acc + d.Taken, 0)
            const totalSched = adherenceData.reduce((acc, d) => acc + d.Taken + d.Missed, 0)
            const percent = totalSched > 0 ? Math.round((totalTaken / totalSched) * 100) : 0

            const prompt = `You are SuppSync AI, a Data Analyst. Analyze this user's last 14 days and provide exactly 3 insights as JSON. Each insight has "title", "body" (1 actionable sentence), and "type" ("positive", "suggestion", "warning").

Stack: ${supps.map(s => s.name).join(', ') || 'None'}
Adherence: ${percent}% (${totalTaken}/${totalSched})
Scores (last few days): ${JSON.stringify(scoreData.slice(-3))}

Return ONLY a valid JSON array.`

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (response.ok) {
                const data = await response.json()
                let parsed = data.response
                if (typeof parsed === 'string') {
                    parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    parsed = JSON.parse(parsed)
                }
                setInsights(parsed)
            } else {
                setInsights([{ title: 'Consistent Parsing', body: 'AI took too long. Try again.', type: 'warning' }])
            }
            setHasGenerated(true)
        } catch {
            setInsights([{ title: 'Network Error', body: 'Check your connection.', type: 'warning' }])
            setHasGenerated(true)
        }
        setIsLoadingText(false)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'positive': return <TrendingUp className="w-5 h-5 text-emerald-400" />
            case 'suggestion': return <Sparkles className="w-5 h-5 text-blue-400" />
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />
            default: return <Sparkles className="w-5 h-5 text-blue-400" />
        }
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4 space-y-6">
            <div className="mb-2">
                <div className="flex items-center space-x-2 mb-1">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <h1 className="text-3xl font-black text-white tracking-tight">Data Mastery</h1>
                </div>
                <p className="text-slate-500 text-sm">AI-powered charts and deep insights.</p>
            </div>

            {/* AI Insights Section */}
            <GlassCard gradient="purple">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 text-purple-400 mr-2" /> AI Assistant Summary
                </h2>
                {!hasGenerated ? (
                    <Button onClick={generateInsights} disabled={isLoadingText} className="w-full bg-purple-600 hover:bg-purple-700">
                        {isLoadingText ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Generate Insights'}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        {insights.map((insight, i) => (
                            <div key={i} className="flex items-start space-x-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="mt-0.5">{getIcon(insight.type)}</div>
                                <div>
                                    <h3 className="font-bold text-white text-xs">{insight.title}</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{insight.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Charts Section */}
            {isLoadingCharts ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
            ) : (
                <>
                    {/* Scores Chart */}
                    <GlassCard gradient="blue">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                            <Activity className="w-4 h-4 text-blue-400 mr-2" /> Subjective Scores (14 Days)
                        </h2>
                        {scoreData.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-6">No scores logged yet.</p>
                        ) : (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={scoreData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '11px' }}
                                            labelStyle={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Line type="monotone" dataKey="Energy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Focus" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Sleep" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </GlassCard>

                    {/* Adherence Chart */}
                    <GlassCard gradient="emerald">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                            <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" /> Log Adherence (14 Days)
                        </h2>
                        {adherenceData.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-6">No logs active.</p>
                        ) : (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adherenceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '11px' }}
                                            labelStyle={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Bar dataKey="Taken" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </GlassCard>
                </>
            )}
        </div>
    )
}
