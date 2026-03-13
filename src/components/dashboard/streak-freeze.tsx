'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Shield, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function StreakFreeze({ currentStreak, userId }: { currentStreak: number; userId: string }) {
    const supabase = createClient()
    const [freezeCount, setFreezeCount] = useState(2)
    const [isUsing, setIsUsing] = useState(false)
    const [used, setUsed] = useState(false)

    const useFreeze = async () => {
        if (freezeCount <= 0 || !userId) return
        setIsUsing(true)

        const today = new Date().toLocaleDateString('en-CA')

        const { data: profile } = await supabase
            .from('profiles')
            .select('streak_freezes, freeze_used_dates')
            .eq('id', userId)
            .single()

        const remaining = profile?.streak_freezes ?? 2
        const usedDates = profile?.freeze_used_dates ?? []

        if (remaining > 0) {
            await supabase
                .from('profiles')
                .update({
                    streak_freezes: remaining - 1,
                    freeze_used_dates: [...usedDates, today],
                })
                .eq('id', userId)

            setFreezeCount(remaining - 1)
            setUsed(true)
        }
        setIsUsing(false)
    }

    if (used) {
        return (
            <motion.div
                className="w-full px-4 mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-center">
                    <Snowflake className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Streak Frozen! ❄️</p>
                    <p className="text-[11px] text-slate-400 mt-1">Your {currentStreak}-day streak is safe for today.</p>
                </div>
            </motion.div>
        )
    }

    if (currentStreak < 3) return null // Only show if they have a streak worth saving

    return (
        <div className="w-full px-4 mb-4">
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-amber-400" />
                        <div>
                            <p className="text-xs font-bold text-white">Streak Protection</p>
                            <p className="text-[10px] text-slate-500">{freezeCount} freeze{freezeCount !== 1 ? 's' : ''} remaining this month</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 h-8 text-xs hover:bg-amber-500/10"
                        onClick={useFreeze}
                        disabled={isUsing || freezeCount <= 0}
                    >
                        <Snowflake className="w-3 h-3 mr-1" /> Use Freeze
                    </Button>
                </div>
            </div>
        </div>
    )
}
