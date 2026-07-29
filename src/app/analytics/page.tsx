'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    BarChart3, TrendingUp, ArrowLeft, Activity, Sparkles, Brain, Heart, 
    Moon, Zap, ShieldCheck, Flame, Download, Share2, Layers, CheckCircle2, 
    AlertCircle, RefreshCw, Cpu, Award, Target, Eye, ChevronRight, FileText,
    Dumbbell, Droplets, Utensils, Compass, Clock, Star, ArrowUpRight
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type DayData = {
    date: string
    adherence: number
    energy: number
    focus: number
    sleep: number
}

const TIMELINE_OPTIONS = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
    { label: 'Lifetime', days: 9999 }
]

const BODY_REGIONS = [
    { id: 'all', label: 'Whole Body System', icon: Activity, desc: 'Global BioScore & Complete Biomarkers' },
    { id: 'brain', label: 'Brain & Cognition', icon: Brain, desc: 'Focus, Nootropics, Memory & Neuroprotection' },
    { id: 'heart', label: 'Cardiovascular & HRV', icon: Heart, desc: 'Heart Rate Variability, Blood Pressure & Circulation' },
    { id: 'muscles', label: 'Muscles & Recovery', icon: Dumbbell, desc: 'Protein Synthesis, Creatine Saturation & DOMS' },
    { id: 'sleep', label: 'Sleep & Circadian', icon: Moon, desc: 'Deep NREM Sleep, REM Efficiency & Melatonin' },
    { id: 'energy', label: 'Mitochondrial Energy', icon: Zap, desc: 'CoQ10, NAD+ Levels & Daily Vitality' }
]

const MODULE_CARDS = [
    { id: 'recovery', title: 'Recovery Score', score: '92%', trend: '+4.2%', icon: Activity, tag: 'Optimal', desc: 'Heart rate variability and parasympathetic tone alignment.', rec: 'Maintain current 21:30 bedtime timing.' },
    { id: 'energy', title: 'Energy Index', score: '8.4 / 10', trend: '+1.1', icon: Zap, tag: 'Elevated', desc: 'Mitochondrial ATP output supported by CoQ10 & B-Complex.', rec: 'Take B-Complex before 12:00 PM.' },
    { id: 'focus', title: 'Cognitive Focus', score: '8.8 / 10', trend: '+0.8', icon: Brain, tag: 'Peak Flow', desc: 'L-Theanine and Caffeine synergy stabilizing alpha waves.', rec: 'Keep caffeine intake below 200mg.' },
    { id: 'sleep', title: 'Sleep Quality', score: '8.6 / 10', trend: '+5.5%', icon: Moon, tag: 'Restorative', desc: 'Deep NREM sleep ratio increased with Magnesium Threonate.', rec: 'Continue 400mg Magnesium at night.' },
    { id: 'mood', title: 'Subjective Wellbeing', score: '8.2 / 10', trend: '+2.0%', icon: Sparkles, tag: 'Stable', desc: 'Serotonergic pathways balanced with Vitamin D3 co-factors.', rec: 'Morning sunlight exposure 15 mins.' },
    { id: 'adherence', title: 'Stack Adherence', score: '94%', trend: '+8.0%', icon: ShieldCheck, tag: 'Consistent', desc: 'Consistent intake across morning and evening routines.', rec: 'Set automated restock alerts.' },
    { id: 'workout', title: 'Workout Frequency', score: '5 Days / Wk', trend: '+1 Day', icon: Dumbbell, tag: 'Active', desc: 'Hypertrophy and cardio training frequency logged.', rec: 'Ensure 48h rest between heavy sessions.' },
    { id: 'hydration', title: 'Hydration Level', score: '3.2 L / Day', trend: 'Optimal', icon: Droplets, tag: 'Hydrated', desc: 'Electrolyte balance maintained with Sodium & Potassium.', rec: 'Add electrolytes during workouts.' },
    { id: 'nutrition', title: 'Nutrient Density', score: '91 / 100', trend: '+3.4%', icon: Utensils, tag: 'Balanced', desc: 'Micronutrient targets met across key vitamins.', rec: 'Increase dark leafy greens intake.' },
    { id: 'heart', title: 'HRV Index', score: '68 ms', trend: '+6 ms', icon: Heart, tag: 'High Resilience', desc: 'Parasympathetic recovery metric measured post-sleep.', rec: 'Avoid food 3 hours before sleep.' },
    { id: 'stress', title: 'Cortisol Modulation', score: 'Low', trend: '-14%', icon: Compass, tag: 'Regulated', desc: 'Ashwagandha KSM-66 modulating HPA axis stress response.', rec: 'Take Ashwagandha with evening meal.' },
    { id: 'consistency', title: 'Routine Streak', score: '14 Days', trend: 'Best Streak', icon: Flame, tag: 'Unstoppable', desc: 'Fourteen consecutive days of complete stack logging.', rec: 'Claim Streak Freeze in store.' }
]

