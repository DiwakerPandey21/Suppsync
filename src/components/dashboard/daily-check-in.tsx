'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Check, Loader2, Sparkles, Battery, Brain, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function DailyCheckIn({ userId, currentDate }: { userId: string, currentDate: string }) {
    const supabase = createClient()
    const router = useRouter()

    const [energy, setEnergy] = useState<number>(5)
    const [focus, setFocus] = useState<number>(5)
    const [sleep, setSleep] = useState<number>(5)
    const [notes, setNotes] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async () => {
        setIsSubmitting(true)

        const { error } = await supabase
            .from('subjective_scores')
            .upsert({
                user_id: userId,
                record_date: currentDate,
                energy_score: energy,
                focus_score: focus,
                sleep_score: sleep,
                notes: notes.trim() || null
            }, {
                onConflict: 'user_id,record_date'
            })

        if (!error) {
            setSubmitted(true)
            router.refresh()
        } else {
            console.error('Failed to log scores', error)
        }

        setIsSubmitting(false)
    }

    if (submitted) {
        return (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-white font-bold text-lg">Check-in Complete</h3>
                <p className="text-slate-400 text-sm">Your data will help calculate ROI over time.</p>
            </div>
        )
    }

    return (
        <div className="w-full bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

            <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-white">Daily Check-in</h2>
            </div>

            <div className="space-y-6">
                {/* Energy Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-300 flex items-center"><Battery className="w-4 h-4 mr-1.5 text-yellow-500" /> Energy</span>
                        <span className="text-yellow-400">{energy} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="1" max="10"
                        value={energy}
                        onChange={(e) => setEnergy(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                {/* Focus Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-300 flex items-center"><Brain className="w-4 h-4 mr-1.5 text-blue-500" /> Focus</span>
                        <span className="text-blue-400">{focus} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="1" max="10"
                        value={focus}
                        onChange={(e) => setFocus(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Sleep Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-300 flex items-center"><Moon className="w-4 h-4 mr-1.5 text-purple-500" /> Sleep Quality</span>
                        <span className="text-purple-400">{sleep} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="1" max="10"
                        value={sleep}
                        onChange={(e) => setSleep(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Optional Notes */}
                <div className="space-y-2 pt-2">
                    <input
                        type="text"
                        placeholder="Add a note (e.g. Bad sleep due to heat)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus-visible:ring-blue-500 text-sm text-white rounded-xl h-11 px-4 placeholder:text-slate-500"
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Today's Scores"}
                </Button>
            </div>
        </div>
    )
}
