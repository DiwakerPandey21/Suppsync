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
        <div className="w-full px-4 mb-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center`}>
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Level {level}</p>
                            <p className="text-[10px] text-slate-500">{getLevelTitle(level)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 text-right relative">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">{xp} XP</span>

                        {/* XP Gain popup */}
                        {showGain && (
                            <motion.span
                                className="absolute -top-6 right-0 text-xs font-black text-green-400"
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -20 }}
                                transition={{ duration: 1.5 }}
                            >
                                +{gainAmount} XP
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${getLevelColor(level)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-[9px] text-slate-600 mt-1 text-right">{xpInCurrentLevel} / {XP_PER_LEVEL} XP to Level {level + 1}</p>
            </div>
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
