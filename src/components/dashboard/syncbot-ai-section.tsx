'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
    Sparkles, ArrowRight, Bot, Zap, ShieldCheck, Activity, Dna, 
    FlaskConical, Pill, Clock, Check, ChevronRight, Brain, Lightbulb,
    Lock, CheckCircle2, AlertCircle, RefreshCw, BarChart2, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_PROMPT_PILLS = [
    { label: 'Analyze My Stack', query: 'Analyze my current supplement stack' },
    { label: 'Improve Sleep', query: 'Build an evidence-based sleep protocol' },
    { label: 'Increase Energy', query: 'Supplements to boost mitochondrial energy' },
    { label: 'Review Blood Test', query: 'Interpret my latest blood biomarker test' },
    { label: 'Supplement Timing', query: 'Optimal daily timing schedule for supplements' },
    { label: 'Explain Biomarkers', query: 'Explain my Vitamin D and Ferritin ranges' },
    { label: 'Find Deficiencies', query: 'Check stack for potential nutrient gaps' }
]

const FEATURE_CARDS = [
    {
        title: 'Stack Optimization',
        desc: 'Personalized compound timing & synergist ratios based on your daily routine.',
        icon: Pill,
        tag: 'Synergy'
    },
    {
        title: 'Supplement Analysis',
        desc: 'Deep bioavailability, molecular absorption, and biochemical mechanism breakdown.',
        icon: Brain,
        tag: 'Biochemistry'
    },
    {
        title: 'Drug Interaction Detection',
        desc: 'Cross-checks contraindications, pharmaceutical safety, and dosage limits.',
        icon: ShieldCheck,
        tag: 'Safety'
    },
    {
        title: 'Biomarker Intelligence',
        desc: 'Correlates blood panel data directly with active supplement protocols.',
        icon: FlaskConical,
        tag: 'Bloodwork'
    },
    {
        title: 'Sleep & Recovery Coach',
        desc: 'Circadian stack timing designed for deep NREM and REM sleep restoration.',
        icon: Clock,
        tag: 'Circadian'
    },
    {
        title: 'Scientific Evidence Search',
        desc: 'Direct PubMed meta-analyses and peer-reviewed clinical research citations.',
        icon: BookOpen,
        tag: 'Literature'
    }
]

const WHY_CHOOSE_CARDS = [
    {
        title: 'Personalized Recommendations',
        desc: 'Tailored specifically to your active supplements, biomarkers, and health goals.',
        icon: Activity
    },
    {
        title: 'Evidence-Based Research',
        desc: 'Backed by PubMed meta-analyses and human clinical trials—never bro-science.',
        icon: ShieldCheck
    },
    {
        title: 'Understands Your Stack',
        desc: 'Reads your exact dosage amounts, schedules, and compound synergies.',
        icon: Pill
    },
    {
        title: 'Learns Your Biomarkers',
        desc: 'Tracks blood lab trends over time to detect deficiencies early.',
        icon: FlaskConical
    },
    {
        title: 'Fast Scientific Answers',
        desc: 'Delivers clear, actionable clinical guidance in under 1.2 seconds.',
        icon: Zap
    },
    {
        title: 'Private & Secure',
        desc: 'Your health data is encrypted with strict HIPAA & SAIF compliant privacy.',
        icon: Lock
    }
]

