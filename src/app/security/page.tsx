'use client'

import React from 'react'
import { ShieldAlert, Server, Cpu } from 'lucide-react'

export default function SecurityPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-slate-300">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Security Specifications</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Data Security</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    How we encrypt and protect your biology metrics.
                </p>
            </div>

            {/* Content text */}
            <div className="space-y-6 text-xs text-slate-400 leading-relaxed">
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center">
                        <Server className="w-4 h-4 text-indigo-400 mr-2" /> Database Layer Encryption
                    </h3>
                    <p>
                        Your biological profiles, laboratory draws, and genetic variant mutations are persisted in Supabase using AES-256 block-level encryption. All operations are isolated utilizing Row Level Security (RLS) policies.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center">
                        <Cpu className="w-4 h-4 text-cyan-400 mr-2" /> API & Transit Layer Protocols
                    </h3>
                    <p>
                        Data sent between your client browser and the SuppSync servers is guarded using Transport Layer Security (TLS 1.3). Communication to Gemini AI engines is fully pseudonymized.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Regular Vulnerability Scanning</h3>
                    <p>
                        We run routine audits, package dependency scans, and automated database health monitoring to ensure the integrity of the SuppSync Health Operating System.
                    </p>
                </div>
            </div>
        </div>
    )
}
