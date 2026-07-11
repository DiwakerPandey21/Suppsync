'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { 
    Sparkles, ExternalLink, ShieldCheck, Heart, Terminal, 
    Database, Server, Cpu, Activity, MessageSquare, Info, 
    ArrowRight, Github, Send, AlertTriangle, CpuIcon, Check, Copy, HelpCircle, Bug, Lightbulb, Handshake
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Footer() {
    const supabase = createClient()
    
    // Rotating taglines
    const taglines = [
        "Take control of your biology.",
        "Built for healthier humans.",
        "Science meets AI.",
        "Optimize every protocol."
    ]

    // Daily health tips
    const tips = [
        "Vitamin D absorption increases when taken with dietary fat.",
        "L-Theanine complements caffeine by smoothing stimulation.",
        "Fasting 12 hours before a blood draw stabilizes lipid metrics.",
        "Magnesium Glycinate before bed supports sleep quality by acting as a GABA agonist.",
        "Coenzyme Q10 morning dosing supports cellular ATP energy production."
    ]

    // Hydration-safe state variables
    const [activeTagline, setActiveTagline] = useState(taglines[0])
    const [activeTip, setActiveTip] = useState(tips[0])
    const [mounted, setMounted] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setMounted(true)
        const dateIdx = new Date().getDate()
        setActiveTagline(taglines[dateIdx % taglines.length])
        setActiveTip(tips[dateIdx % tips.length])
    }, [])

    const handleCopyEmail = () => {
        navigator.clipboard.writeText('support@suppsync.com')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <footer className="w-full mt-16 bg-gradient-to-t from-[#020207] via-[#05050C] to-transparent relative pt-16 pb-12 overflow-hidden select-none">
            {/* Immersive top aurora boundary */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent pointer-events-none" />
            
            <div className="max-w-5xl mx-auto px-6 md:px-8 space-y-12 relative z-10 text-slate-300">
                
                {/* CHAPTER 1: Closing Tagline Hero (Breaking the grid: staggered editorial layout) */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Diagnostic Node</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">SuppSync OS</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-none uppercase tracking-tight max-w-2xl">
                                {mounted ? activeTagline : taglines[0]}
                            </h2>
                        </div>

                        <a 
                            href="/chat"
                            className="w-fit bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase h-10 px-5 rounded-xl transition-all duration-300 flex items-center space-x-2 shrink-0 shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95"
                        >
                            <span>Consult AI Coach</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* CHAPTER 2: About / Mission statement */}
                <div className="max-w-xl text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/[0.04]">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Our Mission</span>
                    SuppSync is an AI-powered Health Operating System helping users optimize supplements, biomarkers, genetics, recovery and longevity through evidence-based insights.
                </div>

                {/* CHAPTER 3: Platform Links (Staggered pills instead of lists) */}
                <div className="space-y-3.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Platform Index</span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                        {[
                            { name: 'Dashboard', href: '/dashboard' },
                            { name: 'Library', href: '/library' },
                            { name: 'Labs', href: '/labs' },
                            { name: 'Social Hub', href: '/social' },
                            { name: 'Profile', href: '/profile' },
                            { name: 'Insights', href: '/insights' },
                            { name: 'Roadmap', href: '/roadmap' },
                            { name: 'Documentation', href: '/docs' },
                            { name: 'API Reference', href: '/api' }
                        ].map(item => (
                            <a 
                                key={item.name}
                                href={item.href}
                                className="px-3.5 py-1.5 bg-white/[0.01] border border-white/[0.06] hover:border-slate-800 hover:bg-white/[0.03] text-slate-300 hover:text-white rounded-full transition-all duration-300 flex items-center space-x-1.5 shadow-sm active:scale-95"
                            >
                                <span className="w-1 h-1 rounded-full bg-blue-500/60" />
                                <span>{item.name}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* CHAPTER 4: Community (Live-feel profile chips) */}
                <div className="space-y-3">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Community Hubs</span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                        <a 
                            href="https://discord.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl flex items-center space-x-2 text-indigo-300 transition-all duration-300"
                        >
                            <span>💬 Discord</span>
                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded">12K Active</span>
                        </a>
                        <a 
                            href="https://github.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center space-x-2 text-slate-300 transition-all duration-300"
                        >
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                            <span className="text-[8px] font-bold text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded">Open Source</span>
                        </a>
                        <a 
                            href="https://twitter.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 rounded-xl flex items-center space-x-2 text-cyan-300 transition-all duration-300"
                        >
                            <span>Twitter / X</span>
                            <span className="text-[8px] font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded">Daily Tips</span>
                        </a>
                    </div>
                </div>

                {/* CHAPTER 5: SupportRounded Action Cards (TAC hover lifts) */}
                <div className="space-y-3.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Support Actions</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button 
                            onClick={handleCopyEmail}
                            className="p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-slate-800 rounded-xl text-left flex justify-between items-center group transition-all duration-300 active:scale-98"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                                {copied ? 'Copied support' : '💬 Contact support'}
                            </span>
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />}
                        </button>
                        
                        <a 
                            href="/bugs"
                            className="p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-slate-800 rounded-xl text-left flex justify-between items-center group transition-all duration-300 active:scale-98"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                                🐛 Report Bug
                            </span>
                            <Bug className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition-colors" />
                        </a>

                        <a 
                            href="/features"
                            className="p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-slate-800 rounded-xl text-left flex justify-between items-center group transition-all duration-300 active:scale-98"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                                💡 Request Feature
                            </span>
                            <Lightbulb className="w-3.5 h-3.5 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                        </a>

                        <a 
                            href="/partners"
                            className="p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-slate-800 rounded-xl text-left flex justify-between items-center group transition-all duration-300 active:scale-98"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                                🤝 Partnerships
                            </span>
                            <Handshake className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </a>
                    </div>
                </div>

                {/* CHAPTER 6: AI Tip & Status row (Connected, minimal) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.04]">
                    
                    {/* Minimal AI Tip */}
                    <div className="flex items-start space-x-3 text-xs leading-normal">
                        <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Today's AI Insight</span>
                            <p className="text-slate-300 font-medium italic">
                                "{mounted ? activeTip : tips[0]}"
                            </p>
                        </div>
                    </div>

                    {/* Floating Status pills */}
                    <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-0.5">Diagnostic state</span>
                        <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400">
                            <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 flex items-center space-x-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping mr-1" />
                                AI Coach Online
                            </span>
                            <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 flex items-center">
                                Database Synced
                            </span>
                            <span className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 flex items-center">
                                Knowledge Updated
                            </span>
                            <span className="bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full text-blue-400 flex items-center">
                                Secure Cloud
                            </span>
                        </div>
                    </div>

                </div>

                {/* CHAPTER 7: Legal, Watermark & Copyright */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.04] relative">
                    
                    {/* Non-distracting watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                        <span className="text-7xl font-black uppercase tracking-[20px] text-white">SUPPSYNC</span>
                    </div>

                    <div className="flex items-center space-x-4 text-[9px] font-black uppercase tracking-wider text-slate-500 relative z-10">
                        <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                        <span>•</span>
                        <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                        <span>•</span>
                        <a href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</a>
                        <span>•</span>
                        <span className="font-mono">v1.2.6</span>
                    </div>

                    <div className="text-right text-[9px] font-black uppercase tracking-wider text-slate-500 relative z-10 flex flex-col md:items-end">
                        <span>© 2026 SUPPSYNC</span>
                        <span className="text-[8px] font-bold text-slate-600 block mt-0.5">Your AI Health Operating System</span>
                    </div>

                </div>

            </div>
        </footer>
    )
}
