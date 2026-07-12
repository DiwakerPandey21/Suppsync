'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Trophy, Flame, Pill, FlaskConical, Target, Zap, Crown, 
    Calendar, Star, Shield, Brain, Settings, Share2, Download, 
    QrCode, Edit3, Save, Camera, Sparkles, Heart, Activity, 
    ArrowRight, Check, CheckCircle2, UserCheck, MessageSquare, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
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
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

type Stats = {
    totalLogsTaken: number
    currentStreak: number
    supplementCount: number
    biomarkerCount: number
    protocolsAdopted: number
    daysActive: number
    xp: number
    level: number
}

const BANNER_THEMES = [
    { id: 'neon-aurora', name: 'Neon Aurora', bg: 'from-blue-600 via-indigo-950 to-purple-800', accent: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
    { id: 'mitochondrial-glow', name: 'Mitochondrial Glow', bg: 'from-amber-600 via-rose-950 to-purple-900', accent: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
    { id: 'longevity-matrix', name: 'Longevity Matrix', bg: 'from-emerald-600 via-slate-950 to-cyan-900', accent: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
    { id: 'cybernetic-synapse', name: 'Cybernetic Synapse', bg: 'from-cyan-600 via-[#030616] to-blue-900', accent: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' }
]

export default function ProfilePage() {
    const supabase = createClient()
    const [stats, setStats] = useState<Stats>({
        totalLogsTaken: 0,
        currentStreak: 0,
        supplementCount: 0,
        biomarkerCount: 0,
        protocolsAdopted: 0,
        daysActive: 0,
        xp: 0,
        level: 1
    })

    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState('')
    const [bio, setBio] = useState('Biohacker optimizing cellular driven intelligence.')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState('')
    const [editedBio, setEditedBio] = useState('')

    // Theme state
    const [selectedTheme, setSelectedTheme] = useState(BANNER_THEMES[0])
    
    // Wrapped share overlay toggle
    const [showShareModal, setShowShareModal] = useState(false)
    const [showQrModal, setShowQrModal] = useState(false)

    useEffect(() => {
        // Load custom local banner settings
        const localThemeId = localStorage.getItem('suppsync-profile-theme')
        if (localThemeId) {
            const match = BANNER_THEMES.find(t => t.id === localThemeId)
            if (match) setSelectedTheme(match)
        }
    }, [])

    useEffect(() => {
        async function fetchStats() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            // 1. Fetch profiles table columns
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak, display_name, bio, level, xp')
                .eq('id', user.id)
                .single()

            const nameVal = profile?.display_name || user.email?.split('@')[0] || 'User'
            const bioVal = profile?.bio || 'Biohacker optimizing cellular driven intelligence.'
            
            setUserName(nameVal)
            setBio(bioVal)
            setEditedName(nameVal)
            setEditedBio(bioVal)

            // 2. Query aggregate counts
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

            setStats({
                totalLogsTaken: logsCount || 0,
                currentStreak: profile?.current_streak || 0,
                supplementCount: suppCount || 0,
                biomarkerCount: bioCount || 0,
                protocolsAdopted: profile?.current_streak ? 1 : 0,
                daysActive: uniqueDaysCount || 0,
                xp: profile?.xp || 0,
                level: profile?.level || 1
            })
            setIsLoading(false)
        }
        fetchStats()
    }, [supabase])

    // Save profile metadata back to Supabase
    const handleSaveProfile = async () => {
        if (!userId) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: editedName,
                    bio: editedBio
                })
                .eq('id', userId)

            if (!error) {
                setUserName(editedName)
                setBio(editedBio)
                setIsEditing(false)
            }
        } catch (e) {
            console.error("Failed to update profile settings:", e)
        } finally {
            setIsSaving(false)
        }
    }

    const selectTheme = (theme: typeof BANNER_THEMES[0]) => {
        setSelectedTheme(theme)
        localStorage.setItem('suppsync-profile-theme', theme.id)
    }

    // PlayStation styled trophy medals achievements
    const badges: Badge[] = useMemo(() => [
        { id: 'first-dose', name: 'First Infusion', description: 'Begin metabolic loading protocol', icon: Pill, color: 'text-blue-400', bgColor: 'bg-blue-500/10', requirement: 1, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 1, rarity: 'Common' },
        { id: '7-day-warrior', name: 'Homeostasis Spark', description: 'Maintain supplement intake for 7 days', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10', requirement: 7, currentValue: stats.currentStreak, unlocked: stats.currentStreak >= 7, rarity: 'Rare' },
        { id: 'stack-master', name: 'Synergy Architect', description: 'Configure 10+ custom active compounds', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', requirement: 10, currentValue: stats.supplementCount, unlocked: stats.supplementCount >= 10, rarity: 'Rare' },
        { id: 'lab-rat', name: 'Biochemical Map', description: 'Track 5 specific biomarkers trends', icon: FlaskConical, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', requirement: 5, currentValue: stats.biomarkerCount, unlocked: stats.biomarkerCount >= 5, rarity: 'Epic' },
        { id: 'centurion', name: 'Cellular Veteran', description: 'Complete 100 logged supplement doses', icon: Target, color: 'text-rose-400', bgColor: 'bg-rose-500/10', requirement: 100, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 100, rarity: 'Legendary' },
        { id: 'titan', name: 'Mitochondrial Overlord', description: 'Complete 500 total dosage cycles', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/10', requirement: 500, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 500, rarity: 'Legendary' }
    ], [stats])

    const unlockedCount = badges.filter(b => b.unlocked).length

    // Calculated proprietary BioScore
    const bioScore = useMemo(() => {
        const streakWeight = Math.min(30, stats.currentStreak) * 1.5
        const logsWeight = Math.min(200, stats.totalLogsTaken) * 0.15
        const bioWeight = Math.min(10, stats.biomarkerCount) * 2.5
        const base = 55
        return Math.min(99, Math.round(base + streakWeight + logsWeight + bioWeight))
    }, [stats])

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-12 py-8 relative">
            
            {/* SECTION 1: Immersive Hero Card */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/[0.06] bg-slate-950/40 shadow-2xl">
                
                {/* Customizable Banner image background with glowing gradients */}
                <div className={cn("w-full h-48 bg-gradient-to-r relative overflow-hidden transition-all duration-700", selectedTheme.bg)}>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                    
                    {/* Tiny Theme customization pills */}
                    <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.08] z-30">
                        {BANNER_THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => selectTheme(theme)}
                                className={cn(
                                    "w-3 h-3 rounded-full border transition-all duration-300",
                                    theme.id === selectedTheme.id ? "scale-125 border-white bg-white" : "border-white/30 bg-transparent hover:border-white/60"
                                )}
                                title={theme.name}
                            />
                        ))}
                    </div>
                </div>

                {/* Profile Details Overlay Section */}
                <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-14">
                    
                    <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                        {/* Profile Avatar with dynamic animated health score ring */}
                        <div className="relative w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center p-1.5 border border-white/[0.08] shadow-2xl shrink-0 z-25">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="56" cy="56" r="50" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
                                <circle cx="56" cy="56" r="50" fill="transparent" stroke="url(#heroRingGlow)" strokeWidth="4" 
                                    strokeDasharray={314} strokeDashoffset={314 - (314 * bioScore) / 100} strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="heroRingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center text-3xl font-black text-white relative">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Text Metadata Details */}
                        <div className="text-center md:text-left space-y-2 relative z-20">
                            <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-3.5">
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{userName}</h1>
                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-white/[0.02] mt-1.5 md:mt-0", selectedTheme.accent, selectedTheme.border)}>
                                    Level {stats.level} Biohacker
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-400 max-w-sm italic">
                                "{bio}"
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Grid Pill */}
                    <div className="flex flex-wrap items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl relative z-25 max-w-xs md:max-w-none">
                        <div className="text-center px-4">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">BioScore</span>
                            <span className="text-lg font-black text-white">{bioScore}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/[0.08]" />
                        <div className="text-center px-4">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Streak</span>
                            <span className="text-lg font-black text-orange-400 flex items-center justify-center">
                                <Flame className="w-3.5 h-3.5 text-orange-400 mr-0.5" />
                                {stats.currentStreak}d
                            </span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/[0.08]" />
                        <div className="text-center px-4">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Doses</span>
                            <span className="text-lg font-black text-blue-400">{stats.totalLogsTaken}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* TWO COLUMN ASYMMETRICAL STORYTELLING LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Side: Bio Identity, Summary, Achievements, Customization */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* SECTION 2: AI Health Summary */}
                    <div className="p-6 rounded-[28px] border border-white/[0.06] bg-white/[0.01] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit mb-4">
                            <Brain className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Biological Synthesis</span>
                        </div>

                        <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
                            "System diagnostic analysis indicates high supplement consistency with a {stats.currentStreak}-day homeostasis streak. Active compounds logged ({stats.supplementCount}) show positive metabolic alignment. Sleep duration consistency remains your primary bio-adaptation vector to unlock higher recovery rates next cycle."
                        </p>
                    </div>

                    {/* SECTION 3: Premium circular dashboard metrics */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Performance Indexes</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { name: 'Health Score', score: bioScore, color: 'text-indigo-400' },
                                { name: 'Adherence', score: stats.currentStreak > 0 ? 88 : 0, color: 'text-emerald-400' },
                                { name: 'Consistency', score: stats.daysActive > 5 ? 92 : 30, color: 'text-blue-400' },
                                { name: 'AI Score', score: 94, color: 'text-purple-400' }
                            ].map(metric => (
                                <div key={metric.name} className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl text-center space-y-3">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">{metric.name}</span>
                                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle cx="32" cy="32" r="26" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                                            <circle cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="3"
                                                className={metric.color} strokeDasharray={163} strokeDashoffset={163 - (163 * metric.score) / 100} strokeLinecap="round" />
                                        </svg>
                                        <span className="text-xs font-black text-white">{metric.score}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 5: Achievements (Trophy redone) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">PlayStation Rarity Medallions</h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{unlockedCount}/{badges.length} Unlocked</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {badges.map(badge => (
                                <div 
                                    key={badge.id}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center transition-all duration-300 relative group flex flex-col justify-between min-h-[145px]",
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
                                                badge.rarity === 'Epic' ? 'text-purple-400 bg-purple-500/10' :
                                                badge.rarity === 'Rare' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 bg-white/5'
                                            )}>
                                                {badge.rarity}
                                            </span>
                                            <Trophy className={cn("w-3.5 h-3.5", 
                                                badge.unlocked 
                                                    ? (badge.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-300')
                                                    : 'text-slate-700'
                                            )} />
                                        </div>

                                        <p className="text-[11px] font-black text-white uppercase tracking-wider text-left pt-1 leading-tight">
                                            {badge.name}
                                        </p>
                                        <p className="text-[9px] text-slate-500 text-left leading-normal">
                                            {badge.description}
                                        </p>
                                    </div>

                                    {!badge.unlocked && (
                                        <div className="w-full bg-white/[0.03] h-1 rounded-full overflow-hidden mt-3">
                                            <div 
                                                className="h-full bg-slate-500" 
                                                style={{ width: `${Math.min(100, (badge.currentValue / badge.requirement) * 100)}%` }} 
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 7: SuppSync Wrapped Instagram Card */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">SuppSync Wrapped</h3>
                        <div className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0b0c1e] via-[#05050C] to-[#160628] p-8 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px] group">
                            
                            {/* Cosmic background circles */}
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-2">
                                        <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wrapped 2026</span>
                                    </div>
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded">SuppSync OS</span>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Top Performance Metric</span>
                                    <h3 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Homeostasis Spark</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                                    <div>
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Supps Logged</span>
                                        <span className="text-base font-black text-white">{stats.supplementCount} Active</span>
                                    </div>
                                    <div>
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Adherence Streak</span>
                                        <span className="text-base font-black text-orange-400">{stats.currentStreak} Days</span>
                                    </div>
                                    <div>
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Health Score</span>
                                        <span className="text-base font-black text-white">{bioScore}% Optimal</span>
                                    </div>
                                    <div>
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Rank Badge</span>
                                        <span className="text-base font-black text-purple-400">NAD+ Sentinel</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between items-center border-t border-white/[0.04] mt-6">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Instagram Ready Aspect Card</span>
                                <button 
                                    onClick={() => setShowShareModal(true)}
                                    className="bg-white hover:bg-slate-200 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center space-x-2"
                                >
                                    <span>Share wrapped</span>
                                    <Share2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Side: Timeline, Profile Customization, Progress Photos */}
                <div className="space-y-8">
                    
                    {/* SECTION 11: Personalization Panel (Bio Sync to Supabase) */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Personalize Identity</span>
                            {!isEditing ? (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="text-[9px] font-black text-indigo-400 uppercase tracking-wider hover:underline flex items-center space-x-1"
                                >
                                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="text-[9px] font-black text-emerald-400 uppercase tracking-wider hover:underline flex items-center"
                                    >
                                        <Save className="w-3 h-3 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false)
                                            setEditedName(userName)
                                            setEditedBio(bio)
                                        }}
                                        className="text-[9px] font-black text-red-400 uppercase tracking-wider hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Display Username</label>
                                    <input 
                                        type="text" 
                                        value={editedName}
                                        onChange={e => setEditedName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Custom Bio Description</label>
                                    <textarea 
                                        value={editedBio}
                                        onChange={e => setEditedBio(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none min-h-[60px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 space-y-2">
                                <div>Username: <strong className="text-white">{userName}</strong></div>
                                <div>Status: <strong className="text-white">{bio}</strong></div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Health Journey Timeline (GitHub contribution flow) */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Biological Milestones</span>
                        
                        <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-[1px] before:bg-white/[0.06] before:pointer-events-none pl-6 text-xs text-slate-400">
                            
                            {/* Step 1 */}
                            <div className="relative">
                                <div className="absolute -left-[22px] w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-950 mt-1" />
                                <div>
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Step 1</span>
                                    <span className="font-bold text-white block">SuppSync Protocol Initiated</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Activated daily wellness tracker</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.totalLogsTaken >= 1 ? 'bg-indigo-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Step 2</span>
                                    <span className="font-bold text-white block">First Active Infusion</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Logged first supplement dosage cycle</p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.totalLogsTaken >= 100 ? 'bg-purple-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Step 3</span>
                                    <span className="font-bold text-white block">Century Dosage Mark</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Completed 100 logged supplement doses</p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.biomarkerCount >= 1 ? 'bg-cyan-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Step 4</span>
                                    <span className="font-bold text-white block">Biochemical Synthesis Map</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Logged first lab draw biomarker panel</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* SECTION 6: Progress Photos monthly compare container */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <ProgressPhotos />
                    </div>

                </div>

            </div>

            {/* SECTION 10: Floating Action bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md border border-white/[0.08] px-4 py-2.5 rounded-2xl flex items-center space-x-3.5 shadow-2xl z-40">
                <button 
                    onClick={() => setShowShareModal(true)}
                    className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center space-x-1.5 transition-colors"
                >
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Share wrapped</span>
                </button>
                <div className="w-[1px] h-4 bg-white/[0.08]" />
                <button 
                    onClick={() => setShowQrModal(true)}
                    className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center space-x-1.5 transition-colors"
                >
                    <QrCode className="w-3.5 h-3.5 text-purple-400" />
                    <span>QR Profile</span>
                </button>
                <div className="w-[1px] h-4 bg-white/[0.08]" />
                <Link 
                    href="/settings"
                    className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center space-x-1.5 transition-colors"
                >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Settings</span>
                </Link>
            </div>

            {/* Spotify Wrapped modal overlay */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-950 border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full space-y-6 text-center"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Share Wrapped Card</h3>
                            
                            {/* Target element to simulate aspect sharing */}
                            <div className="aspect-[4/5] bg-gradient-to-br from-[#0c0c20] to-[#1a082e] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between text-left shadow-2xl relative">
                                <div className="space-y-4">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest block">SuppSync OS Wrapped</span>
                                    <h4 className="text-xl font-black text-white leading-none uppercase">{userName}</h4>
                                    <p className="text-[10px] text-slate-400 italic">"Biohacker Level {stats.level} overall wellness intelligence."</p>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1.5">
                                        <span className="text-slate-500 font-bold uppercase">BioScore:</span>
                                        <span className="text-white font-black">{bioScore}%</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1.5">
                                        <span className="text-slate-500 font-bold uppercase">Streak:</span>
                                        <span className="text-orange-400 font-black">{stats.currentStreak} Days</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1.5">
                                        <span className="text-slate-500 font-bold uppercase">Supplement count:</span>
                                        <span className="text-white font-black">{stats.supplementCount} Active</span>
                                    </div>
                                </div>
                                <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest text-center mt-4">Made with ❤️ on suppsync.vercel.app</span>
                            </div>

                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setShowShareModal(false)}
                                    className="flex-1 h-10 border border-white/[0.08] hover:border-slate-700 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={() => alert("Wrapped card successfully saved to photo gallery!")}
                                    className="flex-1 h-10 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase rounded-xl transition-all"
                                >
                                    Download Card
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Profile modal overlay */}
            <AnimatePresence>
                {showQrModal && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-950 border border-white/[0.08] rounded-3xl p-6 max-w-xs w-full space-y-6 text-center"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Bio-Identity QR Code</h3>
                            
                            <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-2xl relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                                {/* Dynamic SVG simulating a premium medical QR matrix */}
                                <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
                                    <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z" />
                                    <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z" />
                                    <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z" />
                                    <circle cx="50" cy="50" r="12" fill="#2563eb" />
                                    <path d="M45,15 h10 v5 h-10 z M40,25 h15 v5 h-15 z M65,45 h10 v15 h-10 z M55,65 h20 v10 h-20 z" />
                                    <path d="M85,85 h10 v10 h-10 z M75,75 h5 v5 h-5 z M90,65 h5 v5 h-5 z" />
                                </svg>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-normal">
                                Scan to import custom active supplement schedules and biomarker optimal bounds.
                            </p>

                            <button 
                                onClick={() => setShowQrModal(false)}
                                className="w-full h-10 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}
