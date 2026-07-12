'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, Compass, Shield, Heart, Code } from 'lucide-react'

export default function RoadmapPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 text-slate-300">
            {/* Header */}
            <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Development Timeline</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Product Roadmap</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-xl">
                    Follow the evolution of the SuppSync AI Health Operating System.
                </p>
            </div>

            {/* Grid flow */}
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 md:before:left-1/2 before:w-[1px] before:bg-white/[0.06] before:pointer-events-none">
                
                {/* Milestone 1 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between gap-6 md:gap-0">
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border-4 border-[#020207] z-20" />
                    
                    <div className="w-full md:w-[45%] md:text-right space-y-2 pl-8 md:pl-0">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Phase 1: Foundation (Q1 2026)</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Metabolic Tracking Engine</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Deploy basic biomarkers charts, OCR laboratory reports extraction via Gemini Vision APIs, and personalized supplement dosage triggers.
                        </p>
                    </div>
                    <div className="hidden md:block w-[45%]" />
                </div>

                {/* Milestone 2 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between gap-6 md:gap-0">
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-purple-500 border-4 border-[#020207] z-20" />
                    
                    <div className="hidden md:block w-[45%]" />
                    <div className="w-full md:w-[45%] space-y-2 pl-8">
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Phase 2: Genomics (Q2 2026)</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">DNA Sync Protocol</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Integrate raw DNA sequencing datasets (MTHFR, COMT, APOE) to automatically customize active nutrient recommendations based on methylation profiles.
                        </p>
                    </div>
                </div>

                {/* Milestone 3 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between gap-6 md:gap-0">
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-500 border-4 border-[#020207] z-20" />
                    
                    <div className="w-full md:w-[45%] md:text-right space-y-2 pl-8 md:pl-0">
                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Phase 3: Longevity (Q3 2026)</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Predictive Diagnostics</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Launch longitudinal system-health scores mapping organ biological age, systemic inflammation coefficients, and lifestyle correlation metrics.
                        </p>
                    </div>
                    <div className="hidden md:block w-[45%]" />
                </div>

            </div>
        </div>
    )
}
