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
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-md pointer-events-auto">
            {/* Liquid Glass dock wrapper */}
            <div className="relative rounded-[30px] border border-white/[0.08] bg-[#050816]/40 backdrop-blur-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(59,130,246,0.03)] overflow-hidden py-2 px-3">
                {/* Aurora Reflections inside the dock */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="absolute -top-1/2 left-1/4 w-1/2 h-1/2 bg-cyan-400/8 blur-[30px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-1/2 right-1/4 w-1/2 h-1/2 bg-purple-400/5 blur-[30px] rounded-full pointer-events-none" />

                {/* Liquid sliding highlight behind active tab */}
                {activeIndex >= 0 && (
                    <motion.div
                        layoutId="liquidHighlight"
                        className="absolute top-1.5 bottom-1.5 rounded-[22px] bg-gradient-to-r from-cyan-500/[0.06] to-purple-500/[0.06] border border-cyan-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_4px_12px_rgba(6,182,212,0.1)]"
                        style={{ width: `${(100 / tabs.length) - 2}%` }}
                        animate={{ left: `${activeIndex * (100 / tabs.length) + 1}%` }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}

                <div className="flex justify-between items-center h-14 relative z-10">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className="flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer"
                            >
                                {/* Micro-interacting Tab Content */}
                                <motion.div
                                    className="flex flex-col items-center justify-center relative"
                                    whileHover={{ y: -2 }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                                >
                                    {/* Icon with spring scale and gentle rotate */}
                                    <motion.div
                                        animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                        whileHover={{ rotate: 3 }}
                                        transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                                    >
                                        <tab.icon className={cn(
                                            "w-5 h-5 transition-colors duration-300",
                                            isActive 
                                                ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                                                : "text-slate-400 group-hover:text-slate-200"
                                        )} />
                                    </motion.div>

                                    {/* Label: active shows inline, hover slides in from bottom */}
                                    <span className={cn(
                                        "text-[8px] font-black tracking-widest uppercase transition-all duration-300 pointer-events-none mt-1",
                                        isActive 
                                            ? "text-cyan-300 opacity-100 translate-y-0" 
                                            : "text-slate-500 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 absolute top-6 text-slate-300"
                                    )}>
                                        {tab.name}
                                    </span>
                                </motion.div>

                                {/* Active fluid bar indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDot"
                                        className="absolute bottom-1 w-4 h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
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
