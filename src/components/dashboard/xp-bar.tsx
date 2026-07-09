'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Zap, Star } from 'lucide-react'

const XP_PER_LEVEL = 200

function getLevelTitle(level: number): string {
    if (level <= 2) return 'Rookie'
    if (level <= 5) return 'Enthusiast'
    if (level <= 10) return 'Biohacker'
    if (level <= 15) return 'Stack Master'
    if (level <= 20) return 'Supplement Sage'
    return 'Legend'
}

function getLevelColor(level: number): string {
    if (level <= 2) return 'from-slate-500 to-slate-400'
    if (level <= 5) return 'from-green-500 to-emerald-400'
    if (level <= 10) return 'from-blue-500 to-cyan-400'
    if (level <= 15) return 'from-purple-500 to-violet-400'
    if (level <= 20) return 'from-amber-500 to-yellow-400'
    return 'from-red-500 to-orange-400'
}

import { GlassCard } from './glass-card'

export function XpBar() {
    const supabase = createClient()
    const [xp, setXp] = useState(0)
    const [level, setLevel] = useState(1)
    const [showGain, setShowGain] = useState(false)
    const [gainAmount, setGainAmount] = useState(0)

    useEffect(() => {
        loadXp()

        // Listen for custom XP events
        const handler = (e: CustomEvent) => {
            const gained = e.detail?.amount || 0
            setGainAmount(gained)
            setShowGain(true)
            setTimeout(() => setShowGain(false), 2000)
            loadXp()
        }

        window.addEventListener('xp-gained' as any, handler)
        return () => window.removeEventListener('xp-gained' as any, handler)
    }, [])

    const loadXp = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', user.id)
            .single()

        if (profile) {
            setXp(profile.xp || 0)
            setLevel(profile.level || 1)
        }
    }

    const xpInCurrentLevel = xp % XP_PER_LEVEL
    const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100

    return (
        <div className="w-full px-4 mb-6">
            <GlassCard padding={false} className="p-5 border-white/[0.05] relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center shadow-lg shadow-black/30 border border-white/[0.1]`}>
                            <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white tracking-tight leading-none mb-1">Level {level}</p>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-md">
                                {getLevelTitle(level)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-right relative bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-amber-300 tracking-tight">{xp} XP</span>

                        {/* XP Gain popup */}
                        {showGain && (
                            <motion.span
                                className="absolute -top-7 right-2 text-xs font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                initial={{ opacity: 1, y: 5 }}
                                animate={{ opacity: 0, y: -25 }}
                                transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                            >
                                +{gainAmount} XP
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Progress Bar with neon inner tracks and rounded capsules */}
                <div className="relative h-3 bg-white/[0.03] border border-white/[0.04] rounded-full overflow-hidden p-[1px]">
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${getLevelColor(level)} shadow-[0_0_12px_rgba(59,130,246,0.3)]`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">EXP Progress</p>
                    <p className="text-[10px] font-bold text-slate-400">{xpInCurrentLevel} / {XP_PER_LEVEL} XP to next level</p>
                </div>
            </GlassCard>
        </div>
    )
}

// Utility to award XP (call from anywhere)
export async function awardXp(amount: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', user.id)
        .single()

    if (!profile) return

    const newXp = (profile.xp || 0) + amount
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1

    await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', user.id)

    // Dispatch event for XpBar to pick up
    window.dispatchEvent(new CustomEvent('xp-gained', { detail: { amount } }))
}