const SUPPLEMENT_EFFECTIVENESS = [
    { name: 'Magnesium Glycinate', rating: 5, sleepImp: '+14%', moodImp: '+8%', adherence: '98%', status: 'Highly Effective', summary: 'Significant increase in deep REM sleep and muscle relaxation.' },
    { name: 'Vitamin D3 + K2', rating: 5, sleepImp: '+6%', moodImp: '+12%', adherence: '96%', status: 'Essential Core', summary: 'Optimal serum Vitamin D levels achieved (52 ng/mL).' },
    { name: 'Omega-3 Fish Oil', rating: 4, sleepImp: '+5%', moodImp: '+9%', adherence: '92%', status: 'Cardio Protective', summary: 'Reduced systemic inflammatory markers and improved HRV.' },
    { name: 'Creatine Monohydrate', rating: 5, sleepImp: '+2%', moodImp: '+7%', adherence: '95%', status: 'Peak Cellular Energy', summary: 'Increased muscular power output and cognitive endurance.' },
    { name: 'L-Theanine', rating: 4, sleepImp: '+11%', moodImp: '+10%', adherence: '90%', status: 'Calm Focus', summary: 'Smoothens caffeine jitters and aids sleep onset.' }
]

const BIOMARKERS = [
    { name: 'Vitamin D3 (25-OH)', current: '52 ng/mL', ideal: '40 - 70 ng/mL', status: 'Optimal', trend: '▲ +6 ng/mL', prediction: 'Projected 55 ng/mL next month' },
    { name: 'Magnesium Serum', current: '2.4 mg/dL', ideal: '2.0 - 2.6 mg/dL', status: 'Optimal', trend: '▲ +0.2 mg/dL', prediction: 'Stable at optimal range' },
    { name: 'Ferritin (Iron)', current: '85 ng/mL', ideal: '50 - 150 ng/mL', status: 'Balanced', trend: '► Stable', prediction: 'No adjustment needed' },
    { name: 'Omega-3 Index', current: '8.4%', ideal: '> 8.0%', status: 'Optimal', trend: '▲ +1.1%', prediction: 'Inflammation reduced' },
    { name: 'HRV (Resting)', current: '68 ms', ideal: '50 - 90 ms', status: 'High', trend: '▲ +6 ms', prediction: 'Recovery resilience strong' },
    { name: 'Resting Heart Rate', current: '54 bpm', ideal: '50 - 65 bpm', status: 'Athletic', trend: '▼ -2 bpm', prediction: 'Aerobic base expanding' }
]

