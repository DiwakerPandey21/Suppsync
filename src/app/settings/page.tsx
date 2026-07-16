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
    Eye, EyeOff, Save, Trash, FileText, Battery, Signal, Zap, Sliders,
    ShieldAlert, RefreshCcw, Layers, Clock, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Wearables OS 3.0 imports
import { getDeviceCatalog } from '@/lib/wearables/registry'
import { 
    WearableDevice, 
    ConnectionStatus, 
    DeviceHealthState, 
    SyncLogEntry, 
    ConflictResolutionPolicy,
    FirmwareStatus
} from '@/lib/wearables/types'
import { 
    DemoDeviceSimulator, 
    GenericBleAdapter, 
    CloudOauthConnector, 
    MobileBridgeConnector,
    isWebBluetoothSupported 
} from '@/lib/wearables/adapters'


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

    // Wearables OS 3.0 State Configuration
    const [activeDevices, setActiveDevices] = useState<WearableDevice[]>([])
    const [marketplaceSearch, setMarketplaceSearch] = useState('')
    const [marketplaceFilter, setMarketplaceFilter] = useState<'All' | 'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator'>('All')
    
    // Onboarding Wizard states
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
    const [wizardMethod, setWizardMethod] = useState<'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator' | null>(null)
    const [wizardSelectedDevice, setWizardSelectedDevice] = useState<WearableDevice | null>(null)
    const [wizardPermissions, setWizardPermissions] = useState<Record<string, boolean>>({})
    const [bleScanning, setBleScanning] = useState(false)
    const [bleScannedDevices, setBleScannedDevices] = useState<WearableDevice[]>([])
    const [wizardStatusText, setWizardStatusText] = useState('')
    const [wizardError, setWizardError] = useState<string | null>(null)

    // Detailed Device Modal
    const [activeDeviceForDetails, setActiveDeviceForDetails] = useState<WearableDevice | null>(null)
    
    // Conflict Policy & Logs
    const [conflictPolicy, setConflictPolicy] = useState<ConflictResolutionPolicy>('Preferred Device')
    const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([])
    const [syncLogFilter, setSyncLogFilter] = useState<'Today' | 'Week' | 'Month' | 'All'>('All')
    const [wearablesTab, setWearablesTab] = useState<'active' | 'marketplace' | 'metrics' | 'logs'>('active')

    // On Mount initialize pre-connected devices for dynamic UI display
    useEffect(() => {
        if (!isMounted) return
        const catalog = getDeviceCatalog()
        
        // Let's pre-connect a device simulator and an Apple Health bridge to show loaded state
        const initial = catalog.map(device => {
            if (device.id === 'device-simulator') {
                return {
                    ...device,
                    connectionStatus: 'Connected' as ConnectionStatus,
                    healthState: 'Excellent' as DeviceHealthState,
                    batteryLevel: 92,
                    firmwareVersion: 'v2.6.2',
                    latestFirmwareVersion: 'v2.6.2',
                    firmwareStatus: 'Up To Date' as FirmwareStatus,
                    lastFirmwareCheck: new Date().toLocaleDateString(),
                    rssi: 4,
                    connectionQuality: 'Excellent' as any,
                    lastSyncTime: '10:04 AM',
                    dataImportedCount: 142,
                    metrics: {
                        heartRate: 72,
                        hrv: 58,
                        bloodOxygen: 99,
                        bodyTemperature: 36.6,
                        sleepHours: 7.8,
                        recoveryScore: 84,
                        stressLevel: 25,
                        respirationRate: 14,
                        caloriesBurned: 450,
                        steps: 8420,
                        workoutMinutes: 45,
                        vo2Max: 48,
                        restingHeartRate: 58,
                        weight: 74.5
                    },
                    syncAnalytics: {
                        successRate: 100,
                        avgSyncTime: 1.8,
                        failedSyncCount: 0,
                        totalImports: 142,
                        todayImports: 12,
                        weeklyImports: 84,
                        monthlyImports: 142
                    }
                }
            }
            if (device.id === 'apple-health') {
                return {
                    ...device,
                    connectionStatus: 'Connected' as ConnectionStatus,
                    healthState: 'Good' as DeviceHealthState,
                    batteryLevel: 85,
                    firmwareVersion: 'v14.4.1',
                    latestFirmwareVersion: 'v14.4.1',
                    firmwareStatus: 'Up To Date' as FirmwareStatus,
                    lastFirmwareCheck: new Date().toLocaleDateString(),
                    connectionQuality: 'Good' as any,
                    lastSyncTime: '09:42 AM',
                    dataImportedCount: 512,
                    metrics: {
                        steps: 10245,
                        caloriesBurned: 620,
                        sleepHours: 7.2,
                        heartRate: 68,
                        hrv: 52
                    },
                    syncAnalytics: {
                        successRate: 98,
                        avgSyncTime: 3.4,
                        failedSyncCount: 4,
                        totalImports: 512,
                        todayImports: 3,
                        weeklyImports: 42,
                        monthlyImports: 512
                    }
                }
            }
            return device
        })
        setActiveDevices(initial)

        // Seed initial sync logs
        const initialLogs: SyncLogEntry[] = [
            { id: 'log-1', timestamp: '10:04 AM', deviceId: 'device-simulator', deviceName: 'SuppSync Simulator', eventType: 'Connected', description: 'Universal Simulator interface connected.' },
            { id: 'log-2', timestamp: '10:04 AM', deviceId: 'device-simulator', deviceName: 'SuppSync Simulator', eventType: 'Sleep Imported', description: 'Simulated Sleep data imported successfully (7.8 Hours).' },
            { id: 'log-3', timestamp: '09:42 AM', deviceId: 'apple-health', deviceName: 'Apple Health', eventType: 'Workout Synced', description: 'Steps & Workout activity imported from Companion App.' },
            { id: 'log-4', timestamp: '09:42 AM', deviceId: 'apple-health', deviceName: 'Apple Health', eventType: 'Permission Changed', description: 'Biomarkers syncing permission enabled.' }
        ]
        setSyncLogs(initialLogs)
    }, [isMounted])

    // Live Telemetry stream simulator
    useEffect(() => {
        if (!isMounted) return
        const interval = setInterval(() => {
            setActiveDevices(prev => prev.map(d => {
                if (d.connectionStatus === 'Connected' && (d.connectionType === 'Simulator' || d.connectionType === 'BLE')) {
                    const baseHr = d.metrics?.heartRate || 72
                    const delta = Math.floor(Math.random() * 5) - 2
                    const newHr = Math.max(55, Math.min(130, baseHr + delta))
                    const newHrv = Math.max(40, Math.min(110, (d.metrics?.hrv || 55) + (Math.random() > 0.5 ? 2 : -2)))
                    const newSteps = (d.metrics?.steps || 0) + (Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0)

                    // Add occasional timeline entry
                    if (Math.random() > 0.96) {
                        const newLog: SyncLogEntry = {
                            id: Math.random().toString(),
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            deviceId: d.id,
                            deviceName: d.name,
                            eventType: 'Sync Success',
                            description: `Live BPM metrics telemetry sync: ${newHr} BPM`
                        }
                        setSyncLogs(logs => [newLog, ...logs.slice(0, 20)])
                    }

                    return {
                        ...d,
                        metrics: {
                            ...d.metrics,
                            heartRate: newHr,
                            hrv: newHrv,
                            steps: newSteps
                        }
                    }
                }
                return d
            }))
        }, 1500)
        return () => clearInterval(interval)
    }, [isMounted])

    // Sync individual connected wearable device
    const handleDeviceSync = async (device: WearableDevice) => {
        setActiveDevices(prev => prev.map(d => d.id === device.id ? { ...d, healthState: 'Updating' } : d))
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)) // sync lag
            
            setActiveDevices(prev => prev.map(d => {
                if (d.id === device.id) {
                    const updatedCount = (d.dataImportedCount || 0) + (d.connectionType === 'Simulator' ? 12 : 1)
                    const updatedMetrics = { ...d.metrics }
                    if (d.connectionType === 'Simulator') {
                        updatedMetrics.heartRate = Math.floor(65 + Math.random() * 20)
                        updatedMetrics.hrv = Math.floor(55 + Math.random() * 15)
                        updatedMetrics.caloriesBurned = (updatedMetrics.caloriesBurned || 450) + Math.floor(Math.random() * 15)
                        updatedMetrics.steps = (updatedMetrics.steps || 8420) + Math.floor(Math.random() * 80)
                    }

                    return {
                        ...d,
                        healthState: 'Excellent' as DeviceHealthState,
                        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        dataImportedCount: updatedCount,
                        metrics: updatedMetrics
                    }
                }
                return d
            }))

            const newLog: SyncLogEntry = {
                id: Math.random().toString(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                deviceId: device.id,
                deviceName: device.name,
                eventType: 'Sync Success',
                description: `Successfully completed metrics upload diagnostics check.`
            }
            setSyncLogs(logs => [newLog, ...logs])
            triggerToast(`${device.name} synchronized successfully.`)
        } catch (err) {
            setActiveDevices(prev => prev.map(d => d.id === device.id ? { ...d, healthState: 'Error' } : d))
            triggerToast(`Sync failed for ${device.name}`)
        }
    }

    // Toggle individual device connection
    const handleDeviceDisconnect = (device: WearableDevice) => {
        setActiveDevices(prev => prev.map(d => {
            if (d.id === device.id) {
                return {
                    ...d,
                    connectionStatus: 'Disconnected' as ConnectionStatus,
                    healthState: 'Offline' as DeviceHealthState,
                    batteryLevel: undefined,
                    rssi: undefined,
                    metrics: undefined
                }
            }
            return d
        }))

        const newLog: SyncLogEntry = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            deviceId: device.id,
            deviceName: device.name,
            eventType: 'Disconnected',
            description: `Wearable connection channel closed by user.`
        }
        setSyncLogs(logs => [newLog, ...logs])
        triggerToast(`${device.name} disconnected successfully.`)
        if (activeDeviceForDetails?.id === device.id) {
            setActiveDeviceForDetails(null)
        }
    }

    // Aggregated telemetry values compiler
    const compiledMetrics = useMemo(() => {
        const metricsList = [
            { key: 'heartRate', label: 'Heart Rate', unit: 'BPM', icon: '❤', fallback: 72 },
            { key: 'hrv', label: 'HRV', unit: 'ms', icon: '⚡', fallback: 58 },
            { key: 'bloodOxygen', label: 'Blood Oxygen', unit: '%', icon: '🩺', fallback: 98 },
            { key: 'bodyTemperature', label: 'Body Temperature', unit: '°C', icon: '🌡', fallback: 36.6 },
            { key: 'sleepHours', label: 'Sleep Time', unit: 'hrs', icon: '💤', fallback: 7.5 },
            { key: 'recoveryScore', label: 'Recovery Score', unit: '%', icon: '📈', fallback: 80 },
            { key: 'stressLevel', label: 'Stress Index', unit: '/100', icon: '🧠', fallback: 25 },
            { key: 'respirationRate', label: 'Respiration Rate', unit: '/min', icon: '🌬', fallback: 14 },
            { key: 'caloriesBurned', label: 'Calories Burned', unit: 'kcal', icon: '🔥', fallback: 500 },
            { key: 'steps', label: 'Steps Taken', unit: 'steps', icon: '👣', fallback: 8500 },
            { key: 'workoutMinutes', label: 'Workout Time', unit: 'mins', icon: '⏱', fallback: 45 },
            { key: 'vo2Max', label: 'VO2 Max', unit: 'ml/kg', icon: '💨', fallback: 48 },
            { key: 'restingHeartRate', label: 'Resting HR', unit: 'BPM', icon: '📉', fallback: 58 }
        ]

        // Find connected devices
        const connected = activeDevices.filter(d => d.connectionStatus === 'Connected')

        return metricsList.map(m => {
            // Find all connected devices that support this metric, have permission enabled, and have a value
            const providers = connected.filter(d => 
                d.supportedMetrics.includes(m.label) && 
                d.permissions[m.label] !== false &&
                d.metrics?.[m.key as keyof typeof d.metrics] !== undefined
            )

            if (providers.length === 0) {
                return { ...m, value: 'N/A', source: 'None', trend: 'Neutral' }
            }

            let finalVal: number | string = 'N/A'
            let sourceDevice = 'N/A'

            if (conflictPolicy === 'Preferred Device') {
                // Sort by priorityOrder (lower is higher priority)
                const sorted = [...providers].sort((a, b) => a.priorityOrder - b.priorityOrder)
                const best = sorted[0]
                finalVal = best.metrics?.[m.key as keyof typeof best.metrics] as number
                sourceDevice = best.name
            } else if (conflictPolicy === 'Highest Value') {
                let maxVal = -1
                let maxDevice = 'N/A'
                providers.forEach(p => {
                    const val = p.metrics?.[m.key as keyof typeof p.metrics] as number
                    if (val > maxVal) {
                        maxVal = val
                        maxDevice = p.name
                    }
                })
                finalVal = maxVal
                sourceDevice = maxDevice
            } else if (conflictPolicy === 'Newest Reading') {
                // Mock sorting by newest (simulator is newest, followed by others)
                const sorted = [...providers].sort((a, b) => {
                    if (a.connectionType === 'Simulator') return -1
                    if (b.connectionType === 'Simulator') return 1
                    return 0
                })
                const best = sorted[0]
                finalVal = best.metrics?.[m.key as keyof typeof best.metrics] as number
                sourceDevice = best.name
            } else { // Merge Values (Average)
                let sum = 0
                let count = 0
                providers.forEach(p => {
                    const val = p.metrics?.[m.key as keyof typeof p.metrics] as number
                    sum += val
                    count++
                })
                finalVal = Math.round((sum / count) * 10) / 10
                sourceDevice = 'Merged Average'
            }

            // Determine trend indicator
            let trend = 'Neutral'
            if (typeof finalVal === 'number') {
                if (m.key === 'stressLevel') {
                    trend = finalVal > 40 ? 'Increase' : 'Decrease'
                } else {
                    trend = finalVal >= m.fallback ? 'Increase' : 'Decrease'
                }
            }

            return {
                ...m,
                value: finalVal,
                source: sourceDevice,
                trend
            }
        })
    }, [activeDevices, conflictPolicy])

    // Marketplace search and category filtering
    const filteredCatalog = useMemo(() => {
        const catalog = activeDevices
        return catalog.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) ||
                d.manufacturer.toLowerCase().includes(marketplaceSearch.toLowerCase())
            const matchesFilter = marketplaceFilter === 'All' || d.connectionType === marketplaceFilter
            return matchesSearch && matchesFilter
        })
    }, [activeDevices, marketplaceSearch, marketplaceFilter])

    // Onboarding wizard functions
    const startConnectionWizard = () => {
        setIsWizardOpen(true)
        setWizardStep(1)
        setWizardMethod(null)
        setWizardSelectedDevice(null)
        setWizardPermissions({})
        setBleScannedDevices([])
        setWizardError(null)
        setWizardStatusText('')
    }

    const handleWizardMethodSelect = (method: 'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator') => {
        setWizardMethod(method)
        setWizardStep(2)
        if (method === 'Simulator') {
            const catalog = getDeviceCatalog()
            const sim = catalog.find(d => d.id === 'device-simulator')
            if (sim) {
                setBleScannedDevices([sim])
            }
        } else if (method === 'BLE') {
            runBleScan()
        } else if (method === 'Cloud API') {
            const cloudDevices = getDeviceCatalog().filter(d => d.connectionType === 'Cloud API')
            setBleScannedDevices(cloudDevices)
        } else {
            const mobileDevices = getDeviceCatalog().filter(d => d.connectionType === 'Mobile Bridge')
            setBleScannedDevices(mobileDevices)
        }
    }

    const runBleScan = async () => {
        setBleScanning(true)
        setWizardStatusText('Scanning nearby BLE advertisements...')
        setWizardError(null)

        // Web Bluetooth check
        if (isWebBluetoothSupported()) {
            try {
                const bleDevices = getDeviceCatalog().filter(d => d.connectionType === 'BLE')
                setBleScannedDevices(bleDevices)
            } catch (err) {
                console.error(err)
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        const bleDevices = getDeviceCatalog().filter(d => d.connectionType === 'BLE')
        setBleScannedDevices(bleDevices)
        setBleScanning(false)
        setWizardStatusText('Found supported BLE profiles nearby.')
    }

    const handleWizardPairDevice = async (device: WearableDevice) => {
        setWizardSelectedDevice(device)
        setWizardStatusText(`Establishing connection to ${device.name}...`)
        
        try {
            if (device.connectionType === 'Simulator') {
                const adapter = new DemoDeviceSimulator(device)
                const connectedDevice = await adapter.connect()
                setWizardSelectedDevice(connectedDevice)
            } else if (device.connectionType === 'BLE') {
                if (isWebBluetoothSupported()) {
                    setWizardStatusText('Please select the device in the browser prompt...')
                    const adapter = new GenericBleAdapter(device)
                    const connectedDevice = await adapter.connect()
                    setWizardSelectedDevice(connectedDevice)
                } else {
                    setWizardStatusText('Unsupported browser for BLE. Simulating secure pairing...')
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    const connectedDevice = {
                        ...device,
                        connectionStatus: 'Connected' as ConnectionStatus,
                        healthState: 'Excellent' as DeviceHealthState,
                        batteryLevel: 88,
                        rssi: 3,
                        firmwareVersion: 'v1.0.8',
                        latestFirmwareVersion: 'v1.0.8',
                        firmwareStatus: 'Up To Date' as FirmwareStatus,
                        lastFirmwareCheck: new Date().toLocaleDateString(),
                        metrics: { heartRate: 74, hrv: 62 },
                        syncAnalytics: {
                            successRate: 100, avgSyncTime: 2.1, failedSyncCount: 0,
                            totalImports: 1, todayImports: 1, weeklyImports: 1, monthlyImports: 1
                        }
                    }
                    setWizardSelectedDevice(connectedDevice)
                }
            } else if (device.connectionType === 'Cloud API') {
                setWizardError('Future OAuth Integration Required. Backend client validation key missing. Authentic cloud pairing cannot be simulated.')
                return
            } else if (device.connectionType === 'Mobile Bridge') {
                setWizardError('Mobile Companion Required. Establish a sync channel through the SuppSync iOS/Android app to link HealthKit data.')
                return
            }

            const perms: Record<string, boolean> = {}
            device.supportedMetrics.forEach(m => {
                perms[m] = true
            })
            setWizardPermissions(perms)
            setWizardStep(3)
        } catch (err: any) {
            setWizardError(err.message || 'Connection failed. Please retry.')
        }
    }

    const handleWizardPermissionsSave = () => {
        if (!wizardSelectedDevice) return
        const deviceWithPerms = {
            ...wizardSelectedDevice,
            permissions: wizardPermissions
        }
        setWizardSelectedDevice(deviceWithPerms)
        setWizardStep(4)
    }

    const handleWizardComplete = () => {
        if (!wizardSelectedDevice) return
        
        setActiveDevices(prev => prev.map(d => d.id === wizardSelectedDevice.id ? wizardSelectedDevice : d))
        
        const newLog: SyncLogEntry = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            deviceId: wizardSelectedDevice.id,
            deviceName: wizardSelectedDevice.name,
            eventType: 'Connected',
            description: `${wizardSelectedDevice.name} connected successfully with ${Object.keys(wizardPermissions).filter(k => wizardPermissions[k]).length} active sync scopes.`
        }
        setSyncLogs(logs => [newLog, ...logs])
        setIsWizardOpen(false)
        triggerToast(`${wizardSelectedDevice.name} successfully paired!`)
    }

    // OTA firmware updater simulator
    const [otaDeviceUpdating, setOtaDeviceUpdating] = useState<string | null>(null)
    const [otaProgress, setOtaProgress] = useState(0)

    const triggerOtaUpdate = async (deviceId: string) => {
        setOtaDeviceUpdating(deviceId)
        setOtaProgress(0)

        for (let i = 0; i <= 100; i += 10) {
            setOtaProgress(i)
            await new Promise(resolve => setTimeout(resolve, 300))
        }

        setActiveDevices(prev => prev.map(d => {
            if (d.id === deviceId) {
                return {
                    ...d,
                    firmwareVersion: d.latestFirmwareVersion || 'v2.6.2',
                    firmwareStatus: 'Up To Date' as FirmwareStatus,
                    lastFirmwareCheck: new Date().toLocaleDateString(),
                    healthState: 'Excellent' as DeviceHealthState
                }
            }
            return d
        }))

        const device = activeDevices.find(d => d.id === deviceId)
        if (device) {
            const newLog: SyncLogEntry = {
                id: Math.random().toString(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                deviceId: deviceId,
                deviceName: device.name,
                eventType: 'Firmware Updated',
                description: `Successfully flashed OTA update to version ${device.latestFirmwareVersion || 'v2.6.2'}.`
            }
            setSyncLogs(logs => [newLog, ...logs])
            
            if (activeDeviceForDetails?.id === deviceId) {
                setActiveDeviceForDetails(prev => prev ? {
                    ...prev,
                    firmwareVersion: prev.latestFirmwareVersion || 'v2.6.2',
                    firmwareStatus: 'Up To Date',
                    lastFirmwareCheck: new Date().toLocaleDateString()
                } : null)
            }
        }

        setOtaDeviceUpdating(null)
        triggerToast('OTA Firmware update flashed successfully!')
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

                    {/* SECTION 8: CONNECTED WEARABLES OS 3.0 */}
                    <div 
                        ref={el => { sectionRefs.current['wearables'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('wearables') && !isMatched('oura') && !isMatched('whoop') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.05] pb-4 gap-4">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Wearables OS 3.0</h3>
                                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                                        Universal Platform
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Manage health adapters, BLE diagnostic services, and compiled data logs</p>
                            </div>
                            
                            {/* Tabs Navigation */}
                            <div className="flex bg-slate-950/80 p-1 border border-white/[0.08] rounded-xl text-[9px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => setWearablesTab('active')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'active' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Active ({activeDevices.filter(d => d.connectionStatus === 'Connected').length})
                                </button>
                                <button 
                                    onClick={() => setWearablesTab('marketplace')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'marketplace' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Marketplace
                                </button>
                                <button 
                                    onClick={() => setWearablesTab('metrics')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'metrics' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Telemetry
                                </button>
                                <button 
                                    onClick={() => setWearablesTab('logs')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'logs' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Logs & Resolvers
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: ACTIVE CONNECTED DEVICES */}
                        {wearablesTab === 'active' && (
                            <div className="space-y-4">
                                {activeDevices.filter(d => d.connectionStatus === 'Connected').length === 0 ? (
                                    <div className="p-8 border border-dashed border-white/[0.08] rounded-2xl text-center space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto text-slate-500">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-white block">No Connected Health Devices</span>
                                            <span className="text-[10px] text-slate-500 block mt-1">Pair devices in the marketplace to start compiling biometric telemetry.</span>
                                        </div>
                                        <button 
                                            onClick={startConnectionWizard}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Connect First Device
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeDevices.filter(d => d.connectionStatus === 'Connected').map(device => {
                                            const healthColors = {
                                                Excellent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                                                Good: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
                                                'Weak Signal': 'text-amber-400 border-amber-500/20 bg-amber-500/5',
                                                'Needs Sync': 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
                                                'Low Battery': 'text-orange-400 border-orange-500/20 bg-orange-500/5',
                                                Offline: 'text-slate-500 border-white/[0.04] bg-white/[0.01]',
                                                Updating: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
                                                Error: 'text-rose-400 border-rose-500/20 bg-rose-500/5'
                                            }

                                            return (
                                                <div 
                                                    key={device.id} 
                                                    className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-lg">
                                                                {device.logo}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-white block">{device.name}</span>
                                                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">
                                                                    {device.manufacturer} • {device.model}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end space-y-1">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border",
                                                                healthColors[device.healthState as keyof typeof healthColors]
                                                            )}>
                                                                {device.healthState}
                                                            </span>
                                                            {device.batteryLevel !== undefined && (
                                                                <span className="text-[8px] font-bold text-slate-500 flex items-center space-x-1">
                                                                    <Battery className="w-3 h-3 mr-0.5" /> {device.batteryLevel}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Diagnostics quick parameters */}
                                                    <div className="grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider font-black text-slate-500 bg-slate-950/30 p-2 rounded-xl border border-white/[0.03]">
                                                        <div>
                                                            Last Sync: <span className="text-white">{device.lastSyncTime || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            Imports: <span className="text-white">{device.dataImportedCount || 0}</span>
                                                        </div>
                                                        {device.rssi !== undefined && (
                                                            <div className="col-span-2 flex items-center justify-between mt-1 pt-1 border-t border-white/[0.02]">
                                                                <span>Signal Strength:</span>
                                                                <div className="flex items-end space-x-0.5">
                                                                    {[1, 2, 3, 4].map(bar => (
                                                                        <div 
                                                                            key={bar} 
                                                                            className={cn(
                                                                                "w-0.5 rounded-t-sm",
                                                                                bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : bar === 3 ? 'h-3.5' : 'h-4.5',
                                                                                (device.rssi || 0) >= bar ? 'bg-indigo-500' : 'bg-white/[0.08]'
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex space-x-2 text-[8px] font-black uppercase tracking-wider pt-2 border-t border-white/[0.04]">
                                                        <button 
                                                            onClick={() => setActiveDeviceForDetails(device)}
                                                            className="flex-1 h-8 rounded-xl border border-white/[0.06] text-white hover:bg-white/[0.03] transition-all active:scale-95 flex items-center justify-center space-x-1"
                                                        >
                                                            <Sliders className="w-3 h-3 mr-1 text-slate-400" /> Diagnostics
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeviceSync(device)}
                                                            disabled={device.healthState === 'Updating'}
                                                            className="flex-1 h-8 bg-white hover:bg-slate-200 text-black rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                                                        >
                                                            {device.healthState === 'Updating' ? (
                                                                <RefreshCcw className="w-3 h-3 animate-spin text-black" />
                                                            ) : (
                                                                <>
                                                                    <RefreshCcw className="w-3 h-3 mr-1" /> Sync Now
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: DEVICE MARKETPLACE */}
                        {wearablesTab === 'marketplace' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    {/* Search Box */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                        <input 
                                            type="text" 
                                            value={marketplaceSearch}
                                            onChange={(e) => setMarketplaceSearch(e.target.value)}
                                            placeholder="Search health devices, chest bands..."
                                            className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                        />
                                    </div>

                                    {/* Category Select Filters */}
                                    <div className="flex flex-wrap gap-1">
                                        {['All', 'BLE', 'Cloud API', 'Mobile Bridge', 'Simulator'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setMarketplaceFilter(cat as any)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all",
                                                    marketplaceFilter === cat 
                                                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                                        : 'border-white/[0.04] text-slate-500 hover:text-white'
                                                )}
                                            >
                                                {cat === 'BLE' ? 'Bluetooth' : cat === 'Cloud API' ? 'Cloud' : cat === 'Mobile Bridge' ? 'Mobile App' : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {filteredCatalog.map(device => {
                                        const isConnected = device.connectionStatus === 'Connected'
                                        return (
                                            <div 
                                                key={device.id} 
                                                className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/[0.08] transition-all duration-300"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-lg">
                                                            {device.logo}
                                                        </div>
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest border",
                                                            device.connectionType === 'BLE' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                                                            device.connectionType === 'Cloud API' ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                                                            device.connectionType === 'Mobile Bridge' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                                                            'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                                                        )}>
                                                            {device.connectionType === 'BLE' ? 'Bluetooth' : device.connectionType === 'Cloud API' ? 'OAuth Cloud' : device.connectionType === 'Mobile Bridge' ? 'Mobile Bridge' : 'Simulator'}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-xs font-bold text-white mt-3">{device.name}</h4>
                                                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider">{device.manufacturer}</p>
                                                    
                                                    {/* Supported metrics tags */}
                                                    <div className="flex flex-wrap gap-1 mt-2.5">
                                                        {device.supportedMetrics.slice(0, 3).map(m => (
                                                            <span key={m} className="bg-white/[0.02] text-[7px] text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.04]">
                                                                {m}
                                                            </span>
                                                        ))}
                                                        {device.supportedMetrics.length > 3 && (
                                                            <span className="bg-white/[0.02] text-[7px] text-slate-500 px-1 py-0.5 rounded">
                                                                +{device.supportedMetrics.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-white/[0.04] text-[8px] font-black uppercase tracking-wider">
                                                    {isConnected ? (
                                                        <button 
                                                            onClick={() => setActiveDeviceForDetails(device)}
                                                            className="w-full h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center justify-center space-x-1"
                                                        >
                                                            <span>Manage Connected</span>
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                startConnectionWizard()
                                                                // Fast-track wizard values if possible
                                                                setTimeout(() => {
                                                                    handleWizardMethodSelect(device.connectionType)
                                                                    setTimeout(() => {
                                                                        handleWizardPairDevice(device)
                                                                    }, 500)
                                                                }, 100)
                                                            }}
                                                            className="w-full h-8 rounded-xl bg-white hover:bg-slate-200 text-black transition-all flex items-center justify-center space-x-1"
                                                        >
                                                            <span>Connect Device</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TELEMETRY HEALTH METRICS */}
                        {wearablesTab === 'metrics' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {compiledMetrics.map(m => (
                                        <div 
                                            key={m.key} 
                                            className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex flex-col justify-between space-y-3 relative hover:border-white/[0.08] transition-all"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                                                <span className="text-xs">{m.icon}</span>
                                            </div>
                                            
                                            <div>
                                                <span className="text-lg font-black text-white">{m.value}</span>
                                                {m.value !== 'N/A' && (
                                                    <span className="text-[8px] font-bold text-slate-400 ml-1 uppercase">{m.unit}</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest pt-2 border-t border-white/[0.02]">
                                                {m.value !== 'N/A' ? (
                                                    <>
                                                        <span className="text-indigo-400 max-w-[80px] truncate">{m.source}</span>
                                                        <span className={cn(
                                                            m.trend === 'Increase' ? 'text-emerald-400' : 'text-slate-500'
                                                        )}>
                                                            {m.trend === 'Increase' ? '▲ Trend' : '▼ Steady'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-600">No active sources</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dynamic Conflict Resolution Setting */}
                                <div className="p-4 bg-slate-950/40 border border-white/[0.04] rounded-2xl space-y-3">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Sync Conflict Policy</h4>
                                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Determine priorities when multiple wearables track identical categories</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px] font-black uppercase tracking-wider">
                                        {[
                                            { id: 'Preferred Device', desc: 'Registry Priority' },
                                            { id: 'Newest Reading', desc: 'Latest Timestamp' },
                                            { id: 'Highest Value', desc: 'Maximum Value' },
                                            { id: 'Merge Values', desc: 'Average Merge' }
                                        ].map(policy => (
                                            <button
                                                key={policy.id}
                                                onClick={() => {
                                                    setConflictPolicy(policy.id as any)
                                                    triggerToast(`Conflict policy updated to: ${policy.id}`)
                                                }}
                                                className={cn(
                                                    "p-2 rounded-xl border text-center transition-all",
                                                    conflictPolicy === policy.id 
                                                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                                        : 'border-white/[0.04] text-slate-500 hover:bg-white/[0.01]'
                                                )}
                                            >
                                                <div className="font-black">{policy.id}</div>
                                                <div className="text-[6px] text-slate-500 font-bold mt-0.5">{policy.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DIAGNOSTIC LOGS & RESOLVERS */}
                        {wearablesTab === 'logs' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Sync Success Stats */}
                                <div className="space-y-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Sync Engine Analytics</h4>
                                    
                                    <div className="space-y-3 text-[9px] font-black uppercase tracking-wider">
                                        <div className="flex justify-between items-center border-b border-white/[0.02] pb-2">
                                            <span className="text-slate-500">Sync Success Rate</span>
                                            <span className="text-emerald-400 font-black">99.2%</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/[0.02] pb-2">
                                            <span className="text-slate-500">Avg Connection Latency</span>
                                            <span className="text-white">12.4ms</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white/[0.02] pb-2">
                                            <span className="text-slate-500">Active Adaptors Loaded</span>
                                            <span className="text-indigo-400">12 Interfaces</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Total Sync Attempts</span>
                                            <span className="text-white">654 Sessions</span>
                                        </div>
                                    </div>

                                    {/* Future production architecture display */}
                                    <div className="p-3 bg-slate-950/60 border border-white/[0.04] rounded-xl text-[7px] text-slate-500 space-y-1.5">
                                        <span className="font-black text-indigo-400 block uppercase tracking-widest">Future Sync Architecture</span>
                                        <div className="flex items-center space-x-1 font-bold">
                                            <span>Device</span>
                                            <span>→</span>
                                            <span>Connector Worker</span>
                                            <span>→</span>
                                            <span>Supabase</span>
                                            <span>→</span>
                                            <span>Dashboard</span>
                                        </div>
                                        <span className="block italic text-[6px]">Adapters are pre-configured to plug seamlessly into local client workers.</span>
                                    </div>
                                </div>

                                {/* Chronological Feed Logs */}
                                <div className="md:col-span-2 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Live Event Timeline</h4>
                                        
                                        {/* Filter */}
                                        <div className="flex bg-slate-950/80 p-0.5 border border-white/[0.06] rounded-lg text-[7px] font-black uppercase tracking-wider">
                                            {['All', 'Today', 'Week', 'Month'].map(logFilter => (
                                                <button
                                                    key={logFilter}
                                                    onClick={() => setSyncLogFilter(logFilter as any)}
                                                    className={cn("px-2 py-0.5 rounded", syncLogFilter === logFilter ? 'bg-white/[0.06] text-white' : 'text-slate-600')}
                                                >
                                                    {logFilter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                                        {syncLogs.length === 0 ? (
                                            <span className="text-[9px] uppercase tracking-wider text-slate-600 text-center block py-4">No events logged</span>
                                        ) : (
                                            syncLogs.map(log => (
                                                <div 
                                                    key={log.id} 
                                                    className="p-2.5 bg-slate-950/40 border border-white/[0.03] rounded-xl flex items-start space-x-2.5 text-[8px] tracking-wide"
                                                >
                                                    <span className="text-slate-500 font-bold mt-0.5 whitespace-nowrap">{log.timestamp}</span>
                                                    <div className="flex-1 space-y-0.5">
                                                        <div className="flex justify-between">
                                                            <span className="text-white font-bold">{log.deviceName}</span>
                                                            <span className={cn(
                                                                "font-black uppercase text-[7px] tracking-widest",
                                                                log.eventType === 'Connected' || log.eventType === 'Sync Success' ? 'text-indigo-400' :
                                                                log.eventType === 'Disconnected' ? 'text-red-400' :
                                                                'text-slate-400'
                                                            )}>
                                                                {log.eventType}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400">{log.description}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
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

            {/* MODALS GATEWAY: WEARABLES OS 3.0 */}
            <AnimatePresence>
                {/* 1. ONBOARDING CONNECTION WIZARD */}
                {isWizardOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-slate-950/90 border border-white/[0.08] p-6 rounded-[28px] max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden text-xs text-slate-400"
                        >
                            <button 
                                onClick={() => setIsWizardOpen(false)}
                                className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Add Health Device</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                    Step {wizardStep} of 4: {
                                        wizardStep === 1 ? 'Choose Interface' :
                                        wizardStep === 2 ? 'Discovery Scanner' :
                                        wizardStep === 3 ? 'Fine-grained Permissions' :
                                        'Confirmation Summary'
                                    }
                                </p>
                            </div>

                            {/* STEP 1: CHOOSE METHOD */}
                            {wizardStep === 1 && (
                                <div className="space-y-3">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Select device connectivity channel</span>
                                    <div className="grid grid-cols-1 gap-2 text-[9px] font-black uppercase tracking-wider">
                                        <button 
                                            onClick={() => handleWizardMethodSelect('BLE')}
                                            className="p-3 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl flex items-center space-x-3 text-left hover:border-blue-500/35 transition-all duration-300"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                                <Wifi className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-white block">Web Bluetooth (BLE)</span>
                                                <span className="text-[7px] text-slate-500 block font-medium mt-0.5">Pair real hardware sensors (Heart rate bands, Polar monitors)</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleWizardMethodSelect('Cloud API')}
                                            className="p-3 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl flex items-center space-x-3 text-left hover:border-purple-500/35 transition-all duration-300"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-white block">OAuth Cloud Connect</span>
                                                <span className="text-[7px] text-slate-500 block font-medium mt-0.5">Authorize Oura, WHOOP, or Garmin API cloud links</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleWizardMethodSelect('Mobile Bridge')}
                                            className="p-3 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl flex items-center space-x-3 text-left hover:border-orange-500/35 transition-all duration-300"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-white block">Mobile Companion Bridge</span>
                                                <span className="text-[7px] text-slate-500 block font-medium mt-0.5">Link OS integrations like Apple Health or Health Connect</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleWizardMethodSelect('Simulator')}
                                            className="p-3 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl flex items-center space-x-3 text-left hover:border-emerald-500/35 transition-all duration-300"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Terminal className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-white block">Developer Simulator</span>
                                                <span className="text-[7px] text-slate-500 block font-medium mt-0.5">Run simulated data telemetry pipelines for sandbox testing</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: DISCOVERY / BLE RADAR */}
                            {wizardStep === 2 && (
                                <div className="space-y-4">
                                    {wizardMethod === 'BLE' && (
                                        <div className="text-center">
                                            {/* Radar pulse rings */}
                                            <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-2">
                                                <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" />
                                                <div className="absolute inset-3 rounded-full border border-indigo-500/10 animate-pulse" />
                                                <div className="relative w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                                                    <Wifi className="w-6 h-6 animate-pulse" />
                                                </div>
                                            </div>

                                            {/* Unsupported Browser Alert Banner */}
                                            {!isWebBluetoothSupported() && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left flex items-start space-x-2 text-[9px] mb-4">
                                                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold text-amber-400 block">Unsupported Browser BLE Support</span>
                                                        <span className="text-[7px] text-slate-400">Firefox/Safari does not support Web Bluetooth APIs. Redirected automatically to Secure Emulation scan.</span>
                                                    </div>
                                                </div>
                                            )}

                                            <span className="text-[10px] font-bold text-slate-300 block">{wizardStatusText}</span>
                                        </div>
                                    )}

                                    {wizardError && (
                                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-2.5 text-[9px]">
                                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <span className="font-black text-rose-400 block uppercase tracking-wider">Interface Restriction</span>
                                                <p className="text-slate-400 leading-relaxed">{wizardError}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scan List Results */}
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Scanned Devices Directory</span>
                                        {bleScannedDevices.map(device => (
                                            <button 
                                                key={device.id}
                                                onClick={() => handleWizardPairDevice(device)}
                                                className="w-full p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl flex items-center justify-between text-left transition-all"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg">{device.logo}</span>
                                                    <div>
                                                        <span className="text-xs font-bold text-white block">{device.name}</span>
                                                        <span className="text-[7px] text-slate-500 uppercase font-black tracking-wider">{device.manufacturer}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {device.connectionType === 'BLE' && (
                                                        <div className="flex items-end space-x-0.5">
                                                            <div className="w-0.5 h-1 bg-indigo-500 rounded-t-sm" />
                                                            <div className="w-0.5 h-2 bg-indigo-500 rounded-t-sm" />
                                                            <div className="w-0.5 h-3 bg-indigo-500/30 rounded-t-sm" />
                                                            <div className="w-0.5 h-4 bg-indigo-500/30 rounded-t-sm" />
                                                        </div>
                                                    )}
                                                    <span className="bg-white/[0.04] text-[8px] font-black px-2.5 py-1.5 rounded-lg border border-white/[0.04] text-white">
                                                        Pair
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Back btn */}
                                    <button 
                                        onClick={() => setWizardStep(1)}
                                        className="w-full h-10 border border-white/[0.08] text-white rounded-xl font-bold uppercase tracking-wider text-[9px] hover:bg-white/[0.02]"
                                    >
                                        Back to Methods
                                    </button>
                                </div>
                            )}

                            {/* STEP 3: ADVANCED PERMISSIONS MANAGER */}
                            {wizardStep === 3 && wizardSelectedDevice && (
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Sync Scope Permissions</span>
                                        <h4 className="text-xs font-bold text-white mt-1">Configure {wizardSelectedDevice.name} permissions</h4>
                                        <p className="text-[7px] text-slate-500 mt-0.5">Allow SuppSync to access and process the following biomarkers categories</p>
                                    </div>

                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {wizardSelectedDevice.supportedMetrics.map(metric => (
                                            <label 
                                                key={metric}
                                                className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03]"
                                            >
                                                <span className="text-[10px] font-bold text-slate-300">{metric}</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!wizardPermissions[metric]}
                                                    onChange={() => setWizardPermissions(prev => ({ ...prev, [metric]: !prev[metric] }))}
                                                    className="w-4 h-4 accent-indigo-500 bg-slate-900 border-white/[0.08] rounded"
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={handleWizardPermissionsSave}
                                        className="w-full h-10 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-[9px] rounded-xl transition-all"
                                    >
                                        Save & Continue
                                    </button>
                                </div>
                            )}

                            {/* STEP 4: FINISH */}
                            {wizardStep === 4 && wizardSelectedDevice && (
                                <div className="space-y-5 text-center">
                                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white">{wizardSelectedDevice.name} Paired Successfully</h4>
                                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-1">
                                            Interface channel authenticated via {wizardSelectedDevice.connectionType}
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-950/60 border border-white/[0.04] rounded-2xl text-left text-[9px] font-black uppercase tracking-wider space-y-2">
                                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500">Signal Strength</span>
                                            <span className="text-white">{wizardSelectedDevice.rssi !== undefined ? `${wizardSelectedDevice.rssi}/4 RSSI` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500">Firmware status</span>
                                            <span className="text-white">{wizardSelectedDevice.firmwareVersion || 'v1.0.0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Active Permissions</span>
                                            <span className="text-indigo-400">
                                                {Object.keys(wizardPermissions).filter(k => wizardPermissions[k]).length} categories
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleWizardComplete}
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                                    >
                                        Add to Active Devices
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. DEVICE DETAILS DIAGNOSTICS MODAL */}
                {activeDeviceForDetails && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-slate-950/90 border border-white/[0.08] p-6 rounded-[28px] max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden text-xs text-slate-400"
                        >
                            <button 
                                onClick={() => setActiveDeviceForDetails(null)}
                                className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-2xl">
                                    {activeDeviceForDetails.logo}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">{activeDeviceForDetails.name}</h3>
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-0.5">
                                        {activeDeviceForDetails.manufacturer} • {activeDeviceForDetails.model}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                                {/* Left Side: Diagnostics and Telemetry */}
                                <div className="space-y-4">
                                    {/* Live Heart Rate Telemetry */}
                                    {activeDeviceForDetails.connectionStatus === 'Connected' && 
                                     activeDeviceForDetails.supportedMetrics.includes('Heart Rate') && 
                                     activeDeviceForDetails.metrics?.heartRate !== undefined && (
                                        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black text-white">{activeDeviceForDetails.metrics.heartRate}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 ml-1">BPM</span>
                                                </div>
                                            </div>
                                            <span className="text-[7px] font-black text-rose-400 flex items-center uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-ping" /> Live
                                            </span>
                                        </div>
                                    )}

                                    {/* General Stats Details */}
                                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl text-[9px] font-black uppercase tracking-wider space-y-2">
                                        <span className="text-[8px] font-black text-slate-500 block">Diagnostics Metrics</span>
                                        <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                            <span className="text-slate-500">Connection Mode</span>
                                            <span className="text-white">{activeDeviceForDetails.connectionType}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                            <span className="text-slate-500">Battery Level</span>
                                            <span className="text-white">{activeDeviceForDetails.batteryLevel !== undefined ? `${activeDeviceForDetails.batteryLevel}%` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                            <span className="text-slate-500">Signal RSSI</span>
                                            <span className="text-white">{activeDeviceForDetails.rssi !== undefined ? `-${100 - activeDeviceForDetails.rssi * 10} dBm` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Imports Success</span>
                                            <span className="text-emerald-400">99.8%</span>
                                        </div>
                                    </div>

                                    {/* OTA Firmware Check Card */}
                                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl text-[9px] font-black uppercase tracking-wider space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-slate-500 block">Firmware flash status</span>
                                            <span className={cn(
                                                "text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                                                activeDeviceForDetails.firmwareStatus === 'Up To Date' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                                            )}>
                                                {activeDeviceForDetails.firmwareStatus || 'Up To Date'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Active Build</span>
                                            <span className="text-white">{activeDeviceForDetails.firmwareVersion || 'v1.0.0'}</span>
                                        </div>
                                        
                                        {/* OTA update trigger if simulator/available */}
                                        {activeDeviceForDetails.firmwareStatus === 'Update Available' ? (
                                            <button 
                                                onClick={() => triggerOtaUpdate(activeDeviceForDetails.id)}
                                                disabled={otaDeviceUpdating === activeDeviceForDetails.id}
                                                className="w-full h-8 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-[8px] font-black uppercase tracking-wider mt-2 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {otaDeviceUpdating === activeDeviceForDetails.id ? `Flashing Update ${otaProgress}%` : 'Flash OTA Update'}
                                            </button>
                                        ) : (
                                            <span className="text-[7px] text-slate-500 block italic mt-1 text-right">Firmware is up to date.</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Permissions and Actions */}
                                <div className="space-y-4">
                                    {/* Permission Checklist */}
                                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-2.5">
                                        <span className="text-[8px] font-black text-slate-500 block uppercase tracking-widest">Scope Permissions</span>
                                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                                            {activeDeviceForDetails.supportedMetrics.map(metric => {
                                                const hasPerm = activeDevices.find(d => d.id === activeDeviceForDetails.id)?.permissions[metric] !== false
                                                return (
                                                    <label 
                                                        key={metric}
                                                        className="flex items-center justify-between p-1.5 bg-slate-950/40 border border-white/[0.02] rounded-xl cursor-pointer hover:bg-white/[0.02]"
                                                    >
                                                        <span className="text-[9px] font-bold text-slate-300">{metric}</span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={hasPerm}
                                                            onChange={() => {
                                                                setActiveDevices(prev => prev.map(d => {
                                                                    if (d.id === activeDeviceForDetails.id) {
                                                                        return {
                                                                            ...d,
                                                                            permissions: {
                                                                                ...d.permissions,
                                                                                [metric]: !d.permissions[metric]
                                                                            }
                                                                        }
                                                                    }
                                                                    return d
                                                                }))
                                                            }}
                                                            className="w-3.5 h-3.5 accent-indigo-500 bg-slate-900 border-white/[0.08] rounded"
                                                        />
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Sync Frequency Config */}
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-slate-500 block uppercase tracking-widest">Auto Sync Interval</span>
                                        <select 
                                            value={activeDeviceForDetails.syncFrequency}
                                            onChange={(e) => {
                                                const freq = e.target.value as any
                                                setActiveDevices(prev => prev.map(d => d.id === activeDeviceForDetails.id ? { ...d, syncFrequency: freq } : d))
                                            }}
                                            className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                                        >
                                            <option value="Manual">Manual Trigger</option>
                                            <option value="15m">Every 15 Minutes</option>
                                            <option value="30m">Every 30 Minutes</option>
                                            <option value="1h">Every 1 Hour</option>
                                            <option value="Daily">Daily Summary</option>
                                            <option value="WiFi-only">WiFi-Only Background</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Action footer */}
                            <div className="flex space-x-2 pt-4 border-t border-white/[0.04] text-[8px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => handleDeviceDisconnect(activeDeviceForDetails)}
                                    className="flex-1 h-10 border border-red-500/20 text-red-400 hover:bg-red-500/5 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                                >
                                    Disconnect Device
                                </button>
                                <button 
                                    onClick={() => handleDeviceSync(activeDeviceForDetails)}
                                    disabled={activeDeviceForDetails.healthState === 'Updating'}
                                    className="flex-1 h-10 bg-white hover:bg-slate-200 text-black rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {activeDeviceForDetails.healthState === 'Updating' ? (
                                        <RefreshCcw className="w-3.5 h-3.5 animate-spin text-black" />
                                    ) : (
                                        'Synchronize Telemetry'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
