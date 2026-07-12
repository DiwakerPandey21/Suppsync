'use client'

import React, { useState } from 'react'
import { Handshake, Send, Check } from 'lucide-react'

export default function PartnersPage() {
    const [submitting, setSubmitting] = useState(false)
    const [sent, setSent] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [pitch, setPitch] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim() || !pitch.trim()) return
        setSubmitting(true)
        setTimeout(() => {
            setSubmitting(false)
            setSent(true)
            setName('')
            setEmail('')
            setPitch('')
        }, 1200)
    }

    return (
        <div className="max-w-md mx-auto px-6 py-12 space-y-8 text-slate-300">
            <div className="space-y-3 text-center">
                <div className="mx-auto w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Business Partnerships</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Collaborate with the SuppSync health ecosystem.
                </p>
            </div>

            {sent ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                    <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white uppercase">Inquiry Received</h3>
                    <p className="text-[11px] text-slate-400">Our partnership team will follow up within 2 business days. Thank you!</p>
                    <button onClick={() => setSent(false)} className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-2 underline">Submit another inquiry</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Contact Name</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Your full name"
                            className="w-full h-10 bg-white/[0.01] border border-white/[0.08] focus:border-slate-700 rounded-xl px-4 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Business Email</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@company.com"
                            className="w-full h-10 bg-white/[0.01] border border-white/[0.08] focus:border-slate-700 rounded-xl px-4 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Partnership Proposal</label>
                        <textarea 
                            value={pitch}
                            onChange={(e) => setPitch(e.target.value)}
                            required
                            placeholder="Detail how we can collaborate..."
                            className="w-full bg-white/[0.01] border border-white/[0.08] focus:border-slate-700 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none min-h-[100px] transition-all"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full h-10 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                    >
                        <span>{submitting ? 'Transmitting...' : 'Send Proposal'}</span>
                        <Send className="w-3 h-3" />
                    </button>

                    <p className="text-[10px] text-center text-slate-500 font-medium">
                        Or reach out directly to <a href="mailto:support@suppsync.ai" className="text-slate-300 underline font-bold">support@suppsync.ai</a>
                    </p>
                </form>
            )}
        </div>
    )
}
