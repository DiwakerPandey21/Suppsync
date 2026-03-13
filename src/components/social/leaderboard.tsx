'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Medal, Flame, Zap, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
            .limit(20)

        setEntries(data || [])
        setIsLoading(false)
    }

    const getMedal = (rank: number) => {
        if (rank === 0) return <Trophy className="w-4 h-4 text-yellow-400" />
        if (rank === 1) return <Medal className="w-4 h-4 text-slate-300" />
        if (rank === 2) return <Medal className="w-4 h-4 text-amber-600" />
        return <span className="text-xs text-slate-500 font-bold w-4 text-center">{rank + 1}</span>
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

    return (
        <div className="space-y-2">
            {entries.map((entry, i) => (
                <motion.div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                        entry.user_id === myId
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-slate-900/50 border-slate-800'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-6 flex justify-center">{getMedal(i)}</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            {entry.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">
                                {entry.display_name || 'User'}
                                {entry.user_id === myId && <span className="text-blue-400 text-[10px] ml-1">(You)</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="text-xs text-slate-400">{entry.streak}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400">{entry.xp}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
