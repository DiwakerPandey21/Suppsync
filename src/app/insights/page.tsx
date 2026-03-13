'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Insight = {
    title: string
    body: string
    type: 'positive' | 'suggestion' | 'warning'
}

export default function InsightsPage() {
    const supabase = createClient()
    const [insights, setInsights] = useState<Insight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)

    const generateInsights = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Gather data for AI analysis
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const startStr = sevenDaysAgo.toLocaleDateString('en-CA')

            const [logsRes, scoresRes, suppsRes] = await Promise.all([
                supabase.from('logs').select('log_date, status, schedule_id').eq('user_id', user.id).gte('log_date', startStr),
                supabase.from('subjective_scores').select('record_date, energy_score, focus_score, sleep_score').eq('user_id', user.id).gte('record_date', startStr),
                supabase.from('supplements').select('name').eq('user_id', user.id),
            ])

            const logs = logsRes.data || []
            const scores = scoresRes.data || []
            const supps = suppsRes.data || []

            // Build a textual summary for the AI
            const totalTaken = logs.filter(l => l.status === 'taken').length
            const totalScheduled = logs.length
            const adherenceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0

            const avgEnergy = scores.length > 0 ? (scores.reduce((a, s) => a + (s.energy_score || 0), 0) / scores.length).toFixed(1) : 'N/A'
            const avgFocus = scores.length > 0 ? (scores.reduce((a, s) => a + (s.focus_score || 0), 0) / scores.length).toFixed(1) : 'N/A'
            const avgSleep = scores.length > 0 ? (scores.reduce((a, s) => a + (s.sleep_score || 0), 0) / scores.length).toFixed(1) : 'N/A'

            const suppNames = supps.map(s => s.name).join(', ')

            const prompt = `You are SuppSync AI, a personalized supplement advisor. Analyze this user's weekly data and provide exactly 4 insights as JSON. Each insight should have "title" (short), "body" (1-2 sentences max, actionable), and "type" (one of: "positive", "suggestion", "warning").

User's Weekly Data:
- Supplements tracked: ${suppNames || 'None'}
- Adherence rate: ${adherenceRate}% (${totalTaken}/${totalScheduled} doses taken)
- Average Energy score: ${avgEnergy}/10
- Average Focus score: ${avgFocus}/10  
- Average Sleep score: ${avgSleep}/10
- Number of days with subjective scores: ${scores.length}

Respond ONLY with a valid JSON array. No markdown, no backticks, just the JSON array.`

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (response.ok) {
                const data = await response.json()
                try {
                    // Try to parse the AI response as JSON
                    let parsed = data.response
                    if (typeof parsed === 'string') {
                        // Clean up potential markdown wrapping
                        parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                        parsed = JSON.parse(parsed)
                    }
                    setInsights(parsed)
                } catch {
                    // Fallback insights if AI response can't be parsed
                    setInsights([
                        { title: 'Weekly Summary', body: `You took ${totalTaken} out of ${totalScheduled} scheduled doses this week (${adherenceRate}% adherence).`, type: 'positive' },
                        { title: 'Energy Trend', body: `Your average energy score was ${avgEnergy}/10. ${Number(avgEnergy) > 7 ? 'Great energy levels!' : 'Consider adjusting your stack for better results.'}`, type: Number(avgEnergy) > 7 ? 'positive' : 'suggestion' },
                        { title: 'Keep Logging', body: 'The more data you log, the smarter your insights become. Try to check in every day!', type: 'suggestion' },
                        { title: 'Consistency Matters', body: `${adherenceRate >= 80 ? 'Excellent consistency!' : 'Try to improve your adherence rate for better results.'}`, type: adherenceRate >= 80 ? 'positive' : 'warning' },
                    ])
                }
            } else {
                // API error - use fallback
                setInsights([
                    { title: 'Weekly Summary', body: `You took ${totalTaken} out of ${totalScheduled} scheduled doses this week (${adherenceRate}% adherence).`, type: 'positive' },
                    { title: 'Check-In Streak', body: `You logged subjective scores ${scores.length} out of 7 days. More data = smarter insights!`, type: 'suggestion' },
                    { title: 'Stack Size', body: `You're currently tracking ${supps.length} supplements. ${supps.length > 5 ? 'Solid stack!' : 'Consider adding more to optimize.'}`, type: supps.length > 5 ? 'positive' : 'suggestion' },
                    { title: 'Focus on Consistency', body: 'Aim for 90%+ adherence to see measurable differences in your subjective scores.', type: 'warning' },
                ])
            }

            setHasGenerated(true)
        } catch (err) {
            console.error('Insight generation error:', err)
        }
        setIsLoading(false)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'positive': return <TrendingUp className="w-5 h-5 text-green-400" />
            case 'suggestion': return <Sparkles className="w-5 h-5 text-blue-400" />
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />
            default: return <Sparkles className="w-5 h-5 text-blue-400" />
        }
    }

    const getBorder = (type: string) => {
        switch (type) {
            case 'positive': return 'border-green-500/20 bg-green-500/5'
            case 'suggestion': return 'border-blue-500/20 bg-blue-500/5'
            case 'warning': return 'border-amber-500/20 bg-amber-500/5'
            default: return 'border-slate-800 bg-slate-900/50'
        }
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-1">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <h1 className="text-3xl font-black text-white tracking-tight">Insights</h1>
                </div>
                <p className="text-slate-500 text-sm">AI-powered analysis of your supplement data.</p>
            </div>

            {!hasGenerated ? (
                <motion.div
                    className="flex flex-col items-center justify-center py-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                        <Brain className="w-12 h-12 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Generate Weekly Report</h2>
                    <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
                        SuppSync AI will analyze your last 7 days of supplement logs and subjective scores.
                    </p>
                    <Button
                        onClick={generateInsights}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-xl h-12 text-sm"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate Insights</>
                        )}
                    </Button>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {insights.map((insight, i) => (
                        <motion.div
                            key={i}
                            className={`p-4 rounded-2xl border ${getBorder(insight.type)}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5">{getIcon(insight.type)}</div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">{insight.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.body}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <Button
                        onClick={() => { setHasGenerated(false); setInsights([]) }}
                        variant="outline"
                        className="w-full mt-4 border-slate-800 text-slate-400 hover:bg-slate-900"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                </div>
            )}
        </div>
    )
}
