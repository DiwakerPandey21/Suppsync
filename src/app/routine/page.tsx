'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Pill, Droplet, Sun, Moon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/glass-card'
import { ConfettiBurst } from '@/components/dashboard/confetti-burst'

type ScheduledDose = {
    id: string
    time: string
    supplements: {
        id: string
        name: string
        default_dosage_amount: string
        default_dosage_unit: string
        form: string
    }[]
}

export default function RoutinePlayer() {
    const supabase = createClient()
    const router = useRouter()
    const [doses, setDoses] = useState<ScheduledDose[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isFinished, setIsFinished] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => { loadTodayRoutine() }, [])

    const loadTodayRoutine = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: schedules } = await supabase
            .from('schedules')
            .select(`
                id, time,
                supplement_id,
                supplements (id, name, form, default_dosage_amount, default_dosage_unit)
            `)
            .eq('user_id', user.id)
            .order('time', { ascending: true })

        if (schedules) {
            // Group by time
            const grouped = schedules.reduce((acc, curr: any) => {
                const existing = acc.find(item => item.time === curr.time)
                if (existing) {
                    existing.supplements.push(curr.supplements)
                } else {
                    acc.push({
                        id: curr.id, // Using first schedule ID of this time group as primary key for logging
                        time: curr.time,
                        supplements: [curr.supplements]
                    })
                }
                return acc
            }, [] as ScheduledDose[])

            setDoses(grouped)
        }
        setIsLoading(false)
    }

    const logDose = async (status: 'taken' | 'missed') => {
        const dose = doses[currentIndex]
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user && dose) {
            const logEntry = {
                user_id: user.id,
                log_date: new Date().toLocaleDateString('en-CA'),
                status: status,
                schedule_id: dose.id // Storing the primary schedule ID linking this group
            }
            await supabase.from('logs').insert(logEntry)
        }

        if (currentIndex < doses.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setIsFinished(true)
            setShowConfetti(true)
            setTimeout(() => {
                setShowConfetti(false)
            }, 5000)
        }
    }

    const getTimeGreeting = (time: string) => {
        const hour = parseInt(time.split(':')[0])
        if (hour < 12) return { text: 'Morning Routine', icon: <Sun className="w-6 h-6 text-amber-400" /> }
        if (hour < 18) return { text: 'Afternoon Routine', icon: <Droplet className="w-6 h-6 text-blue-400" /> }
        return { text: 'Night Routine', icon: <Moon className="w-6 h-6 text-indigo-400" /> }
    }

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    if (doses.length === 0) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Pill className="w-16 h-16 text-slate-700 mx-auto" />
                <h1 className="text-2xl font-black text-white">No stack scheduled.</h1>
                <p className="text-slate-400">Head to the library to build your supplement routine.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-8 px-6 py-3 bg-blue-600 rounded-xl font-bold">Go Back</button>
            </div>
        )
    }

    if (isFinished) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
                <ConfettiBurst trigger={showConfetti} />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-12 h-12 text-emerald-400" />
                    </div>
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-2">Awesome Job!</h1>
                <p className="text-slate-400 mb-12">You've completed your routine for now.</p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-white transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    const currentDose = doses[currentIndex]
    const greeting = getTimeGreeting(currentDose.time)

    // Format time from HH:MM:SS to HH:MM AM/PM
    const timeFormatted = new Date(`1970-01-01T${currentDose.time}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="px-6 pt-12 pb-6 flex justify-between items-center">
                <button onClick={() => router.push('/dashboard')} className="text-slate-400 p-2"><X className="w-6 h-6" /></button>
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                    Step {currentIndex + 1} of {doses.length}
                </span>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full"
                    >
                        <div className="text-center mb-10">
                            <div className="flex justify-center mb-4">{greeting.icon}</div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{greeting.text}</h2>
                            <h1 className="text-5xl font-black text-white mt-2 mb-8">{timeFormatted}</h1>
                        </div>

                        <GlassCard gradient="blue" className="mb-12">
                            <h3 className="text-sm font-bold text-white mb-4">Take the following:</h3>
                            <div className="space-y-3">
                                {currentDose.supplements.map((supp, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                                <Pill className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <span className="font-bold text-white">{supp.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-blue-400">{supp.default_dosage_amount} {supp.default_dosage_unit}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Action Area */}
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button 
                        onClick={() => logDose('missed')}
                        className="py-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all flex flex-col items-center"
                    >
                        <X className="w-6 h-6 mb-1" />
                        Skip
                    </button>
                    <button 
                        onClick={() => logDose('taken')}
                        className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] flex flex-col items-center"
                    >
                        <Check className="w-6 h-6 mb-1" />
                        Take All
                    </button>
                </div>
            </div>
        </div>
    )
}
