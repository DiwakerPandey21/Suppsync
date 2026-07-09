'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
    children: ReactNode
    className?: string
    gradient?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'none'
    glow?: boolean
    padding?: boolean
}

const gradients = {
    blue: 'from-blue-500/15 via-blue-500/5 to-transparent',
    purple: 'from-violet-500/15 via-violet-500/5 to-transparent',
    emerald: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    amber: 'from-amber-500/15 via-amber-500/5 to-transparent',
    rose: 'from-rose-500/15 via-rose-500/5 to-transparent',
    cyan: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    none: '',
}

const glowColors = {
    blue: 'shadow-blue-500/10 border-blue-500/20',
    purple: 'shadow-violet-500/10 border-violet-500/20',
    emerald: 'shadow-emerald-500/10 border-emerald-500/20',
    amber: 'shadow-amber-500/10 border-amber-500/20',
    rose: 'shadow-rose-500/10 border-rose-500/20',
    cyan: 'shadow-cyan-500/10 border-cyan-500/20',
    none: '',
}

export function GlassCard({
    children,
    className = '',
    gradient = 'none',
    glow = false,
    padding = true,
}: GlassCardProps) {
    return (
        <motion.div
            className={`
                relative overflow-hidden rounded-3xl
                glass-panel
                ${gradient !== 'none' ? `bg-gradient-to-br ${gradients[gradient]}` : ''}
                ${glow ? `shadow-2xl ${glowColors[gradient]}` : ''}
                ${padding ? 'p-6' : ''}
                ${className}
            `}
            whileHover={gradient !== 'none' ? { 
                y: -4, 
                borderColor: 'rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,255,255,0.05)'
            } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Soft inner radial gradient highlight */}
            <div className="absolute inset-0 bg-radial-[circle_at_top_left] from-white/[0.05] via-transparent to-transparent pointer-events-none rounded-3xl" />
            
            {/* Dynamic Glass Shimmer overlay */}
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.01] to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

            <div className="relative z-10">{children}</div>
        </motion.div>
    )
}
