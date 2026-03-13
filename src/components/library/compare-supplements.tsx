'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeftRight, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type Supplement = { id: string; name: string }

export function CompareSupplements() {
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)
    const [supps, setSupps] = useState<Supplement[]>([])
    const [pick1, setPick1] = useState<string | null>(null)
    const [pick2, setPick2] = useState<string | null>(null)
    const [result, setResult] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const openModal = async () => {
        setIsOpen(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('supplements').select('id, name').eq('user_id', user.id)
        setSupps(data || [])
    }

    const compare = async () => {
        if (!pick1 || !pick2) return
        setIsLoading(true)

        const s1 = supps.find(s => s.id === pick1)?.name
        const s2 = supps.find(s => s.id === pick2)?.name

        const prompt = `Compare these two supplements side-by-side: "${s1}" vs "${s2}".

Respond with ONLY a JSON object (no markdown):
{
  "supp1": "${s1}",
  "supp2": "${s2}",
  "categories": [
    { "name": "Primary Benefits", "s1": "brief", "s2": "brief" },
    { "name": "Best Timing", "s1": "brief", "s2": "brief" },
    { "name": "Side Effects", "s1": "brief", "s2": "brief" },
    { "name": "Synergy Together", "s1": "description", "s2": "description" }
  ],
  "verdict": "1-sentence recommendation"
}`

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
                }
                setResult(parsed)
            }
        } catch {}
        setIsLoading(false)
    }

    let parsedResult: any = null
    try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : result
    } catch {}

    return (
        <>
            <button
                onClick={openModal}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="text-sm font-bold">Compare Supplements</span>
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
                                    <ArrowLeftRight className="w-5 h-5 text-indigo-400 mr-2" /> Compare
                                </h3>
                                <button onClick={() => { setIsOpen(false); setResult(''); setPick1(null); setPick2(null) }}>
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {!parsedResult ? (
                                <>
                                    <p className="text-xs text-slate-400 mb-3">Pick two supplements to compare:</p>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold mb-1.5">SUPPLEMENT 1</p>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                {supps.filter(s => s.id !== pick2).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setPick1(s.id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                                            pick1 === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold mb-1.5">SUPPLEMENT 2</p>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                {supps.filter(s => s.id !== pick1).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setPick2(s.id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                                            pick2 === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={compare}
                                        disabled={!pick1 || !pick2 || isLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ArrowLeftRight className="w-4 h-4 mr-1" />}
                                        Compare
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="text-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2">
                                            <p className="text-xs font-bold text-indigo-300">{parsedResult.supp1}</p>
                                        </div>
                                        <div className="text-center bg-purple-500/10 border border-purple-500/20 rounded-xl p-2">
                                            <p className="text-xs font-bold text-purple-300">{parsedResult.supp2}</p>
                                        </div>
                                    </div>

                                    {parsedResult.categories?.map((cat: any, i: number) => (
                                        <div key={i} className="mb-3">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{cat.name}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <p className="text-[11px] text-slate-300 bg-slate-900 rounded-lg p-2">{cat.s1}</p>
                                                <p className="text-[11px] text-slate-300 bg-slate-900 rounded-lg p-2">{cat.s2}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-2">
                                        <p className="text-[10px] text-emerald-400 font-bold mb-1">VERDICT</p>
                                        <p className="text-xs text-slate-300">{parsedResult.verdict}</p>
                                    </div>

                                    <Button
                                        onClick={() => { setResult(''); setPick1(null); setPick2(null) }}
                                        variant="outline"
                                        className="w-full mt-3 border-slate-700"
                                    >
                                        Compare Again
                                    </Button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