export function SyncbotAiSection() {
    const [activeTab, setActiveTab] = useState<'preview' | 'example'>('preview')

    return (
        <section id="syncbot-ai" className="w-full my-12 text-slate-100 select-none">
            <div className="max-w-6xl mx-auto space-y-16 px-4 sm:px-6">

                {/* DAILY AI INSIGHTS WIDGET (Apple Health Style) */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 text-xs">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest block">Daily AI Insight</span>
                            <p className="text-slate-300 font-medium text-xs leading-normal">
                                Taking Vitamin D3 alongside dietary healthy fats increases cellular absorption by up to 32%.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>AI Engine Active</span>
                    </div>
                </div>

                {/* SECTION HERO */}
                <div className="text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center space-x-2 bg-slate-900 border border-white/[0.08] px-3.5 py-1 rounded-full text-cyan-400 text-[9px] font-black uppercase tracking-widest shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>SyncBot AI 4.0</span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                        Your Personal AI Health Intelligence
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
                        Evidence-based supplement recommendations, biomarker interpretation, stack optimization, recovery analysis and scientific health guidance—personalized using your SuppSync data.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link 
                            href="/chat"
                            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 active:scale-95"
                        >
                            <span>Open AI Coach</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <a 
                            href="#ai-features"
                            className="px-6 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 font-black text-xs uppercase tracking-wider transition-all active:scale-95"
                        >
                            See What It Can Do
                        </a>
                    </div>

                    {/* QUICK PROMPT PILLS */}
                    <div className="pt-6 space-y-2">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Quick AI Queries</span>
                        <div className="flex flex-wrap justify-center gap-1.5 text-[9px] font-bold text-slate-300">
                            {QUICK_PROMPT_PILLS.map((pill, idx) => (
                                <Link
                                    key={idx}
                                    href={`/chat?q=${encodeURIComponent(pill.query)}`}
                                    className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 hover:text-white transition-all cursor-pointer"
                                >
                                    {pill.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* INTERACTIVE MINIATURE SHOWCASE PREVIEW */}
                <div className="rounded-3xl bg-slate-950/80 border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-4xl mx-auto">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-xs font-black text-white uppercase tracking-widest block">SyncBot Clinical Preview</span>
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Interactive Health Intelligence Engine</span>
                            </div>
                        </div>

                        <div className="flex bg-slate-900 p-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={cn("px-3 py-1 rounded-lg transition-all", activeTab === 'preview' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                            >
                                Stack Preview
                            </button>
                            <button 
                                onClick={() => setActiveTab('example')}
                                className={cn("px-3 py-1 rounded-lg transition-all", activeTab === 'example' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                            >
                                Clinical Case
                            </button>
                        </div>
                    </div>

                    {activeTab === 'preview' ? (
                        <div className="space-y-4">
                            {/* User Bubble */}
                            <div className="flex justify-end">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs font-medium max-w-md shadow-lg">
                                    "Review my current supplement stack for sleep and recovery."
                                </div>
                            </div>

                            {/* AI Response Card */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-3">
                                <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-cyan-400">
                                    <Sparkles className="w-3 h-3" />
                                    <span>SyncBot Clinical Analysis</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[
                                        { title: 'Sleep Analysis', detail: 'Magnesium Glycinate & L-Theanine timing aligned for REM sleep.', status: 'Optimal' },
                                        { title: 'Stack Optimization', detail: '3 active synergist compounds logged with zero dosage overlaps.', status: 'Verified' },
                                        { title: 'Vitamin Deficiencies', detail: 'Vitamin D3 (48 ng/mL) co-factored with Vitamin K2.', status: 'Balanced' },
                                        { title: 'Interaction Check', detail: 'Zero pharmaceutical or biochemical contraindications detected.', status: 'Safe' }
                                    ].map((item, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-white/[0.04] space-y-1">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                <span className="text-white">{item.title}</span>
                                                <span className="text-emerald-400">{item.status}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-normal">{item.detail}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 border-t border-white/[0.04]">
                                    <span>BioScore Metric Impact</span>
                                    <span className="text-emerald-400 font-bold">▲ BioScore Improved (+4.2%)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-xs">
                            {/* Case Demo */}
                            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-3">
                                <div className="flex items-center space-x-2 text-[8px] font-black text-amber-400 uppercase tracking-widest">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Case Observation: Afternoon Fatigue</span>
                                </div>

                                <div className="space-y-2 text-[10px] text-slate-300">
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.04] flex items-center justify-between">
                                        <span>Low Sleep Score Recorded</span>
                                        <span className="text-rose-400 font-bold">5.8 / 10</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.04] flex items-center justify-between">
                                        <span>Missed Magnesium Intake</span>
                                        <span className="text-amber-400 font-bold">3 Consecutive Days</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.04] flex items-center justify-between">
                                        <span>Late Caffeine Consumption</span>
                                        <span className="text-rose-400 font-bold">Logged at 16:30</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-[10px] space-y-1">
                                    <span className="font-black uppercase tracking-wider text-[8px] block">Suggested Clinical Protocol</span>
                                    <p>Shift caffeine cut-off to 14:00. Take 400mg Magnesium Glycinate at 21:30 for GABA receptor activation.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 6 MINIMALIST FEATURE CARDS */}
                <div id="ai-features" className="space-y-6 pt-6">
                    <div className="text-center space-y-1">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Clinical Capabilities</span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Built for Clinical Precision</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {FEATURE_CARDS.map((feat, idx) => {
                            const IconComponent = feat.icon
                            return (
                                <div 
                                    key={idx}
                                    className="p-5 rounded-2xl bg-slate-950/60 border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3 group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-white/[0.03] text-slate-400 tracking-widest">
                                            {feat.tag}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-cyan-300 transition-colors">{feat.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{feat.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* WHY THOUSANDS OF HEALTH DECISIONS START WITH SYNCBOT AI */}
                <div className="space-y-6 pt-6">
                    <div className="text-center space-y-1">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Evidence & Trust</span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                            Why thousands of health decisions start with SyncBot AI
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {WHY_CHOOSE_CARDS.map((card, idx) => {
                            const CardIcon = card.icon
                            return (
                                <div 
                                    key={idx}
                                    className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-2"
                                >
                                    <CardIcon className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{card.title}</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">{card.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* AI STATISTICS ROW */}
                <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/[0.06] backdrop-blur-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-center select-none">
                    {[
                        { value: '250,000+', label: 'Questions Answered' },
                        { value: '12,000+', label: 'Supplements Indexed' },
                        { value: '45,000+', label: 'Clinical Studies' },
                        { value: '< 1.2s', label: 'Avg Response Time' },
                        { value: '99.4%', label: 'Clinical Accuracy' }
                    ].map((stat, i) => (
                        <div key={i} className="space-y-1">
                            <span className="text-xl sm:text-2xl font-black text-white tracking-tight block">{stat.value}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}
