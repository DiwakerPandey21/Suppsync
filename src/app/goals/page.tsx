'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Target, Plus, X, Loader2, TrendingUp, Dumbbell, Moon, Zap, Brain, Heart, 
    Check, Sparkles, Award, Trophy, ShieldCheck, Activity, Flame, Droplets, 
    Utensils, Calendar, ChevronRight, ArrowLeft, RefreshCw, Star, CheckCircle2,
    Lock, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { ConfettiBurst } from '@/components/dashboard/confetti-burst'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Goal = {
    id: string
    title: string
    category: string
    target_value: number
    current_value: number
    unit?: string
    deadline?: string | null
}

const CATEGORIES = [
    { id: 'muscle', label: 'Muscle Gain', icon: Dumbbell, color: 'text-blue-400' },
    { id: 'sleep', label: 'Better Sleep', icon: Moon, color: 'text-indigo-400' },
    { id: 'energy', label: 'More Energy', icon: Zap, color: 'text-amber-400' },
    { id: 'focus', label: 'Mental Focus', icon: Brain, color: 'text-cyan-400' },
    { id: 'health', label: 'General Health', icon: Heart, color: 'text-rose-400' },
    { id: 'recovery', label: 'Recovery', icon: Activity, color: 'text-emerald-400' },
    { id: 'hydration', label: 'Hydration', icon: Droplets, color: 'text-cyan-300' },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'text-orange-400' },
    { id: 'consistency', label: 'Consistency', icon: Flame, color: 'text-red-400' }
]

const GOAL_TEMPLATES = [
    { title: '30-Day Hypertrophy & Muscle Build', category: 'muscle', target: 100, xp: '+800 XP', tag: 'Popular' },
    { title: '14-Day Deep REM Sleep Reset', category: 'sleep', target: 14, xp: '+500 XP', tag: 'Circadian' },
    { title: 'Daily 3.5L Hydration Challenge', category: 'hydration', target: 30, xp: '+300 XP', tag: 'Wellness' },
    { title: 'High-Protein Intake Protocol (160g+)', category: 'nutrition', target: 30, xp: '+600 XP', tag: 'Nutrition' },
    { title: 'Nootropic Mental Focus Routine', category: 'focus', target: 21, xp: '+450 XP', tag: 'Cognitive' },
    { title: 'Unbroken 30-Day Supplement Streak', category: 'consistency', target: 30, xp: '+1000 XP', tag: 'Mastery' },
    { title: '5-Day Hypertrophy Workout Split', category: 'muscle', target: 20, xp: '+700 XP', tag: 'Fitness' },
    { title: 'Morning Solar Sunlight Exposure (15m)', category: 'health', target: 30, xp: '+400 XP', tag: 'Hormones' }
]

const BADGES = [
    { title: 'Consistency King', desc: 'Log supplements 14 days in a row', icon: Flame, unlocked: true, color: 'text-amber-400' },
    { title: 'Recovery Master', desc: 'Achieve 90%+ recovery BioScore', icon: Activity, unlocked: true, color: 'text-emerald-400' },
    { title: 'Protein Champion', desc: 'Hit 160g protein 7 days', icon: Utensils, unlocked: true, color: 'text-blue-400' },
    { title: 'Hydration Hero', desc: 'Drink 3L+ water for 10 days', icon: Droplets, unlocked: true, color: 'text-cyan-400' },
    { title: 'Sleep Ninja', desc: 'Sleep 8h+ 5 nights consecutive', icon: Moon, unlocked: false, color: 'text-purple-400' },
    { title: 'Lab Explorer', desc: 'Upload biomarker blood panel', icon: Sparkles, unlocked: false, color: 'text-indigo-400' }
]

