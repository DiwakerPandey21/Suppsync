'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Plus, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const GOALS = [
    { id: 'energy', label: '⚡ Energy', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
    { id: 'sleep', label: '😴 Better Sleep', color: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' },
    { id: 'focus', label: '🧠 Focus & Clarity', color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' },
    { id: 'muscle', label: '💪 Muscle & Recovery', color: 'bg-red-500/20 border-red-500/30 text-red-300' },
    { id: 'immunity', label: '🛡️ Immunity', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
    { id: 'stress', label: '🧘 Stress Relief', color: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
    { id: 'longevity', label: '🧬 Longevity', color: 'bg-pink-500/20 border-pink-500/30 text-pink-300' },
    { id: 'skin', label: '✨ Skin & Hair', color: 'bg-rose-500/20 border-rose-500/30 text-rose-300' },
    { id: 'gut', label: '🫁 Gut Health', color: 'bg-teal-500/20 border-teal-500/30 text-teal-300' },
]

type Recommendation = {
    name: string
    dosage: string
    timing: string
    reason: string
}

export default function StackBuilderPage() {
    const supabase = createClient()
    const [selectedGoals, setSelectedGoals] = useState<string[]>([])
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [addedSupps, setAddedSupps] = useState<Set<string>>(new Set())

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        )
    }

    const generateStack = async () => {
        if (selectedGoals.length === 0) return
        setIsLoading(true)

        const goalLabels = selectedGoals.map(id => GOALS.find(g => g.id === id)?.label || id).join(', ')

        const prompt = `You are SuppSync AI, a personalized supplement advisor. Based on the user's goals, recommend a supplement stack.

User's Goals: ${goalLabels}

Respond with ONLY a JSON array of 5-7 supplements. Each object must have:
- "name": supplement name (e.g. "Ashwagandha KSM-66")
- "dosage": recommended daily dose (e.g. "600mg")
- "timing": when to take it (e.g. "Morning with food")
- "reason": one sentence why it helps with the listed goals

No markdown, no backticks, just the JSON array.`

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
                setRecommendations(parsed)
            }
        } catch (err) {
            console.error('Stack builder error:', err)
        }
        setIsLoading(false)
    }

    const addToLibrary = async (rec: Recommendation) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('supplements').insert({
            user_id: user.id,
            name: rec.name,
            brand: 'AI Recommended',
            type: 'capsule',
        })

        if (!error) {
            setAddedSupps(prev => new Set(prev).add(rec.name))
        }
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            {/* Header */}
            <div className="mb-6">
                <Link href="/profile" className="text-slate-500 text-sm flex items-center mb-3 hover:text-slate-300 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Profile
                </Link>
                <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <h1 className="text-3xl font-black text-white tracking-tight">Stack Builder</h1>
                </div>
                <p className="text-slate-500 text-sm">Select your goals and AI will build your perfect stack.</p>
            </div>

            {/* Goal Picker */}
            <AnimatePresence>
                {recommendations.length === 0 && (
                    <motion.div exit={{ opacity: 0, height: 0 }}>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {GOALS.map(goal => {
                                const selected = selectedGoals.includes(goal.id)
                                return (
                                    <motion.button
                                        key={goal.id}
                                        onClick={() => toggleGoal(goal.id)}
                                        className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${selected
                                                ? goal.color + ' ring-1 ring-white/10'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {goal.label}
                                    </motion.button>
                                )
                            })}
                        </div>

                        <Button
                            onClick={generateStack}
                            disabled={selectedGoals.length === 0 || isLoading}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold h-12 rounded-xl"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building your stack...</>
                            ) : (
                                <><Sparkles className="w-4 h-4 mr-2" /> Build My Stack ({selectedGoals.length} goals)</>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            {recommendations.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-white">Your Personalized Stack</h2>
                        <button
                            onClick={() => { setRecommendations([]); setAddedSupps(new Set()) }}
                            className="text-xs text-slate-500 hover:text-slate-300"
                        >
                            Start Over
                        </button>
                    </div>

                    {recommendations.map((rec, i) => {
                        const isAdded = addedSupps.has(rec.name)
                        return (
                            <motion.div
                                key={rec.name}
                                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{rec.name}</h3>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <span className="text-xs text-blue-400 font-semibold">{rec.dosage}</span>
                                            <span className="text-xs text-slate-600">•</span>
                                            <span className="text-xs text-amber-400">{rec.timing}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={isAdded ? "outline" : "default"}
                                        className={isAdded
                                            ? "border-green-500/30 text-green-400 h-8 text-xs"
                                            : "bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                                        }
                                        onClick={() => addToLibrary(rec)}
                                        disabled={isAdded}
                                    >
                                        {isAdded ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Added</> : <><Plus className="w-3 h-3 mr-1" /> Add</>}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{rec.reason}</p>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
