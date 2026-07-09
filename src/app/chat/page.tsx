'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function ChatPage() {
    const supabase = createClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [userContext, setUserContext] = useState<any>({ stack: [], scores: [], biomarkers: [], goals: [], genotypes: [] })
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => { loadUserContext() }, [])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    const loadUserContext = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [supps, scores, bio, goals, genos] = await Promise.all([
            supabase.from('supplements').select('name, default_dosage_amount, default_dosage_unit').eq('user_id', user.id),
            supabase.from('subjective_scores').select('record_date, energy_score, focus_score, sleep_score').eq('user_id', user.id).order('record_date', { ascending: false }).limit(7),
            supabase.from('biomarkers').select('name, value, unit, log_date').eq('user_id', user.id).order('log_date', { ascending: false }).limit(5),
            supabase.from('goals').select('title, current_value, target_value').eq('user_id', user.id),
            supabase.from('genotypes').select('marker_name, status').eq('user_id', user.id)
        ])

        setUserContext({
            stack: supps.data?.map(s => `${s.name} (${s.default_dosage_amount}${s.default_dosage_unit})`) || [],
            scores: scores.data || [],
            biomarkers: bio.data || [],
            goals: goals.data || [],
            genotypes: genos.data || []
        })
    }

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        // Create the payload for the V9 chat route
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
                // Read streaming response
                const reader = res.body?.getReader()
                const decoder = new TextDecoder()
                let responseText = ''

                if (reader) {
                    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                    
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        
                        // Since we switched to toTextStreamResponse(), 
                        // the stream gives us raw text chunks directly!
                        const chunk = decoder.decode(value, { stream: true })
                        responseText += chunk
                        
                        setMessages(prev => {
                            const newMsgs = [...prev]
                            newMsgs[newMsgs.length - 1].content = responseText
                            return newMsgs
                        })
                    }
                }
            } else {
                let errorMsg = 'Sorry, I had trouble thinking. Try again!'
                try {
                    const errObj = await res.json()
                    if (errObj.error) errorMsg = `Server Error: ${errObj.error}`
                } catch (e) {}
                setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }])
            }
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error: ' + String(e) }])
        }

        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-screen pt-6 pb-24 relative overflow-hidden bg-background">
            {/* Soft decorative background glows */}
            <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[30%] right-[-10%] w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="px-6 mb-6 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/[0.1]">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none mb-1">SyncBot AI</h1>
                        <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Intelligent Coach Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-4 z-10 pb-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        {/* Animated Glowing AI Companion Orb */}
                        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
                            {/* Inner Pulsating Circle */}
                            <motion.div 
                                className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-30 blur-md"
                                animate={{
                                    scale: [0.9, 1.2, 0.9],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                            />
                            {/* Core Orb */}
                            <motion.div 
                                className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-400 via-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.5)] border border-white/[0.2]"
                                animate={{
                                    y: [0, -6, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                            >
                                <Sparkles className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            </motion.div>
                        </div>

                        <h2 className="text-xl font-black text-white tracking-tight mb-2">Supplement Intelligence</h2>
                        <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed mb-6">
                            Ask me anything about your stack, dosage timings, or biochemical compatibility.
                        </p>

                        <div className="space-y-2.5 w-full max-w-xs mt-2">
                            {[
                                'What supplements help with sleep?',
                                'Should I take creatine with food?',
                                'Best time for Vitamin D3?',
                            ].map((q, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => { setInput(q); }}
                                    whileHover={{ y: -1, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="block w-full text-xs text-slate-300 bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-3 hover:border-blue-500/25 hover:text-white transition-all text-left shadow-sm"
                                >
                                    {q}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                        >
                            <div className={`flex items-start space-x-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 border border-white/[0.1]'
                                        : 'bg-gradient-to-br from-blue-500 to-purple-500 border border-white/[0.1]'
                                }`}>
                                    {msg.role === 'user'
                                        ? <User className="w-4 h-4 text-white" />
                                        : <Bot className="w-4 h-4 text-white" />
                                    }
                                </div>
                                <div className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600/90 text-white rounded-br-md border border-blue-500/20'
                                        : 'glass-panel text-slate-200 rounded-bl-md border-white/[0.05]'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        className="flex items-start space-x-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border border-white/[0.1] shadow-md">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="glass-panel border-white/[0.05] rounded-3xl rounded-bl-md px-5 py-4">
                            <div className="flex space-x-1.5">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="px-6 pt-4 pb-6 z-10">
                <div className="flex items-center space-x-2.5 glass-panel border-white/[0.06] rounded-2xl p-2 shadow-xl">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type stack question..."
                        className="flex-1 bg-transparent border-none rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                    <motion.button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:opacity-90 transition-opacity cursor-pointer shadow-md border border-white/[0.08]"
                    >
                        <Send className="w-4.5 h-4.5 text-white" />
                    </motion.button>
                </div>
            </div>
        </div>
    )
}
