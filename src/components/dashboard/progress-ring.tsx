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
        <div className="relative flex items-center justify-center py-6">
            {/* Animated glow behind the ring */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 180,
                    height: 180,
                    background: isPerfect
                        ? 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0) 70%)'
                        : `radial-gradient(circle, rgba(59,130,246,${0.05 + glowIntensity * 0.25}) 0%, rgba(59,130,246,0) 70%)`,
                    filter: `blur(${10 + glowIntensity * 15}px)`
                }}
                animate={{
                    scale: isPerfect ? [1, 1.15, 1] : [1, 1.05, 1],
                    opacity: [0.6, 1, 0.6]
                }}
                transition={{
                    duration: isPerfect ? 1.5 : 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            <div className="absolute flex flex-col items-center justify-center">
                <motion.span
                    className={`text-4xl font-black ${isPerfect ? 'text-green-400' : 'text-white'}`}
                    key={completed}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    {completed}
                </motion.span>
                <span className="text-xs text-slate-400 font-medium">of {total} taken</span>
            </div>

            <svg className="transform -rotate-90 w-40 h-40">
                <circle
                    className="text-slate-800"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="80"
                    cy="80"
                />
                <motion.circle
                    className={isPerfect ? 'text-green-500' : 'text-[#3b82f6]'}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="80"
                    cy="80"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
        </div>
    )
}
