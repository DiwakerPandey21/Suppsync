'use client'

import React from 'react'
import { Sparkles, Terminal, FileText, Code, ShieldAlert, Cpu } from 'lucide-react'

export default function DocsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-300">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Knowledge Base</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Documentation & API</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Developer guidelines and user manuals for the SuppSync Health OS.
                </p>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* User Manuals */}
                <div className="space-y-4 p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                    <div className="flex items-center space-x-2 text-white">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-black uppercase tracking-wider">User Handbook</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Learn how to log daily scores, analyze blood draws, upload DNA variant sequences, and synthesize customized supplement stacks.
                    </p>
                </div>

                {/* API Reference */}
                <div id="api" className="space-y-4 p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                    <div className="flex items-center space-x-2 text-white">
                        <Code className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-black uppercase tracking-wider">SuppSync Public API</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Integrate biomarker records and active protocols. SuppSync provides REST endpoints returning structured JSON telemetry.
                    </p>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <code className="text-[10px] font-mono text-indigo-300 block break-all">
                            GET /api/v1/protocols
                        </code>
                    </div>
                </div>

            </div>
        </div>
    )
}
