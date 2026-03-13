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
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
            <div className="relative bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/40">
                {/* Animated sliding indicator */}
                {activeIndex >= 0 && (
                    <motion.div
                        className="absolute top-0 h-full rounded-2xl bg-blue-500/10 border border-blue-500/20"
                        style={{ width: `${100 / tabs.length}%` }}
                        animate={{ x: `${activeIndex * 100}%` }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                )}

                <div className="flex justify-around items-center h-16 px-2 relative z-10">
                    {tabs.map((tab, index) => {
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-200 relative',
                                    isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                                )}
                            >
                                <motion.div
                                    animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <tab.icon className="w-5 h-5" />
                                </motion.div>
                                <span className={cn(
                                    "text-[10px] font-semibold transition-all",
                                    isActive ? "text-blue-400" : "text-slate-600"
                                )}>
                                    {tab.name}
                                </span>

                                {/* Active dot indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabDot"
                                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-blue-400"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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
