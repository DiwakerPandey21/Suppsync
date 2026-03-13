'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export function VoiceLogger({ onLogUpdate }: { onLogUpdate?: () => void }) {
    const supabase = createClient()
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle')
    const [matchedSupplement, setMatchedSupplement] = useState('')
    const recognitionRef = useRef<any>(null)
    const transcriptRef = useRef('')

    const startListening = () => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        if (!SpeechRecognition) {
            setStatus('error')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
            const text = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('')
            setTranscript(text)
            transcriptRef.current = text
        }

        recognition.onend = async () => {
            setIsListening(false)
            const finalText = transcriptRef.current
            if (finalText) {
                await processCommand(finalText)
            } else {
                setStatus('error')
                setTimeout(() => setStatus('idle'), 3000)
            }
        }

        recognition.onerror = () => {
            setIsListening(false)
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
        }

        recognitionRef.current = recognition
        transcriptRef.current = ''
        setTranscript('')
        recognition.start()
        setIsListening(true)
        setStatus('listening')
    }

    const stopListening = () => {
        recognitionRef.current?.stop()
        setIsListening(false)
    }

    // Normalize for fuzzy matching
    const normalize = (s: string) => {
        return s.toLowerCase()
            .replace(/\bone\b/g, '1').replace(/\btwo\b/g, '2').replace(/\bthree\b/g, '3')
            .replace(/\bfour\b/g, '4').replace(/\bfive\b/g, '5').replace(/\bsix\b/g, '6')
            .replace(/\bseven\b/g, '7').replace(/\beight\b/g, '8').replace(/\bnine\b/g, '9')
            .replace(/\bten\b/g, '10')
            .replace(/[^a-z0-9]/g, '')
    }

    const processCommand = async (text: string) => {
        setStatus('processing')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
            return
        }

        // Get user's supplements
        const { data: supps } = await supabase
            .from('supplements')
            .select('id, name')
            .eq('user_id', user.id)

        if (!supps || supps.length === 0) {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
            return
        }

        // Fuzzy match
        const normalizedText = normalize(text)
        const match = supps.find(s => {
            const normalizedName = normalize(s.name)
            return normalizedText.includes(normalizedName) || normalizedName.includes(normalizedText)
        })

        if (!match) {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
            return
        }

        // Find schedule for this supplement
        const { data: schedules } = await supabase
            .from('schedules')
            .select('id')
            .eq('supplement_id', match.id)
            .eq('is_active', true)

        if (!schedules || schedules.length === 0) {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
            return
        }

        const today = new Date().toLocaleDateString('en-CA')
        const scheduleId = schedules[0].id

        // Check if already logged today
        const { data: existingLogs } = await supabase
            .from('logs')
            .select('id')
            .eq('schedule_id', scheduleId)
            .eq('log_date', today)
            .limit(1)

        if (existingLogs && existingLogs.length > 0) {
            // Already taken today
            setMatchedSupplement(match.name)
            setStatus('success')
            onLogUpdate?.()
            setTimeout(() => setStatus('idle'), 3000)
            return
        }

        // INSERT a new log as 'taken' (same as DailyChecklist toggle)
        const { error } = await supabase.from('logs').insert({
            schedule_id: scheduleId,
            user_id: user.id,
            log_date: today,
            status: 'taken',
        })

        if (!error) {
            // Also decrement inventory
            const { data: inv } = await supabase
                .from('inventory')
                .select('id, amount_remaining')
                .eq('supplement_id', match.id)
                .single()
            if (inv) {
                await supabase.from('inventory')
                    .update({ amount_remaining: Math.max(0, inv.amount_remaining - 1) })
                    .eq('id', inv.id)
            }

            setMatchedSupplement(match.name)
            setStatus('success')
            onLogUpdate?.()
        } else {
            setStatus('error')
        }

        setTimeout(() => setStatus('idle'), 3000)
    }

    return (
        <div className="fixed bottom-28 right-6 z-50">
            <AnimatePresence>
                {status !== 'idle' && status !== 'listening' && (
                    <motion.div
                        className={`absolute bottom-16 right-0 w-56 rounded-2xl p-3 text-xs font-semibold ${
                            status === 'success' ? 'bg-green-900/90 text-green-300 border border-green-700' :
                            status === 'error' ? 'bg-red-900/90 text-red-300 border border-red-700' :
                            'bg-slate-900/90 text-slate-300 border border-slate-700'
                        }`}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        {status === 'processing' && (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Matching "{transcript}"...</span>
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>✓ Marked {matchedSupplement} as taken!</span>
                            </div>
                        )}
                        {status === 'error' && <span>Couldn't match supplement. Try again.</span>}
                    </motion.div>
                )}

                {isListening && (
                    <motion.div
                        className="absolute bottom-16 right-0 w-48 bg-blue-900/90 border border-blue-700 rounded-2xl p-3 text-xs text-blue-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="font-bold mb-1">🎙 Listening...</p>
                        <p className="text-[10px] text-blue-400">{transcript || 'Say a supplement name...'}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={isListening ? stopListening : startListening}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                    isListening
                        ? 'bg-red-500 shadow-red-500/30 animate-pulse'
                        : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-blue-500/20'
                }`}
                whileTap={{ scale: 0.9 }}
                title="Voice log a supplement"
            >
                {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            </motion.button>
        </div>
    )
}