const COMMUNITY_CHALLENGES = [
    { title: 'Log Supplements 7 Days Straight', target: '7 Days', participants: '1,420 Active', reward: '+300 XP' },
    { title: 'Circadian Sleep Cut-off Before 23:00', target: '14 Days', participants: '890 Active', reward: '+500 XP' },
    { title: 'Hit Protein Target (1.6g / kg)', target: '30 Days', participants: '2,100 Active', reward: '+800 XP' },
    { title: 'Daily 10k Steps & Solar Exposure', target: '21 Days', participants: '1,150 Active', reward: '+600 XP' }
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
    const [confettiTrigger, setConfettiTrigger] = useState(false)
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

    const [dailyTasks, setDailyTasks] = useState([
        { id: 'water', label: 'Drink 3.5L Water with Electrolytes', done: false, xp: 50 },
        { id: 'protein', label: 'Hit 160g Protein Target', done: true, xp: 100 },
        { id: 'supps', label: 'Log Morning & Night Stack', done: true, xp: 100 },
        { id: 'workout', label: 'Complete Resistance Session', done: false, xp: 150 },
        { id: 'sleep', label: '8 Hours Sleep & Night Magnesium', done: true, xp: 100 },
        { id: 'sunlight', label: '15 Mins Morning Sunlight Exposure', done: false, xp: 50 }
    ])

    useEffect(() => { load() }, [])

    const load = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        if (!error && data) {
            setGoals(data)
        }
        setIsLoading(false)
    }

    const addGoal = async (titleOverride?: string, catOverride?: string, targetOverride?: number) => {
        const titleToUse = titleOverride || newTitle
        const catToUse = catOverride || newCat
        const targetToUse = targetOverride || newTarget

        if (!titleToUse.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('goals').insert({
            user_id: user.id,
            title: titleToUse,
            category: catToUse,
            target_value: targetToUse,
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
        
        if (newVal >= goal.target_value && goal.current_value < goal.target_value) {
            setConfettiTrigger(true)
            setTimeout(() => setConfettiTrigger(false), 200)
        }

        await supabase.from('goals').update({ current_value: newVal }).eq('id', id)
        setGoals(prev => prev.map(g => g.id === id ? { ...g, current_value: newVal } : g))
    }

    const deleteGoal = async (id: string) => {
        await supabase.from('goals').delete().eq('id', id)
        setGoals(prev => prev.filter(g => g.id !== id))
    }

    const toggleTask = (id: string) => {
        setDailyTasks(prev => prev.map(t => {
            if (t.id === id) {
                const nextDone = !t.done
                if (nextDone) {
                    setConfettiTrigger(true)
                    setTimeout(() => setConfettiTrigger(false), 150)
                }
                return { ...t, done: nextDone }
            }
            return t
        }))
    }

    const getCatMeta = (cat: string) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[0]

    const totalGoals = goals.length
    const completedGoals = goals.filter(g => (g.current_value / g.target_value) >= 1).length
    const dailyDoneCount = dailyTasks.filter(t => t.done).length
    const dailyPct = Math.round((dailyDoneCount / dailyTasks.length) * 100)

    const filteredGoals = useMemo(() => {
        if (selectedCategoryFilter === 'all') return goals
        return goals.filter(g => g.category === selectedCategoryFilter)
    }, [goals, selectedCategoryFilter])

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 px-4 sm:px-8 lg:px-12 select-none">
            <ConfettiBurst trigger={confettiTrigger} />

            {/* WIDESCREEN CONTAINER (1600px Max Desktop Canvas) */}
            <div className="max-w-[1600px] w-full mx-auto space-y-8 pt-6">

                {/* NAVIGATION HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center space-x-2">
                                <Target className="w-5 h-5 text-emerald-400" />
                                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Goals OS 3.1</h1>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Personal Health Journey & Goal Mission Control</span>
                        </div>
                    </div>

                    <Button 
                        onClick={() => setShowAdd(!showAdd)} 
                        size="sm" 
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 mr-1" /> New Health Goal
                    </Button>
                </div>

                {/* HERO SECTION & 4 KPI METRIC STRIP */}
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-950 via-[#041d14] to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/20 relative overflow-hidden shadow-2xl">
                        <div className="space-y-2 max-w-3xl">
                            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                <Target className="w-3.5 h-3.5" />
                                <span>Health Mission Control</span>
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                                Your Personal Health Journey
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                                Small, consistent daily improvements create extraordinary long-term strength, longevity, and cognitive peak performance.
                            </p>
                        </div>

                        {/* 4 WIDESCREEN KPI TILES */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                            {[
                                { label: 'Completed Goals', val: `${completedGoals} / ${totalGoals}`, sub: 'Active Targets', color: 'text-emerald-400' },
                                { label: "Today's Targets", val: `${dailyPct}%`, sub: `${dailyDoneCount}/${dailyTasks.length} Completed`, color: 'text-cyan-400' },
                                { label: 'Active Streak', val: '14 Days', sub: 'Unbroken Record', color: 'text-amber-400' },
                                { label: 'Biohacker Rank', val: 'Master Tier', sub: 'Level 14 • 4,200 XP', color: 'text-indigo-400' }
                            ].map((tile, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">{tile.label}</span>
                                    <span className={cn("text-base sm:text-lg font-black block tracking-tight", tile.color)}>{tile.val}</span>
                                    <span className="text-[8px] font-bold text-slate-400 block">{tile.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FEATURED ACTIVE MISSION SPOTLIGHT */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-white block">Featured Mission Protocol</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">30-Day Hypertrophy & Stack Optimization</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs font-bold">
                            <span className="text-amber-400 font-black">+800 XP Reward</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                                72% Complete
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>Mission Adherence Progress</span>
                            <span className="text-white">21 Days Remaining</span>
                        </div>
                        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/[0.06]">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-[72%] shadow-lg shadow-emerald-500/20" />
                        </div>
                    </div>

                    <div className="pt-1 flex items-center space-x-2 text-[10px] text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span><strong>AI Goal Coach:</strong> "You've completed 72% of this protocol. Completing your evening Magnesium Glycinate log keeps your streak active!"</span>
                    </div>
                </div>

                {/* ADD GOAL FORM COLLAPSIBLE */}
                <AnimatePresence>
                    {showAdd && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <GlassCard gradient="emerald">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Create Custom Health Goal</h3>
                                        <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <input
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="e.g. Achieve 8.5/10 Sleep Score for 14 Days"
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                    />

                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Goal Category</span>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setNewCat(cat.id)}
                                                    className={cn(
                                                        "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                                        newCat === cat.id ? "bg-emerald-500 text-slate-950" : "bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
                                                    )}
                                                >
                                                    <cat.icon className="w-3.5 h-3.5" />
                                                    <span>{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Target Units / Count</span>
                                            <input
                                                type="number"
                                                value={newTarget}
                                                onChange={e => setNewTarget(parseInt(e.target.value) || 100)}
                                                className="w-32 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={() => addGoal()} disabled={saving || !newTitle.trim()} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2-COLUMN DESKTOP CORE SECTION: CHECKLIST + ROADMAP */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT (7/12): DAILY TARGET CHECKLIST */}
                    <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Today's Daily Target Checklist</h3>
                            </div>
                            <span className="text-xs font-black text-emerald-400">{dailyDoneCount} of {dailyTasks.length} Done ({dailyPct}%)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dailyTasks.map(task => (
                                <div 
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={cn(
                                        "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                                        task.done 
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                                            : "bg-slate-900/50 border-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200"
                                    )}
                                >
                                    <div className="flex items-center space-x-2.5">
                                        <div className={cn("w-4 h-4 rounded-lg border flex items-center justify-center transition-colors shrink-0", task.done ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-700")}>
                                            {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <span className={cn("text-[11px] font-bold line-clamp-1", task.done && "line-through opacity-70")}>{task.label}</span>
                                    </div>

                                    <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                                        +{task.xp} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT (5/12): ROADMAP & BIOHACKER RANK */}
                    <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Milestone Journey</span>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Roadmap Stages</h3>
                        </div>

                        <div className="space-y-2 text-xs">
                            {[
                                { stage: 'Week 1: Adaptation', status: 'Completed', detail: 'Supplement timing calibrated.', color: 'text-emerald-400' },
                                { stage: 'Week 2: Bio-Synergy', status: 'Active Protocol', detail: 'Biomarker levels stabilizing.', color: 'text-cyan-400' },
                                { stage: 'Week 3: Peak BioScore', status: 'Upcoming', detail: 'NREM sleep & HRV optimization.', color: 'text-slate-500' },
                                { stage: 'Month 2: Longevity Mastery', status: 'Locked', detail: 'Full routine automation.', color: 'text-slate-500' }
                            ].map((s, idx) => (
                                <div key={idx} className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/[0.04] flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] font-black text-white block">{s.stage}</span>
                                        <span className="text-[9px] text-slate-400 block">{s.detail}</span>
                                    </div>
                                    <span className={cn("text-[8px] font-black uppercase tracking-wider", s.color)}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* 1-CLICK READY-MADE GOAL TEMPLATES (4-COLUMN DESKTOP GRID) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block">Quick Start Protocols</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">1-Click Goal Templates</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">Click to activate instantly</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {GOAL_TEMPLATES.map((tmpl, idx) => (
                            <div 
                                key={idx}
                                className="p-5 rounded-2xl bg-slate-950/60 border border-white/[0.06] hover:border-emerald-500/30 transition-all space-y-3 group flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 tracking-widest">{tmpl.tag}</span>
                                        <span className="text-[9px] font-black text-amber-400">{tmpl.xp}</span>
                                    </div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-emerald-300 transition-colors line-clamp-2">{tmpl.title}</h4>
                                </div>

                                <button 
                                    onClick={() => addGoal(tmpl.title, tmpl.category, tmpl.target)}
                                    className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-emerald-500 hover:text-slate-950 border border-white/[0.06] text-slate-300 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer"
                                >
                                    <span>Activate Goal</span>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACTIVE GOALS CARDS (4-COLUMN DESKTOP GRID) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Active Health Goals</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Your Active Targets</h3>
                        </div>

                        <div className="flex bg-slate-900 p-1 rounded-xl text-[9px] font-black uppercase">
                            <button 
                                onClick={() => setSelectedCategoryFilter('all')}
                                className={cn("px-3 py-1 rounded-lg transition-all", selectedCategoryFilter === 'all' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                            >
                                All ({goals.length})
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
                    ) : filteredGoals.length === 0 ? (
                        <div className="p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                                <Target className="w-6 h-6" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h4 className="text-base font-black text-white uppercase tracking-wider">No Active Goals Logged</h4>
                                <p className="text-xs text-slate-400">Start your health journey by choosing a 1-click goal template above or creating a custom target.</p>
                            </div>
                            <Button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                                Create Your First Goal
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredGoals.map((goal, i) => {
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
                                                    <h3 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">{goal.title}</h3>
                                                </div>
                                                <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl font-black text-white">
                                                    <AnimatedCounter value={pct} suffix="%" />
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold">
                                                    {goal.current_value} / {goal.target_value}
                                                </span>
                                            </div>

                                            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden mb-3 border border-white/[0.06]">
                                                <motion.div
                                                    className={cn("h-full rounded-full", isComplete ? 'bg-emerald-500' : 'bg-blue-500')}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, pct)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => updateProgress(goal.id, -5)}
                                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl py-1.5 text-xs font-bold transition-colors border border-white/[0.04]"
                                                >
                                                    -5
                                                </button>
                                                <button
                                                    onClick={() => updateProgress(goal.id, 5)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-1.5 text-xs font-bold transition-colors shadow-md"
                                                >
                                                    +5
                                                </button>
                                                <button
                                                    onClick={() => updateProgress(goal.id, 10)}
                                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl py-1.5 text-xs font-black transition-colors shadow-md"
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

                {/* ACHIEVEMENTS & BADGES SYSTEM (6-COLUMN DESKTOP) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block">Gamified Progression</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Achievements & Badges</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">4 of 6 Unlocked</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {BADGES.map((badge, idx) => {
                            const BadgeIcon = badge.icon
                            return (
                                <div 
                                    key={idx}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center space-y-2 relative transition-all",
                                        badge.unlocked 
                                            ? "bg-slate-950/60 border-white/[0.08]" 
                                            : "bg-slate-950/30 border-white/[0.03] opacity-50"
                                    )}
                                >
                                    <div className={cn("w-9 h-9 rounded-2xl mx-auto flex items-center justify-center", badge.unlocked ? "bg-white/[0.04]" : "bg-slate-900")}>
                                        <BadgeIcon className={cn("w-5 h-5", badge.unlocked ? badge.color : "text-slate-600")} />
                                    </div>

                                    <div>
                                        <span className="text-xs font-black text-white block uppercase tracking-wider">{badge.title}</span>
                                        <span className="text-[8px] text-slate-500 block leading-tight">{badge.desc}</span>
                                    </div>

                                    {!badge.unlocked && (
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-500 tracking-widest inline-block">
                                            Locked
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* COMMUNITY CHALLENGES (4-COLUMN DESKTOP) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">Community Arena</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Community Challenges</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">Join Thousands of Biohackers</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {COMMUNITY_CHALLENGES.map((ch, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.04] space-y-3 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">{ch.target}</span>
                                        <span className="text-[9px] font-bold text-emerald-400">{ch.reward}</span>
                                    </div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{ch.title}</h4>
                                    <span className="text-[9px] text-slate-500 block">{ch.participants}</span>
                                </div>

                                <button 
                                    onClick={() => addGoal(ch.title, 'consistency', 14)}
                                    className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Join Challenge
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
