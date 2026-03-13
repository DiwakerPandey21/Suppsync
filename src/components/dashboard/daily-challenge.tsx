'use client'

import { useState, useEffect } from 'react'
import { Target, Check, Gift } from 'lucide-react'
import { motion } from 'framer-motion'
import { awardXp } from './xp-bar'

const CHALLENGES = [
    { id: 'early', text: 'Take all supplements before 10 AM', xp: 30, icon: '⏰' },
    { id: 'full', text: 'Complete 100% of your stack today', xp: 50, icon: '💯' },
    { id: 'workout', text: 'Log a workout today', xp: 25, icon: '🏋️' },
    { id: 'checkin', text: 'Complete your daily check-in', xp: 15, icon: '📝' },
    { id: 'streak', text: 'Maintain your streak for another day', xp: 20, icon: '🔥' },
    { id: 'research', text: 'Research a supplement in your stack', xp: 20, icon: '📚' },
    { id: 'social', text: 'Check out the social feed', xp: 10, icon: '👥' },
    { id: 'hydrate', text: 'Drink 8 glasses of water today', xp: 15, icon: '💧' },
    { id: 'timing', text: 'Check your Smart Timing suggestions', xp: 15, icon: '⏱️' },
    { id: 'share', text: 'Share your profile card with a friend', xp: 25, icon: '📤' },
]

function getDailyChallenge(): typeof CHALLENGES[0] {
    // Deterministic based on date
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    return CHALLENGES[seed % CHALLENGES.length]
}

export function DailyChallenge() {
    const [challenge] = useState(getDailyChallenge())
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        const key = `challenge_${new Date().toLocaleDateString('en-CA')}`
        if (localStorage.getItem(key) === 'done') {
            setCompleted(true)
        }
    }, [])

    const complete = async () => {
        if (completed) return
        setCompleted(true)
        const key = `challenge_${new Date().toLocaleDateString('en-CA')}`
        localStorage.setItem(key, 'done')
        await awardXp(challenge.xp)
    }

    return (
        <div className="w-full px-4 mb-4">
            <motion.div
                className={`border rounded-2xl p-4 transition-colors ${
                    completed
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                }`}
                layout
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-xl">{challenge.icon}</span>
                        <div>
                            <div className="flex items-center space-x-1.5">
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Daily Challenge</p>
                            </div>
                            <p className="text-xs text-white font-medium mt-0.5">{challenge.text}</p>
                        </div>
                    </div>

                    {completed ? (
                        <div className="flex items-center space-x-1 bg-green-500/20 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-[10px] font-bold text-green-400">Done!</span>
                        </div>
                    ) : (
                        <button
                            onClick={complete}
                            className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-full transition-colors"
                        >
                            <Gift className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">+{challenge.xp} XP</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
