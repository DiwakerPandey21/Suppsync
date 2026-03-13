'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

type Interaction = {
    pair: string
    severity: 'danger' | 'caution' | 'synergy'
    description: string
}

export function InteractionChecker() {
    const supabase = createClient()
    const [interactions, setInteractions] = useState<Interaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasChecked, setHasChecked] = useState(false)

    const checkInteractions = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: supps } = await supabase
                .from('supplements')
                .select('name')
                .eq('user_id', user.id)

            if (!supps || supps.length < 2) {
                setInteractions([{
                    pair: 'Not enough data',
                    severity: 'caution',
                    description: 'Add at least 2 supplements to your library to check for interactions.'
                }])
                setHasChecked(true)
                setIsLoading(false)
                return
            }

            const names = supps.map(s => s.name).join(', ')

            const prompt = `You are a pharmacology expert. Analyze these supplements for interactions: ${names}

Check for:
1. Dangerous combinations that should be avoided
2. Combinations requiring caution (timing/absorption interference)
3. Synergistic combinations that boost each other

Respond with ONLY a JSON array. Each object must have:
- "pair": the two supplements involved (e.g. "Iron + Calcium")
- "severity": exactly one of "danger", "caution", or "synergy"
- "description": one sentence explanation

Include 3-6 interactions. If there are no dangerous interactions, still include caution and synergy items. No markdown, no backticks, just the JSON array.`

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
                setInteractions(parsed)
            }
            setHasChecked(true)
        } catch (err) {
            console.error('Interaction check error:', err)
        }
        setIsLoading(false)
    }

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'danger': return <AlertTriangle className="w-4 h-4 text-red-400" />
            case 'caution': return <ShieldAlert className="w-4 h-4 text-amber-400" />
            case 'synergy': return <CheckCircle2 className="w-4 h-4 text-green-400" />
            default: return <Sparkles className="w-4 h-4 text-blue-400" />
        }
    }

    const getBorder = (severity: string) => {
        switch (severity) {
            case 'danger': return 'border-red-500/20 bg-red-500/5'
            case 'caution': return 'border-amber-500/20 bg-amber-500/5'
            case 'synergy': return 'border-green-500/20 bg-green-500/5'
            default: return 'border-slate-800'
        }
    }

    return (
        <div className="w-full px-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        <h3 className="font-bold text-white text-sm">Interaction Checker</h3>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-slate-700"
                        onClick={checkInteractions}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : hasChecked ? 'Re-scan' : 'Scan Stack'}
                    </Button>
                </div>

                {!hasChecked && !isLoading && (
                    <p className="text-xs text-slate-500">Scan your supplement stack for potential interactions.</p>
                )}

                {interactions.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {interactions.map((inter, i) => (
                            <motion.div
                                key={i}
                                className={`p-3 rounded-xl border ${getBorder(inter.severity)}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-start space-x-2">
                                    <div className="mt-0.5">{getIcon(inter.severity)}</div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{inter.pair}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{inter.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
