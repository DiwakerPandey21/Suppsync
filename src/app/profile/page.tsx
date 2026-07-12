'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Trophy, Flame, Pill, FlaskConical, Target, Zap, Crown, 
    Calendar, Star, Shield, Brain, Settings, Share2, Download, 
    QrCode, Edit3, Save, Camera, Sparkles, Heart, Activity, 
    ArrowRight, Check, CheckCircle2, UserCheck, MessageSquare, Info,
    RefreshCw, HeartHandshake, Eye, Copy, Printer, FileText, Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ProgressPhotos } from '@/components/profile/progress-photos'
import QRCode from 'qrcode'
import { toPng, toJpeg } from 'html-to-image'

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

// 30 Procedural Cover collections
const COVER_THEMES = [
    { id: 'cyber-neon', name: 'Cyber Neon', from: '#060b26', via: '#110224', to: '#1c0316', accent: '#f43f5e', text: 'text-rose-400' },
    { id: 'biohacker-lab', name: 'Biohacker Laboratory', from: '#021812', via: '#060a0f', to: '#0d021c', accent: '#10b981', text: 'text-emerald-400' },
    { id: 'dna-molecules', name: 'DNA Molecules', from: '#02031a', via: '#0b0c1e', to: '#160230', accent: '#3b82f6', text: 'text-blue-400' },
    { id: 'neural-net', name: 'Neural Network', from: '#030712', via: '#0d0a21', to: '#1a0438', accent: '#a855f7', text: 'text-purple-400' },
    { id: 'futuristic-city', name: 'Futuristic City', from: '#020617', via: '#0f172a', to: '#1e1b4b', accent: '#6366f1', text: 'text-indigo-400' },
    { id: 'aurora', name: 'Aurora Glow', from: '#061c16', via: '#040b14', to: '#180424', accent: '#14b8a6', text: 'text-teal-400' },
    { id: 'galaxy', name: 'Purple Galaxy', from: '#08011a', via: '#14022a', to: '#02000a', accent: '#d946ef', text: 'text-fuchsia-400' },
    { id: 'medical-hud', name: 'Medical HUD', from: '#01121d', via: '#020a10', to: '#080112', accent: '#06b6d4', text: 'text-cyan-400' },
    { id: 'fitness-arena', name: 'Fitness Arena', from: '#1a0505', via: '#090202', to: '#140b0b', accent: '#ef4444', text: 'text-red-400' },
    { id: 'protein-powder', name: 'Protein Abstract', from: '#0f051d', via: '#07020e', to: '#1b0c30', accent: '#8b5cf6', text: 'text-violet-400' },
    { id: 'chemical-structures', name: 'Chemical Structures', from: '#041d1a', via: '#020a14', to: '#0e021a', accent: '#10b981', text: 'text-emerald-400' },
    { id: 'minimal-black', name: 'Minimal Black', from: '#030303', via: '#09090b', to: '#18181b', accent: '#a1a1aa', text: 'text-slate-400' },
    { id: 'blue-plasma', name: 'Blue Plasma', from: '#020a24', via: '#06113c', to: '#010514', accent: '#3b82f6', text: 'text-blue-400' },
    { id: 'ai-core', name: 'AI Core', from: '#0a0524', via: '#040114', to: '#170b38', accent: '#a855f7', text: 'text-purple-400' },
    { id: 'scifi-energy', name: 'Sci-Fi Energy', from: '#241a02', via: '#0d0a02', to: '#171102', accent: '#f59e0b', text: 'text-amber-400' },
    { id: 'workout-blueprint', name: 'Workout Blueprint', from: '#021e3d', via: '#010f21', to: '#07162c', accent: '#0ea5e9', text: 'text-sky-400' },
    { id: 'olympic-stadium', name: 'Olympic Stadium', from: '#140c02', via: '#050300', to: '#1c1002', accent: '#f59e0b', text: 'text-amber-500' },
    { id: 'gaming-arena', name: 'Gaming Arena', from: '#1f021f', via: '#0c010d', to: '#140224', accent: '#ec4899', text: 'text-pink-400' },
    { id: 'space-nebula', name: 'Space Nebula', from: '#040d21', via: '#10052b', to: '#050212', accent: '#8b5cf6', text: 'text-indigo-400' },
    { id: 'hexagonal-mesh', name: 'Hexagonal Mesh', from: '#090d16', via: '#030508', to: '#141b2b', accent: '#64748b', text: 'text-slate-400' },
    { id: 'anime-energy', name: 'Anime Energy', from: '#2b0404', via: '#0d0101', to: '#1c0303', accent: '#f43f5e', text: 'text-rose-500' },
    { id: 'fantasy-warrior', name: 'Fantasy Warrior', from: '#17120c', via: '#0a0805', to: '#1a140d', accent: '#b45309', text: 'text-amber-600' },
    { id: 'cyber-samurai', name: 'Cyber Samurai', from: '#1a0429', via: '#08010f', to: '#140220', accent: '#d946ef', text: 'text-fuchsia-400' },
    { id: 'knight-armor', name: 'Knight Armor', from: '#111827', via: '#1f2937', to: '#030712', accent: '#9ca3af', text: 'text-gray-400' },
    { id: 'assassin', name: 'Assassin Theme', from: '#080707', via: '#120f0f', to: '#020202', accent: '#ef4444', text: 'text-red-500' },
    { id: 'shadow-ninja', name: 'Shadow Ninja', from: '#040b14', via: '#010408', to: '#0d131f', accent: '#3b82f6', text: 'text-blue-500' },
    { id: 'spartan', name: 'Spartan Warrior', from: '#240a0a', via: '#100404', to: '#170606', accent: '#dc2626', text: 'text-red-600' },
    { id: 'viking', name: 'Viking Theme', from: '#1c160c', via: '#0d0a05', to: '#171207', accent: '#d97706', text: 'text-amber-600' },
    { id: 'dragon', name: 'Dragon Theme', from: '#1d0404', via: '#0c0101', to: '#2b0909', accent: '#ef4444', text: 'text-red-500' },
    { id: 'mecha', name: 'Mecha Theme', from: '#070f2b', via: '#1b1a55', to: '#070f2b', accent: '#535c91', text: 'text-indigo-300' }
]