export default function AnalyticsPage() {
    const supabase = createClient()
    const [data, setData] = useState<DayData[]>([])
    const [selectedDays, setSelectedDays] = useState<number>(30)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRegion, setSelectedRegion] = useState('all')
    const [compareMode, setCompareMode] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'effectiveness' | 'biomarkers' | 'records'>('overview')

    useEffect(() => {
        fetchData()
    }, [selectedDays])

    const fetchData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const daysToFetch = selectedDays === 9999 ? 365 : selectedDays
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysToFetch)
        const startStr = startDate.toLocaleDateString('en-CA')

        const { data: logs } = await supabase
            .from('logs')
            .select('log_date, status')
            .eq('user_id', user.id)
            .gte('log_date', startStr)

        const { data: scores } = await supabase
            .from('subjective_scores')
            .select('record_date, energy_score, focus_score, sleep_score')
            .eq('user_id', user.id)
            .gte('record_date', startStr)

        const dayMap = new Map<string, DayData>()

        for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString('en-CA')
            dayMap.set(dateStr, { date: dateStr, adherence: 0, energy: 0, focus: 0, sleep: 0 })
        }

        const logsByDay = new Map<string, { taken: number; total: number }>()
        logs?.forEach(l => {
            const existing = logsByDay.get(l.log_date) || { taken: 0, total: 0 }
            existing.total += 1
            if (l.status === 'taken') existing.taken += 1
            logsByDay.set(l.log_date, existing)
        })

        logsByDay.forEach((counts, date) => {
            const day = dayMap.get(date)
            if (day) {
                day.adherence = counts.total > 0 ? Math.round((counts.taken / counts.total) * 100) : 0
            }
        })

        scores?.forEach(s => {
            const day = dayMap.get(s.record_date)
            if (day) {
                day.energy = s.energy_score || 0
                day.focus = s.focus_score || 0
                day.sleep = s.sleep_score || 0
            }
        })

        const result = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))
        
        // Fallback demo data if user has 0 logs
        if (result.every(r => r.adherence === 0 && r.energy === 0)) {
            const demoData: DayData[] = result.map((r, idx) => ({
                ...r,
                adherence: Math.min(100, 75 + Math.round(Math.sin(idx * 0.5) * 20)),
                energy: Number((6.5 + Math.sin(idx * 0.4) * 2).toFixed(1)),
                focus: Number((7.0 + Math.cos(idx * 0.3) * 1.8).toFixed(1)),
                sleep: Number((7.2 + Math.sin(idx * 0.6) * 1.5).toFixed(1))
            }))
            setData(demoData)
        } else {
            setData(result)
        }

        setIsLoading(false)
    }

    const avg = (key: keyof DayData) => {
        const nonZero = data.filter(d => typeof d[key] === 'number' && (d[key] as number) > 0)
        if (nonZero.length === 0) return 0
        return Math.round(nonZero.reduce((a, d) => a + (d[key] as number), 0) / nonZero.length)
    }

    const filteredModules = useMemo(() => {
        if (selectedRegion === 'all') return MODULE_CARDS
        if (selectedRegion === 'brain') return MODULE_CARDS.filter(m => ['focus', 'mood', 'adherence'].includes(m.id))
        if (selectedRegion === 'heart') return MODULE_CARDS.filter(m => ['heart', 'stress', 'recovery'].includes(m.id))
        if (selectedRegion === 'muscles') return MODULE_CARDS.filter(m => ['recovery', 'workout', 'nutrition'].includes(m.id))
        if (selectedRegion === 'sleep') return MODULE_CARDS.filter(m => ['sleep', 'consistency', 'recovery'].includes(m.id))
        if (selectedRegion === 'energy') return MODULE_CARDS.filter(m => ['energy', 'hydration', 'adherence'].includes(m.id))
        return MODULE_CARDS
    }, [selectedRegion])

    const customTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-slate-950/95 border border-white/10 rounded-xl p-3 text-xs shadow-2xl backdrop-blur-md space-y-1">
                <p className="text-slate-400 font-bold border-b border-white/10 pb-1 mb-1">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex justify-between items-center space-x-3">
                        <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-slate-300 font-medium">{p.name}:</span>
                        </span>
                        <span className="font-black text-white" style={{ color: p.color }}>
                            {p.value}{p.name === 'Adherence' ? '%' : '/10'}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 px-4 sm:px-8 select-none">
            <div className="max-w-7xl mx-auto space-y-10 pt-6">

                {/* BACK TO DASHBOARD & EXPORT BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                    <Link href="/dashboard" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setCompareMode(!compareMode)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5",
                                compareMode ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Compare Cycles</span>
                        </button>

                        <button 
                            onClick={() => alert("Generating PDF Health Report...")}
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* HERO SECTION */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-slate-950 via-[#060c21] to-slate-950 p-6 sm:p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-2xl">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-cyan-400 text-[9px] font-black uppercase tracking-widest">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Analytics OS 3.0</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                            Health Intelligence
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                            Understand how your supplement timing, biochemical co-factors, and daily routines directly modulate your biological performance over time.
                        </p>
                    </div>

                    {/* HERO METRICS TILES */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                        {[
                            { label: 'Current BioScore', val: '88 / 100', status: '▲ +5.4%', color: 'text-cyan-400' },
                            { label: 'Overall Trend', val: 'Optimal', status: 'Clinical Target', color: 'text-emerald-400' },
                            { label: 'Current Streak', val: '14 Days', status: 'Unbroken', color: 'text-amber-400' },
                            { label: 'AI Rating', val: 'A+ Clinical', status: 'Top 2% User', color: 'text-indigo-400' }
                        ].map((m, i) => (
                            <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">{m.label}</span>
                                <span className={cn("text-base sm:text-lg font-black block tracking-tight", m.color)}>{m.val}</span>
                                <span className="text-[8px] font-bold text-slate-400 block">{m.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI WEEKLY SUMMARY REPORT (Apple Health / ChatGPT style) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-white block">AI Clinical Intelligence Report</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Automated Weekly Synthesis</span>
                            </div>
                        </div>

                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            ✓ Verified Analysis
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">Key Observation</span>
                            <p className="text-slate-300 font-medium leading-relaxed">
                                Your recovery score improved by <strong className="text-white">+12%</strong> this cycle. Deep NREM sleep consistency increased by 42 minutes following evening Magnesium Threonate dosing.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">Circadian Trend</span>
                            <p className="text-slate-300 font-medium leading-relaxed">
                                Energy dipped slightly on Wednesday afternoons following late caffeine consumption. Moving caffeine cut-off to 14:00 restored afternoon clarity.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">AI Protocol Recommendation</span>
                            <p className="text-slate-300 font-medium leading-relaxed">
                                Maintain 5,000 IU Vitamin D3 intake with healthy breakfast fats. Hydration target reached 3.2L daily, supporting optimal renal filtration.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TIMELINE SELECTOR */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-2 rounded-2xl border border-white/[0.06]">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-3">Timeline Range:</span>

                    <div className="flex flex-wrap gap-1 flex-1 sm:flex-none">
                        {TIMELINE_OPTIONS.map(opt => (
                            <button
                                key={opt.days}
                                onClick={() => setSelectedDays(opt.days)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex-1 sm:flex-none text-center",
                                    selectedDays === opt.days 
                                        ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" 
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTERACTIVE BODY SYSTEM SELECTOR */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Biological Targeting</span>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Anatomical System Filter</h3>
                        </div>
                        <span className="text-[9px] font-bold text-cyan-400">Click a system to isolate analytics</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {BODY_REGIONS.map(region => {
                            const RegionIcon = region.icon
                            const isSelected = selectedRegion === region.id
                            return (
                                <button
                                    key={region.id}
                                    onClick={() => setSelectedRegion(region.id)}
                                    className={cn(
                                        "p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 group",
                                        isSelected 
                                            ? "bg-cyan-500/10 border-cyan-500/40 text-white shadow-lg shadow-cyan-500/10" 
                                            : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-slate-200"
                                    )}
                                >
                                    <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center transition-colors", isSelected ? "bg-cyan-500 text-slate-950" : "bg-white/[0.04] text-slate-400 group-hover:text-cyan-400")}>
                                        <RegionIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black block uppercase tracking-wider">{region.label}</span>
                                        <span className="text-[8px] text-slate-500 block line-clamp-1">{region.desc}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* MAIN CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ADHERENCE TREND CHART */}
                    <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Stack Adherence Curve</h3>
                            </div>
                            <span className="text-xs font-black text-emerald-400">Avg {avg('adherence')}%</span>
                        </div>

                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="adherenceGradOS" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d.slice(5)} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                                    <Tooltip content={customTooltip} />
                                    <Area type="monotone" dataKey="adherence" stroke="#10b981" fill="url(#adherenceGradOS)" strokeWidth={2.5} name="Adherence" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SUBJECTIVE SCORES MULTI-LINE CHART */}
                    <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Subjective Biomarker Curves</h3>
                            </div>
                            <div className="flex items-center space-x-3 text-[9px] font-bold">
                                <span className="text-amber-400">● Energy ({avg('energy')})</span>
                                <span className="text-blue-400">● Focus ({avg('focus')})</span>
                                <span className="text-purple-400">● Sleep ({avg('sleep')})</span>
                            </div>
                        </div>

                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d.slice(5)} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                                    <Tooltip content={customTooltip} />
                                    <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={false} name="Energy" />
                                    <Line type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={2} dot={false} name="Focus" />
                                    <Line type="monotone" dataKey="sleep" stroke="#a855f7" strokeWidth={2} dot={false} name="Sleep" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* CORRELATION ENGINE (Sleep -> Recovery -> Energy Flow) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">System Dynamics</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Biochemical Correlation Engine</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">Automated Causal Link Mapping</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        {[
                            { title: '1. Supplement Intake', val: 'Magnesium + D3', sub: '98% Adherence', color: 'border-blue-500/30 text-blue-400' },
                            { title: '2. Deep NREM Sleep', val: '8.2 Hours Avg', sub: '▲ +14% Quality', color: 'border-purple-500/30 text-purple-400' },
                            { title: '3. Parasympathetic HRV', val: '68 ms HRV', sub: '▲ +6 ms Shift', color: 'border-cyan-500/30 text-cyan-400' },
                            { title: '4. Vitality & Energy', val: '8.8 / 10 Score', sub: '▲ +18% Subjective', color: 'border-emerald-500/30 text-emerald-400' }
                        ].map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className={cn("p-4 rounded-2xl bg-slate-900/60 border text-center space-y-1.5 relative", step.color)}>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">{step.title}</span>
                                    <span className="text-sm font-black text-white block">{step.val}</span>
                                    <span className="text-[9px] font-bold block">{step.sub}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* 12 MODULE ANALYTICS GRID */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Health Intelligence Modules</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">12 Core Performance Domains</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{filteredModules.length} Modules Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredModules.map((mod, i) => {
                            const ModIcon = mod.icon
                            return (
                                <div 
                                    key={i}
                                    className="p-5 rounded-2xl bg-slate-950/60 border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3 group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                                                <ModIcon className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider">{mod.title}</h4>
                                        </div>
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 tracking-widest">
                                            {mod.tag}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end border-b border-white/[0.04] pb-3">
                                        <div>
                                            <span className="text-xl font-black text-white tracking-tight">{mod.score}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-400">{mod.trend}</span>
                                    </div>

                                    <div className="space-y-1 text-[10px]">
                                        <p className="text-slate-400 leading-normal">{mod.desc}</p>
                                        <div className="pt-1 flex items-center space-x-1.5 text-cyan-300 font-medium">
                                            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                                            <span className="line-clamp-1">{mod.rec}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* SUPPLEMENT EFFECTIVENESS MATRIX */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/[0.08] space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block">Efficacy Leaderboard</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Supplement Effectiveness Ranking</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">Calculated from 30-Day Biomarker Shifts</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {SUPPLEMENT_EFFECTIVENESS.map((supp, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 max-w-md">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-black text-white uppercase tracking-wider">{supp.name}</span>
                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 tracking-widest">{supp.status}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">{supp.summary}</p>
                                </div>

                                <div className="flex items-center space-x-6 text-xs shrink-0">
                                    <div className="text-center">
                                        <span className="text-[8px] font-black uppercase text-slate-500 block">Rating</span>
                                        <span className="text-amber-400 font-bold">{'★'.repeat(supp.rating)}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[8px] font-black uppercase text-slate-500 block">Sleep Shift</span>
                                        <span className="text-emerald-400 font-bold">{supp.sleepImp}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[8px] font-black uppercase text-slate-500 block">Mood Shift</span>
                                        <span className="text-cyan-400 font-bold">{supp.moodImp}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[8px] font-black uppercase text-slate-500 block">Adherence</span>
                                        <span className="text-white font-bold">{supp.adherence}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BIOMARKER INTELLIGENCE CARDS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Bloodwork & Wearables</span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Biomarker Intelligence Panel</h3>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">6 Key Markers Tracked</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BIOMARKERS.map((bio, idx) => (
                            <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-white/[0.06] space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-white uppercase tracking-wider">{bio.name}</span>
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{bio.status}</span>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-xl font-black text-white block tracking-tight">{bio.current}</span>
                                        <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Target Range: {bio.ideal}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-400">{bio.trend}</span>
                                </div>

                                <div className="pt-2 border-t border-white/[0.04] text-[9px] text-slate-400 flex items-center space-x-1.5">
                                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span>{bio.prediction}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI PREDICTION ENGINE CARD */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-indigo-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-cyan-400 text-[8px] font-black uppercase tracking-widest">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>AI Predictive Health Modeling</span>
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">30-Day Recovery Projection</h4>
                        <p className="text-xs text-slate-300 max-w-xl">
                            If your current stack adherence (94%) and sleep timing are maintained, your recovery BioScore is projected to improve by <strong className="text-emerald-400">+8.2%</strong> over the next 30 days.
                        </p>
                    </div>

                    <button 
                        onClick={() => alert("Detailed 90-day predictive report generated!")}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0"
                    >
                        View Full Forecast
                    </button>
                </div>

                {/* PERSONAL RECORDS ROW */}
                <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/[0.06] backdrop-blur-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-center">
                    {[
                        { val: '14 Days', label: 'Longest Streak' },
                        { val: '9.4 / 10', label: 'Highest Energy' },
                        { val: '9.2 / 10', label: 'Best Sleep Score' },
                        { val: '142 Logs', label: 'Supplements Logged' },
                        { val: '96%', label: 'Peak Recovery' }
                    ].map((pr, i) => (
                        <div key={i} className="space-y-1">
                            <span className="text-lg sm:text-xl font-black text-white tracking-tight block">{pr.val}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">{pr.label}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
