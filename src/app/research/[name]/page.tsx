'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Loader2, ArrowLeft, Beaker, AlertCircle, Clock, FlaskConical } from 'lucide-react'
import Link from 'next/link'

type ResearchData = {
    overview: string
    benefits: string[]
    dosage: string
    timing: string
    side_effects: string[]
    interactions: string[]
}

export default function ResearchPage() {
    const params = useParams()
    const name = decodeURIComponent(params.name as string)
    const [data, setData] = useState<ResearchData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchResearch()
    }, [name])

    const fetchResearch = async () => {
        setIsLoading(true)
        const prompt = `You are a supplement science expert. Provide a comprehensive research summary for "${name}".

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "overview": "2-3 sentence overview of what this supplement is and its primary use",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "dosage": "recommended dosage range with specifics",
  "timing": "when to take it and with what (e.g. with food, on empty stomach)",
  "side_effects": ["side effect 1", "side effect 2", "side effect 3"],
  "interactions": ["interaction 1", "interaction 2"]
}`

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (res.ok) {
                const result = await res.json()
                let parsed = result.response
                if (typeof parsed === 'string') {
                    parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    parsed = JSON.parse(parsed)
                }
                setData(parsed)
            }
        } catch (err) {
            console.error('Research error:', err)
        }
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center flex-col">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm text-slate-500">Researching {name}...</p>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            <Link href="/library" className="text-slate-500 text-sm flex items-center mb-4 hover:text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
            </Link>

            <div className="flex items-center space-x-2 mb-1">
                <BookOpen className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-black text-white">{name}</h1>
            </div>
            <p className="text-xs text-slate-500 mb-6">AI-Generated Research Summary</p>

            {/* Overview */}
            <motion.div
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-sm text-slate-300 leading-relaxed">{data.overview}</p>
            </motion.div>

            {/* Benefits */}
            <motion.div
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h3 className="text-sm font-bold text-emerald-400 flex items-center mb-3">
                    <Beaker className="w-4 h-4 mr-2" /> Benefits
                </h3>
                <ul className="space-y-2">
                    {data.benefits.map((b, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start">
                            <span className="text-emerald-400 mr-2 mt-0.5">•</span> {b}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Dosage & Timing */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div
                    className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-xs font-bold text-blue-400 flex items-center mb-2">
                        <FlaskConical className="w-3.5 h-3.5 mr-1.5" /> Dosage
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{data.dosage}</p>
                </motion.div>
                <motion.div
                    className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <h3 className="text-xs font-bold text-amber-400 flex items-center mb-2">
                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Timing
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{data.timing}</p>
                </motion.div>
            </div>

            {/* Side Effects */}
            <motion.div
                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-sm font-bold text-red-400 flex items-center mb-3">
                    <AlertCircle className="w-4 h-4 mr-2" /> Side Effects
                </h3>
                <ul className="space-y-2">
                    {data.side_effects.map((s, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start">
                            <span className="text-red-400 mr-2 mt-0.5">⚠</span> {s}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Interactions */}
            <motion.div
                className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
            >
                <h3 className="text-sm font-bold text-purple-400 mb-3">Known Interactions</h3>
                <ul className="space-y-2">
                    {data.interactions.map((inter, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start">
                            <span className="text-purple-400 mr-2 mt-0.5">⟷</span> {inter}
                        </li>
                    ))}
                </ul>
            </motion.div>
        </div>
    )
}
