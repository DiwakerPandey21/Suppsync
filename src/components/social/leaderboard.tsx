'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Medal, Flame, Zap, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type LeaderEntry = {
    user_id: string
    display_name: string
    xp: number
    streak: number
}

export function Leaderboard() {
    const supabase = createClient()
    const [entries, setEntries] = useState<LeaderEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [myId, setMyId] = useState<string | null>(null)

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setMyId(user.id)

        const { data } = await supabase
            .from('leaderboard_cache')
            .select('*')
            .order('xp', { ascending: false })
            .limit(10)

        setEntries(data || [])
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12">
                <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Leaderboard is empty. Start earning XP!</p>
            </div>
        )
    }

    const topThree = entries.slice(0, 3)
    const remaining = entries.slice(3)

    // Reorder topThree so index 1 (2nd place) is on the left, index 0 (1st place) is in the center, and index 2 (3rd place) is on the right
    const podiumData = [
        topThree[1] ? { ...topThree[1], rank: 2 } : null,
        topThree[0] ? { ...topThree[0], rank: 1 } : null,
        topThree[2] ? { ...topThree[2], rank: 3 } : null,
    ].filter(Boolean)

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-white/[0.05]">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">Ranks</h3>
            </div>

            {/* Podium Section */}
            <div className="grid grid-cols-3 gap-2 pt-6 items-end justify-center min-h-[160px] px-1 relative">
                {podiumData.map((user) => {
                    if (!user) return null
                    const isMe = user.user_id === myId
                    const isFirst = user.rank === 1
                    const isSecond = user.rank === 2

                    return (
                        <motion.div
                            key={user.user_id}
                            className="flex flex-col items-center justify-end h-full relative"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: user.rank * 0.1 }}
                        >
                            {/* Avatar */}
                            <div className="relative mb-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg border-2",
                                    isFirst 
                                        ? "bg-gradient-to-br from-amber-400 to-yellow-600 border-yellow-400 shadow-yellow-500/20 scale-110" 
                                        : isSecond
                                            ? "bg-gradient-to-br from-slate-400 to-slate-600 border-slate-300"
                                            : "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500"
                                )}>
                                    {user.display_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className={cn(
                                    "absolute -top-2.5 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black text-black border",
                                    isFirst 
                                        ? "bg-yellow-400 border-yellow-300" 
                                        : isSecond
                                            ? "bg-slate-300 border-slate-200"
                                            : "bg-amber-600 border-amber-500 text-white"
                                )}>
                                    {user.rank}
                                </span>
                            </div>

                            <p className="text-[10px] font-black text-white text-center max-w-[70px] truncate leading-none mb-1">
                                {user.display_name}
                            </p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase mb-2">
                                {user.xp} XP
                            </p>

                            {/* Podium Column block */}
                            <motion.div
                                className={cn(
                                    "w-full rounded-t-xl border-t border-x relative flex flex-col justify-end items-center pb-2",
                                    isFirst 
                                        ? "h-20 bg-yellow-500/10 border-yellow-500/20" 
                                        : isSecond
                                            ? "h-14 bg-slate-400/5 border-slate-400/10"
                                            : "h-10 bg-amber-700/5 border-amber-700/10"
                                )}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <Zap className={cn(
                                    "w-3.5 h-3.5",
                                    isFirst ? "text-yellow-400 animate-pulse" : isSecond ? "text-slate-400" : "text-amber-600"
                                )} />
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* List Section */}
            <div className="space-y-2 mt-4">
                {remaining.map((entry, idx) => {
                    const isMe = entry.user_id === myId
                    return (
                        <motion.div
                            key={entry.user_id}
                            className={cn(
                                "flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                                isMe
                                    ? "bg-blue-500/10 border-blue-500/25"
                                    : "bg-white/[0.01] border-white/[0.05] hover:border-white/[0.1]"
                            )}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-[10px] text-slate-500 font-black w-4 text-center">#{idx + 4}</span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-white/[0.08] flex items-center justify-center text-xs font-black text-white">
                                    {entry.display_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white">
                                        {entry.display_name || 'User'}
                                        {isMe && <span className="text-blue-400 text-[8px] ml-1 uppercase font-black">You</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span className="text-[10px] font-bold text-slate-400">{entry.streak}</span>
                                </div>
                                <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
                                    <Zap className="w-2.5 h-2.5 text-yellow-400" />
                                    <span className="text-[9px] font-black text-yellow-400">{entry.xp}</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
