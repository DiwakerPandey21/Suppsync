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
    blue: 'from-blue-500/10 via-transparent to-transparent',
    purple: 'from-violet-500/10 via-transparent to-transparent',
    emerald: 'from-emerald-500/10 via-transparent to-transparent',
    amber: 'from-amber-500/10 via-transparent to-transparent',
    rose: 'from-rose-500/10 via-transparent to-transparent',
    cyan: 'from-cyan-500/10 via-transparent to-transparent',
    none: '',
}

const glowColors = {
    blue: 'shadow-blue-500/5',
    purple: 'shadow-violet-500/5',
    emerald: 'shadow-emerald-500/5',
    amber: 'shadow-amber-500/5',
    rose: 'shadow-rose-500/5',
    cyan: 'shadow-cyan-500/5',
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
                relative overflow-hidden rounded-2xl
                bg-white/[0.03] backdrop-blur-xl
                border border-white/[0.06]
                ${gradient !== 'none' ? `bg-gradient-to-br ${gradients[gradient]}` : ''}
                ${glow ? `shadow-xl ${glowColors[gradient]}` : ''}
                ${padding ? 'p-4' : ''}
                ${className}
            `}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Subtle inner shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    )
}
