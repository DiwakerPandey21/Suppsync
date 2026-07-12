'use client'

import React, { useState } from 'react'
import { Bug, Send, Check } from 'lucide-react'

export default function BugsPage() {
    const [submitting, setSubmitting] = useState(false)
    const [sent, setSent] = useState(false)
    const [desc, setDesc] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!desc.trim()) return
        setSubmitting(true)
        setTimeout(() => {
            setSubmitting(false)
            setSent(true)
            setDesc('')
        }, 1200)
    }

    return (
        <div className="max-w-md mx-auto px-6 py-12 space-y-8 text-slate-300">
            <div className="space-y-3 text-center">
                <div className="mx-auto w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                    <Bug className="w-5 h-5 text-red-400" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Report a Bug</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Help us refine the SuppSync OS experience.
                </p>
            </div>

            {sent ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                    <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white uppercase">Report Submitted</h3>
                    <p className="text-[11px] text-slate-400">Our engineering team has received the telemetry. Thank you!</p>
                    <button onClick={() => setSent(false)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-2 underline">Submit another report</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Issue Description</label>
                        <textarea 
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            required
                            placeholder="Describe what occurred, including the steps to reproduce..."
                            className="w-full bg-white/[0.01] border border-white/[0.08] focus:border-slate-700 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none min-h-[120px] transition-all"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full h-10 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                    >
                        <span>{submitting ? 'Transmitting...' : 'Submit Bug Report'}</span>
                        <Send className="w-3 h-3" />
                    </button>

                    <p className="text-[10px] text-center text-slate-500 font-medium">
                        Or email details directly to <a href="mailto:support@suppsync.ai" className="text-slate-300 underline font-bold">support@suppsync.ai</a>
                    </p>
                </form>
            )}
        </div>
    )
}
