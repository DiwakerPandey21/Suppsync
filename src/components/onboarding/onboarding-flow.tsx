'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Pill, Bell, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STEPS = [
    {
        title: 'Welcome to SuppSync',
        subtitle: 'Your AI-powered supplement companion',
        icon: Sparkles,
        color: 'from-blue-500 to-purple-500',
        description: 'Track your supplements, get AI insights, and optimize your biohacking stack.',
    },
    {
        title: 'Build Your Stack',
        subtitle: 'Add your first supplements',
        icon: Pill,
        color: 'from-emerald-500 to-teal-500',
        description: 'Head to the Library or use AI Stack Builder to add supplements based on your goals.',
    },
    {
        title: 'Stay Consistent',
        subtitle: 'Enable push notifications',
        icon: Bell,
        color: 'from-amber-500 to-orange-500',
        description: 'Get daily reminders to never miss a dose. You can enable notifications in Settings.',
    },
    {
        title: "You're All Set!",
        subtitle: 'Start your biohacking journey',
        icon: CheckCircle2,
        color: 'from-green-500 to-emerald-500',
        description: 'Check off supplements daily, track your biomarkers, and earn achievement badges!',
    },
]

export function OnboardingFlow() {
    const [show, setShow] = useState(false)
    const [step, setStep] = useState(0)

    useEffect(() => {
        const completed = localStorage.getItem('suppsync-onboarded')
        if (!completed) {
            setShow(true)
        }
    }, [])

    const finish = () => {
        localStorage.setItem('suppsync-onboarded', 'true')
        setShow(false)
    }

    if (!show) return null

    const current = STEPS[step]
    const Icon = current.icon

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    key={step}
                    className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-8 text-center"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    {/* Step indicator */}
                    <div className="flex justify-center space-x-2 mb-8">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : i < step ? 'w-4 bg-blue-500/40' : 'w-4 bg-slate-800'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <motion.div
                        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.color} mx-auto mb-6 flex items-center justify-center shadow-lg`}
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        <Icon className="w-10 h-10 text-white" />
                    </motion.div>

                    <h2 className="text-xl font-black text-white mb-1">{current.title}</h2>
                    <p className="text-sm text-blue-400 font-semibold mb-4">{current.subtitle}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-8">{current.description}</p>

                    {step < STEPS.length - 1 ? (
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-400 h-11"
                                onClick={finish}
                            >
                                Skip
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
                                onClick={() => setStep(s => s + 1)}
                            >
                                Next <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 font-bold"
                            onClick={finish}
                        >
                            Let's Go! 🚀
                        </Button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
