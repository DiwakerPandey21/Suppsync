'use client'

import React from 'react'
import { ShieldCheck, Info } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-slate-300">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">End-to-End Secure</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Privacy Policy</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Last Updated: March 2026
                </p>
            </div>

            {/* Content text */}
            <div className="space-y-6 text-xs text-slate-400 leading-relaxed">
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">1. Medical Data Sovereignty</h3>
                    <p>
                        All biomarker results, hormone panels, and genetic data uploaded to SuppSync belong entirely to you. We do not rent, sell, or disclose your biological data to insurance networks or data brokers.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Data Security & Encryption</h3>
                    <p>
                        Information is securely synced via encrypted Supabase databases. We utilize AES-256 database encryption at rest and SSL/TLS transport layer security protocols in transit.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">3. AI Synthesis Transparency</h3>
                    <p>
                        Biomarker analysis uses sandboxed Gemini LLM engines. Prompts containing lab details are analyzed without persistent user identifier data.
                    </p>
                </div>
            </div>
        </div>
    )
}
