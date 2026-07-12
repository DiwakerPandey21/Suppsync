'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Trophy, Flame, Pill, FlaskConical, Target, Zap, Shield, Brain, QrCode, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Badge = {
    id: string
    name: string
    description: string
    icon: any
    color: string
    bgColor: string
    requirement: number
    unlocked: boolean
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

const COVER_THEMES = [
    { id: 'cyber-neon', name: 'Cyber Neon', bg: 'from-blue-600 via-indigo-950 to-purple-800', accent: 'text-rose-400', border: 'border-indigo-500/20' },
    { id: 'biohacker-lab', name: 'Biohacker Laboratory', bg: 'from-emerald-600 via-slate-950 to-cyan-900', accent: 'text-emerald-400', border: 'border-emerald-500/20' },
    { id: 'dna-molecules', name: 'DNA Molecules', bg: 'from-blue-700 via-slate-950 to-purple-900', accent: 'text-blue-400', border: 'border-blue-500/20' },
    { id: 'neural-net', name: 'Neural Network', bg: 'from-indigo-600 via-slate-950 to-pink-900', accent: 'text-purple-400', border: 'border-purple-500/20' }
]

export default function PublicProfilePage() {
    const params = useParams()
    const username = params.username as string
    const supabase = createClient()

    const [profile, setProfile] = useState<any>(null)
    const [stats, setStats] = useState<any>({
        totalLogsTaken: 0,
        supplementCount: 0,
        biomarkerCount: 0,
        daysActive: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadPublicProfile() {
            if (!username) return

            // Query profiles by username
            const { data: userProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', decodeURIComponent(username))
                .maybeSingle()

            if (userProfile) {
                setProfile(userProfile)

                // Query associated public stats aggregates
                const [logsRes, suppRes, bioRes] = await Promise.all([
                    supabase.from('logs').select('id', { count: 'exact', head: true }).eq('user_id', userProfile.id).eq('status', 'taken'),
                    supabase.from('supplements').select('id', { count: 'exact', head: true }).eq('user_id', userProfile.id),
                    supabase.from('biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', userProfile.id)
                ])

                setStats({
                    totalLogsTaken: logsRes.count || 0,
                    supplementCount: suppRes.count || 0,
                    biomarkerCount: bioRes.count || 0
                })
            }
            setIsLoading(false)
        }
        loadPublicProfile()
    }, [username, supabase])

    const userSeed = useMemo(() => {
        if (!profile?.id) return 1
        return profile.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    }, [profile])

    const activeTheme = useMemo(() => {
        return COVER_THEMES[userSeed % COVER_THEMES.length]
    }, [userSeed])

    const bioScore = useMemo(() => {
        const streakWeight = Math.min(30, profile?.current_streak || 0) * 1.5
        const logsWeight = Math.min(200, stats.totalLogsTaken) * 0.15
        const bioWeight = Math.min(10, stats.biomarkerCount) * 2.5
        const base = 55
        return Math.min(99, Math.round(base + streakWeight + logsWeight + bioWeight))
    }, [profile, stats])

    const badges: Badge[] = useMemo(() => [
        { id: 'first-dose', name: 'First Infusion', description: 'Log first supplement dosage cycle', icon: Pill, color: 'text-blue-400', bgColor: 'bg-blue-500/10', requirement: 1, unlocked: stats.totalLogsTaken >= 1, rarity: 'Common' },
        { id: '7-day-warrior', name: 'Homeostasis Spark', description: 'Maintain supplement intake for 7 days', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10', requirement: 7, unlocked: (profile?.current_streak || 0) >= 7, rarity: 'Rare' },
        { id: 'stack-master', name: 'Synergy Architect', description: 'Configure 10+ custom active compounds', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', requirement: 10, unlocked: stats.supplementCount >= 10, rarity: 'Rare' },
        { id: 'lab-rat', name: 'Biochemical Map', description: 'Track 5 specific biomarkers trends', icon: FlaskConical, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', requirement: 5, unlocked: stats.biomarkerCount >= 5, rarity: 'Epic' },
        { id: 'centurion', name: 'Cellular Veteran', description: 'Complete 100 logged supplement doses', icon: Target, color: 'text-rose-400', bgColor: 'bg-rose-500/10', requirement: 100, unlocked: stats.totalLogsTaken >= 100, rarity: 'Legendary' }
    ], [stats, profile])

    const unlockedCount = badges.filter(b => b.unlocked).length

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
                <Activity className="w-12 h-12 text-slate-700 mx-auto" />
                <h1 className="text-xl font-black text-white uppercase tracking-tight">Identity Not Found</h1>
                <p className="text-xs text-slate-500">
                    The requested public profile "@" has not been configured in the SuppSync directory yet.
                </p>
                <Link 
                    href="/dashboard" 
                    className="inline-block text-[10px] text-indigo-400 font-black uppercase tracking-wider underline mt-4"
                >
                    Return to dashboard
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 text-slate-300">
            
            {/* Identity Hero */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/[0.06] bg-slate-950/40 shadow-2xl">
                <div className={cn("w-full h-48 bg-gradient-to-r relative overflow-hidden", activeTheme.bg)}>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-14">
                    <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                        <div className="relative w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center p-1.5 border border-white/[0.08] shadow-2xl shrink-0 z-20">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center text-3xl font-black text-white relative">
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="text-center md:text-left space-y-1 relative z-20">
                            <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-3.5">
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{profile.display_name || 'SuppSync Member'}</h1>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">@{profile.username}</span>
                            </div>
                            <p className="text-xs text-slate-400 max-w-sm italic">
                                "{profile.bio || 'Biohacker optimizing cellular driven intelligence.'}"
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl relative z-20">
                        <div className="text-center px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">BioScore</span>
                            <span className="text-lg font-black text-white">{bioScore}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/[0.08]" />
                        <div className="text-center px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Level</span>
                            <span className="text-lg font-black text-indigo-400">{profile.level || 1}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance & Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Public stats summary */}
                <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Unlocked Trophy Medallions</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {badges.map(badge => (
                            <div 
                                key={badge.id}
                                className={cn(
                                    "p-4 rounded-2xl border text-center transition-all duration-300 relative flex flex-col justify-between min-h-[120px]",
                                    badge.unlocked 
                                        ? "bg-white/[0.01] border-white/[0.08] hover:border-slate-800" 
                                        : "bg-slate-950/40 border-white/[0.02] opacity-40"
                                )}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                            badge.rarity === 'Legendary' ? 'text-amber-400 bg-amber-500/10' :
                                            badge.rarity === 'Epic' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 bg-white/5'
                                        )}>
                                            {badge.rarity}
                                        </span>
                                        <Trophy className={cn("w-3.5 h-3.5", badge.unlocked ? 'text-amber-400' : 'text-slate-700')} />
                                    </div>
                                    <p className="text-[11px] font-black text-white uppercase tracking-wider text-left mt-1">{badge.name}</p>
                                    <p className="text-[9px] text-slate-500 text-left">{badge.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Passport QR */}
                <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] text-center space-y-4 flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Verifiable Digital Identity</span>
                    <div className="bg-white p-2 rounded-2xl w-40 h-40 mx-auto flex items-center justify-center relative">
                        <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z" />
                            <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z" />
                            <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z" />
                            <circle cx="50" cy="50" r="10" fill="#2563eb" />
                            <path d="M45,15 h10 v5 h-10 z M40,25 h15 v5 h-15 z M65,45 h10 v15 h-10 z M55,65 h20 v10 h-20 z" />
                        </svg>
                    </div>
                    <p className="text-[10px] text-slate-500">Scan to follow metrics updates.</p>
                </div>

            </div>

        </div>
    )
}
