import { motion } from 'framer-motion'

interface ProgressRingProps {
    completed: number
    total: number
}

export function ProgressRing({ completed, total }: ProgressRingProps) {
    const percentage = total > 0 ? (completed / total) * 100 : 0
    const radius = 60
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    // Dynamic glow color and intensity
    const glowIntensity = Math.min(1, percentage / 100)
    const isPerfect = percentage === 100

    return (
        <div className="relative flex items-center justify-center py-8">
            {/* Ambient Cosmic Background Glow behind the Ring */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: 200,
                    height: 200,
                    background: isPerfect
                        ? 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.1) 40%, rgba(0,0,0,0) 75%)'
                        : `radial-gradient(circle, rgba(59,130,246,${0.1 + glowIntensity * 0.15}) 0%, rgba(59,130,246,0) 70%)`,
                    filter: `blur(${15 + glowIntensity * 10}px)`
                }}
                animate={{
                    scale: isPerfect ? [1, 1.08, 1] : [1, 1.03, 1],
                    opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                    duration: isPerfect ? 2.5 : 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Glass Container Ring Wrapper */}
            <div className="absolute w-[180px] h-[180px] rounded-full border border-white/[0.04] bg-white/[0.01] pointer-events-none" />

            <div className="absolute flex flex-col items-center justify-center">
                <motion.span
                    className={`text-5xl font-black tracking-tighter ${isPerfect ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-white text-glow-blue'}`}
                    key={completed}
                    initial={{ scale: 1.15, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                >
                    {Math.round(percentage)}%
                </motion.span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {completed} of {total} Taken
                </span>
            </div>

            <svg className="transform -rotate-90 w-44 h-44 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
                <circle
                    className="text-white/[0.03]"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="88"
                    cy="88"
                />
                <motion.circle
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="url(#ringGradient)"
                    fill="transparent"
                    r={radius}
                    cx="88"
                    cy="88"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
            </svg>
        </div>
    )
}
