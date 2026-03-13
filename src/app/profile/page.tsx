'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Trophy, Flame, Pill, FlaskConical, Target, Zap, Crown, Calendar, Star, Shield, Brain, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ShareableProfileCard } from '@/components/profile/shareable-card'
import { ProgressPhotos } from '@/components/profile/progress-photos'

type Badge = {
    id: string
    name: string
    description: string
    icon: any
    color: string
    bgColor: string
    requirement: number
    currentValue: number
    unlocked: boolean
}

type Stats = {
    totalLogsTaken: number
    currentStreak: number
    supplementCount: number
    biomarkerCount: number
    protocolsAdopted: number
    daysActive: number
}

export default function ProfilePage() {
    const supabase = createClient()
    const [stats, setStats] = useState<Stats>({
        totalLogsTaken: 0,
        currentStreak: 0,
        supplementCount: 0,
        biomarkerCount: 0,
        protocolsAdopted: 0,
        daysActive: 0,
    })
    const [userName, setUserName] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserName(user.email?.split('@')[0] || 'User')

            const { count: logsCount } = await supabase
                .from('logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'taken')

            const { count: suppCount } = await supabase
                .from('supplements')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            const { count: bioCount } = await supabase
                .from('biomarkers')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            const { data: uniqueDays } = await supabase
                .from('logs')
                .select('log_date')
                .eq('user_id', user.id)
                .eq('status', 'taken')

            const uniqueDaysCount = new Set(uniqueDays?.map(d => d.log_date)).size

            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak')
                .eq('id', user.id)
                .single()

            setStats({
                totalLogsTaken: logsCount || 0,
                currentStreak: profile?.current_streak || 0,
                supplementCount: suppCount || 0,
                biomarkerCount: bioCount || 0,
                protocolsAdopted: 0,
                daysActive: uniqueDaysCount,
            })
            setIsLoading(false)
        }
        fetchStats()
    }, [supabase])

    const badges: Badge[] = [
        { id: 'first-dose', name: 'First Dose', description: 'Log your first supplement', icon: Pill, color: 'text-blue-400', bgColor: 'bg-blue-500/20', requirement: 1, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 1 },
        { id: '7-day-warrior', name: '7-Day Warrior', description: 'Maintain a 7-day streak', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/20', requirement: 7, currentValue: stats.currentStreak, unlocked: stats.currentStreak >= 7 },
        { id: 'monthly-machine', name: 'Monthly Machine', description: 'Maintain a 30-day streak', icon: Calendar, color: 'text-purple-400', bgColor: 'bg-purple-500/20', requirement: 30, currentValue: stats.currentStreak, unlocked: stats.currentStreak >= 30 },
        { id: 'century-club', name: 'Century Club', description: '100-day streak', icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', requirement: 100, currentValue: stats.currentStreak, unlocked: stats.currentStreak >= 100 },
        { id: 'stack-master', name: 'Stack Master', description: 'Track 10+ supplements', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', requirement: 10, currentValue: stats.supplementCount, unlocked: stats.supplementCount >= 10 },
        { id: 'lab-rat', name: 'Lab Rat', description: 'Log 5 biomarker entries', icon: FlaskConical, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', requirement: 5, currentValue: stats.biomarkerCount, unlocked: stats.biomarkerCount >= 5 },
        { id: 'centurion', name: 'Centurion', description: 'Take 100 total doses', icon: Target, color: 'text-red-400', bgColor: 'bg-red-500/20', requirement: 100, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 100 },
        { id: 'titan', name: 'Titan', description: 'Take 500 total doses', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/20', requirement: 500, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 500 },
        { id: 'legend', name: 'Legend', description: 'Take 1000 total doses', icon: Star, color: 'text-pink-400', bgColor: 'bg-pink-500/20', requirement: 1000, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 1000 },
    ]

    const unlockedCount = badges.filter(b => b.unlocked).length

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            {/* Profile Header */}
            <div className="text-center mb-8">
                <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-blue-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    {userName.charAt(0).toUpperCase()}
                </motion.div>
                <h1 className="text-2xl font-black text-white">{userName}</h1>
                <p className="text-sm text-slate-500 mt-1">Biohacker since Day 1</p>
            </div>

            {/* Lifetime Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    { label: 'Doses', value: stats.totalLogsTaken, color: 'text-blue-400' },
                    { label: 'Streak', value: stats.currentStreak, color: 'text-orange-400' },
                    { label: 'Days', value: stats.daysActive, color: 'text-green-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Share Profile Card */}
            <div className="mb-8">
                <ShareableProfileCard
                    userName={userName}
                    totalDoses={stats.totalLogsTaken}
                    streak={stats.currentStreak}
                    daysActive={stats.daysActive}
                    badgesUnlocked={unlockedCount}
                    totalBadges={badges.length}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <Link href="/insights" className="flex items-center space-x-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 hover:bg-purple-500/20 transition-colors">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <div>
                        <p className="text-sm font-bold text-white">AI Insights</p>
                        <p className="text-[10px] text-slate-500">Weekly report</p>
                    </div>
                </Link>
                <Link href="/settings" className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:bg-slate-800 transition-colors">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="text-sm font-bold text-white">Settings</p>
                        <p className="text-[10px] text-slate-500">Export & more</p>
                    </div>
                </Link>
            </div>

            {/* Achievements Section */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                    Achievements
                </h2>
                <span className="text-xs text-slate-500 font-bold">{unlockedCount}/{badges.length} Unlocked</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, i) => {
                    const progress = Math.min(100, (badge.currentValue / badge.requirement) * 100)
                    return (
                        <motion.div
                            key={badge.id}
                            className={cn(
                                "relative flex flex-col items-center p-4 rounded-2xl border text-center transition-all",
                                badge.unlocked
                                    ? `${badge.bgColor} border-slate-700`
                                    : "bg-slate-900/50 border-slate-800/50 opacity-50"
                            )}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: badge.unlocked ? 1 : 0.5, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                                badge.unlocked ? badge.bgColor : "bg-slate-800"
                            )}>
                                <badge.icon className={cn("w-5 h-5", badge.unlocked ? badge.color : "text-slate-600")} />
                            </div>
                            <p className={cn("text-[11px] font-bold leading-tight", badge.unlocked ? "text-white" : "text-slate-600")}>
                                {badge.name}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 leading-tight">{badge.description}</p>

                            {!badge.unlocked && (
                                <div className="w-full mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${badge.bgColor}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Progress Photos */}
            <div className="w-full px-4 pt-4">
                <ProgressPhotos />
            </div>
        </div>
    )
}
