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
    const [userStack, setUserStack] = useState<string[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadUserStack()
    }, [])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    const loadUserStack = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: supps } = await supabase
            .from('supplements')
            .select('name, default_dosage_amount, default_dosage_unit')
            .eq('user_id', user.id)
        if (supps) {
            setUserStack(supps.map(s => `${s.name} (${s.default_dosage_amount}${s.default_dosage_unit})`))
        }
    }

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        const systemContext = userStack.length > 0
            ? `The user currently takes these supplements: ${userStack.join(', ')}. Use this context to give personalized advice.`
            : 'The user has not added any supplements yet.'

        const conversationHistory = [...messages, userMsg]
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n')

        const prompt = `You are SuppSync AI, a friendly and knowledgeable supplement coach. You help users with supplement advice, dosages, timing, interactions, and general wellness questions.

${systemContext}

Conversation so far:
${conversationHistory}

Respond helpfully and concisely. Use bullet points when listing multiple items. Keep responses under 150 words.`

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble thinking. Try again!' }])
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }])
        }

        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-screen pt-4 pb-20">
            {/* Header */}
            <div className="px-4 mb-4">
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">SuppSync AI</h1>
                        <p className="text-[10px] text-slate-500">Your personal supplement coach</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-violet-400" />
                        </div>
                        <p className="text-sm font-bold text-white mb-2">Ask me anything about supplements</p>
                        <div className="space-y-2 mt-4">
                            {[
                                'What supplements help with sleep?',
                                'Should I take creatine with food?',
                                'Best time for Vitamin D3?',
                            ].map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(q); }}
                                    className="block w-full text-xs text-slate-400 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 hover:border-violet-500/30 hover:text-violet-300 transition-colors text-left"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600'
                                        : 'bg-gradient-to-br from-violet-600 to-blue-600'
                                }`}>
                                    {msg.role === 'user'
                                        ? <User className="w-3.5 h-3.5 text-white" />
                                        : <Bot className="w-3.5 h-3.5 text-white" />
                                    }
                                </div>
                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-md'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        className="flex items-start space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 pt-3 pb-2 border-t border-slate-800/50">
                <div className="flex items-center space-x-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask about supplements..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    )
}
