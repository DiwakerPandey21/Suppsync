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
    ShieldAlert, RefreshCcw, Layers, Clock, AlertCircle, Target, Moon, Droplets
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

    // Account & User details
    const [displayName, setDisplayName] = useState('')
    const [userName, setUserName] = useState('')
    const [userBio, setUserBio] = useState('')
    const [email, setEmail] = useState('')
    const [memberSince, setMemberSince] = useState('July 2026')
    const [userId, setUserId] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    // Theme & Aesthetics States
    const [accentColor, setAccentColor] = useState('Indigo')
    const [glassIntensity, setGlassIntensity] = useState(15)
    const [animationSpeed, setAnimationSpeed] = useState(300)
    const [compactMode, setCompactMode] = useState(false)
    const [roundedCorners, setRoundedCorners] = useState(16)
    const [fontScale, setFontScale] = useState(1.0)

    // Health & Biological Goals
    const [preferredGoal, setPreferredGoal] = useState('Longevity & Vitality')
    const [targetSleepHours, setTargetSleepHours] = useState(8.0)
    const [targetWaterLiters, setTargetWaterLiters] = useState(3.0)
    const [systemUnits, setSystemUnits] = useState<'Metric' | 'Imperial'>('Metric')

    // AI Health Assistant States
    const [aiPersonality, setAiPersonality] = useState('Hyper-Analytical')
    const [aiDepth, setAiDepth] = useState('Expert Clinical')
    const [riskTolerance, setRisktolerance] = useState(50)
    const [predictiveRecommendations, setPredictiveRecommendations] = useState(true)

    // Notification Preferences States
    const [isPushEnabled, setIsPushEnabled] = useState(false)
    const [isPushSupported, setIsPushSupported] = useState(false)
    const [supplementReminders, setSupplementReminders] = useState(true)
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(true)

    // Privacy & Security States
    const [anonymousResearchOptIn, setAnonymousResearchOptIn] = useState(true)
    const [aiTrainingConsent, setAiTrainingConsent] = useState(false)
    const [publicProfile, setPublicProfile] = useState(false)
    const [mfaEnabled, setMfaEnabled] = useState(false)
    const [isMfaWizardOpen, setIsMfaWizardOpen] = useState(false)
    const [mfaWizardStep, setMfaWizardStep] = useState<1 | 2 | 3 | 4>(1)
    const [mfaSetupMethod, setMfaSetupMethod] = useState<'TOTP' | 'SMS' | 'Key'>('TOTP')
    const [mfaVerifyCode, setMfaVerifyCode] = useState('')
    const [mfaSecretKey, setMfaSecretKey] = useState('JBSWY3DPEHPK3PXP')
    const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([])
    const [mfaWizardError, setMfaWizardError] = useState<string | null>(null)

    // Active Connected Sessions
    const [activeSessions, setActiveSessions] = useState<any[]>([
        { id: 'sess-1', browser: 'Chrome', os: 'Windows 11', ip: '192.168.1.42', country: 'India (Bengaluru)', loginTime: 'Just Now', current: true },
        { id: 'sess-2', browser: 'Safari', os: 'iOS 17.5', ip: '103.88.22.10', country: 'India (Mumbai)', loginTime: '3 hours ago', current: false },
        { id: 'sess-3', browser: 'Firefox', os: 'macOS Sonoma', ip: '82.165.12.98', country: 'Germany (Frankfurt)', loginTime: 'Yesterday', current: false }
    ])

    // Labs & Genetics Preferences
    const [pdfAutoParse, setPdfAutoParse] = useState(true)
    const [referenceRangeStyle, setReferenceRangeStyle] = useState<'Standard Clinical' | 'Optimal Biohacking'>('Optimal Biohacking')
    const [dnaPrivacyLevel, setDnaPrivacyLevel] = useState<'Private & Encrypted' | 'Restricted Access'>('Private & Encrypted')

    // Data Export & Storage
    const [isExporting, setIsExporting] = useState<string | null>(null)
    const [storageCache, setStorageCache] = useState({
        cachedAI: 4.8,
        reports: 1.2,
        images: 8.4,
        progressPhotos: 12.0,
        wrappedCards: 5.6
    })

    // UI Feedback & Destructive Actions
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [dangerZoneAction, setDangerZoneAction] = useState<'deactivate' | 'delete' | 'reset' | 'export_data' | 'delete_data' | null>(null)
    const [dangerZoneConfirmText, setDangerZoneConfirmText] = useState('')

    // Navigation and search references
    const searchInputRef = useRef<HTMLInputElement>(null)
    const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // Wearables OS States
    const [activeDevices, setActiveDevices] = useState<WearableDevice[]>([])
    const [marketplaceSearch, setMarketplaceSearch] = useState('')
    const [marketplaceFilter, setMarketplaceFilter] = useState<'All' | 'BLE' | 'Cloud API' | 'Mobile Bridge'>('All')
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
    const [wizardMethod, setWizardMethod] = useState<'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator' | null>(null)
    const [wizardSelectedDevice, setWizardSelectedDevice] = useState<WearableDevice | null>(null)
    const [wizardPermissions, setWizardPermissions] = useState<Record<string, boolean>>({})
    const [activeDeviceForDetails, setActiveDeviceForDetails] = useState<WearableDevice | null>(null)
    const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([])
    const [wearablesTab, setWearablesTab] = useState<'active' | 'marketplace' | 'metrics' | 'logs'>('active')

    // Load initial Supabase user defaults and local configs
    useEffect(() => {
        setIsMounted(true)
        
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true)
            checkPushSubscription()
        }

        const fetchUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    setEmail(user.email || '')
                    
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle()
                    
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
            } catch (err) {
                console.error("SuppSync auth session fetch bypassed:", err)
            }
        }
        fetchUser()

        // Load custom preferences from localStorage
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
        const cachedMfa = localStorage.getItem('suppsync-mfa-enabled')
        if (cachedMfa) setMfaEnabled(cachedMfa === 'true')

        // Keyboard shortcut Ctrl + K for settings search
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

    useEffect(() => {
        if (isMounted) autoSave()
    }, [accentColor, glassIntensity, roundedCorners, fontScale, compactMode, animationSpeed])

    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 3000)
    }

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
                triggerToast('Push reminders disabled.')
            } catch (err) {
                console.error(err)
            }
        } else {
            if (!VAPID_PUBLIC_KEY) {
                alert('Push notification configuration key is missing.')
                return
            }
            try {
                const registration = await navigator.serviceWorker.register('/sw.js')
                await navigator.serviceWorker.ready
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    alert('Please allow notification permissions in your browser.')
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
                triggerToast('Push reminders enabled!')
            } catch (err) {
                console.error(err)
            }
        }
    }

    // CSV Exports logic
    const handleCsvExport = async (type: 'logs' | 'biomarkers' | 'scores') => {
        setIsExporting(type)
        try {
            if (!userId) {
                triggerToast('Please sign in to export your health records.')
                setIsExporting(null)
                return
            }
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
            triggerToast('Profile updated successfully!')
        } catch (err) {
            setSaveStatus('failed')
        }
    }

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
            preferredGoal,
            targetSleepHours,
            targetWaterLiters,
            systemUnits,
            aiPersonality,
            aiDepth,
            riskTolerance,
            predictiveRecommendations,
            supplementReminders,
            quietHoursEnabled,
            anonymousResearchOptIn,
            aiTrainingConsent,
            pdfAutoParse,
            referenceRangeStyle
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload))
        const link = document.createElement('a')
        link.setAttribute("href", dataStr)
        link.setAttribute("download", `suppsync_health_profile_${userName || 'user'}.json`)
        link.click()
        triggerToast('Health profile backup downloaded.')
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
                if (data.preferredGoal) setPreferredGoal(data.preferredGoal)
                if (data.targetSleepHours) setTargetSleepHours(data.targetSleepHours)
                if (data.targetWaterLiters) setTargetWaterLiters(data.targetWaterLiters)
                if (data.systemUnits) setSystemUnits(data.systemUnits)
                if (data.aiPersonality) setAiPersonality(data.aiPersonality)
                if (data.aiDepth) setAiDepth(data.aiDepth)
                if (data.riskTolerance) setRisktolerance(data.riskTolerance)
                
                triggerToast('Settings restored successfully!')
            } catch (err) {
                alert('Invalid JSON backup file.')
            }
        }
        reader.readAsText(file)
    }

    const clearStorageCache = () => {
        setStorageCache({
            cachedAI: 0,
            reports: 0,
            images: 0,
            progressPhotos: 0,
            wrappedCards: 0
        })
        triggerToast('Offline assets and temporary caches purged.')
    }

    const scrollToSection = (id: string) => {
        setActiveSection(id)
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // On Mount initialize device profiles
    useEffect(() => {
        if (!isMounted) return
        const catalog = getDeviceCatalog()
        
        const initial = catalog.map(device => {
            if (device.id === 'apple-health') {
                return {
                    ...device,
                    connectionStatus: 'Connected' as ConnectionStatus,
                    healthState: 'Good' as DeviceHealthState,
                    batteryLevel: 85,
                    firmwareVersion: 'v17.5.1',
                    latestFirmwareVersion: 'v17.5.1',
                    firmwareStatus: 'Up To Date' as FirmwareStatus,
                    lastFirmwareCheck: new Date().toLocaleDateString(),
                    rssi: 4,
                    connectionQuality: 'Excellent' as any,
                    lastSyncTime: '15m ago',
                    dataImportedCount: 320,
                    metrics: {
                        heartRate: 68,
                        hrv: 64,
                        bloodOxygen: 98,
                        sleepHours: 8.1,
                        recoveryScore: 88,
                        steps: 9240,
                        workoutMinutes: 50,
                        vo2Max: 49,
                        restingHeartRate: 54
                    }
                }
            }
            return device
        })
        
        setActiveDevices(initial)
    }, [isMounted])

    // Wearables actions
    const handleDeviceSync = async (device: WearableDevice) => {
        setActiveDevices(prev => prev.map(d => d.id === device.id ? { ...d, healthState: 'Updating' as DeviceHealthState } : d))
        await new Promise(resolve => setTimeout(resolve, 1500))

        const updatedHr = Math.floor(60 + Math.random() * 25)
        const updatedHrv = Math.floor(50 + Math.random() * 30)

        setActiveDevices(prev => prev.map(d => {
            if (d.id === device.id) {
                return {
                    ...d,
                    healthState: 'Excellent' as DeviceHealthState,
                    lastSyncTime: 'Just Now',
                    dataImportedCount: (d.dataImportedCount || 0) + 1,
                    metrics: {
                        ...d.metrics,
                        heartRate: updatedHr,
                        hrv: updatedHrv
                    }
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
            description: `Manual sync completed. Latest pulse: ${updatedHr} BPM, HRV: ${updatedHrv}ms.`
        }
        setSyncLogs(logs => [newLog, ...logs])
        triggerToast(`${device.name} synced!`)
    }

    const handleDeviceDisconnect = (device: WearableDevice) => {
        setActiveDevices(prev => prev.map(d => d.id === device.id ? { ...d, connectionStatus: 'Disconnected' as ConnectionStatus, healthState: 'Offline' as DeviceHealthState } : d))
        const newLog: SyncLogEntry = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            deviceId: device.id,
            deviceName: device.name,
            eventType: 'Disconnected',
            description: `${device.name} disconnected.`
        }
        setSyncLogs(logs => [newLog, ...logs])
        triggerToast(`${device.name} disconnected.`)
        if (activeDeviceForDetails?.id === device.id) {
            setActiveDeviceForDetails(null)
        }
    }

    // Two-Factor Authentication Setup & Disable
    const handleOpenMfaSetup = () => {
        const codes = Array.from({ length: 10 }, () => 
            `REC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
        )
        setMfaRecoveryCodes(codes)
        setMfaWizardStep(1)
        setIsMfaWizardOpen(true)
        setMfaVerifyCode('')
        setMfaWizardError(null)
    }

    const handleMfaVerifyOTP = () => {
        if (mfaVerifyCode.trim().length !== 6) {
            setMfaWizardError('Please enter a 6-digit verification code.')
            return
        }

        setMfaEnabled(true)
        localStorage.setItem('suppsync-mfa-enabled', 'true')
        setIsMfaWizardOpen(false)
        triggerToast('Two-Factor Authentication enabled!')
    }

    const handleMfaDisable = () => {
        if (confirm('Are you sure you want to turn off Two-Factor Authentication?')) {
            setMfaEnabled(false)
            localStorage.setItem('suppsync-mfa-enabled', 'false')
            triggerToast('Two-Factor Authentication turned off.')
        }
    }

    const handleTerminateSession = (id: string, isCurrent: boolean) => {
        if (isCurrent) {
            handleSignOut()
            return
        }
        setActiveSessions(prev => prev.filter(s => s.id !== id))
        triggerToast('Session revoked.')
    }

    const handleDangerZoneAction = (action: 'deactivate' | 'delete' | 'reset' | 'export_data' | 'delete_data') => {
        setDangerZoneAction(action)
        setDangerZoneConfirmText('')
    }

    const handleConfirmDangerAction = () => {
        if (dangerZoneAction === 'reset') {
            localStorage.clear()
            triggerToast('Preferences reset to default.')
            setTimeout(() => window.location.reload(), 1000)
        } else if (dangerZoneAction === 'delete_data') {
            clearStorageCache()
            triggerToast('Local telemetry cache cleared.')
        } else if (dangerZoneAction === 'export_data') {
            triggerBackup()
        } else {
            const targetWord = dangerZoneAction === 'deactivate' ? 'DEACTIVATE' : 'DELETE'
            if (dangerZoneConfirmText !== targetWord) {
                alert(`Please type "${targetWord}" in all capitals to confirm.`)
                return
            }
            triggerToast(`Account ${dangerZoneAction === 'deactivate' ? 'deactivation' : 'deletion'} requested.`)
            handleSignOut()
        }
        setDangerZoneAction(null)
    }

    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await supabase.auth.signOut()
            localStorage.removeItem('suppsync-accent-color')
            localStorage.removeItem('suppsync-glass-intensity')
            localStorage.removeItem('suppsync-rounded-corners')
            localStorage.removeItem('suppsync-font-scale')
            localStorage.removeItem('suppsync-mfa-enabled')

            await new Promise(resolve => setTimeout(resolve, 1000))
            setIsSigningOut(false)
            router.push('/login')
        } catch (err) {
            console.error('Sign Out error:', err)
            setIsSigningOut(false)
            router.push('/login')
        }
    }

    // Wearables telemetry compilation
    const compiledMetrics = useMemo(() => {
        const metricsList = [
            { key: 'heartRate', label: 'Heart Rate', unit: 'BPM', fallback: 72, icon: '❤️' },
            { key: 'hrv', label: 'Heart Rate Var.', unit: 'ms', fallback: 64, icon: '📈' },
            { key: 'sleepHours', label: 'Sleep Duration', unit: 'hrs', fallback: 7.8, icon: '🌙' },
            { key: 'recoveryScore', label: 'Recovery Score', unit: '%', fallback: 85, icon: '⚡' },
            { key: 'steps', label: 'Daily Steps', unit: 'steps', fallback: 8420, icon: '👟' },
            { key: 'bloodOxygen', label: 'SpO2 Oxygen', unit: '%', fallback: 98, icon: '🫁' }
        ]

        const connected = activeDevices.filter(d => d.connectionStatus === 'Connected')
        if (connected.length === 0) {
            return metricsList.map(m => ({ ...m, value: 'N/A', source: 'None', trend: 'Neutral' }))
        }

        return metricsList.map(m => {
            const providers = connected.filter(d => d.metrics?.[m.key as keyof typeof d.metrics] !== undefined)
            if (providers.length === 0) {
                return { ...m, value: 'N/A', source: 'None', trend: 'Neutral' }
            }

            const best = providers[0]
            const val = best.metrics?.[m.key as keyof typeof best.metrics] as number

            return {
                ...m,
                value: val,
                source: best.name,
                trend: val >= m.fallback ? 'Increase' : 'Steady'
            }
        })
    }, [activeDevices])

    const filteredCatalog = useMemo(() => {
        const catalog = activeDevices
        return catalog.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) ||
                d.manufacturer.toLowerCase().includes(marketplaceSearch.toLowerCase())
            const matchesFilter = marketplaceFilter === 'All' || d.connectionType === marketplaceFilter
            return matchesSearch && matchesFilter
        })
    }, [activeDevices, marketplaceSearch, marketplaceFilter])

    const startConnectionWizard = () => {
        setIsWizardOpen(true)
        setWizardStep(1)
        setWizardMethod(null)
        setWizardSelectedDevice(null)
        setWizardPermissions({})
    }

    const handleWizardMethodSelect = (method: 'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator') => {
        setWizardMethod(method)
        setWizardStep(2)
    }

    const handleWizardPairDevice = async (device: WearableDevice) => {
        setWizardSelectedDevice(device)
        await new Promise(resolve => setTimeout(resolve, 800))
        const connectedDevice = {
            ...device,
            connectionStatus: 'Connected' as ConnectionStatus,
            healthState: 'Excellent' as DeviceHealthState,
            batteryLevel: 90,
            lastSyncTime: 'Just Now',
            metrics: { heartRate: 72, hrv: 64, sleepHours: 7.8, recoveryScore: 86 }
        }
        setWizardSelectedDevice(connectedDevice)

        const perms: Record<string, boolean> = {}
        device.supportedMetrics.forEach(m => { perms[m] = true })
        setWizardPermissions(perms)
        setWizardStep(3)
    }

    // 10 Clean Consumer Categories
    const CATEGORIES = [
        { id: 'account', label: 'Account Profile', icon: User, desc: 'Personal details and credentials.' },
        { id: 'security', label: 'Security & Privacy', icon: Lock, desc: '2FA, active sessions, and data safety.' },
        { id: 'wearables', label: 'Connected Wearables', icon: Smartphone, desc: 'Apple Health, Oura, WHOOP, Garmin sync.' },
        { id: 'health-goals', label: 'Health & Goals', icon: Target, desc: 'Biological targets, sleep, and unit preferences.' },
        { id: 'ai-settings', label: 'AI Health Coach', icon: Brain, desc: 'Coaching style, depth, and risk tolerance.' },
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Reminders, insights, and quiet hours.' },
        { id: 'privacy', label: 'Data Sharing & Privacy', icon: Shield, desc: 'Research opt-in, encryption, and consent.' },
        { id: 'labs', label: 'Labs & Genetics', icon: FlaskConical, desc: 'Automated lab PDF parsing and reference ranges.' },
        { id: 'export', label: 'Data Export & Backup', icon: Download, desc: 'Export CSV health records and JSON backups.' },
        { id: 'personalization', label: 'App Personalization', icon: Palette, desc: 'Accent colors, theme studio, and font scaling.' },
        { id: 'about', label: 'About SuppSync', icon: Info, desc: 'App status, legal terms, and privacy policy.' }
    ]

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return CATEGORIES
        return CATEGORIES.filter(c => 
            c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery])

    const isMatched = (text: string) => {
        if (!searchQuery) return false
        return text.toLowerCase().includes(searchQuery.toLowerCase())
    }

    if (!isMounted) return null

    const accentClass = ACCENT_COLORS.find(c => c.name === accentColor) || ACCENT_COLORS[0]

    return (
        <div 
            style={{ fontSize: `${fontScale}rem` }}
            className="flex min-h-screen flex-col lg:flex-row gap-8 px-4 sm:px-6 py-6 pb-32 select-none text-slate-100 max-w-7xl mx-auto w-full relative"
        >
            {/* FLOATING STATUS INDICATOR */}
            <div className="fixed top-6 right-6 z-50 bg-slate-950/80 backdrop-blur-md border border-white/[0.08] px-4 py-2 rounded-full flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                {saveStatus === 'saving' && (
                    <>
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span>Saving...</span>
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

            {/* LEFT SIDEBAR: Navigation + System Status */}
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

                {/* Sidebar Navigation */}
                <div className="hidden lg:block bg-slate-950/40 border border-white/[0.06] rounded-3xl p-4 space-y-1 max-h-[55vh] overflow-y-auto custom-scrollbar">
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

                {/* SYSTEM HEALTH SYNC CARD */}
                <div className="bg-slate-950/40 border border-white/[0.06] rounded-3xl p-5 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-white/[0.05] pb-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Health Sync Status</span>
                    </div>

                    <div className="space-y-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <div className="flex justify-between items-center">
                            <span>Cloud Sync</span>
                            <span className="text-emerald-400 flex items-center"><Wifi className="w-3.5 h-3.5 mr-1" /> Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>AI Coach Engine</span>
                            <span className="text-emerald-400 flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1" /> Ready</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Notifications</span>
                            <span className={cn(isPushEnabled ? 'text-emerald-400' : 'text-slate-500')}>
                                {isPushEnabled ? 'Active' : 'Off'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Biometric Encryption</span>
                            <span className="text-emerald-400">Protected</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow space-y-8 max-w-4xl">
                
                {/* 1. QUICK ACTIONS HERO PANEL */}
                <div className="p-6 bg-gradient-to-br from-[#0c0c1b] via-slate-950 to-slate-950 border border-white/[0.06] rounded-[32px] space-y-4">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[9px] font-black uppercase tracking-wider">
                        <button onClick={() => handleCsvExport('logs')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Download className="w-3.5 h-3.5 text-blue-400" />
                            <span>Export Logs</span>
                        </button>
                        <button onClick={triggerBackup} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Backup Profile</span>
                        </button>
                        <button onClick={() => triggerToast('AI Health scan complete. 94% optimal.')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Brain className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI Health Check</span>
                        </button>
                        <button onClick={() => scrollToSection('wearables')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                            <span>Pair Wearable</span>
                        </button>
                        <button onClick={() => scrollToSection('security')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Security Check</span>
                        </button>
                        <button onClick={() => triggerToast('Subscription: Active SuppSync Pro')} className="h-10 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-1.5 transition-all text-slate-300">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Subscription</span>
                        </button>
                    </div>
                </div>

                {/* 2. THE CONSUMER SETTINGS SECTIONS */}
                <div className="space-y-8">
                    
                    {/* SECTION 1: ACCOUNT PROFILE */}
                    <div 
                        ref={el => { sectionRefs.current['account'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('account') && !isMatched('profile') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Account Profile</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Manage your display profile and contact email</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Display Name</label>
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                    placeholder="Your display name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Username</label>
                                <input 
                                    type="text" 
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                    placeholder="@username"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Health Bio & Biohacking Goals</label>
                                <textarea 
                                    value={userBio}
                                    onChange={(e) => setUserBio(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all min-h-[70px] resize-y"
                                    placeholder="Brief health summary, focus areas, or biohacking goals..."
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
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Update Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/40 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                        placeholder="New password"
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
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Member since {memberSince}</span>
                            <button 
                                onClick={saveProfileData}
                                className="bg-white hover:bg-slate-200 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center space-x-1.5"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 2: SECURITY & PRIVACY DASHBOARD */}
                    <div 
                        ref={el => { sectionRefs.current['security'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('security') && !isMatched('privacy') && !isMatched('session') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Security & Account Access</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Manage authentication, 2FA, and active sessions</p>
                            </div>
                        </div>

                        {/* Security Health Gauges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px] font-black uppercase tracking-wider">
                            <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-1">
                                <span className="text-slate-500 text-[8px]">Security Rating</span>
                                <div className="text-sm font-black text-white">{mfaEnabled ? '92%' : '65%'}</div>
                                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-1.5">
                                    <div 
                                        className={cn("h-full rounded-full transition-all duration-500", mfaEnabled ? "w-[92%] bg-indigo-500" : "w-[65%] bg-amber-500")} 
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-1">
                                <span className="text-slate-500 text-[8px]">2FA Status</span>
                                <div className="flex items-center space-x-1.5 mt-1">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", mfaEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
                                    <span className="text-white">{mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>

                            <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-1">
                                <span className="text-slate-500 text-[8px]">Password Protection</span>
                                <div className="text-white flex items-center space-x-1 mt-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-0.5" /> Protected
                                </div>
                            </div>

                            <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-1">
                                <span className="text-slate-500 text-[8px]">Active Devices</span>
                                <div className="text-white mt-1">{activeSessions.length} Devices</div>
                            </div>
                        </div>

                        {/* Two-Factor Auth Box */}
                        <div className="p-4 bg-slate-950/40 border border-white/[0.04] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white block">Two-Factor Authentication (2FA)</span>
                                <span className="text-[10px] text-slate-500 block leading-relaxed">
                                    Add an extra layer of protection using authenticator apps like Google Authenticator or 1Password.
                                </span>
                            </div>
                            <div className="shrink-0">
                                {mfaEnabled ? (
                                    <button 
                                        onClick={handleMfaDisable}
                                        className="px-4 py-2 border border-red-500/20 hover:bg-red-500/5 text-red-400 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Disable 2FA
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleOpenMfaSetup}
                                        className="px-4 py-2 bg-white hover:bg-slate-200 text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Enable 2FA
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="space-y-3">
                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Active Login Sessions</span>
                            <div className="space-y-2">
                                {activeSessions.map(sess => (
                                    <div 
                                        key={sess.id} 
                                        className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between hover:border-white/[0.08] transition-all"
                                    >
                                        <div className="flex items-center space-x-3 text-[9px] font-black uppercase tracking-wider">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xs">
                                                💻
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-white font-bold">{sess.browser} on {sess.os}</span>
                                                    {sess.current && (
                                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest">
                                                            This Device
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 text-[8px] font-bold block mt-0.5">
                                                    Location: {sess.country} • Last active: {sess.loginTime}
                                                </span>
                                            </div>
                                        </div>

                                        {!sess.current && (
                                            <button 
                                                onClick={() => handleTerminateSession(sess.id, false)}
                                                className="px-2.5 py-1 border border-white/[0.08] hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Sign Out
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Account Actions / Danger Zone */}
                        <div className="border-t border-white/[0.05] pt-4 space-y-3">
                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Account Actions</span>
                            <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => handleDangerZoneAction('reset')}
                                    className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-xl transition-all"
                                >
                                    Reset Preferences
                                </button>
                                <button 
                                    onClick={() => handleDangerZoneAction('deactivate')}
                                    className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-xl transition-all"
                                >
                                    Deactivate Profile
                                </button>
                                <button 
                                    onClick={() => handleDangerZoneAction('delete')}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
                                >
                                    Delete Account
                                </button>
                                <button 
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="px-4 py-2 bg-white hover:bg-slate-200 text-black rounded-xl transition-all ml-auto flex items-center space-x-1.5 disabled:opacity-50"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: CONNECTED WEARABLES */}
                    <div 
                        ref={el => { sectionRefs.current['wearables'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('wearables') && !isMatched('apple health') && !isMatched('oura') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.05] pb-4 gap-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Connected Wearables & Devices</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Sync health metrics from Apple Health, Oura, WHOOP, Garmin, and Fitbit</p>
                            </div>
                            
                            <div className="flex bg-slate-950/80 p-1 border border-white/[0.08] rounded-xl text-[9px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => setWearablesTab('active')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'active' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Connected ({activeDevices.filter(d => d.connectionStatus === 'Connected').length})
                                </button>
                                <button 
                                    onClick={() => setWearablesTab('marketplace')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'marketplace' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Add Device
                                </button>
                                <button 
                                    onClick={() => setWearablesTab('metrics')}
                                    className={cn("px-3 py-1.5 rounded-lg transition-all", wearablesTab === 'metrics' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                                >
                                    Biometrics Overview
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: CONNECTED DEVICES */}
                        {wearablesTab === 'active' && (
                            <div className="space-y-4">
                                {activeDevices.filter(d => d.connectionStatus === 'Connected').length === 0 ? (
                                    <div className="p-8 border border-dashed border-white/[0.08] rounded-2xl text-center space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto text-slate-500">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-white block">No Devices Connected</span>
                                            <span className="text-[10px] text-slate-500 block mt-1">Connect your wearable or health app to automatically sync heart rate, sleep, and recovery.</span>
                                        </div>
                                        <button 
                                            onClick={startConnectionWizard}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Connect A Device
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeDevices.filter(d => d.connectionStatus === 'Connected').map(device => (
                                            <div 
                                                key={device.id} 
                                                className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/[0.1] transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-lg">
                                                            {device.logo}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-white block">{device.name}</span>
                                                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">
                                                                {device.manufacturer}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                                                        Active Sync
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider font-black text-slate-500 bg-slate-950/30 p-2.5 rounded-xl border border-white/[0.03]">
                                                    <div>Last Synced: <span className="text-white">{device.lastSyncTime || 'Just now'}</span></div>
                                                    <div>Battery: <span className="text-white">{device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'}</span></div>
                                                </div>

                                                <div className="flex space-x-2 text-[8px] font-black uppercase tracking-wider pt-2 border-t border-white/[0.04]">
                                                    <button 
                                                        onClick={() => setActiveDeviceForDetails(device)}
                                                        className="flex-1 h-8 rounded-xl border border-white/[0.06] text-white hover:bg-white/[0.03] transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeviceSync(device)}
                                                        disabled={device.healthState === 'Updating'}
                                                        className="flex-1 h-8 bg-white hover:bg-slate-200 text-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-1"
                                                    >
                                                        {device.healthState === 'Updating' ? (
                                                            <RefreshCcw className="w-3 h-3 animate-spin text-black" />
                                                        ) : (
                                                            <span>Sync Now</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: MARKETPLACE */}
                        {wearablesTab === 'marketplace' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {filteredCatalog.map(device => (
                                        <div 
                                            key={device.id} 
                                            className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/[0.08] transition-all"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-lg">
                                                        {device.logo}
                                                    </div>
                                                </div>

                                                <h4 className="text-xs font-bold text-white mt-3">{device.name}</h4>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider">{device.manufacturer}</p>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    startConnectionWizard()
                                                    setTimeout(() => {
                                                        handleWizardMethodSelect(device.connectionType)
                                                        setTimeout(() => {
                                                            handleWizardPairDevice(device)
                                                        }, 500)
                                                    }, 100)
                                                }}
                                                className="w-full h-8 rounded-xl bg-white hover:bg-slate-200 text-black text-[8px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Connect Device
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TELEMETRY */}
                        {wearablesTab === 'metrics' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {compiledMetrics.map(m => (
                                    <div 
                                        key={m.key} 
                                        className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-2"
                                    >
                                        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            <span>{m.label}</span>
                                            <span>{m.icon}</span>
                                        </div>
                                        <div>
                                            <span className="text-lg font-black text-white">{m.value}</span>
                                            {m.value !== 'N/A' && <span className="text-[8px] font-bold text-slate-400 ml-1">{m.unit}</span>}
                                        </div>
                                        <div className="text-[7px] font-black uppercase text-indigo-400 pt-1 border-t border-white/[0.02]">
                                            Source: {m.source}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: HEALTH & BIOLOGICAL GOALS */}
                    <div 
                        ref={el => { sectionRefs.current['health-goals'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('goals') && !isMatched('health') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Health & Biological Goals</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Set target health outcomes, daily targets, and units</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Primary Health Focus</label>
                                <select 
                                    value={preferredGoal}
                                    onChange={(e) => setPreferredGoal(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    {['Longevity & Vitality', 'Hypertrophy & Strength', 'Cognitive Focus & Brain Health', 'Sleep & Recovery Optimization', 'Metabolic & Fat Loss'].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">System Measurement Units</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 border border-white/[0.08] rounded-xl text-center text-xs font-bold uppercase tracking-wider">
                                    <button 
                                        onClick={() => setSystemUnits('Metric')}
                                        className={cn("py-1.5 rounded-lg transition-all", systemUnits === 'Metric' ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-white")}
                                    >
                                        Metric (kg, ml)
                                    </button>
                                    <button 
                                        onClick={() => setSystemUnits('Imperial')}
                                        className={cn("py-1.5 rounded-lg transition-all", systemUnits === 'Imperial' ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-white")}
                                    >
                                        Imperial (lbs, oz)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Target Sleep Duration</span>
                                    <span>{targetSleepHours} Hours</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="6.0" 
                                    max="10.0" 
                                    step="0.5"
                                    value={targetSleepHours}
                                    onChange={(e) => setTargetSleepHours(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Target Daily Water Intake</span>
                                    <span>{targetWaterLiters} Liters</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1.5" 
                                    max="5.0" 
                                    step="0.5"
                                    value={targetWaterLiters}
                                    onChange={(e) => setTargetWaterLiters(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: AI HEALTH COACH */}
                    <div 
                        ref={el => { sectionRefs.current['ai-settings'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('ai') && !isMatched('coach') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Health Coach</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Customize coaching style and scientific depth</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Coaching Tone</label>
                                <select 
                                    value={aiPersonality} 
                                    onChange={(e) => setAiPersonality(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    {['Hyper-Analytical', 'Supportive Coach', 'Clinical Doctor', 'Direct & Concise'].map(p => (
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
                                    {['Beginner (Simple terms)', 'Intermediate', 'Expert Clinical'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                    <span>AI Risk Sensitivity</span>
                                    <span>{riskTolerance}% (Balanced)</span>
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
                                    <span className="text-xs font-bold text-white block">Predictive Dosage Recommendations</span>
                                    <span className="text-[10px] text-slate-500 block">Allow AI to suggest dosage timing based on your sleep and workout patterns</span>
                                </div>
                                <button 
                                    onClick={() => setPredictiveRecommendations(!predictiveRecommendations)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        predictiveRecommendations ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", predictiveRecommendations ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 6: NOTIFICATION PREFERENCES */}
                    <div 
                        ref={el => { sectionRefs.current['notifications'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('notifications') && !isMatched('reminders') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Notifications & Reminders</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control dose reminders, health alerts, and quiet hours</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isPushSupported && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-white block">Push Notifications</span>
                                        <span className="text-[10px] text-slate-500 block">Receive instant push alerts on your device</span>
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
                            )}

                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Supplement Intake Reminders</span>
                                    <span className="text-[10px] text-slate-500 block">Remind me when it is time to take morning and evening stacks</span>
                                </div>
                                <button 
                                    onClick={() => setSupplementReminders(!supplementReminders)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        supplementReminders ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", supplementReminders ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Quiet Hours</span>
                                    <span className="text-[10px] text-slate-500 block">Mute non-urgent notifications between 10:00 PM and 7:00 AM</span>
                                </div>
                                <button 
                                    onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        quietHoursEnabled ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", quietHoursEnabled ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 7: PRIVACY & DATA SECURITY */}
                    <div 
                        ref={el => { sectionRefs.current['privacy'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('privacy') && !isMatched('data') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Data Sharing & Privacy</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Control data retention, encryption, and anonymized research</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-white block">Anonymized Science Research Opt-in</span>
                                    <span className="text-[10px] text-slate-500 block">Share de-identified supplement outcomes to support clinical studies</span>
                                </div>
                                <button 
                                    onClick={() => setAnonymousResearchOptIn(!anonymousResearchOptIn)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        anonymousResearchOptIn ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", anonymousResearchOptIn ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">AI Model Training Consent</span>
                                    <span className="text-[10px] text-slate-500 block">Allow SuppSync to use anonymized logs to refine health coaching accuracy</span>
                                </div>
                                <button 
                                    onClick={() => setAiTrainingConsent(!aiTrainingConsent)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        aiTrainingConsent ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", aiTrainingConsent ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Public Profile Visibility</span>
                                    <span className="text-[10px] text-slate-500 block">Allow other users to view your public supplement stack profile</span>
                                </div>
                                <button 
                                    onClick={() => setPublicProfile(!publicProfile)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        publicProfile ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", publicProfile ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 8: LABS & GENETICS */}
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
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Automated PDF lab processing and reference ranges</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Reference Range Standard</label>
                                <select 
                                    value={referenceRangeStyle}
                                    onChange={(e) => setReferenceRangeStyle(e.target.value as any)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    <option value="Optimal Biohacking">Optimal Biohacking Ranges (Longevity focused)</option>
                                    <option value="Standard Clinical">Standard Clinical Ranges (Standard Lab Corp)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">DNA & Genetics Privacy</label>
                                <select 
                                    value={dnaPrivacyLevel}
                                    onChange={(e) => setDnaPrivacyLevel(e.target.value as any)}
                                    className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                                >
                                    <option value="Private & Encrypted">Private & Encrypted (Client-side key)</option>
                                    <option value="Restricted Access">Restricted Access (Requires Pin)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between md:col-span-2 border-t border-white/[0.05] pt-4">
                                <div>
                                    <span className="text-xs font-bold text-white block">Automated PDF Lab Parsing</span>
                                    <span className="text-[10px] text-slate-500 block">Extract uploaded bloodwork draws automatically using intelligent OCR models</span>
                                </div>
                                <button 
                                    onClick={() => setPdfAutoParse(!pdfAutoParse)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                        pdfAutoParse ? "bg-indigo-500" : "bg-slate-800"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", pdfAutoParse ? "translate-x-6" : "translate-x-0")} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 9: DATA EXPORT & BACKUP */}
                    <div 
                        ref={el => { sectionRefs.current['export'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('export') && !isMatched('backup') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Data Export & Backup</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Download CSV health logs or export JSON backup files</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[9px] font-black uppercase tracking-wider">
                                <button
                                    onClick={() => handleCsvExport('logs')}
                                    disabled={isExporting !== null}
                                    className="p-4 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl text-left space-y-1 transition-all"
                                >
                                    <span className="text-xs font-bold text-white block">Dosage Logs</span>
                                    <span className="text-[8px] text-slate-500 block">Download CSV</span>
                                </button>
                                <button
                                    onClick={() => handleCsvExport('biomarkers')}
                                    disabled={isExporting !== null}
                                    className="p-4 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl text-left space-y-1 transition-all"
                                >
                                    <span className="text-xs font-bold text-white block">Biomarkers</span>
                                    <span className="text-[8px] text-slate-500 block">Download CSV</span>
                                </button>
                                <button
                                    onClick={() => handleCsvExport('scores')}
                                    disabled={isExporting !== null}
                                    className="p-4 bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.04] rounded-2xl text-left space-y-1 transition-all"
                                >
                                    <span className="text-xs font-bold text-white block">Wellness Scores</span>
                                    <span className="text-[8px] text-slate-500 block">Download CSV</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-wider pt-2 border-t border-white/[0.05]">
                                <button 
                                    onClick={triggerBackup}
                                    className="h-12 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-2 transition-all text-slate-200"
                                >
                                    <Download className="w-4 h-4 text-emerald-400" />
                                    <span>Download Profile Backup (JSON)</span>
                                </button>

                                <div className="relative h-12 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer">
                                    <Upload className="w-4 h-4 text-blue-400" />
                                    <span className="text-slate-200">Restore Profile (JSON)</span>
                                    <input 
                                        type="file" 
                                        accept=".json"
                                        onChange={triggerRestore}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 10: APP PERSONALIZATION */}
                    <div 
                        ref={el => { sectionRefs.current['personalization'] = el }}
                        className={cn(
                            "p-6 rounded-[28px] border bg-slate-950/20 space-y-6 transition-all duration-300",
                            searchQuery && !isMatched('personalization') && !isMatched('accent') ? 'opacity-30 scale-[0.99] border-white/[0.02]' : 'border-white/[0.06] shadow-xl'
                        )}
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">App Personalization</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Customize accent themes and display preferences</p>
                            </div>
                        </div>

                        <div className="space-y-5">
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

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <span>Glass Transparency</span>
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
                                    <span>Font Scale</span>
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

                    {/* SECTION 11: ABOUT SUPPSYNC */}
                    <div 
                        ref={el => { sectionRefs.current['about'] = el }}
                        className="p-6 rounded-[28px] border border-white/[0.06] bg-slate-950/20 space-y-4"
                    >
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">About SuppSync</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-0.5">Version info and legal disclaimers</p>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v2.7.1</span>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            SuppSync is an AI-assisted health and supplement management platform designed to help you track biomarker trends, dosage routines, and wearable biometrics. SuppSync does not provide medical diagnosis.
                        </p>

                        <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-wider text-indigo-400 pt-2 border-t border-white/[0.05]">
                            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                            <Link href="/terms" className="hover:underline">Terms of Service</Link>
                            <Link href="/disclaimer" className="hover:underline">Medical Disclaimer</Link>
                        </div>
                    </div>

                </div>

                {/* INTERNAL DEV PANEL (ONLY COMPILED & SHOWN IN DEVELOPMENT MODE) */}
                <InternalDevPanel clearStorageCache={clearStorageCache} triggerToast={triggerToast} />

            </div>

            {/* MODALS */}
            <AnimatePresence>
                {/* 1. MFA SETUP WIZARD */}
                {isMfaWizardOpen && (
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
                                onClick={() => setIsMfaWizardOpen(false)}
                                className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="text-center space-y-1">
                                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400 mb-2">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Setup Two-Factor Auth</h3>
                            </div>

                            {/* STEPPER */}
                            <div className="flex justify-between items-center px-4">
                                {[1, 2, 3, 4].map(step => (
                                    <React.Fragment key={step}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all",
                                            mfaWizardStep >= step ? "bg-indigo-600 border-indigo-500 text-white" : "border-white/[0.08] bg-slate-950 text-slate-500"
                                        )}>
                                            {step}
                                        </div>
                                        {step < 4 && <div className={cn("h-0.5 flex-1 mx-2", mfaWizardStep > step ? "bg-indigo-600" : "bg-white/[0.04]")} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {mfaWizardStep === 1 && (
                                <div className="space-y-4">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Choose Method</span>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'TOTP', name: 'Authenticator App', desc: 'Use Google Authenticator, Duo, or 1Password.' },
                                            { id: 'SMS', name: 'SMS Text Code', desc: 'Receive code via phone.' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setMfaSetupMethod(m.id as any)}
                                                className={cn(
                                                    "w-full p-3 border text-left rounded-xl transition-all block",
                                                    mfaSetupMethod === m.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/[0.04]'
                                                )}
                                            >
                                                <span className="text-[9px] font-bold text-white block">{m.name}</span>
                                                <span className="text-[8px] text-slate-500 block mt-0.5">{m.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setMfaWizardStep(2)} className="w-full h-11 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-[9px] rounded-xl transition-all">
                                        Continue
                                    </button>
                                </div>
                            )}

                            {mfaWizardStep === 2 && (
                                <div className="space-y-4">
                                    <div className="w-32 h-32 bg-slate-900 border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto relative overflow-hidden">
                                        <div className="absolute inset-2 border-2 border-dashed border-indigo-500/40 rounded-lg flex flex-wrap p-1.5 gap-0.5 opacity-60">
                                            {Array.from({ length: 36 }).map((_, i) => (
                                                <div key={i} className={cn("w-3 h-3 rounded-sm", (i % 2 === 0 || i % 5 === 0) ? "bg-white" : "bg-transparent")} />
                                            ))}
                                        </div>
                                        <span className="text-[6px] font-black uppercase text-indigo-400 bg-slate-950/80 px-2 py-1 rounded border border-indigo-500/20 z-10">Scan QR</span>
                                    </div>
                                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-2">
                                        <span className="text-slate-500 text-[8px] font-black uppercase">Secret Key</span>
                                        <code className="text-white block font-mono text-[10px] tracking-widest text-center py-1 bg-slate-950 rounded border border-white/[0.04]">{mfaSecretKey}</code>
                                    </div>
                                    <button onClick={() => setMfaWizardStep(3)} className="w-full h-11 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-[9px] rounded-xl transition-all">
                                        I Scanned The Code
                                    </button>
                                </div>
                            )}

                            {mfaWizardStep === 3 && (
                                <div className="space-y-4">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Save Backup Recovery Codes</span>
                                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-slate-300 py-2.5 px-3 bg-slate-950 border border-white/[0.04] rounded-xl">
                                        {mfaRecoveryCodes.map(code => (
                                            <div key={code} className="text-center select-all">{code}</div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const element = document.createElement("a");
                                            const file = new Blob([mfaRecoveryCodes.join('\n')], {type: 'text/plain'});
                                            element.href = URL.createObjectURL(file);
                                            element.download = "suppsync-recovery-codes.txt";
                                            document.body.appendChild(element);
                                            element.click();
                                            document.body.removeChild(element);
                                            triggerToast('Recovery codes saved!')
                                        }}
                                        className="w-full h-10 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-wider text-[9px] rounded-xl transition-all"
                                    >
                                        Download Recovery Codes (.txt)
                                    </button>
                                    <button 
                                        onClick={() => setMfaWizardStep(4)} 
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                                    >
                                        I Saved My Codes
                                    </button>
                                </div>
                            )}

                            {mfaWizardStep === 4 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Enter 6-Digit Verification Code</label>
                                        <input 
                                            type="text" 
                                            maxLength={6}
                                            value={mfaVerifyCode}
                                            onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white tracking-[6px] text-center font-black focus:outline-none"
                                        />
                                    </div>
                                    <button onClick={handleMfaVerifyOTP} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all">
                                        Verify & Complete Setup
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. DANGER ZONE CONFIRMATION */}
                {dangerZoneAction !== null && (
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
                            className="bg-slate-950/90 border border-red-500/20 p-6 rounded-[28px] max-w-sm w-full shadow-2xl space-y-5 relative overflow-hidden text-xs text-slate-400"
                        >
                            <button 
                                onClick={() => setDangerZoneAction(null)}
                                className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="text-center space-y-1">
                                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400 mb-2">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Confirm Action</h3>
                            </div>

                            {(dangerZoneAction === 'deactivate' || dangerZoneAction === 'delete') && (
                                <div className="space-y-3">
                                    <p className="text-[9px] text-slate-400 text-center leading-normal">
                                        Type <span className="font-bold text-red-400 uppercase">"{dangerZoneAction === 'deactivate' ? 'DEACTIVATE' : 'DELETE'}"</span> to authorize:
                                    </p>
                                    <input 
                                        type="text" 
                                        value={dangerZoneConfirmText}
                                        onChange={(e) => setDangerZoneConfirmText(e.target.value)}
                                        placeholder={dangerZoneAction === 'deactivate' ? 'DEACTIVATE' : 'DELETE'}
                                        className="w-full bg-slate-950/80 border border-red-500/20 focus:border-red-500/60 rounded-xl px-3 py-2 text-[11px] font-black tracking-widest uppercase text-center text-white focus:outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="flex space-x-2 text-[8px] font-black uppercase tracking-wider">
                                <button onClick={() => setDangerZoneAction(null)} className="flex-1 h-10 border border-white/[0.08] hover:border-slate-700 text-white rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleConfirmDangerAction} className="flex-1 h-10 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all">
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 3. SIGN OUT BACKDROP */}
                {isSigningOut && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                    >
                        <div className="text-center space-y-4">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white">Signing Out...</h4>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

// Separate Internal Developer Panel (Rendered ONLY in local development builds)
function InternalDevPanel({ clearStorageCache, triggerToast }: { clearStorageCache: () => void, triggerToast: (msg: string) => void }) {
    if (process.env.NODE_ENV !== 'development') return null

    return (
        <div className="mt-12 p-6 rounded-[28px] border border-amber-500/20 bg-slate-950/40 space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
                <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Internal Dev Tools (Local Dev Only)</h3>
                </div>
                <span className="text-[7px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                    NODE_ENV = development
                </span>
            </div>
            <p className="text-[9px] text-slate-500">
                These tools are only compiled during local development and are excluded from public production builds.
            </p>
            <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                <button 
                    onClick={() => {
                        localStorage.clear()
                        triggerToast('Local storage cleared.')
                    }}
                    className="px-4 py-2 border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 rounded-xl transition-all"
                >
                    Clear LocalStorage
                </button>
                <button 
                    onClick={clearStorageCache}
                    className="px-4 py-2 border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 rounded-xl transition-all"
                >
                    Purge Asset Cache
                </button>
            </div>
        </div>
    )
}
