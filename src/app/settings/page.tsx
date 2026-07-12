'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
    Settings, Search, User, Palette, Brain, Bell, Heart, Pill, 
    Smartphone, Dna, Download, Upload, ShieldCheck, Lock, Shield, 
    FlaskConical, Database, Sparkles, RefreshCw, Power, Terminal, 
    Info, Activity, Wifi, Trash2, Copy, Plus, Check, CheckCircle2, 
    X, Flame, BookOpen, MessageSquare, Share2, HelpCircle, LogOut,
    Eye, EyeOff, Save, Trash, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Accent Colors Configuration
const ACCENT_COLORS = [
    { name: 'Indigo', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 active:border-indigo-400', color: '#6366f1' },
    { name: 'Cyan', class: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 active:border-cyan-400', color: '#06b6d4' },
    { name: 'Purple', class: 'text-purple-400 bg-purple-500/10 border-purple-500/20 active:border-purple-400', color: '#a855f7' },
    { name: 'Rose', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20 active:border-rose-400', color: '#f43f5e' },
    { name: 'Emerald', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 active:border-emerald-400', color: '#10b981' }
]

// VAPID Public Key for Push reminders
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function SettingsOS() {
    const supabase = createClient()
    const router = useRouter()
    
    // Core settings states
    const [isMounted, setIsMounted] = useState(false)
    const [activeSection, setActiveSection] = useState('account')
    const [searchQuery, setSearchQuery] = useState('')
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'failed'>('saved')
    const [isDevMode, setIsDevMode] = useState(false)

    // Form inputs and details
    const [displayName, setDisplayName] = useState('')
    const [userName, setUserName] = useState('')
    const [userBio, setUserBio] = useState('')
    const [email, setEmail] = useState('')
    const [memberSince, setMemberSince] = useState('July 2026')
    const [userId, setUserId] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    // Theme Customizer States
    const [accentColor, setAccentColor] = useState('Indigo')
    const [glassIntensity, setGlassIntensity] = useState(15) // percentage background transparency
    const [animationSpeed, setAnimationSpeed] = useState(300) // ms transition durations
    const [compactMode, setCompactMode] = useState(false)
    const [roundedCorners, setRoundedCorners] = useState(16) // px
    const [fontScale, setFontScale] = useState(1.0) // rem factor

    // AI OS Customizer States
    const [aiPersonality, setAiPersonality] = useState('Hyper-Analytical')
    const [aiLength, setAiLength] = useState('Concise')
    const [aiDepth, setAiDepth] = useState('Expert')
    const [riskTolerance, setRisktolerance] = useState(50) // 0 to 100 slider
    const [preferredGoal, setPreferredGoal] = useState('Longevity & Performance')
    const [dailySummaryTime, setDailySummaryTime] = useState('20:00')
    const [weeklySummaryDay, setWeeklySummaryDay] = useState('Sunday')
    const [predictiveRecommendations, setPredictiveRecommendations] = useState(true)
    const [experimentalAI, setExperimentalAI] = useState(false)

    // Push Subscriptions States
    const [isPushEnabled, setIsPushEnabled] = useState(false)
    const [isPushSupported, setIsPushSupported] = useState(false)
    const [isExporting, setIsExporting] = useState<string | null>(null)

    // Storage simulate stats states
    const [storageCache, setStorageCache] = useState({
        cachedAI: 4.8,
        reports: 1.2,
        images: 8.4,
        progressPhotos: 12.0,
        wrappedCards: 5.6
    })

    // Custom alerts state
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Navigation and search references
    const searchInputRef = useRef<HTMLInputElement>(null)
    const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // Load initial Supabase user defaults and local configs
    useEffect(() => {
        setIsMounted(true)
        
        // Listen to service worker push support
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true)
            checkPushSubscription()
        }

        // Fetch User details
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                setEmail(user.email || '')
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, username, bio, created_at')
                    .eq('id', user.id)
                    .single()
                
                if (profile) {
                    setDisplayName(profile.display_name || '')
                    setUserName(profile.username || '')
                    setUserBio(profile.bio || '')
                    if (profile.created_at) {
                        const date = new Date(profile.created_at)
                        setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
                    }
                }
            }
        }
        fetchUser()

        // Load custom theme settings from localStorage
        const cachedAccent = localStorage.getItem('suppsync-accent-color')
        if (cachedAccent) setAccentColor(cachedAccent)
        const cachedGlass = localStorage.getItem('suppsync-glass-intensity')
        if (cachedGlass) setGlassIntensity(Number(cachedGlass))
        const cachedCorners = localStorage.getItem('suppsync-rounded-corners')
        if (cachedCorners) setRoundedCorners(Number(cachedCorners))
        const cachedFont = localStorage.getItem('suppsync-font-scale')
        if (cachedFont) setFontScale(Number(cachedFont))
        const cachedCompact = localStorage.getItem('suppsync-compact-mode')
        if (cachedCompact) setCompactMode(cachedCompact === 'true')
        const cachedSpeed = localStorage.getItem('suppsync-animation-speed')
        if (cachedSpeed) setAnimationSpeed(Number(cachedSpeed))

        // Keylistener Ctrl + K search trigger
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Scroll spy tracker to highlight active category
    useEffect(() => {
        if (!isMounted) return
        const handleScroll = () => {
            const scrollPos = window.scrollY + 160
            for (const key of Object.keys(sectionRefs.current)) {
                const el = sectionRefs.current[key]
                if (el) {
                    const top = el.offsetTop
                    const height = el.offsetHeight
                    if (scrollPos >= top && scrollPos < top + height) {
                        setActiveSection(key)
                        break
                    }
                }
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isMounted])

    // Save configuration states automatically
    const autoSave = () => {
        setSaveStatus('saving')
        setTimeout(() => {
            try {
                localStorage.setItem('suppsync-accent-color', accentColor)
                localStorage.setItem('suppsync-glass-intensity', String(glassIntensity))
                localStorage.setItem('suppsync-rounded-corners', String(roundedCorners))
                localStorage.setItem('suppsync-font-scale', String(fontScale))
                localStorage.setItem('suppsync-compact-mode', String(compactMode))
                localStorage.setItem('suppsync-animation-speed', String(animationSpeed))
                setSaveStatus('saved')
            } catch (err) {
                setSaveStatus('failed')
            }
        }, 600)
    }

    // Trigger auto-save whenever personalizations change
    useEffect(() => {
        if (isMounted) autoSave()
    }, [accentColor, glassIntensity, roundedCorners, fontScale, compactMode, animationSpeed])

    // Manage toast alert
    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 3000)
    }

    // Service worker subscription logic (Push Notifications)
    const checkPushSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsPushEnabled(!!subscription)
        } catch (err) {
            console.error('Error checking subscription:', err)
        }
    }

    const togglePush = async () => {
        if (isPushEnabled) {
            // Unsubscribe
            try {
                const registration = await navigator.serviceWorker.ready
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    await subscription.unsubscribe()
                }
                if (userId) {
                    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
                }
                setIsPushEnabled(false)
                triggerToast('Reminders disabled successfully.')
            } catch (err) {
                console.error(err)
            }
        } else {
            // Subscribe
            if (!VAPID_PUBLIC_KEY) {
                alert('Push VAPID key is missing in config environments.')
                return
            }
            try {
                const registration = await navigator.serviceWorker.register('/sw.js')
                await navigator.serviceWorker.ready
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    alert('Please enable browser notification access permissions.')
                    return
                }
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })
                const subJSON = subscription.toJSON()
                if (userId) {
                    await supabase.from('push_subscriptions').upsert({
                        user_id: userId,
                        endpoint: subJSON.endpoint,
                        p256dh: subJSON.keys?.p256dh || '',
                        auth: subJSON.keys?.auth || '',
                        device_type: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
                    }, { onConflict: 'user_id' })
                }
                setIsPushEnabled(true)
                triggerToast('Reminders successfully registered!')
            } catch (err) {
                console.error(err)
            }
        }
    }

    // Supabase CSV Exports logic
    const handleCsvExport = async (type: 'logs' | 'biomarkers' | 'scores') => {
        setIsExporting(type)
        try {
            if (!userId) return
            let csvContent = ''
            let filename = `suppsync_${type}.csv`

            if (type === 'logs') {
                const { data } = await supabase
                    .from('logs')
                    .select('log_date, status, schedules(dosage_amount, dosage_unit, supplements(name))')
                    .eq('user_id', userId)
                    .order('log_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Supplement,Dosage,Status\n' + 
                    (data || []).map((log: any) => {
                        const sched = Array.isArray(log.schedules) ? log.schedules[0] : log.schedules
                        const supp = sched?.supplements
                        const suppName = Array.isArray(supp) ? supp[0]?.name : supp?.name
                        return `${log.log_date},"${suppName || 'Unknown'}",${sched?.dosage_amount || ''}${sched?.dosage_unit || ''},${log.status}`
                    }).join('\n')
            } else if (type === 'biomarkers') {
                const { data } = await supabase
                    .from('biomarkers')
                    .select('marker_name, value, unit, test_date')
                    .eq('user_id', userId)
                    .order('test_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Marker,Value,Unit\n' + 
                    (data || []).map((b: any) => `${b.test_date},"${b.marker_name}",${b.value},${b.unit}`).join('\n')
            } else if (type === 'scores') {
                const { data } = await supabase
                    .from('subjective_scores')
                    .select('record_date, energy_score, focus_score, sleep_score')
                    .eq('user_id', userId)
                    .order('record_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Energy,Focus,Sleep\n' + 
                    (data || []).map((s: any) => `${s.record_date},${s.energy_score},${s.focus_score},${s.sleep_score}`).join('\n')
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.click()
            URL.revokeObjectURL(url)
            triggerToast(`${type.toUpperCase()} exported successfully.`)
        } catch (err) {
            console.error(err)
        }
        setIsExporting(null)
    }

    // Save profile details to Supabase
    const saveProfileData = async () => {
        if (!userId) return
        setSaveStatus('saving')
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    display_name: displayName,
                    username: userName,
                    bio: userBio
                })
            if (error) throw error
            setSaveStatus('saved')
            triggerToast('Profile account info saved!')
        } catch (err) {
            setSaveStatus('failed')
        }
    }

    // JSON Settings Backup & Restore Utility
    const triggerBackup = () => {
        const payload = {
            displayName,
            userName,
            userBio,
            accentColor,
            glassIntensity,
            animationSpeed,
            compactMode,
            roundedCorners,
            fontScale,
            aiPersonality,
            aiLength,
            aiDepth,
            riskTolerance,
            preferredGoal,
            dailySummaryTime,
            weeklySummaryDay,
            predictiveRecommendations,
            experimentalAI
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload))
        const link = document.createElement('a')
        link.setAttribute("href", dataStr)
        link.setAttribute("download", `suppsync_backup_${userName || 'profile'}.json`)
        link.click()
        triggerToast('JSON configuration backup downloaded.')
    }

    const triggerRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string)
                if (data.displayName) setDisplayName(data.displayName)
                if (data.userName) setUserName(data.userName)
                if (data.userBio) setUserBio(data.userBio)
                if (data.accentColor) setAccentColor(data.accentColor)
                if (data.glassIntensity) setGlassIntensity(data.glassIntensity)
                if (data.roundedCorners) setRoundedCorners(data.roundedCorners)
                if (data.fontScale) setFontScale(data.fontScale)
                if (data.compactMode !== undefined) setCompactMode(data.compactMode)
                if (data.aiPersonality) setAiPersonality(data.aiPersonality)
                if (data.aiLength) setAiLength(data.aiLength)
                if (data.aiDepth) setAiDepth(data.aiDepth)
                if (data.riskTolerance) setRisktolerance(data.riskTolerance)
                if (data.preferredGoal) setPreferredGoal(data.preferredGoal)
                
                triggerToast('Settings restored successfully!')
            } catch (err) {
                alert('Invalid JSON backup file.')
            }
        }
        reader.readAsText(file)
    }

    // Cache clearing action
    const clearStorageCache = () => {
        setStorageCache({
            cachedAI: 0,
            reports: 0,
            images: 0,
            progressPhotos: 0,
            wrappedCards: 0
        })
        triggerToast('Offline images and data caches purged.')
    }

    // Scroll to specific section smoothly
    const scrollToSection = (id: string) => {
        setActiveSection(id)
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Wearables simulator stats
    const [wearables, setWearables] = useState([
        { id: 'apple', name: 'Apple Health', connected: true, lastSync: '12 mins ago', battery: '85%' },
        { id: 'oura', name: 'Oura Ring', connected: true, lastSync: '1 hour ago', battery: '92%' },
        { id: 'whoop', name: 'WHOOP Strap', connected: true, lastSync: 'Just now', battery: '60%' },
        { id: 'fitbit', name: 'Fitbit Coach', connected: false, lastSync: 'N/A', battery: 'N/A' },
        { id: 'garmin', name: 'Garmin Connect', connected: false, lastSync: 'N/A', battery: 'N/A' }
    ])

    const toggleWearable = (id: string) => {
        setWearables(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, connected: !w.connected, lastSync: !w.connected ? 'Just now' : 'N/A', battery: !w.connected ? '100%' : 'N/A' }
            }
            return w
        }))
        triggerToast('Device connection updated.')
    }

    // All categories configuration list
    const CATEGORIES = [
        { id: 'account', label: 'Account Controls', icon: User, desc: 'Personal details and security credentials.' },
        { id: 'personalization', label: 'Profile Aesthetics', icon: Palette, desc: 'Configure themes and visible identity tags.' },
        { id: 'theme-studio', label: 'Theme Studio', icon: Sparkles, desc: 'Pixel adjustments for the layout structure.' },
        { id: 'ai-settings', label: 'AI Customizer', icon: Brain, desc: 'Tone, response scope, and coaching modes.' },
        { id: 'notifications', label: 'Alert Reminders', icon: Bell, desc: 'PWA notifications and reminder windows.' },
        { id: 'health', label: 'Health Preferences', icon: Heart, desc: 'Metric thresholds and timing rules.' },
        { id: 'supplements', label: 'Supplement Rules', icon: Pill, desc: 'Warnings, reminders, and barcode scanner defaults.' },
        { id: 'wearables', label: 'Connected Wearables', icon: Smartphone, desc: 'Apple Health, Garmin, Oura, WHOOP sync manager.' },
        { id: 'labs', label: 'Labs & Genetics', icon: FlaskConical, desc: 'PDF parse configurations and genetics records.' },
        { id: 'export', label: 'Data Hub Export', icon: Download, desc: 'Download CSV health logs and biomarkers.' },
        { id: 'backup', label: 'Backup & Restore', icon: Upload, desc: 'Export settings profiles as editable JSON files.' },
        { id: 'storage', label: 'Storage Manager', icon: Database, desc: 'Analyze caches and offline visual logs.' },
        { id: 'security', label: 'Security & Token Hub', icon: Lock, desc: 'API keys, active sessions, and data policies.' },
        { id: 'about', label: 'About SuppSync', icon: Info, desc: 'Roadmap logs, build date, and documentation links.' }
    ]

    // Real-time Search Filtering
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return CATEGORIES
        return CATEGORIES.filter(c => 
            c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery])

    // Match helper for highlighting search matches inside elements
    const isMatched = (text: string) => {
        if (!searchQuery) return false
        return text.toLowerCase().includes(searchQuery.toLowerCase())
    }

    if (!isMounted) return null

    // Get current Accent Class mapping
    const accentClass = ACCENT_COLORS.find(c => c.name === accentColor) || ACCENT_COLORS[0]

    return (
        <div 
            style={{ fontSize: `${fontScale}rem` }}
            className="flex min-h-screen flex-col lg:flex-row gap-8 px-4 sm:px-6 py-6 pb-32 select-none text-slate-100 max-w-7xl mx-auto w-full relative"
        >
            {/* FLOATING STATUS & AUTO-SAVE INDICATOR */}
            <div className="fixed top-6 right-6 z-50 bg-slate-950/80 backdrop-blur-md border border-white/[0.08] px-4 py-2 rounded-full flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                {saveStatus === 'saving' && (
                    <>
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span>Saving Changes...</span>
                    </>
                )}
                {saveStatus === 'saved' && (
                    <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                    </>
                )}
                {saveStatus === 'failed' && (
                    <>
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>Save Failed</span>
                    </>
                )}
            </div>

            {/* TOAST ALERT OVERLAY */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-28 left-1/2 z-[9999] bg-slate-950 border border-white/[0.12] px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl text-xs font-black uppercase tracking-wider text-slate-200"
                    >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEFT SIDEBAR: Sticky Nav + System Health Sync Panel */}
            <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-8 h-fit space-y-6">
                
                {/* Search OS input */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search settings... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/[0.08] focus:border-white/[0.18] rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Sidebar Sticky Scroll Selector */}
                <div className="hidden lg:block bg-slate-950/40 border border-white/[0.06] rounded-3xl p-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {filteredCategories.map(cat => {
                        const Icon = cat.icon
                        const isActive = activeSection === cat.id
                        return (
                            <button
                                key={cat.id}
                                onClick={() => scrollToSection(cat.id)}
                                className={cn(
                                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-bold uppercase tracking-wider select-none",
                                    isActive 
                                        ? "bg-white/[0.04] text-white border border-white/[0.06]" 
                                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.01] border border-transparent"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? accentClass.class.split(' ')[0] : "text-slate-500")} />
                                <span className="truncate">{cat.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* SYSTEM HEALTH SYNC STATUS CARD */}
                <div className="bg-slate-950/40 border border-white/[0.06] rounded-3xl p-5 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-white/[0.05] pb-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Health Sync Status</span>
                    </div>

                    <div className="space-y-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <div className="flex justify-between items-center">
                            <span>Supabase Node</span>
                            <span className="text-emerald-400 flex items-center"><Wifi className="w-3.5 h-3.5 mr-1" /> Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Gemini AI engine</span>
                            <span className="text-emerald-400 flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1" /> Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>PWA alerts</span>
                            <span className={cn(isPushEnabled ? 'text-emerald-400' : 'text-amber-400')}>
                                {isPushEnabled ? 'Enabled' : 'Not setup'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>DNA Lab catalogs</span>
                            <span className="text-emerald-400">Synced</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Data node index</span>
                            <span className="text-emerald-400">Healthy</span>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.05] pt-3 text-[8px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                        <span>Last backup: 2h ago</span>
                        <span>v2.7.1</span>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow space-y-8 max-w-4xl">
                
                {/* 1. QUICK ACTIONS HERO PANEL */}
                <div className="p-6 bg-gradient-to-br from-[#0c0c1b] via-slate-950 to-slate-950 border border-white/[0.06] rounded-[32px] space-y-4">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Quick Actions Dashboard</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[9px] font-black uppercase tracking-wider">
                        <button onClick={() => handleCsvExport('logs')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Download className="w-3.5 h-3.5 text-blue-400" />
                            <span>Export logs</span>
                        </button>
                        <button onClick={() => scrollToSection('export')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Wrapped PNG</span>
                        </button>
                        <button onClick={triggerBackup} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Backup JSON</span>
                        </button>
                        <button onClick={() => triggerToast('AI Health scan complete. 94% optimal.')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Brain className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI Health Scan</span>
                        </button>
                        <button onClick={() => triggerToast('Barcode scanner active on dashboard.')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                            <span>Scan barcode</span>
                        </button>
                        <button onClick={() => triggerToast('Subscription status: Verified Plus.')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Subscription</span>
                        </button>
                    </div>
                </div>

                {/* 2. THE DYNAMIC SETTINGS FORM CARDS */}
                <div className="space-y-8">
                    
                    {/* SECTION 1: ACCOUNT */}
                    <div 
                        ref={el => { sectionRefs.current['account'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('account') && !isMatched('display name') && !isMatched('username') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Account Details</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Primary profile information synced with Supabase</p>
                            </div>
                            <span className="text-[7px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Secure auth</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Display Name</label>
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                    placeholder="Biohacker display name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Username</label>
                                <input 
                                    type="text" 
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                    placeholder="Unique identifier tag"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Custom Bio</label>
                                <textarea 
                                    value={userBio}
                                    onChange={(e) => setUserBio(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all min-h-[70px] resize-y"
                                    placeholder="Write custom profile summary bio..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    disabled 
                                    className="w-full bg-slate-950/30 border border-white/[0.03] text-slate-500 rounded-xl px-3.5 py-2.5 text-xs cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                        placeholder="Update password credentials"
                                    />
                                    <button 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/[0.05]">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Signed in: {memberSince}</span>
                            <button 
                                onClick={saveProfileData}
                                className="bg-white hover:bg-slate-200 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center space-x-1.5"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save details</span>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 2: PROFILE PERSONALIZATION */}
                    <div 
                        ref={el => { sectionRefs.current['personalization'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('personalization') && !isMatched('accent') && !isMatched('visibility') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Profile Personalization</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Customize accent tags and details</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Accent Color Palette selector */}
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Accent Palette</label>
                                <div className="flex items-center space-x-3.5">
                                    {ACCENT_COLORS.map(color => (
                                        <button
                                            key={color.name}
                                            onClick={() => setAccentColor(color.name)}
                                            style={{ borderColor: color.name === accentColor ? color.color : 'transparent' }}
                                            className="w-10 h-10 rounded-full border-2 p-0.5 flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <span style={{ backgroundColor: color.color }} className="w-full h-full rounded-full" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Public Profile Visibility</span>
                                    <span className="text-[10px] text-slate-500 block">Allow anyone to view your biohacker identity page</span>
                                </div>
                                <button 
                                    onClick={() => setCompactMode(!compactMode)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        compactMode ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", compactMode ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: THEME STUDIO */}
                    <div 
                        ref={el => { sectionRefs.current['theme-studio'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('theme-studio') && !isMatched('rounded') && !isMatched('font') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Theme Studio</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Pixel adjustments for the workspace</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Glass Intensity</span>
                                    <span>{glassIntensity}% Opacity</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="40" 
                                    value={glassIntensity}
                                    onChange={(e) => setGlassIntensity(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Rounded Corners</span>
                                    <span>{roundedCorners}px Radius</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="4" 
                                    max="32" 
                                    value={roundedCorners}
                                    onChange={(e) => setRoundedCorners(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Font Scale Sizing</span>
                                    <span>{fontScale}x Factor</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.8" 
                                    max="1.2" 
                                    step="0.05"
                                    value={fontScale}
                                    onChange={(e) => setFontScale(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: AI SETTINGS */}
                    <div 
                        ref={el => { sectionRefs.current['ai-settings'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('ai') && !isMatched('coach') && !isMatched('gemini') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Coach Customizer</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Tweak Gemini response personalities</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">AI Personality</label>
                                <select 
                                    value={aiPersonality} 
                                    onChange={(e) => setAiPersonality(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    {['Hyper-Analytical', 'Motivator', 'Direct & Blunt', 'Academic Scientist', 'Balanced Clinical'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Scientific Depth</label>
                                <select 
                                    value={aiDepth} 
                                    onChange={(e) => setAiDepth(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    {['Beginner (No jargon)', 'Intermediate', 'Expert (Clinical focus)'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                    <span>AI Risk Tolerance</span>
                                    <span>{riskTolerance}% Tolerance</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={riskTolerance}
                                    onChange={(e) => setRisktolerance(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-between md:col-span-2 border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Enable Experimental AI Recommendations</span>
                                    <span className="text-[10px] text-slate-500 block">Deploy early-access LLM models for dosage predictions</span>
                                </div>
                                <button 
                                    onClick={() => setExperimentalAI(!experimentalAI)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        experimentalAI ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", experimentalAI ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: NOTIFICATIONS */}
                    <div 
                        ref={el => { sectionRefs.current['notifications'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('notifications') && !isMatched('push') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Alert Reminders</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control notification intervals</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isPushSupported ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-white block">System Push Reminders</span>
                                        <span className="text-[10px] text-slate-500 block">Remind dosage time via push alerts</span>
                                    </div>
                                    <button 
                                        onClick={togglePush}
                                        className={cn(
                                            "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                            isPushEnabled ? "bg-indigo-500" : "bg-slate-800"
                                        )}
                                    >
                                        <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", isPushEnabled ? "translate-x-6" : "translate-x-0")} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 uppercase font-black tracking-wider text-center py-2">
                                    Push alerts not supported in this browser environment.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 6: HEALTH PREFERENCES */}
                    <div 
                        ref={el => { sectionRefs.current['health'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('health') && !isMatched('preferences') && !isMatched('unit') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Health Preferences</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Set biological and timezone configs</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">System Units</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 border border-white/[0.08] rounded-xl text-center text-xs font-bold uppercase tracking-wider">
                                    <button className="py-1 bg-white/[0.06] rounded-lg text-white">Metric</button>
                                    <button className="py-1 text-slate-400 hover:text-white">Imperial</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Preferred health goals</label>
                                <input 
                                    type="text" 
                                    value={preferredGoal}
                                    onChange={(e) => setPreferredGoal(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 7: SUPPLEMENT RULES */}
                    <div 
                        ref={el => { sectionRefs.current['supplements'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('supplements') && !isMatched('rules') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Supplement Rules</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control warning threshold bounds</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-white block">Auto Interaction Warnings</span>
                                    <span className="text-[10px] text-slate-500 block">Flag safety alerts for overlapping supplement ingredients</span>
                                </div>
                                <button className="w-12 h-6 rounded-full p-1 bg-indigo-500">
                                    <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 8: CONNECTED WEARABLES */}
                    <div 
                        ref={el => { sectionRefs.current['wearables'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('wearables') && !isMatched('oura') && !isMatched('whoop') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Connected Wearables</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Sync state and diagnostic info</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {wearables.map(w => (
                                <div key={w.id} className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl flex flex-col justify-between space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-white block">{w.name}</span>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest mt-0.5 block", w.connected ? 'text-emerald-400' : 'text-slate-500')}>
                                                {w.connected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                        {w.connected && (
                                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                                                Battery: {w.battery}
                                            </span>
                                        )}
                                    </div>

                                    {w.connected && (
                                        <div className="text-[8px] uppercase tracking-wider text-slate-500 font-black">
                                            Last Sync: {w.lastSync}
                                        </div>
                                    )}

                                    <div className="flex space-x-2 text-[9px] font-black uppercase tracking-wider">
                                        <button 
                                            onClick={() => toggleWearable(w.id)}
                                            className={cn(
                                                "flex-1 h-9 rounded-xl border transition-all active:scale-95",
                                                w.connected 
                                                    ? 'border-red-500/20 text-red-400 hover:bg-red-500/5' 
                                                    : 'border-white/[0.06] text-white hover:bg-white/[0.03]'
                                            )}
                                        >
                                            {w.connected ? 'Disconnect' : 'Connect'}
                                        </button>
                                        {w.connected && (
                                            <button 
                                                onClick={() => {
                                                    triggerToast(`${w.name} synced successfully.`)
                                                    setWearables(prev => prev.map(item => item.id === w.id ? { ...item, lastSync: 'Just now' } : item))
                                                }}
                                                className="flex-1 h-9 bg-white hover:bg-slate-200 text-black rounded-xl transition-all active:scale-95"
                                            >
                                                Sync Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 9: LABS & GENETICS */}
                    <div 
                        ref={el => { sectionRefs.current['labs'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('labs') && !isMatched('genetics') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Labs & Genetics</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control DNA data permissions</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-white block">Automated PDF Parsing</span>
                                    <span className="text-[10px] text-slate-500 block">Extract uploaded lab draws values using OCR models</span>
                                </div>
                                <button className="w-12 h-6 rounded-full p-1 bg-indigo-500">
                                    <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 10: DATA HUB EXPORT */}
                    <div 
                        ref={el => { sectionRefs.current['export'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('export') && !isMatched('logs') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Data Hub Export</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Download logs and subjective score timeline charts</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-[10px] font-black uppercase tracking-wider">
                            {[
                                { id: 'logs', label: 'Supplement dosage logs', desc: 'Full dosage logs history' },
                                { id: 'biomarkers', label: 'Blood work biomarkers', desc: 'Mapped biomarker timeline values' },
                                { id: 'scores', label: 'Subjective wellness scores', desc: 'Daily subjective reports' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleCsvExport(item.id as any)}
                                    disabled={isExporting !== null}
                                    className="w-full h-12 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] px-4 rounded-xl flex items-center justify-between text-slate-300 transition-all active:scale-[0.99]"
                                >
                                    <div className="text-left">
                                        <span className="text-xs font-bold text-white block">{item.label}</span>
                                        <span className="text-[8px] text-slate-500 block">{item.desc}</span>
                                    </div>
                                    {isExporting === item.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                                    ) : (
                                        <Download className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 11: BACKUP & RESTORE */}
                    <div 
                        ref={el => { sectionRefs.current['backup'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('backup') && !isMatched('restore') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Backup & Restore</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Export settings profiles as JSON profiles</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-wider">
                            <button 
                                onClick={triggerBackup}
                                className="h-12 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 text-slate-200"
                            >
                                <Download className="w-4 h-4 text-emerald-400" />
                                <span>Backup Settings (JSON)</span>
                            </button>

                            <div className="relative h-12 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer">
                                <Upload className="w-4 h-4 text-blue-400" />
                                <span className="text-slate-200">Restore Settings (JSON)</span>
                                <input 
                                    type="file" 
                                    accept=".json"
                                    onChange={triggerRestore}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 12: STORAGE MANAGER */}
                    <div 
                        ref={el => { sectionRefs.current['storage'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('storage') && !isMatched('cache') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Storage Manager</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Analyze caches and offline assets</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                                    <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">Cached AI models</span>
                                    <span className="text-xs font-black text-white">{storageCache.cachedAI.toFixed(1)} MB</span>
                                </div>
                                <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                                    <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">Offline reports</span>
                                    <span className="text-xs font-black text-white">{storageCache.reports.toFixed(1)} MB</span>
                                </div>
                                <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl col-span-2 md:col-span-1">
                                    <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">Images & wrapped</span>
                                    <span className="text-xs font-black text-white">{(storageCache.images + storageCache.wrappedCards + storageCache.progressPhotos).toFixed(1)} MB</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                    Total Usage: {(storageCache.cachedAI + storageCache.reports + storageCache.images + storageCache.progressPhotos + storageCache.wrappedCards).toFixed(1)} MB
                                </span>
                                <button 
                                    onClick={clearStorageCache}
                                    className="border border-red-500/20 hover:bg-red-500/5 text-red-400 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center space-x-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear cached assets</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 13: SECURITY */}
                    <div 
                        ref={el => { sectionRefs.current['security'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('security') && !isMatched('token') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Security & API Hub</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control login sessions and developer credentials</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-white block">Two-Factor Authentication (2FA)</span>
                                    <span className="text-[10px] text-slate-500 block">Add passcode check during secure portal logins</span>
                                </div>
                                <button className="w-12 h-6 rounded-full p-1 bg-slate-800">
                                    <div className="w-4 h-4 rounded-full bg-white translate-x-0" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Developer Advanced Toggle</span>
                                    <span className="text-[10px] text-slate-500 block">Reveal local diagnostic and force-refresh triggers</span>
                                </div>
                                <button 
                                    onClick={() => setIsDevMode(!isDevMode)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        isDevMode ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", isDevMode ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>

                            {/* DESTRUCTIVE ACTION CONTAINER */}
                            <div className="border-t border-white/[0.05] pt-4 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-rose-500 block">Destructive Actions</span>
                                    <span className="text-[10px] text-slate-500 block">Remove or sign out from this account session</span>
                                </div>
                                
                                <div className="flex space-x-2">
                                    <form action="/auth/signout" method="POST">
                                        <button 
                                            type="submit"
                                            className="h-10 border border-white/[0.08] hover:border-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider px-4 transition-all flex items-center space-x-1.5"
                                        >
                                            <LogOut className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Sign Out</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DEVELOPER DIAGNOSTICS CARD (CONDITIONAL) */}
                    <AnimatePresence>
                        {isDevMode && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 rounded-[28px] border border-amber-500/20 bg-slate-950/40 space-y-6 overflow-hidden"
                            >
                                <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                                    <div className="flex items-center space-x-2">
                                        <Terminal className="w-4 h-4 text-amber-500" />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Developer Diagnostics</h3>
                                    </div>
                                    <span className="text-[7px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">Debug</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wider">
                                    <button 
                                        onClick={() => {
                                            localStorage.clear()
                                            triggerToast('Local storage state cleared.')
                                        }}
                                        className="h-10 border border-amber-500/20 hover:bg-amber-500/5 text-amber-400 rounded-xl transition-all"
                                    >
                                        Clear LocalStorage
                                    </button>
                                    <button 
                                        onClick={() => triggerToast('Tutorial flow initialized.')}
                                        className="h-10 border border-amber-500/20 hover:bg-amber-500/5 text-amber-400 rounded-xl transition-all"
                                    >
                                        Reset Onboarding
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SECTION 14: ABOUT */}
                    <div 
                        ref={el => { sectionRefs.current['about'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('about') && !isMatched('version') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">About SuppSync</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Project roadmap and documentation logs</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Version info</span>
                                    <span className="font-bold text-white block">v2.7.1 (OS Build 2026.07)</span>
                                    <span className="text-[10px] block">Build Date: July 13, 2026</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Active project repository</span>
                                    <a 
                                        href="https://github.com/DiwakerPandey21/Suppsync" 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-indigo-400 hover:underline flex items-center"
                                    >
                                        GitHub Repository <Share2 className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </div>

                            <div className="border-t border-white/[0.05] pt-4 grid grid-cols-3 gap-2.5 text-center text-[9px] font-black uppercase tracking-wider">
                                <a 
                                    href="/roadmap" 
                                    className="h-10 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-xl flex items-center justify-center transition-all text-slate-300"
                                >
                                    Roadmap
                                </a>
                                <a 
                                    href="/docs" 
                                    className="h-10 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-xl flex items-center justify-center transition-all text-slate-300"
                                >
                                    Documentation
                                </a>
                                <a 
                                    href="https://instagram.com/diwaker_pandey21" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-xl flex items-center justify-center transition-all text-slate-300"
                                >
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    )
}
