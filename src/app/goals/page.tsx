'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, X, Loader2, TrendingUp, Dumbbell, Moon, Zap, Brain, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'

type Goal = {
    id: string
    title: string
    category: string
    target_value: number
    current_value: number
    unit: string
    deadline: string | null
}

const CATEGORIES = [
    { id: 'muscle', label: 'Muscle Gain', icon: Dumbbell, color: 'text-blue-400' },
    { id: 'sleep', label: 'Better Sleep', icon: Moon, color: 'text-indigo-400' },
    { id: 'energy', label: 'More Energy', icon: Zap, color: 'text-amber-400' },
    { id: 'focus', label: 'Mental Focus', icon: Brain, color: 'text-cyan-400' },
    { id: 'health', label: 'General Health', icon: Heart, color: 'text-rose-400' },
]

export default function GoalsPage() {
    const supabase = createClient()
    const [goals, setGoals] = useState<Goal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newCat, setNewCat] = useState('muscle')
    const [newTarget, setNewTarget] = useState(100)
    const [saving, setSaving] = useState(false)

    useEffect(() => { load() }, [])

    const load = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        setGoals(data || [])
        setIsLoading(false)
    }

    const addGoal = async () => {
        if (!newTitle.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase.from('goals').insert({
            user_id: user.id,
            title: newTitle,
            category: newCat,
            target_value: newTarget,
            current_value: 0,
        })
        setNewTitle('')
        setShowAdd(false)
        setSaving(false)
        load()
    }

    const updateProgress = async (id: string, delta: number) => {
        const goal = goals.find(g => g.id === id)
        if (!goal) return
        const newVal = Math.max(0, Math.min(goal.target_value, goal.current_value + delta))
        await supabase.from('goals').update({ current_value: newVal }).eq('id', id)
        setGoals(prev => prev.map(g => g.id === id ? { ...g, current_value: newVal } : g))
    }

    const deleteGoal = async (id: string) => {
        await supabase.from('goals').delete().eq('id', id)
        setGoals(prev => prev.filter(g => g.id !== id))
    }

    const getCatMeta = (cat: string) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[0]

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center space-x-2">
                        <Target className="w-6 h-6 text-emerald-400" />
                        <h1 className="text-3xl font-black text-white tracking-tight">Goals</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Track your fitness & wellness goals</p>
                </div>
                <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9">
                    <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
            </div>

            {/* Add Goal Form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <GlassCard gradient="emerald">
                            <input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g. Hit 80kg bench press"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 mb-3"
                            />
                            <div className="flex flex-wrap gap-2 mb-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setNewCat(cat.id)}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            newCat === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        <cat.icon className="w-3 h-3" />
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2 mb-3">
                                <span className="text-xs text-slate-500">Target:</span>
                                <input
                                    type="number"
                                    value={newTarget}
                                    onChange={e => setNewTarget(parseInt(e.target.value) || 100)}
                                    className="w-20 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                                />
                            </div>
                            <Button onClick={addGoal} disabled={saving || !newTitle.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
                            </Button>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goal Cards */}
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
            ) : goals.length === 0 ? (
                <div className="text-center py-16">
                    <Target className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No goals yet. Set your first one!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {goals.map((goal, i) => {
                        const cat = getCatMeta(goal.category)
                        const pct = Math.round((goal.current_value / goal.target_value) * 100)
                        const isComplete = pct >= 100
                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <GlassCard gradient={isComplete ? 'emerald' : 'blue'} glow={isComplete}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <cat.icon className={`w-4 h-4 ${cat.color}`} />
                                            <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                                        </div>
                                        <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl font-black text-white">
                                            <AnimatedCounter value={pct} suffix="%" />
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {goal.current_value} / {goal.target_value}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                                        <motion.div
                                            className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, pct)}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                        />
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => updateProgress(goal.id, -5)}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-1.5 text-xs font-semibold transition-colors"
                                        >
                                            -5
                                        </button>
                                        <button
                                            onClick={() => updateProgress(goal.id, 5)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs font-semibold transition-colors"
                                        >
                                            +5
                                        </button>
                                        <button
                                            onClick={() => updateProgress(goal.id, 10)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 text-xs font-semibold transition-colors"
                                        >
                                            +10
                                        </button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
