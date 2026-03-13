'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { SmilePlus, Check, Loader2 } from 'lucide-react'
import { GlassCard } from './glass-card'

const MOODS = [
    { emoji: '😊', label: 'Great', value: 'great' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Low', value: 'low' },
    { emoji: '😩', label: 'Rough', value: 'rough' },
]

const SYMPTOMS = [
    '💤 Fatigue', '🤕 Headache', '🤢 Nausea', '⚡ Jitters',
    '😤 Irritability', '🧊 Brain Fog', '💪 Soreness', '😰 Anxiety',
]

export function MoodLogger() {
    const supabase = createClient()
    const [selectedMood, setSelectedMood] = useState<string | null>(null)
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [alreadyLogged, setAlreadyLogged] = useState(false)

    useEffect(() => { checkExisting() }, [])

    const checkExisting = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const todayStr = new Date().toLocaleDateString('en-CA')
        const { data } = await supabase
            .from('mood_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('log_date', todayStr)
            .single()
        if (data) setAlreadyLogged(true)
    }

    const toggleSymptom = (s: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        )
    }

    const save = async () => {
        if (!selectedMood) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('mood_logs').insert({
            user_id: user.id,
            log_date: new Date().toLocaleDateString('en-CA'),
            mood: selectedMood,
            symptoms: selectedSymptoms.map(s => s.slice(2).trim()),
            notes: notes || null,
        })

        setSaving(false)
        setSaved(true)
        setAlreadyLogged(true)
    }

    if (alreadyLogged && !saved) return null
    if (saved) {
        return (
            <div className="w-full px-4 mb-4">
                <GlassCard gradient="emerald">
                    <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-400">Mood logged! ✓</p>
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="w-full px-4 mb-4">
            <GlassCard gradient="purple">
                <div className="flex items-center space-x-2 mb-3">
                    <SmilePlus className="w-4 h-4 text-violet-400" />
                    <p className="text-xs font-bold text-white">How are you feeling?</p>
                </div>

                {/* Mood Selection */}
                <div className="flex justify-between mb-4">
                    {MOODS.map(mood => (
                        <button
                            key={mood.value}
                            onClick={() => setSelectedMood(mood.value)}
                            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
                                selectedMood === mood.value
                                    ? 'bg-violet-500/20 scale-110'
                                    : 'hover:bg-slate-800'
                            }`}
                        >
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="text-[9px] text-slate-400">{mood.label}</span>
                        </button>
                    ))}
                </div>

                {/* Symptoms */}
                <AnimatePresence>
                    {selectedMood && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Any symptoms?</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {SYMPTOMS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleSymptom(s)}
                                        className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                                            selectedSymptoms.includes(s)
                                                ? 'bg-violet-500/30 text-violet-300 border border-violet-500/30'
                                                : 'bg-slate-800 text-slate-400 border border-transparent'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any notes? (optional)"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none mb-3"
                            />

                            <button
                                onClick={save}
                                disabled={saving}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-xs font-bold transition-colors"
                            >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Log Mood'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </div>
    )
}
