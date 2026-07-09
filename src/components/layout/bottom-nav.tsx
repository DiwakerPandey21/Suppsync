'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Pill, Activity, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function BottomNav() {
    const pathname = usePathname()

    const tabs = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Social', href: '/social', icon: Users },
        { name: 'Library', href: '/library', icon: Pill },
        { name: 'Labs', href: '/labs', icon: Activity },
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const activeIndex = tabs.findIndex(tab => pathname === tab.href)

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-md">
            <div className="relative glass-panel rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-white/[0.06] overflow-hidden">
                {/* Animated sliding indicator background */}
                {activeIndex >= 0 && (
                    <motion.div
                        className="absolute top-2 bottom-2 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/15"
                        style={{ width: `${(100 / tabs.length) - 4}%` }}
                        animate={{ left: `${activeIndex * (100 / tabs.length) + 2}%` }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                )}
 
                <div className="flex justify-around items-center h-18 px-2 relative z-10">
                    {tabs.map((tab, index) => {
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300 relative',
                                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                )}
                            >
                                <motion.div
                                    animate={isActive ? { y: -3, scale: 1.1 } : { y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                                >
                                    <tab.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-blue-400 text-glow-blue" : "text-slate-500")} />
                                </motion.div>
                                <span className={cn(
                                    "text-[9px] font-bold tracking-wider uppercase transition-all duration-300",
                                    isActive ? "text-blue-300 opacity-100" : "text-slate-500 opacity-70"
                                )}>
                                    {tab.name}
                                </span>
 
                                {/* Active glowing bar indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-1 w-8 h-[2px] rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
