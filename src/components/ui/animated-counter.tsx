'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedCounterProps {
    value: number
    suffix?: string
    prefix?: string
    duration?: number
    className?: string
    decimals?: number
}

export function AnimatedCounter({
    value,
    suffix = '',
    prefix = '',
    duration = 1.2,
    className = '',
    decimals = 0,
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        const startTime = performance.now()
        const startValue = 0

        const animate = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3)

            const current = startValue + (value - startValue) * easedProgress
            setDisplayValue(current)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [isInView, value, duration])

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3 }}
        >
            {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}{suffix}
        </motion.span>
    )
}
