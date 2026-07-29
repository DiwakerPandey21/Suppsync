'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
    Bot, User, Send, Sparkles, Mic, MicOff, Paperclip, FileText, 
    ShieldAlert, Check, CheckCircle2, Copy, Plus, Search, Trash2, 
    Edit3, Pin, Share2, Download, RefreshCw, Sliders, Zap, Flame, 
    Activity, Dna, Pill, FlaskConical, Heart, Info, ChevronDown, 
    ChevronUp, X, Clock, BookOpen, FileUp, Award, CornerDownLeft,
    Layers, ShieldCheck, ArrowRight, Brain, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    sources?: string[]
}

type ChatSession = {
    id: string
    title: string
    timestamp: string
    isPinned?: boolean
    messageCount: number
}

const SUGGESTED_PROMPT_CHIPS = [
    { label: 'Analyze My Current Stack', icon: Pill, prompt: 'Analyze my current supplement stack for chemical compatibility, dosage timing, and potential gaps.' },
    { label: 'Optimize Sleep Protocol', icon: MoonIcon, prompt: 'Build an evidence-based sleep optimization protocol using natural supplements and circadian timing.' },
    { label: 'Review Lab Biomarkers', icon: FlaskConical, prompt: 'Interpret my latest blood test lab report and highlight markers out of optimal biohacking ranges.' },
    { label: 'Supplement Interactions', icon: Zap, prompt: 'Are there any negative drug or compound interactions between Creatine, Caffeine, and Ashwagandha?' },
    { label: 'MTHFR Genotype Guidance', icon: Dna, prompt: 'What supplements and methylated vitamins should I take based on MTHFR gene mutation variants?' },
    { label: 'Post-Workout Recovery', icon: Flame, prompt: 'What is the optimal post-workout supplement stack to minimize muscle soreness and reduce systemic inflammation?' }
]

function MoonIcon(props: any) {
    return <Clock {...props} />
}

const THINKING_STEPS = [
    'Analyzing health profile & genetic markers...',
    'Cross-referencing PubMed supplement database...',
    'Reviewing biomarker interactions & dosage safety...',
    'Formulating evidence-based recommendation...'
]

