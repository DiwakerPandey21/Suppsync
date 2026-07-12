'use client'

import React from 'react'
import { FileText } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-slate-300">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full w-fit">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Protocol Agreement</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Terms of Service</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Last Updated: March 2026
                </p>
            </div>

            {/* Content text */}
            <div className="space-y-6 text-xs text-slate-400 leading-relaxed">
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">1. Platform Utilization</h3>
                    <p>
                        SuppSync is designed as a tracking client and AI companion tool for lifestyle optimization. By using this service, you acknowledge that you are responsible for cross-referencing all recommendations with a certified healthcare practitioner.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Account Responsibility</h3>
                    <p>
                        You must maintain the security of your Supabase authentication sessions and credentials. SuppSync is not responsible for data loss arising from unauthorized third-party credentials access.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">3. System Operations</h3>
                    <p>
                        We reserve the right to deploy hotfixes, database migrations, and schema optimizations as needed to maintain high availability and accurate biomarker calculations.
                    </p>
                </div>
            </div>
        </div>
    )
}
