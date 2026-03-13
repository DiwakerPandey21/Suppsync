'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Grid3X3, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type Supplement = { id: string; name: string }
type MatrixCell = { synergy: 'good' | 'caution' | 'avoid' | 'neutral'; note: string }

export function InteractionMatrix() {
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)
    const [supps, setSupps] = useState<Supplement[]>([])
    const [matrix, setMatrix] = useState<Record<string, MatrixCell>>({})
    const [isLoading, setIsLoading] = useState(false)

    const open = async () => {
        setIsOpen(true)
        if (supps.length > 0) return
        setIsLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase.from('supplements').select('id, name').eq('user_id', user.id)
        const suppList = data || []
        setSupps(suppList)

        if (suppList.length < 2) { setIsLoading(false); return }

        // Generate pairs and ask AI
        const pairs = []
        for (let i = 0; i < suppList.length; i++) {
            for (let j = i + 1; j < suppList.length; j++) {
                pairs.push(`${suppList[i].name} + ${suppList[j].name}`)
            }
        }

        const prompt = `Rate these supplement pair interactions. Return ONLY a valid JSON object with each pair as key and an object with "synergy" (one of: "good", "caution", "avoid", "neutral") and "note" (under 20 chars).

Pairs: ${pairs.join(', ')}

Example: { "Magnesium + Zinc": { "synergy": "caution", "note": "compete for absorption" } }`

        try {
            const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
            if (res.ok) {
                const data = await res.json()
                let parsed = data.response
                if (typeof parsed === 'string') {
                    parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    parsed = JSON.parse(parsed)
                }
                setMatrix(parsed || {})
            }
        } catch {}
        setIsLoading(false)
    }

    const getCell = (s1: string, s2: string): MatrixCell => {
        return matrix[`${s1} + ${s2}`] || matrix[`${s2} + ${s1}`] || { synergy: 'neutral', note: '—' }
    }

    const synergyColor = (s: string) => {
        switch (s) {
            case 'good': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            case 'caution': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            case 'avoid': return 'bg-red-500/20 text-red-400 border-red-500/30'
            default: return 'bg-slate-800/50 text-slate-500 border-slate-700'
        }
    }

    const synergyEmoji = (s: string) => {
        switch (s) {
            case 'good': return '✅'
            case 'caution': return '⚠️'
            case 'avoid': return '🚫'
            default: return '➖'
        }
    }

    return (
        <>
            <button
                onClick={open}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-bold">Interaction Matrix</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center">
                                    <Grid3X3 className="w-5 h-5 text-cyan-400 mr-2" /> Interactions
                                </h3>
                                <button onClick={() => setIsOpen(false)}>
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                                    <p className="text-xs text-slate-500">Analyzing interactions...</p>
                                </div>
                            ) : supps.length < 2 ? (
                                <p className="text-xs text-slate-500 text-center py-8">Add at least 2 supplements to see interactions.</p>
                            ) : (
                                <div className="space-y-2">
                                    {supps.map((s1, i) =>
                                        supps.slice(i + 1).map(s2 => {
                                            const cell = getCell(s1.name, s2.name)
                                            return (
                                                <div
                                                    key={`${s1.id}-${s2.id}`}
                                                    className={`flex items-center justify-between p-2.5 rounded-xl border ${synergyColor(cell.synergy)}`}
                                                >
                                                    <div className="flex items-center space-x-2 min-w-0">
                                                        <span className="text-sm">{synergyEmoji(cell.synergy)}</span>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-semibold text-white truncate">
                                                                {s1.name} + {s2.name}
                                                            </p>
                                                            <p className="text-[9px] text-slate-400">{cell.note}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}

                                    <div className="flex justify-center space-x-3 pt-3 border-t border-slate-800">
                                        {['good', 'caution', 'avoid', 'neutral'].map(s => (
                                            <div key={s} className="flex items-center space-x-1">
                                                <span className="text-xs">{synergyEmoji(s)}</span>
                                                <span className="text-[9px] text-slate-500 capitalize">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
