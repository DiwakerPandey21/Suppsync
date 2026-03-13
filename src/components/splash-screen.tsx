'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoFull } from '@/components/ui/logo'

// Pre-computed deterministic particle configs to avoid SSR/client Math.random() mismatch
const PARTICLE_CONFIGS = [
    { w: 3, l: 5, t: 12, o: 0.3, dy: -45, dx: 8, dur: 4.2, del: 0.3 },
    { w: 5, l: 22, t: 78, o: 0.4, dy: -55, dx: -12, dur: 5.1, del: 1.1 },
    { w: 2, l: 45, t: 34, o: 0.25, dy: -35, dx: 5, dur: 3.8, del: 0.8 },
    { w: 4, l: 68, t: 56, o: 0.35, dy: -50, dx: -8, dur: 6.2, del: 1.5 },
    { w: 3, l: 82, t: 23, o: 0.3, dy: -40, dx: 10, dur: 4.5, del: 0.2 },
    { w: 5, l: 15, t: 67, o: 0.45, dy: -60, dx: -5, dur: 5.8, del: 1.8 },
    { w: 2, l: 35, t: 89, o: 0.28, dy: -38, dx: 12, dur: 3.5, del: 0.6 },
    { w: 4, l: 55, t: 15, o: 0.32, dy: -48, dx: -10, dur: 4.8, del: 1.2 },
    { w: 3, l: 92, t: 45, o: 0.38, dy: -42, dx: 7, dur: 5.5, del: 0.4 },
    { w: 5, l: 8, t: 92, o: 0.42, dy: -52, dx: -14, dur: 6.0, del: 1.6 },
    { w: 2, l: 42, t: 8, o: 0.22, dy: -33, dx: 9, dur: 4.0, del: 0.9 },
    { w: 4, l: 72, t: 72, o: 0.36, dy: -58, dx: -6, dur: 5.3, del: 1.3 },
    { w: 3, l: 28, t: 48, o: 0.3, dy: -44, dx: 11, dur: 3.7, del: 0.1 },
    { w: 5, l: 58, t: 82, o: 0.4, dy: -36, dx: -9, dur: 6.5, del: 1.9 },
    { w: 2, l: 88, t: 62, o: 0.26, dy: -46, dx: 6, dur: 4.3, del: 0.7 },
    { w: 4, l: 18, t: 38, o: 0.34, dy: -54, dx: -11, dur: 5.6, del: 1.0 },
    { w: 3, l: 48, t: 95, o: 0.32, dy: -40, dx: 13, dur: 3.9, del: 1.7 },
    { w: 5, l: 78, t: 18, o: 0.44, dy: -50, dx: -7, dur: 4.6, del: 0.5 },
    { w: 2, l: 62, t: 52, o: 0.24, dy: -38, dx: 8, dur: 5.9, del: 1.4 },
    { w: 4, l: 38, t: 28, o: 0.38, dy: -56, dx: -13, dur: 4.1, del: 0.0 },
]
const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4']

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    return 100
                }
                return prev + 4
            })
        }, 80)

        const timer = setTimeout(() => {
            setShowSplash(false)
        }, 2500)

        return () => {
            clearTimeout(timer)
            clearInterval(interval)
        }
    }, [])

    return (
        <>
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        key="splash-screen"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F172A] overflow-hidden"
                    >
                        {/* Floating particles background */}
                        {PARTICLE_CONFIGS.map((p, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: p.w,
                                    height: p.w,
                                    left: `${p.l}%`,
                                    top: `${p.t}%`,
                                    backgroundColor: COLORS[i % 3],
                                    opacity: p.o,
                                }}
                                animate={{
                                    y: [0, p.dy, 0],
                                    x: [0, p.dx, 0],
                                    opacity: [0.2, 0.6, 0.2],
                                }}
                                transition={{
                                    duration: p.dur,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: p.del,
                                }}
                            />
                        ))}

                        {/* 3D Heartbeat Animation Container */}
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1, 1.15, 1],
                                rotateY: [0, 5, -5, 5, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <LogoFull />
                        </motion.div>

                        {/* Tagline */}
                        <motion.p
                            className="text-slate-500 text-sm font-medium mt-6 tracking-wider"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            Your daily supplement companion
                        </motion.p>

                        {/* Progress bar */}
                        <motion.div
                            className="absolute bottom-16 w-48 h-1 bg-slate-800 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full"
                                style={{ width: `${progress}%` }}
                                transition={{ duration: 0.1 }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main App Content */}
            {children}
        </>
    )
}
