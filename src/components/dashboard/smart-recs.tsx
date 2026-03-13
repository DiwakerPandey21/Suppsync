'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { GlassCard } from './glass-card'
import { motion, AnimatePresence } from 'framer-motion'

export function SmartRecs() {
    const supabase = createClient()
    const [recs, setRecs] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [generated, setGenerated] = useState(false)

    const generate = async () => {
        if (generated) { setIsOpen(!isOpen); return }
        setIsLoading(true)
        setIsOpen(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: supps } = await supabase
            .from('supplements')
            .select('name, default_dosage_amount, default_dosage_unit')
            .eq('user_id', user.id)

        const { data: scores } = await supabase
            .from('subjective_scores')
            .select('energy_score, focus_score, sleep_score')
            .eq('user_id', user.id)
            .order('record_date', { ascending: false })
            .limit(7)

        const prompt = `You are a supplement coach. Based on this user's stack and recent scores, give 3 SHORT actionable recommendations for today.

Stack: ${JSON.stringify(supps?.map(s => `${s.name} ${s.default_dosage_amount}${s.default_dosage_unit}`) || [])}
Recent scores (last 7 days): ${JSON.stringify(scores || [])}

Return ONLY a JSON array of 3 strings, each under 60 chars. Example:
["Take Magnesium 30min before bed tonight", "Try Vitamin D with breakfast fat", "Consider adding Omega-3 for focus"]`

        try {
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
                setRecs(Array.isArray(parsed) ? parsed : [])
                setGenerated(true)
            }
        } catch {}
        setIsLoading(false)
    }

    return (
        <div className="w-full px-4 mb-4">
            <button
                onClick={generate}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl hover:from-amber-500/10 hover:to-orange-500/10 transition-all"
            >
                <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">Smart Tips for Today</span>
                </div>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && recs.length > 0 && (
                    <motion.div
                        className="mt-2 space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {recs.map((rec, i) => (
                            <GlassCard key={i} gradient="amber">
                                <div className="flex items-start space-x-2">
                                    <span className="text-amber-400 font-black text-sm">{i + 1}.</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                                </div>
                            </GlassCard>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
