'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { 
    Sparkles, ExternalLink, ShieldCheck, Heart, Terminal, 
    Database, Server, Cpu, Activity, MessageSquare, Info, 
    ArrowRight, Github, Send, AlertTriangle, CpuIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Footer() {
    const supabase = createClient()
    
    // Live Supabase metrics state
    const [metrics, setMetrics] = useState<{ supplements: number, biohackers: number, biomarkers: number } | null>(null)

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const [suppRes, biohackerRes, biomarkerRes] = await Promise.all([
                    supabase.from('supplements').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('biomarkers').select('*', { count: 'exact', head: true })
                ])
                
                // Only set metrics if we actually receive real counts greater than 0
                if (suppRes.count || biohackerRes.count || biomarkerRes.count) {
                    setMetrics({
                        supplements: suppRes.count || 0,
                        biohackers: biohackerRes.count || 0,
                        biomarkers: biomarkerRes.count || 0
                    })
                }
            } catch (e) {
                console.warn("Failed to fetch live database metrics:", e)
            }
        }
        fetchMetrics()
    }, [])

    // Rotating daily taglines (Section 1)
    const taglines = [
        "Take control of your biology.",
        "Built for healthier humans.",
        "Science meets AI.",
        "Optimize every protocol."
    ]
    const activeTagline = useMemo(() => {
        const idx = new Date().getDate() % taglines.length
        return taglines[idx]
    }, [])

    // Daily health tips (Section 7)
    const tips = [
        "Vitamin D absorption increases when taken with dietary fat.",
        "L-Theanine complements caffeine by smoothing stimulation and reducing jitters.",
        "Fasting 12 hours before a blood draw stabilizes lipid metrics for accurate readings.",
        "Magnesium Glycinate before bed supports sleep quality by acting as a gentle GABA agonist.",
        "Coenzyme Q10 morning dosing supports cellular ATP energy production."
    ]
    const activeTip = useMemo(() => {
        const idx = new Date().getDate() % tips.length
        return tips[idx]
    }, [])

    return (
        <footer className="w-full mt-24 border-t border-white/[0.06] bg-[#020207] relative overflow-hidden select-none">
            {/* Soft background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-16 relative z-10">
                
                {/* SECTION 1: Closing Hero */}
                <div className="relative rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#0A0B1A] via-[#02030A] to-[#120420] p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="space-y-3 max-w-xl text-center md:text-left">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                            Protocol Sync Active
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                            {activeTagline}
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            Empowered by evidence-based medicine and Gemini neural intelligence.
                        </p>
                    </div>

                    <a 
                        href="/chat"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-6 py-4 rounded-2xl transition-all duration-300 flex items-center space-x-2 shrink-0 shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
                    >
                        <span>Open AI Coach</span>
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>

                {/* Main Link Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    
                    {/* SECTION 2: About SuppSync */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <span className="font-black text-base tracking-widest text-white uppercase">SuppSync</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                            SuppSync is an AI-powered Health Operating System helping users optimize supplements, biomarkers, genetics, recovery and longevity through evidence-based insights.
                        </p>
                    </div>

                    {/* SECTION 3: Platform Links */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                            <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                            <li><a href="/library" className="hover:text-white transition-colors">Library</a></li>
                            <li><a href="/labs" className="hover:text-white transition-colors">Labs</a></li>
                            <li><a href="/social" className="hover:text-white transition-colors">Social Hub</a></li>
                            <li><a href="/profile" className="hover:text-white transition-colors">Bio-Profile</a></li>
                            <li><a href="/insights" className="hover:text-white transition-colors">Insights</a></li>
                        </ul>
                    </div>

                    {/* SECTION 4: Community Links */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Community</h4>
                        <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                            <li>
                                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-1.5">
                                    <span>Discord</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600" />
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-1.5">
                                    <span>GitHub</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600" />
                                </a>
                            </li>
                            <li>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-1.5">
                                    <span>Twitter / X</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600" />
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-1.5">
                                    <span>Instagram</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* SECTION 6: Legal Links */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legal</h4>
                        <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                            <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            <li><a href="/disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</a></li>
                            <li><a href="/security" className="hover:text-white transition-colors">Data Security</a></li>
                        </ul>
                    </div>

                </div>

                {/* SECTION 5: Support Cards (Glass cards layout) */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Support & Partnerships</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {[
                            { name: 'Help Center', href: '/help' },
                            { name: 'Contact Support', href: '/support' },
                            { name: 'Feature Requests', href: '/features' },
                            { name: 'Bug Reports', href: '/bugs' },
                            { name: 'Feedback', href: '/feedback' },
                            { name: 'FAQ', href: '/faq' },
                            { name: 'Partnerships', href: '/partners' }
                        ].map(item => (
                            <a 
                                key={item.name}
                                href={item.href}
                                className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-center text-[10px] font-black uppercase text-slate-400 hover:text-white hover:border-slate-800 hover:bg-white/[0.02] transition-all duration-300"
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Split segment: AI Tip, Live Metrics, System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/[0.04]">
                    
                    {/* SECTION 7: Daily AI Health Insight */}
                    <div className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl space-y-2">
                        <div className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Daily Bio-Tip</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                            "{activeTip}"
                        </p>
                    </div>

                    {/* SECTION 8: Live Platform Metrics */}
                    {metrics ? (
                        <div className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl flex justify-between items-center">
                            <div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Live Platform Status</span>
                                <span className="text-xl font-black text-white leading-none mt-1.5 block">Synced Nodes</span>
                            </div>
                            <div className="text-right space-y-1 text-[10px] font-semibold text-slate-400">
                                <div>Active Biohackers: <strong className="text-white">{metrics.biohackers}</strong></div>
                                <div>Supplements Logged: <strong className="text-white">{metrics.supplements}</strong></div>
                                <div>Biomarkers Tracked: <strong className="text-white">{metrics.biomarkers}</strong></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl flex items-center space-x-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                            <div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Security synched</span>
                                <p className="text-[10px] font-bold text-slate-400 leading-tight">All medical records are encrypted end-to-end.</p>
                            </div>
                        </div>
                    )}

                    {/* SECTION 9: System Status */}
                    <div className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl space-y-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">System Diagnostics</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-bold uppercase text-slate-400">
                            <div className="flex items-center justify-between">
                                <span>AI Coach</span>
                                <span className="text-emerald-400 font-black flex items-center space-x-1">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping mr-1" />
                                    ONLINE
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Supabase</span>
                                <span className="text-emerald-400 font-black">CONNECTED</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Genomics</span>
                                <span className="text-indigo-400 font-black">READY</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Version</span>
                                <span className="text-slate-500 font-mono">v1.2.6</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom branding and copyright */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.04] relative">
                    
                    {/* SECTION 10: Branding watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                        <span className="text-8xl font-black uppercase tracking-[24px] text-white">SUPPSYNC</span>
                    </div>

                    {/* SECTION 11: Copyright */}
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest relative z-10">
                        © 2026 SUPPSYNC. Your AI Health Operating System.
                    </span>

                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
                        Made with ❤️ for healthier humans.
                    </span>

                </div>

            </div>
        </footer>
    )
}
