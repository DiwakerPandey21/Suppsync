'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Clock, Loader2, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

type TimingSuggestion = {
    supplement: string
    current_time: string
    suggested_time: string
    reason: string
}

export function SmartTimingOptimizer() {
    const supabase = createClient()
    const [suggestions, setSuggestions] = useState<TimingSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasOptimized, setHasOptimized] = useState(false)

    const optimizeTiming = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: schedules } = await supabase
                .from('schedules')
                .select('time_of_day, dosage_amount, dosage_unit, supplements(name)')
                .eq('user_id', user.id)

            if (!schedules || schedules.length === 0) {
                setSuggestions([])
                setHasOptimized(true)
                setIsLoading(false)
                return
            }

            const scheduleInfo = schedules.map((s: any) => {
                const supp = Array.isArray(s.supplements) ? s.supplements[0] : s.supplements
                return `${supp?.name || 'Unknown'}: ${s.dosage_amount}${s.dosage_unit} at ${s.time_of_day || 'unspecified time'}`
            }).join('\n')

            const prompt = `You are a supplement pharmacology expert. Analyze this user's supplement schedule and suggest optimal timing for maximum absorption and effectiveness.

Current Schedule:
${scheduleInfo}

Respond with ONLY a JSON array. Each object must have:
- "supplement": supplement name
- "current_time": their current timing (e.g. "morning" or "unspecified")
- "suggested_time": your recommended time (e.g. "Evening, 1 hour before bed")
- "reason": one sentence why (focus on absorption, circadian rhythm, or food interactions)

Include ALL supplements. No markdown, no backticks, just the JSON array.`

            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (res.ok) {
                const data = await res.json()
                let parsed = data.response
                if (typeof parsed === 'string') {
                    parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    parsed = JSON.parse(parsed)
                }
                setSuggestions(parsed)
            }
            setHasOptimized(true)
        } catch (err) {
            console.error('Timing optimizer error:', err)
        }
        setIsLoading(false)
    }

    return (
        <div className="w-full px-4 mb-6">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-white text-sm">Smart Timing</h3>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-slate-700"
                        onClick={optimizeTiming}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : hasOptimized ? 'Re-optimize' : 'Optimize'}
                    </Button>
                </div>

                {!hasOptimized && !isLoading && (
                    <p className="text-xs text-slate-500">AI suggests the best time to take each supplement.</p>
                )}

                {hasOptimized && suggestions.length === 0 && (
                    <p className="text-xs text-slate-500">No schedules found. Add supplements and schedules first.</p>
                )}

                {suggestions.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {suggestions.map((s, i) => (
                            <motion.div
                                key={i}
                                className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white">{s.supplement}</p>
                                    <p className="text-[11px] text-blue-400 font-semibold mt-0.5">⏰ {s.suggested_time}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.reason}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
