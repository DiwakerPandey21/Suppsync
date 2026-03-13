'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Dumbbell, Loader2, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

const WORKOUT_TYPES = [
    { id: 'strength', label: '🏋️ Strength', color: 'bg-red-500/20 border-red-500/30 text-red-300' },
    { id: 'cardio', label: '🏃 Cardio', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
    { id: 'flexibility', label: '🧘 Flexibility', color: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
    { id: 'sports', label: '⚽ Sports', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
]

export function LogWorkout() {
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [type, setType] = useState('')
    const [name, setName] = useState('')
    const [duration, setDuration] = useState('')

    const save = async () => {
        if (!type) return
        setIsSaving(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('workouts').insert({
            user_id: user.id,
            type,
            name: name || type,
            duration_min: parseInt(duration) || null,
        })

        setSaved(true)
        setIsSaving(false)
        setTimeout(() => {
            setIsOpen(false)
            setSaved(false)
            setType('')
            setName('')
            setDuration('')
        }, 1500)
    }

    return (
        <div className="w-full px-4 mb-4">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    <Dumbbell className="w-4 h-4" />
                    <span className="text-sm font-bold">Log Workout</span>
                </button>
            ) : (
                <motion.div
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    {saved ? (
                        <div className="flex items-center justify-center space-x-2 py-4 text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-bold">Workout logged!</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center">
                                    <Dumbbell className="w-4 h-4 text-red-400 mr-2" /> Log Workout
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-xs text-slate-500">Cancel</button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {WORKOUT_TYPES.map(wt => (
                                    <button
                                        key={wt.id}
                                        onClick={() => setType(wt.id)}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                            type === wt.id ? wt.color + ' ring-1 ring-white/10' : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}
                                    >
                                        {wt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Workout name"
                                    className="bg-slate-800 border-slate-700 text-white text-xs h-9"
                                />
                                <Input
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    placeholder="Duration (min)"
                                    type="number"
                                    className="bg-slate-800 border-slate-700 text-white text-xs h-9"
                                />
                            </div>

                            <Button
                                onClick={save}
                                disabled={!type || isSaving}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-9 text-xs"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                Save Workout
                            </Button>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    )
}
