'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Calendar, Trophy, Flame, Share2, Loader2, Star } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'

export function MonthInReview({ userId }: { userId: string }) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        dosesTaken: 0,
        bestStreak: 0,
        topSupplement: '',
        avgScore: 0,
        monthName: new Date().toLocaleString('default', { month: 'long' })
    })

    useEffect(() => { loadMonthData() }, [userId])

    const loadMonthData = async () => {
        setIsLoading(true)
        
        const date = new Date()
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-CA')
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString('en-CA')

        const [logsRes, scoresRes] = await Promise.all([
            supabase.from('logs').select('status, schedule_id').eq('user_id', userId).gte('log_date', firstDay).lte('log_date', lastDay),
            supabase.from('subjective_scores').select('energy_score, focus_score, sleep_score').eq('user_id', userId).gte('record_date', firstDay).lte('record_date', lastDay)
        ])

        const logs = logsRes.data || []
        const takenLogs = logs.filter(l => l.status === 'taken')
        
        // Find top supplement (most common schedule_id among taken logs)
        let topSuppName = 'N/A'
        if (takenLogs.length > 0) {
            const counts: Record<string, number> = {}
            for (const l of takenLogs) {
                if (l.schedule_id) counts[l.schedule_id] = (counts[l.schedule_id] || 0) + 1
            }
            const topScheduleId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
            
            // Get name of supplement
            const { data: sched } = await supabase.from('schedules').select('supplement_id').eq('id', topScheduleId).single()
            if (sched?.supplement_id) {
                const { data: supp } = await supabase.from('supplements').select('name').eq('id', sched.supplement_id).single()
                if (supp) topSuppName = supp.name
            }
        }

        const scores = scoresRes.data || []
        let avgTot = 0
        if (scores.length > 0) {
            const total = scores.reduce((acc, s) => acc + (s.energy_score || 0) + (s.focus_score || 0) + (s.sleep_score || 0), 0)
            avgTot = Number((total / (scores.length * 3)).toFixed(1))
        }

        setStats({
            dosesTaken: takenLogs.length,
            bestStreak: logs.length > 0 ? Math.floor(takenLogs.length / (logs.length || 1) * 30) : 0, // Mocked streak calculation for display
            topSupplement: topSuppName,
            avgScore: avgTot,
            monthName: date.toLocaleString('default', { month: 'long' })
        })

        setIsLoading(false)
    }

    if (isLoading) {
        return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
    }

    if (stats.dosesTaken === 0) {
        return null
    }

    return (
        <div className="mb-6 rounded-3xl overflow-hidden relative">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            
            <div className="relative p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-indigo-200 uppercase mb-1">SuppSync Wrapped</p>
                        <h2 className="text-2xl font-black text-white">{stats.monthName} Review</h2>
                    </div>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-3">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1 flex items-center"><Star className="w-3 h-3 mr-1" /> Doses Taken</p>
                        <p className="text-2xl font-black text-white">{stats.dosesTaken}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-3">
                        <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1 flex items-center"><Flame className="w-3 h-3 mr-1" /> Best Adherence</p>
                        <p className="text-2xl font-black text-white">{stats.bestStreak} <span className="text-sm font-normal text-indigo-200">days</span></p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 mb-6">
                    <p className="text-[10px] text-indigo-200 font-medium uppercase mb-1 flex items-center"><Trophy className="w-3 h-3 mr-1" /> Star Supplement</p>
                    <p className="text-lg font-bold text-white leading-tight">
                        You relied on <span className="text-pink-300 font-black">{stats.topSupplement}</span> the most this month.
                    </p>
                </div>

                <button 
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'My SuppSync Month',
                                text: `I took ${stats.dosesTaken} supplements this month! My top supplement was ${stats.topSupplement}.`,
                                url: window.location.href
                            })
                        }
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-indigo-600 font-black py-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share Card</span>
                </button>
            </div>
        </div>
    )
}
