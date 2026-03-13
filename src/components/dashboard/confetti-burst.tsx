'use client'

import { useEffect, useState, useCallback } from 'react'

interface Particle {
    id: number
    x: number
    y: number
    color: string
    size: number
    rotation: number
    velocityX: number
    velocityY: number
    opacity: number
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#06b6d4', '#f97316']

export function ConfettiBurst({ trigger }: { trigger: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([])

    const createParticles = useCallback(() => {
        const newParticles: Particle[] = []
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: 50 + (Math.random() - 0.5) * 20, // Start near center (%)
                y: 35,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 4 + Math.random() * 8,
                rotation: Math.random() * 360,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: -(3 + Math.random() * 6),
                opacity: 1
            })
        }
        setParticles(newParticles)

        // Animate particles
        let frame = 0
        const animate = () => {
            frame++
            setParticles(prev =>
                prev.map(p => ({
                    ...p,
                    x: p.x + p.velocityX * 0.3,
                    y: p.y + p.velocityY * 0.3,
                    velocityY: p.velocityY + 0.15, // gravity
                    rotation: p.rotation + p.velocityX * 3,
                    opacity: Math.max(0, p.opacity - 0.015)
                })).filter(p => p.opacity > 0)
            )
            if (frame < 120) {
                requestAnimationFrame(animate)
            } else {
                setParticles([])
            }
        }
        requestAnimationFrame(animate)
    }, [])

    useEffect(() => {
        if (trigger) {
            createParticles()
        }
    }, [trigger, createParticles])

    if (particles.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transform: `rotate(${p.rotation}deg)`,
                        opacity: p.opacity,
                        transition: 'none'
                    }}
                />
            ))}
        </div>
    )
}
