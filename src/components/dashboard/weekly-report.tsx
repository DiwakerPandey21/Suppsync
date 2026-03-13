'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, Loader2, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function WeeklyReport() {
    const supabase = createClient()
    const [report, setReport] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [generated, setGenerated] = useState(false)

    const generate = async () => {
        if (generated) { setIsOpen(!isOpen); return }
        setIsLoading(true)
        setIsOpen(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const startStr = sevenDaysAgo.toLocaleDateString('en-CA')

        // Fetch last 7 days of logs
        const { data: logs } = await supabase
            .from('logs')
            .select('log_date, status, schedules(supplements(name))')
            .eq('user_id', user.id)
            .gte('log_date', startStr)

        // Fetch scores
        const { data: scores } = await supabase
            .from('subjective_scores')
            .select('record_date, energy_score, focus_score, sleep_score')
            .eq('user_id', user.id)
            .gte('record_date', startStr)

        const prompt = `You are a supplement wellness coach. Generate a brief weekly report for a user.

Logs from last 7 days: ${JSON.stringify(logs?.slice(0, 30) || [])}
Subjective scores: ${JSON.stringify(scores || [])}

Format the report as:
📊 **Weekly Summary** (1 sentence overview)
✅ **Adherence** (% and trend)
⚡ **Top Supplements** (which ones taken most)
💡 **Recommendation** (1 actionable tip for next week)

Keep it under 100 words. Be encouraging.`

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
            if (res.ok) {
                const data = await res.json()
                setReport(data.response)
                setGenerated(true)
            }
        } catch {}
        setIsLoading(false)
    }

    return (
        <div className="w-full px-4 mb-4">
            <button
                onClick={generate}
                className="w-full flex items-center justify-between p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl hover:bg-violet-500/10 transition-colors"
            >
                <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-violet-400" />
                    <span className="text-sm font-bold text-white">Weekly AI Report</span>
                </div>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                ) : isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && report && (
                    <motion.div
                        className="mt-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{report}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