export default function ProfilePage() {
    const supabase = createClient()
    
    // UI Refs for image rendering
    const wrappedRef = useRef<HTMLDivElement>(null)
    const idCardRef = useRef<HTMLDivElement>(null)

    // Base stats state
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
    const [userNickname, setUserNickname] = useState('') // display_name
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    
    // Inputs
    const [editedUsername, setEditedUsername] = useState('')
    const [editedNickname, setEditedNickname] = useState('')
    const [editedBio, setEditedBio] = useState('')

    // Cover Theme & customization states
    const [activeTheme, setActiveTheme] = useState(COVER_THEMES[0])
    const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null)
    const [favoriteCovers, setFavoriteCovers] = useState<string[]>([])
    
    // Modal controls
    const [showWrappedModal, setShowWrappedModal] = useState(false)
    const [showQrModal, setShowQrModal] = useState(false)
    const [showIdCardModal, setShowIdCardModal] = useState(false)

    // Wrapped Export parameters
    const [wrappedTemplate, setWrappedTemplate] = useState<'Dark Premium' | 'Neon' | 'Aurora' | 'Galaxy' | 'Medical' | 'Cyber' | 'Minimal'>('Dark Premium')
    const [exportFormat, setExportFormat] = useState<'Story' | 'Post' | 'Banner'>('Story')
    const [isExporting, setIsExporting] = useState(false)

    // QR Image States
    const [qrPngUrl, setQrPngUrl] = useState('')
    const [qrSvgUrl, setQrSvgUrl] = useState('')

    // Hidden input ref for custom cover upload
    const coverUploadRef = useRef<HTMLInputElement>(null)

    // Hash algorithm for seeded covers
    const userSeed = useMemo(() => {
        if (!userId) return 1
        return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    }, [userId])

    // Determinstic seeded procedural selector
    useEffect(() => {
        if (userId) {
            const localTheme = localStorage.getItem('suppsync-cover-theme')
            if (localTheme) {
                const match = COVER_THEMES.find(t => t.id === localTheme)
                if (match) setActiveTheme(match)
            } else {
                setActiveTheme(COVER_THEMES[userSeed % COVER_THEMES.length])
            }
            
            // Load custom uploaded cover if exists
            const customCover = localStorage.getItem('suppsync-custom-cover')
            if (customCover) setCustomCoverUrl(customCover)

            // Load favorites
            const favs = localStorage.getItem('suppsync-fav-covers')
            if (favs) setFavoriteCovers(JSON.parse(favs))
        }
    }, [userId, userSeed])

    // Main fetch profile & aggregates
    useEffect(() => {
        async function fetchStats() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak, display_name, bio, level, xp, username')
                .eq('id', user.id)
                .single()

            const nameVal = profile?.username || user.email?.split('@')[0] || 'biohacker'
            const nickVal = profile?.display_name || 'SuppSync Member'
            const bioVal = profile?.bio || 'Biohacker optimizing cellular driven intelligence.'
            
            setUserName(nameVal)
            setUserNickname(nickVal)
            setBio(bioVal)
            setEditedUsername(nameVal)
            setEditedNickname(nickVal)
            setEditedBio(bioVal)

            // Query database counts
            const [logsRes, suppRes, bioRes, uniqueDaysRes] = await Promise.all([
                supabase.from('logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'taken'),
                supabase.from('supplements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('logs').select('log_date').eq('user_id', user.id).eq('status', 'taken')
            ])

            const uniqueDaysCount = new Set(uniqueDaysRes.data?.map(d => d.log_date)).size

            setStats({
                totalLogsTaken: logsRes.count || 0,
                currentStreak: profile?.current_streak || 0,
                supplementCount: suppRes.count || 0,
                biomarkerCount: bioRes.count || 0,
                protocolsAdopted: profile?.current_streak ? 1 : 0,
                daysActive: uniqueDaysCount || 0,
                xp: profile?.xp || 0,
                level: profile?.level || 1
            })
            setIsLoading(false)
        }
        fetchStats()
    }, [supabase])

    // Generate real QR code dynamically when identity variables change
    useEffect(() => {
        if (!userId) return
        const targetUrl = `https://suppsync.vercel.app/u/${userName}`
        
        QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 512,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }).then(url => setQrPngUrl(url))

        QRCode.toString(targetUrl, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 2
        }).then(svg => {
            const blob = new Blob([svg], { type: 'image/svg+xml' })
            setQrSvgUrl(URL.createObjectURL(blob))
        })
    }, [userId, userName])

    // Custom deterministic random SVG elements generator based on userSeed
    const proceduralElements = useMemo(() => {
        const rnd = (function(seed) {
            let s = seed
            return function() {
                s = Math.sin(s) * 10000
                return s - Math.floor(s)
            }
        })(userSeed)

        const points = Array.from({ length: 14 }).map(() => ({
            x: rnd() * 100,
            y: rnd() * 100,
            r: rnd() * 3 + 1.5
        }))

        const paths = Array.from({ length: 10 }).map(() => ({
            from: Math.floor(rnd() * points.length),
            to: Math.floor(rnd() * points.length)
        }))

        return { points, paths }
    }, [userSeed])

    // PlayStation trophy medallions config
    const badges: Badge[] = useMemo(() => [
        { id: 'first-dose', name: 'First Infusion', description: 'Log first supplement dosage cycle', icon: Pill, color: 'text-blue-400', bgColor: 'bg-blue-500/10', requirement: 1, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 1, rarity: 'Common' },
        { id: '7-day-warrior', name: 'Homeostasis Spark', description: 'Maintain supplement intake for 7 days', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10', requirement: 7, currentValue: stats.currentStreak, unlocked: stats.currentStreak >= 7, rarity: 'Rare' },
        { id: 'stack-master', name: 'Synergy Architect', description: 'Configure 10+ custom active compounds', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', requirement: 10, currentValue: stats.supplementCount, unlocked: stats.supplementCount >= 10, rarity: 'Rare' },
        { id: 'lab-rat', name: 'Biochemical Map', description: 'Track 5 specific biomarkers trends', icon: FlaskConical, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', requirement: 5, currentValue: stats.biomarkerCount, unlocked: stats.biomarkerCount >= 5, rarity: 'Epic' },
        { id: 'centurion', name: 'Cellular Veteran', description: 'Complete 100 logged supplement doses', icon: Target, color: 'text-rose-400', bgColor: 'bg-rose-500/10', requirement: 100, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 100, rarity: 'Legendary' },
        { id: 'titan', name: 'Mitochondrial Overlord', description: 'Complete 500 total dosage cycles', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/10', requirement: 500, currentValue: stats.totalLogsTaken, unlocked: stats.totalLogsTaken >= 500, rarity: 'Legendary' }
    ], [stats])

    const unlockedCount = badges.filter(b => b.unlocked).length

    // Calculated BioScore
    const bioScore = useMemo(() => {
        const streakWeight = Math.min(30, stats.currentStreak) * 1.5
        const logsWeight = Math.min(200, stats.totalLogsTaken) * 0.15
        const bioWeight = Math.min(10, stats.biomarkerCount) * 2.5
        const base = 55
        return Math.min(99, Math.round(base + streakWeight + logsWeight + bioWeight))
    }, [stats])

    // Save profile preferences back to Supabase
    const handleSaveProfile = async () => {
        if (!userId) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editedUsername,
                    display_name: editedNickname,
                    bio: editedBio
                })
                .eq('id', userId)

            if (!error) {
                setUserName(editedUsername)
                setUserNickname(editedNickname)
                setBio(editedBio)
                setIsEditing(false)
            }
        } catch (e) {
            console.error("Failed to update profile settings:", e)
        } finally {
            setIsSaving(false)
        }
    }

    // Cover custom uploads
    const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            setCustomCoverUrl(dataUrl)
            localStorage.setItem('suppsync-custom-cover', dataUrl)
        }
        reader.readAsDataURL(file)
    }

    const handleShuffleCover = () => {
        setCustomCoverUrl(null)
        localStorage.removeItem('suppsync-custom-cover')
        const randomTheme = COVER_THEMES[Math.floor(Math.random() * COVER_THEMES.length)]
        setActiveTheme(randomTheme)
        localStorage.setItem('suppsync-cover-theme', randomTheme.id)
    }

    const handleResetCover = () => {
        setCustomCoverUrl(null)
        localStorage.removeItem('suppsync-custom-cover')
        const seededTheme = COVER_THEMES[userSeed % COVER_THEMES.length]
        setActiveTheme(seededTheme)
        localStorage.setItem('suppsync-cover-theme', seededTheme.id)
    }

    const toggleFavoriteCover = () => {
        let updated = [...favoriteCovers]
        if (updated.includes(activeTheme.id)) {
            updated = updated.filter(id => id !== activeTheme.id)
        } else {
            updated.push(activeTheme.id)
        }
        setFavoriteCovers(updated)
        localStorage.setItem('suppsync-fav-covers', JSON.stringify(updated))
    }

    // Modern html-to-image Crisp Export Engine
    const exportWrappedImage = async (format: 'png' | 'jpeg') => {
        const node = wrappedRef.current
        if (!node) return
        setIsExporting(true)

        try {
            // Apply scale: 2 for crisp exports
            const options = {
                pixelRatio: 2,
                cacheBust: true,
                style: {
                    transform: 'scale(1)',
                    left: '0',
                    top: '0'
                }
            }

            let dataUrl = ''
            if (format === 'png') {
                dataUrl = await toPng(node, options)
            } else {
                dataUrl = await toJpeg(node, options)
            }

            const link = document.createElement('a')
            link.download = `SuppSync-Wrapped-${userName}.${format}`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error("Export failure:", error)
        } finally {
            setIsExporting(false)
        }
    }

    const exportIdCard = async () => {
        const node = idCardRef.current
        if (!node) return
        setIsExporting(true)
        try {
            const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
            const link = document.createElement('a')
            link.download = `SuppSync-ID-${userName}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error("Export ID failure:", error)
        } finally {
            setIsExporting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-12 py-8 relative">
            
            {/* SECTION 1: Immersive Hero Cover System */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/[0.06] bg-slate-950/40 shadow-2xl">
                
                {/* Dynamically generated cover backdrop */}
                <div 
                    style={{ background: `linear-gradient(to right, ${activeTheme.from}, ${activeTheme.via}, ${activeTheme.to})` }}
                    className="w-full h-56 relative overflow-hidden transition-all duration-700 select-none"
                >
                    {customCoverUrl ? (
                        <img src={customCoverUrl} alt="Cover image" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none">
                            {/* Neural Network mesh */}
                            {proceduralElements.paths.map((p, idx) => (
                                <line 
                                    key={idx}
                                    x1={`${proceduralElements.points[p.from].x}%`}
                                    y1={`${proceduralElements.points[p.from].y}%`}
                                    x2={`${proceduralElements.points[p.to].x}%`}
                                    y2={`${proceduralElements.points[p.to].y}%`}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className={activeTheme.accent}
                                />
                            ))}
                            {proceduralElements.points.map((pt, idx) => (
                                <circle 
                                    key={idx}
                                    cx={`${pt.x}%`}
                                    cy={`${pt.y}%`}
                                    r={pt.r}
                                    fill="currentColor"
                                    className={activeTheme.accent}
                                />
                            ))}
                            {/* Geometric abstract blueprint lines */}
                            <path d="M 0,0 L 100,56 M 0,56 L 100,0" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        </svg>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Interactive Action Controls */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/[0.08] z-30 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <button onClick={handleShuffleCover} className="hover:text-white flex items-center space-x-1 transition-colors">
                            <RefreshCw className="w-3 h-3" />
                            <span>Shuffle</span>
                        </button>
                        <div className="w-[1px] h-3 bg-white/[0.1]" />
                        <button onClick={() => coverUploadRef.current?.click()} className="hover:text-white flex items-center space-x-1 transition-colors">
                            <Camera className="w-3 h-3" />
                            <span>Upload</span>
                        </button>
                        <div className="w-[1px] h-3 bg-white/[0.1]" />
                        <button onClick={handleResetCover} className="hover:text-white transition-colors">Reset</button>
                        <div className="w-[1px] h-3 bg-white/[0.1]" />
                        <button onClick={toggleFavoriteCover} className={cn("hover:text-white transition-colors", favoriteCovers.includes(activeTheme.id) ? 'text-amber-400' : 'text-slate-400')}>
                            ★
                        </button>
                    </div>

                    <input 
                        type="file" 
                        ref={coverUploadRef} 
                        onChange={handleCoverFile} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>

                {/* Profile Details Container (Overlapping banner) */}
                <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16">
                    
                    <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                        <div className="relative w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center p-1.5 border border-white/[0.08] shadow-2xl shrink-0 z-20">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="56" cy="56" r="50" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="3.5" />
                                <circle cx="56" cy="56" r="50" fill="transparent" stroke="url(#heroRingGlow)" strokeWidth="3.5" 
                                    strokeDasharray={314} strokeDashoffset={314 - (314 * bioScore) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center text-3xl font-black text-white relative">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="text-center md:text-left space-y-1.5 relative z-20">
                            <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-3.5">
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{userNickname}</h1>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">@{userName}</span>
                            </div>
                            
                            <p className="text-xs text-slate-400 max-w-sm italic">
                                "{bio}"
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-2">
                        <div className="flex flex-wrap items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl relative z-20">
                            <div className="text-center px-3">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">BioScore</span>
                                <span className="text-lg font-black text-white">{bioScore}</span>
                            </div>
                            <div className="w-[1px] h-6 bg-white/[0.08]" />
                            <div className="text-center px-3">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Streak</span>
                                <span className="text-lg font-black text-orange-400 flex items-center justify-center">
                                    <Flame className="w-3.5 h-3.5 text-orange-400 mr-0.5" />
                                    {stats.currentStreak}d
                                </span>
                            </div>
                            <div className="w-[1px] h-6 bg-white/[0.08]" />
                            <div className="text-center px-3">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Level</span>
                                <span className="text-lg font-black text-indigo-400">{stats.level}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ASYMMETRICAL EDITORIAL GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* SECTION 2: Conversational AI Health Summary */}
                    <div className="p-6 rounded-[28px] border border-white/[0.06] bg-white/[0.01] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit mb-4">
                            <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Biological Synthesis</span>
                        </div>

                        <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
                            "Adherence analysis shows a robust {stats.currentStreak}-day homeostasis streak, with active supplement logging matching optimal biological target bounds. Prioritize Vitamin D fat-solubility and focus consistency to unlock Level {stats.level + 1}."
                        </p>
                    </div>

                    {/* SECTION 3: Performance Indexes */}
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

                    {/* SECTION 7: Wrapped Trigger Box */}
                    <div className="p-6 bg-gradient-to-br from-[#0c0c20] to-[#1a082e] border border-white/[0.08] rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                        <div className="space-y-2 text-center md:text-left">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                                Instagram-Ready Template 2.0
                            </span>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">SuppSync Wrapped 2.0</h3>
                            <p className="text-[11px] text-slate-400 max-w-sm">
                                Generate a premium Instagram Story export card detailing your biology metrics.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowWrappedModal(true)}
                            className="bg-white hover:bg-slate-200 text-black px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center space-x-2 cursor-pointer shrink-0 active:scale-95 shadow-lg shadow-white/5"
                        >
                            <span>Synthesize wrapped</span>
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                </div>

                {/* Right Side: Identity Controls, Timeline, Photos */}
                <div className="space-y-8">
                    
                    {/* SECTION 11: Personalization Panel */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Personalize Identity</span>
                            {!isEditing ? (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="text-[9px] font-black text-indigo-400 uppercase tracking-wider hover:underline flex items-center space-x-1"
                                >
                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
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
                                            setEditedUsername(userName)
                                            setEditedNickname(userNickname)
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
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Display Nickname</label>
                                    <input 
                                        type="text" 
                                        value={editedNickname}
                                        onChange={e => setEditedNickname(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Unique Username</label>
                                    <input 
                                        type="text" 
                                        value={editedUsername}
                                        onChange={e => setEditedUsername(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Custom Bio</label>
                                    <textarea 
                                        value={editedBio}
                                        onChange={e => setEditedBio(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none min-h-[60px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 space-y-2">
                                <div>Name: <strong className="text-white">{userNickname}</strong></div>
                                <div>Username: <strong className="text-white">@{userName}</strong></div>
                                <div>Bio: <strong className="text-white">{bio}</strong></div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Health Journey Timeline */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Biological Milestones</span>
                        
                        <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-[1px] before:bg-white/[0.06] before:pointer-events-none pl-6 text-xs text-slate-400">
                            
                            <div className="relative">
                                <div className="absolute -left-[22px] w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-950 mt-1" />
                                <div>
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Milestone 1</span>
                                    <span className="font-bold text-white block">SuppSync Protocol Initiated</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Activated daily wellness tracker</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.totalLogsTaken >= 1 ? 'bg-indigo-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Milestone 2</span>
                                    <span className="font-bold text-white block">First Dose Administered</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Logged first supplement dosage cycle</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.totalLogsTaken >= 100 ? 'bg-purple-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Milestone 3</span>
                                    <span className="font-bold text-white block">Century Dosage Mark</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Completed 100 logged supplement doses</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className={cn("absolute -left-[22px] w-2.5 h-2.5 rounded-full border border-slate-950 mt-1", stats.biomarkerCount >= 1 ? 'bg-cyan-500' : 'bg-slate-800')} />
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Milestone 4</span>
                                    <span className="font-bold text-white block">Biochemical Mapping</span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Logged first lab draw biomarker panel</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* SECTION 6: Progress Photos Compare Container */}
                    <div className="p-6 bg-white/[0.01] border border-white/[0.06] rounded-[28px] space-y-4">
                        <ProgressPhotos />
                    </div>

                </div>

            </div>

            {/* SECTION 10: Floating Action bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md border border-white/[0.08] px-4 py-2.5 rounded-2xl flex items-center space-x-3.5 shadow-2xl z-40">
                <button 
                    onClick={() => setShowWrappedModal(true)}
                    className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center space-x-1.5 transition-colors"
                >
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Wrapped 2.0</span>
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
                <button 
                    onClick={() => setShowIdCardModal(true)}
                    className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center space-x-1.5 transition-colors"
                >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ID Card</span>
                </button>
            </div>

            {/* MODAL 1: WRAPPED CARD 2.0 OVERLAY */}
            <AnimatePresence>
                {showWrappedModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[99] overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b0b14] border border-white/[0.08] rounded-3xl p-6 max-w-4xl w-full flex flex-col md:flex-row gap-6 relative"
                        >
                            {/* Scrollable Preview Area */}
                            <div className="flex-1 flex flex-col items-center">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Instagram Story Card Preview (1080x1920)</h3>
                                
                                {/* 9:16 story container scaled down for preview */}
                                <div className="border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative w-[270px] h-[480px] bg-slate-950">
                                    
                                    {/* The absolute offscreen rendering canvas element captured by html-to-image at full 1080x1920 */}
                                    <div 
                                        ref={wrappedRef}
                                        style={{ 
                                            width: '1080px', 
                                            height: '1920px', 
                                            transform: 'scale(0.25)', 
                                            transformOrigin: 'top left' 
                                        }}
                                        className={cn(
                                            "bg-gradient-to-br p-16 flex flex-col justify-between absolute left-0 top-0 select-none",
                                            wrappedTemplate === 'Dark Premium' ? 'from-[#070714] via-[#0b0c1e] to-[#020207]' :
                                            wrappedTemplate === 'Neon' ? 'from-[#1e1b4b] via-[#311042] to-[#090514]' :
                                            wrappedTemplate === 'Aurora' ? 'from-[#021c16] via-[#05111c] to-[#0a0514]' :
                                            wrappedTemplate === 'Galaxy' ? 'from-[#08021c] via-[#1b082e] to-[#03000a]' :
                                            wrappedTemplate === 'Medical' ? 'from-[#021727] via-[#030e18] to-[#070214]' :
                                            wrappedTemplate === 'Cyber' ? 'from-[#241202] via-[#0e0a02] to-[#12041b]' :
                                            'from-[#0c0d12] via-[#12131a] to-[#090a0d]'
                                        )}
                                    >
                                        <div className="space-y-12">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center space-x-4">
                                                    <Activity className="w-8 h-8 text-indigo-400" />
                                                    <span className="text-xl font-black text-slate-400 uppercase tracking-widest">SuppSync Wrapped</span>
                                                </div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 rounded-full">
                                                    Health OS
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-6">
                                                <div className="w-24 h-24 rounded-full bg-slate-950 p-1 border-2 border-indigo-500 shadow-2xl">
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-3xl font-black text-white">
                                                        {userName.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-3xl font-black text-white uppercase">{userNickname}</h4>
                                                    <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider">@{userName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-2">
                                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">Top Performance Metric</span>
                                                <h3 className="text-5xl font-black text-white uppercase tracking-tight">Homeostasis Spark</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/[0.06]">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">BioScore Index</span>
                                                    <span className="text-3xl font-black text-white">{bioScore}% Optimal</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Adherence Streak</span>
                                                    <span className="text-3xl font-black text-orange-400">{stats.currentStreak} Days</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Active Supplements</span>
                                                    <span className="text-3xl font-black text-white">{stats.supplementCount} Logged</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Biohacker Level</span>
                                                    <span className="text-3xl font-black text-purple-400">Level {stats.level}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-between items-center border-t border-white/[0.06]">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">© 2026 SUPPSYNC</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">suppsync.vercel.app</span>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Control Sidebar */}
                            <div className="w-full md:w-[320px] flex flex-col justify-between space-y-6">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Export Settings</h3>
                                    
                                    {/* Template Selector */}
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Choose Design Theme</label>
                                        <select 
                                            value={wrappedTemplate} 
                                            onChange={(e: any) => setWrappedTemplate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                                        >
                                            {['Dark Premium', 'Neon', 'Aurora', 'Galaxy', 'Medical', 'Cyber', 'Minimal'].map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/[0.06]">
                                    <button 
                                        disabled={isExporting}
                                        onClick={() => exportWrappedImage('png')}
                                        className="w-full h-11 bg-white hover:bg-slate-200 text-black font-black text-[10px] uppercase rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-lg active:scale-95"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>{isExporting ? 'Generating...' : 'Download png (story)'}</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowWrappedModal(false)}
                                        className="w-full h-11 border border-white/[0.08] hover:border-slate-700 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: QR DIGITAL IDENTITY OVERLAY */}
            <AnimatePresence>
                {showQrModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[99]">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-950 border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full space-y-6 text-center relative"
                        >
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">QR Health Passport</h3>
                                
                                <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-2xl relative">
                                    {qrPngUrl && <img src={qrPngUrl} alt="QR Code" className="w-full h-full" />}
                                    <div className="absolute w-8 h-8 bg-slate-950 rounded-xl border-2 border-white flex items-center justify-center z-20">
                                        <Activity className="w-4 h-4 text-blue-400" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase">{userNickname}</h4>
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">Level {stats.level} Biohacker</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider">
                                <a 
                                    href={qrPngUrl}
                                    download={`SuppSync-QR-${userName}.png`}
                                    className="h-10 border border-white/[0.08] hover:border-slate-700 text-white rounded-xl transition-all flex items-center justify-center space-x-2"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download png</span>
                                </a>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://suppsync.vercel.app/u/${userName}`)
                                        alert("Profile URL successfully copied!")
                                    }}
                                    className="h-10 bg-white hover:bg-slate-200 text-black rounded-xl transition-all flex items-center justify-center space-x-2"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy URL</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => setShowQrModal(false)}
                                className="w-full h-10 border border-white/[0.08] hover:border-slate-700 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: BIOHACKER IDENTITY CARD */}
            <AnimatePresence>
                {showIdCardModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[99]">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#090a12] border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full space-y-6 text-center relative"
                        >
                            {/* Printable Passport Card Element */}
                            <div 
                                ref={idCardRef}
                                className="w-[320px] h-[480px] bg-gradient-to-b from-[#111222] via-[#05060d] to-[#0e0f1a] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between text-left relative overflow-hidden shadow-2xl mx-auto"
                            >
                                {/* Futuristic HUD mesh elements */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute top-4 right-4 text-[7px] font-mono text-cyan-400/60 tracking-wider">SECURE HUD 2.0</div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 border-b border-white/[0.05] pb-3">
                                        <Activity className="w-5 h-5 text-cyan-400" />
                                        <div>
                                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">SuppSync OS</span>
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Health Identity Passport</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-950 border border-white/[0.08] flex items-center justify-center text-xl font-black text-white shrink-0">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">@{userName}</span>
                                            <h4 className="text-base font-black text-white uppercase leading-none mt-0.5">{userNickname}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-4 border-t border-white/[0.05]">
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1">
                                        <span className="text-slate-500 font-bold uppercase">Biohacker Level:</span>
                                        <span className="text-white font-black">Level {stats.level}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1">
                                        <span className="text-slate-500 font-bold uppercase">Health BioScore:</span>
                                        <span className="text-white font-black">{bioScore}%</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1">
                                        <span className="text-slate-500 font-bold uppercase">Adherence Streak:</span>
                                        <span className="text-orange-400 font-black">{stats.currentStreak} Days</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] border-b border-white/[0.04] pb-1">
                                        <span className="text-slate-500 font-bold uppercase">Biomarkers Mapped:</span>
                                        <span className="text-white font-black">{stats.biomarkerCount} Markers</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/[0.05] pt-4 mt-4">
                                    <div className="space-y-1">
                                        <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest block">System Node Status</span>
                                        <span className="text-[8px] font-black text-emerald-400 uppercase flex items-center">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                                            SYNCED VERIFIED
                                        </span>
                                    </div>
                                    {qrPngUrl && <img src={qrPngUrl} className="w-12 h-12 bg-white p-0.5 rounded" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setShowIdCardModal(false)}
                                    className="h-10 border border-white/[0.08] hover:border-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={exportIdCard}
                                    className="h-10 bg-white hover:bg-slate-200 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}