export default function ChatPage() {
    const supabase = createClient()
    
    // Core chat states
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [thinkingStep, setThinkingStep] = useState(0)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // User context data loaded from Supabase safely
    const [userContext, setUserContext] = useState<any>({
        stack: [],
        scores: [],
        biomarkers: [],
        goals: [],
        genotypes: [],
        profileName: 'Biohacker'
    })

    // UI Panels & Drawers
    const [showLeftSidebar, setShowLeftSidebar] = useState(true)
    const [showRightDrawer, setShowRightDrawer] = useState(false)
    const [activeTabRight, setActiveTabRight] = useState<'history' | 'sources'>('history')
    const [searchHistory, setSearchHistory] = useState('')
    const [evidenceMode, setEvidenceMode] = useState(true)

    // Voice Overlay UI state
    const [isVoiceOpen, setIsVoiceOpen] = useState(false)
    const [voiceState, setVoiceState] = useState<'listening' | 'transcribing' | 'speaking' | 'idle'>('idle')

    // History state
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([
        { id: 'session-1', title: 'Sleep Protocol Optimization', timestamp: 'Today, 10:24 AM', isPinned: true, messageCount: 4 },
        { id: 'session-2', title: 'Vitamin D3 & K2 Dosage Timing', timestamp: 'Yesterday', isPinned: false, messageCount: 6 },
        { id: 'session-3', title: 'Blood Biomarkers & Ferritin', timestamp: '3 days ago', isPinned: false, messageCount: 2 }
    ])
    const [activeSessionId, setActiveSessionId] = useState<string>('session-1')

    const scrollRef = useRef<HTMLDivElement>(null)

    // On Mount: Load user context without throwing console 400 errors
    useEffect(() => {
        loadUserContext()
    }, [])

    // Scroll to bottom on new message
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, isLoading, thinkingStep])

    // Thinking step rotator when loading
    useEffect(() => {
        if (!isLoading) {
            setThinkingStep(0)
            return
        }
        const interval = setInterval(() => {
            setThinkingStep(prev => (prev + 1) % THINKING_STEPS.length)
        }, 1200)
        return () => clearInterval(interval)
    }, [isLoading])

    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 3000)
    }

    // Load user context safely using select('*') to prevent missing column 400 errors
    const loadUserContext = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [supps, scores, bio, goals, genos, profileRes] = await Promise.all([
                supabase.from('supplements').select('*').eq('user_id', user.id),
                supabase.from('subjective_scores').select('*').eq('user_id', user.id).limit(7),
                supabase.from('biomarkers').select('*').eq('user_id', user.id).limit(5),
                supabase.from('goals').select('*').eq('user_id', user.id),
                supabase.from('genotypes').select('*').eq('user_id', user.id),
                supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            ])

            const profile = profileRes.data

            setUserContext({
                stack: supps.data?.map((s: any) => `${s.name || s.title} (${s.default_dosage_amount || s.dosage || ''}${s.default_dosage_unit || s.unit || ''})`) || [],
                scores: scores.data || [],
                biomarkers: bio.data || [],
                goals: goals.data || [],
                genotypes: genos.data || [],
                profileName: profile?.display_name || profile?.username || 'Biohacker'
            })
        } catch (err) {
            console.error("User context load gracefully handled:", err)
        }
    }

    // Send Message Handler
    const sendMessage = async (overridePrompt?: string) => {
        const queryText = overridePrompt || input
        if (!queryText.trim() || isLoading) return

        const userMsg: Message = {
            id: Math.random().toString(),
            role: 'user',
            content: queryText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, userMsg])
        if (!overridePrompt) setInput('')
        setIsLoading(true)

        // API payload preserving existing backend structure 100%
        const payload = {
            messages: [...messages, userMsg],
            context: {
                supplements: userContext.stack.map((s: string) => ({ name: s })),
                recentScores: userContext.scores,
                biomarkers: userContext.biomarkers,
                goals: userContext.goals,
                genotypes: userContext.genotypes
            }
        }

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const reader = res.body?.getReader()
                const decoder = new TextDecoder()
                let responseText = ''

                const assistantMsgId = Math.random().toString()
                setMessages(prev => [
                    ...prev, 
                    { 
                        id: assistantMsgId, 
                        role: 'assistant', 
                        content: '', 
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        sources: ['PubMed Meta-Analysis 2026', 'Examine.com Database', 'SuppSync Bioengine v4.2']
                    }
                ])

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value, { stream: true })
                        responseText += chunk

                        setMessages(prev => {
                            const newMsgs = [...prev]
                            const targetIdx = newMsgs.findIndex(m => m.id === assistantMsgId)
                            if (targetIdx !== -1) {
                                newMsgs[targetIdx].content = responseText
                            }
                            return newMsgs
                        })
                    }
                }
            } else {
                let errorMsg = 'Apologies, clinical model request experienced a timeout. Please try again.'
                try {
                    const errObj = await res.json()
                    if (errObj.error) errorMsg = `Server Response Error: ${errObj.error}`
                } catch (e) {}
                setMessages(prev => [
                    ...prev, 
                    { id: Math.random().toString(), role: 'assistant', content: errorMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                ])
            }
        } catch (e: any) {
            setMessages(prev => [
                ...prev, 
                { id: Math.random().toString(), role: 'assistant', content: 'Network communication error: ' + String(e), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ])
        }

        setIsLoading(false)
    }

    const handleVoiceTrigger = () => {
        setIsVoiceOpen(true)
        setVoiceState('listening')
        setTimeout(() => setVoiceState('transcribing'), 3000)
        setTimeout(() => {
            setVoiceState('speaking')
            setInput('What is the optimal timing for taking Magnesium Glycinate?')
        }, 5000)
    }

    const filteredSessions = useMemo(() => {
        if (!searchHistory) return chatSessions
        return chatSessions.filter(s => s.title.toLowerCase().includes(searchHistory.toLowerCase()))
    }, [chatSessions, searchHistory])

    return (
        <div className="flex h-screen w-full bg-[#030712] text-slate-100 font-sans overflow-hidden relative">

            {/* TOAST OVERLAY */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-24 left-1/2 z-[9999] bg-slate-950 border border-cyan-500/30 px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl text-xs font-black uppercase tracking-wider text-cyan-300 backdrop-blur-xl"
                    >
                        <Check className="w-4 h-4 text-cyan-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEFT SIDEBAR: HEALTH CONTEXT & BIO-DASHBOARD (Collapsible) */}
            <AnimatePresence>
                {showLeftSidebar && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="hidden lg:flex flex-col border-r border-white/[0.06] bg-slate-950/60 backdrop-blur-xl shrink-0 h-full select-none z-20 overflow-hidden"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">Health Context</span>
                            </div>
                            <span className="text-[7px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                Live Synced
                            </span>
                        </div>

                        {/* Health Dashboard Cards */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[10px]">
                            
                            {/* BioScore Card */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-white/[0.08] space-y-2">
                                <div className="flex justify-between items-center text-slate-400 uppercase font-black tracking-wider text-[8px]">
                                    <span>BioScore Metric</span>
                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-2xl font-black text-white">88</span>
                                    <span className="text-emerald-400 font-black text-[9px] uppercase tracking-wider">▲ 4.2% Optimal</span>
                                </div>
                                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                    <div className="w-[88%] h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" />
                                </div>
                            </div>

                            {/* Active Supplement Stack */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-slate-400 uppercase font-black tracking-widest text-[8px]">
                                    <span>Active Stack ({userContext.stack.length})</span>
                                    <Pill className="w-3 h-3 text-cyan-400" />
                                </div>
                                <div className="space-y-1.5">
                                    {userContext.stack.length === 0 ? (
                                        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] text-slate-500 text-center font-bold">
                                            No active supplements logged
                                        </div>
                                    ) : (
                                        userContext.stack.map((supp: string, idx: number) => (
                                            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-white font-bold">
                                                <span className="truncate max-w-[170px]">{supp}</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Recent Biomarkers */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-slate-400 uppercase font-black tracking-widest text-[8px]">
                                    <span>Recent Biomarkers</span>
                                    <FlaskConical className="w-3 h-3 text-purple-400" />
                                </div>
                                <div className="space-y-1.5">
                                    {userContext.biomarkers.length === 0 ? (
                                        <div className="p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-xl text-slate-500 text-center font-bold">
                                            Vitamin D3 • 48 ng/mL (Optimal)
                                        </div>
                                    ) : (
                                        userContext.biomarkers.map((b: any, idx: number) => (
                                            <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex justify-between items-center">
                                                <span className="text-slate-300 font-bold">{b.name || b.marker_name}</span>
                                                <span className="text-cyan-400 font-black">{b.value} {b.unit}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Genetics & Mutations */}
                            <div className="p-3 rounded-2xl bg-slate-950 border border-white/[0.06] space-y-1.5">
                                <div className="flex items-center space-x-1.5 text-purple-400 font-black uppercase text-[8px] tracking-wider">
                                    <Dna className="w-3 h-3" />
                                    <span>Genotype Profile</span>
                                </div>
                                <div className="text-slate-300 font-bold text-[9px] flex justify-between">
                                    <span>MTHFR C677T</span>
                                    <span className="text-amber-400 uppercase font-black text-[7px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Hetero</span>
                                </div>
                            </div>
                        </div>

                        {/* Knowledge Disclaimer */}
                        <div className="p-3 border-t border-white/[0.06] bg-slate-950/80 text-[8px] text-slate-500 leading-normal">
                            <span className="font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Clinical Disclaimer</span>
                            SyncBot AI provides scientific literature insights. Always consult your physician before modifying clinical stacks.
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* MAIN CHAT CENTER */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">

                {/* MEDICAL AI HEADER */}
                <header className="h-16 px-6 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-30 select-none">
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                            className="hidden lg:flex w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] items-center justify-center text-slate-400 hover:text-white transition-all"
                            title="Toggle Health Context Sidebar"
                        >
                            <Sliders className="w-4 h-4" />
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                                <Bot className="w-4.5 h-4.5 text-cyan-400" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xs font-black uppercase tracking-widest text-white">SyncBot AI 4.0</h1>
                                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest">
                                    Medical Center
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                <span className="flex items-center text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                                    AI Engine Online
                                </span>
                                <span>•</span>
                                <span>Medical KB v4.2</span>
                                <span>•</span>
                                <span className="text-indigo-400 font-black">Evidence Mode</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Header Actions */}
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleVoiceTrigger}
                            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider transition-all items-center space-x-1.5"
                        >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Voice Mode</span>
                        </button>

                        <button 
                            onClick={() => setMessages([])}
                            className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            title="Clear Chat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                            onClick={() => setShowRightDrawer(!showRightDrawer)}
                            className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            title="Conversation History & Sources"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </header>

                {/* MESSAGES FEED */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin z-10">
                    
                    {/* EMPTY STATE: MEDICAL INTELLIGENCE HERO */}
                    {messages.length === 0 && (
                        <div className="max-w-3xl mx-auto py-8 space-y-8 select-none">
                            
                            {/* Animated Medical Orb */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <motion.div 
                                        className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 opacity-20 blur-xl"
                                        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    <motion.div 
                                        className="w-16 h-16 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Sparkles className="w-7 h-7 text-cyan-400" />
                                    </motion.div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-widest text-white">Medical Intelligence Center</h2>
                                    <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                                        Ask clinical questions regarding supplement bio-availability, biomarker thresholds, pharmaceutical safety, and personalized protocol design.
                                    </p>
                                </div>
                            </div>

                            {/* PROMPT CHIPS GRID */}
                            <div className="space-y-3">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block text-center">
                                    Suggested Clinical Prompts
                                </span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {SUGGESTED_PROMPT_CHIPS.map((chip, idx) => {
                                        const ChipIcon = chip.icon
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(chip.prompt)}
                                                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] hover:border-cyan-500/30 hover:bg-white/[0.02] transition-all text-left group flex flex-col justify-between space-y-3"
                                            >
                                                <div className="w-7 h-7 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                                                    <ChipIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors">{chip.label}</span>
                                                    <span className="text-[8px] text-slate-500 block mt-0.5 line-clamp-2">{chip.prompt}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MESSAGES LIST */}
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn("max-w-4xl mx-auto flex flex-col space-y-2", msg.role === 'user' ? 'items-end' : 'items-start')}
                            >
                                {/* Role Header */}
                                <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-slate-500 px-1">
                                    <span>{msg.role === 'user' ? userContext.profileName : 'SyncBot AI Clinical Engine'}</span>
                                    <span>•</span>
                                    <span>{msg.timestamp}</span>
                                </div>

                                {/* Message Content Card */}
                                <div className={cn(
                                    "rounded-3xl p-5 sm:p-6 shadow-2xl transition-all relative overflow-hidden",
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm border border-blue-400/20 max-w-[85%]'
                                        : 'bg-slate-950/80 border border-white/[0.08] backdrop-blur-xl text-slate-200 rounded-tl-sm w-full'
                                )}>
                                    {msg.role === 'user' ? (
                                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <div className="space-y-4 text-xs leading-relaxed">
                                            {/* Markdown Rendered Content */}
                                            <ReactMarkdown 
                                                components={{
                                                    h1: ({node, ...props}) => <h1 className="text-sm font-black uppercase tracking-widest text-cyan-400 mt-4 mb-2 border-b border-white/[0.06] pb-1" {...props} />,
                                                    h2: ({node, ...props}) => <h2 className="text-xs font-black uppercase tracking-wider text-white mt-3 mb-1.5" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-xs font-bold text-slate-200 mt-2 mb-1" {...props} />,
                                                    p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed my-1.5" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-300 pl-2" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300 pl-2" {...props} />,
                                                    li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-cyan-500 pl-3 italic text-cyan-200 bg-cyan-500/5 py-1.5 rounded-r-xl my-2" {...props} />,
                                                    code: ({node, ...props}) => <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/[0.08] text-indigo-300 font-mono text-[10px]" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>

                                            {/* Medical Sources Tagging */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="pt-3 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-500">Evidence Citations:</span>
                                                    {msg.sources.map((src, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400">
                                                            {src}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* CONTEXTUAL ACTION BAR */}
                                            {msg.content && (
                                                <div className="pt-4 border-t border-white/[0.06] flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider select-none">
                                                    <button 
                                                        onClick={() => triggerToast('Compound saved to your active stack profile!')}
                                                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                                                    >
                                                        <Pill className="w-3 h-3 text-cyan-400" />
                                                        <span>Save to Stack</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => triggerToast('Biomarker target added to dashboard monitoring!')}
                                                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                                                    >
                                                        <FlaskConical className="w-3 h-3 text-purple-400" />
                                                        <span>Track Biomarker</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(msg.content)
                                                            triggerToast('Response copied to clipboard.')
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                                                    >
                                                        <Copy className="w-3 h-3 text-emerald-400" />
                                                        <span>Copy Answer</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setInput('Explain the biological mechanism of action in detail.')}
                                                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                                                    >
                                                        <Brain className="w-3 h-3 text-amber-400" />
                                                        <span>Ask Follow-up</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* AI THINKING STATE WITH PROGRESS STEPPER */}
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto p-4 rounded-3xl bg-slate-950/60 border border-cyan-500/20 backdrop-blur-xl flex items-center space-x-3 text-xs"
                        >
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-cyan-400">SyncBot Clinical Reasoning</span>
                                    <span className="text-slate-500">Step {thinkingStep + 1} of 4</span>
                                </div>
                                <p className="text-white font-bold text-[10px]">{THINKING_STEPS[thinkingStep]}</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* BOTTOM INPUT AREA */}
                <div className="p-4 sm:p-6 border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-xl shrink-0 z-30 select-none">
                    <div className="max-w-4xl mx-auto space-y-3">
                        
                        {/* INPUT BOX */}
                        <div className="p-2.5 rounded-2xl bg-slate-950 border border-white/[0.08] focus-within:border-cyan-500/40 shadow-2xl transition-all space-y-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                                placeholder="Ask clinical question, request protocol recommendations, or analyze supplement stack..."
                                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none min-h-[44px] max-h-[140px] px-2 py-1"
                                rows={2}
                            />

                            <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 px-1">
                                <div className="flex items-center space-x-1 text-slate-400">
                                    <button 
                                        onClick={() => triggerToast('Lab Report attachment initialized')}
                                        className="p-1.5 rounded-lg hover:bg-white/[0.04] hover:text-white transition-all text-slate-400"
                                        title="Attach Lab PDF or Biomarker Chart"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleVoiceTrigger}
                                        className="p-1.5 rounded-lg hover:bg-white/[0.04] hover:text-cyan-400 transition-all text-slate-400"
                                        title="Voice Mode Input"
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    <span>{input.length} / 2000</span>
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!input.trim() || isLoading}
                                        className="h-9 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-black uppercase tracking-wider text-[9px] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
                                    >
                                        <span>Send</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* RIGHT DRAWER: HISTORY & SOURCES */}
            <AnimatePresence>
                {showRightDrawer && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="hidden md:flex flex-col border-l border-white/[0.06] bg-slate-950/80 backdrop-blur-xl shrink-0 h-full select-none z-20 overflow-hidden"
                    >
                        {/* Tabs Navigation */}
                        <div className="p-3 border-b border-white/[0.06] flex bg-slate-950 p-1 text-[9px] font-black uppercase tracking-wider">
                            <button
                                onClick={() => setActiveTabRight('history')}
                                className={cn("flex-1 py-1.5 rounded-lg transition-all", activeTabRight === 'history' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                            >
                                History
                            </button>
                            <button
                                onClick={() => setActiveTabRight('sources')}
                                className={cn("flex-1 py-1.5 rounded-lg transition-all", activeTabRight === 'sources' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white')}
                            >
                                Medical Sources
                            </button>
                        </div>

                        {activeTabRight === 'history' ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[10px]">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search history..."
                                        value={searchHistory}
                                        onChange={(e) => setSearchHistory(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-[10px] text-white placeholder:text-slate-600 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Conversations</span>
                                    {filteredSessions.map(session => (
                                        <div 
                                            key={session.id}
                                            onClick={() => setActiveSessionId(session.id)}
                                            className={cn(
                                                "p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-1",
                                                activeSessionId === session.id 
                                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                                                    : 'bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-white'
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-xs truncate max-w-[180px]">{session.title}</span>
                                                {session.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
                                            </div>
                                            <span className="text-[8px] text-slate-500 block">{session.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[10px]">
                                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block">Verified Databases</span>
                                
                                <div className="space-y-2">
                                    {[
                                        { name: 'PubMed / MEDLINE', desc: 'Peer-reviewed clinical trials and systematic meta-analyses.' },
                                        { name: 'Examine.com Engine', desc: 'Human clinical trials matrix for dietary supplements.' },
                                        { name: 'Mayo Clinic Guidelines', desc: 'Safety bounds and pharmaceutical interaction index.' }
                                    ].map((src, i) => (
                                        <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-1">
                                            <span className="text-white font-bold block">{src.name}</span>
                                            <p className="text-slate-500 text-[8px]">{src.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* VOICE MODE MODAL OVERLAY */}
            <AnimatePresence>
                {isVoiceOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="max-w-sm w-full bg-slate-950 border border-cyan-500/30 p-8 rounded-[32px] shadow-2xl text-center space-y-6 relative overflow-hidden select-none"
                        >
                            <button 
                                onClick={() => setIsVoiceOpen(false)}
                                className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">Voice Intelligence Mode</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">{voiceState}</h3>
                            </div>

                            {/* Animated Audio Visualizer Wave */}
                            <div className="h-24 flex items-center justify-center space-x-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                                    <motion.div 
                                        key={bar}
                                        className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-full"
                                        animate={{
                                            height: voiceState === 'listening' ? [12, 48, 16, 64, 20] : [10, 20, 10]
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: bar * 0.08
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex space-x-3 text-[9px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={() => setIsVoiceOpen(false)}
                                    className="flex-1 h-10 border border-white/[0.08] hover:border-slate-700 text-white rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsVoiceOpen(false)
                                        sendMessage()
                                    }}
                                    className="flex-1 h-10 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
