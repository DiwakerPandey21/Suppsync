'use client'

import { useRef, useState } from 'react'
import { Share2, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ShareCardProps = {
    userName: string
    totalDoses: number
    streak: number
    daysActive: number
    badgesUnlocked: number
    totalBadges: number
}

export function ShareableProfileCard({
    userName, totalDoses, streak, daysActive, badgesUnlocked, totalBadges
}: ShareCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const generateCard = async (): Promise<Blob | null> => {
        const canvas = canvasRef.current
        if (!canvas) return null

        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const W = 600
        const H = 340
        canvas.width = W
        canvas.height = H

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, W, H)
        bg.addColorStop(0, '#0F172A')
        bg.addColorStop(0.5, '#1E1B4B')
        bg.addColorStop(1, '#0F172A')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, W, H)

        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)'
        ctx.lineWidth = 1
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
        }
        for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
        }

        // Decorative glow circles
        const drawGlow = (x: number, y: number, r: number, color: string) => {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r)
            glow.addColorStop(0, color)
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.fillRect(x - r, y - r, r * 2, r * 2)
        }
        drawGlow(100, 80, 120, 'rgba(59, 130, 246, 0.15)')
        drawGlow(500, 260, 100, 'rgba(168, 85, 247, 0.12)')

        // Avatar circle with gradient
        const avatarX = 80, avatarY = 80, avatarR = 32
        const avatarGrad = ctx.createLinearGradient(avatarX - avatarR, avatarY - avatarR, avatarX + avatarR, avatarY + avatarR)
        avatarGrad.addColorStop(0, '#3b82f6')
        avatarGrad.addColorStop(0.5, '#8b5cf6')
        avatarGrad.addColorStop(1, '#06b6d4')
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2)
        ctx.fillStyle = avatarGrad
        ctx.fill()

        // Avatar letter
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(userName.charAt(0).toUpperCase(), avatarX, avatarY + 1)

        // Username
        ctx.textAlign = 'left'
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(userName, 130, 72)

        // Subtitle
        ctx.font = '13px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = '#64748B'
        ctx.fillText('SuppSync Biohacker', 130, 95)

        // Divider line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(40, 135)
        ctx.lineTo(W - 40, 135)
        ctx.stroke()

        // Stats boxes
        const stats = [
            { label: 'DOSES', value: String(totalDoses), color: '#3b82f6' },
            { label: 'STREAK', value: String(streak), color: '#f97316' },
            { label: 'DAYS', value: String(daysActive), color: '#22c55e' },
            { label: 'BADGES', value: `${badgesUnlocked}/${totalBadges}`, color: '#eab308' },
        ]

        const boxW = 110, boxH = 80, startX = 40, startY = 155, gap = 18
        stats.forEach((stat, i) => {
            const bx = startX + i * (boxW + gap)

            // Box bg
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)'
            ctx.lineWidth = 1
            const r = 12
            ctx.beginPath()
            ctx.moveTo(bx + r, startY)
            ctx.lineTo(bx + boxW - r, startY)
            ctx.quadraticCurveTo(bx + boxW, startY, bx + boxW, startY + r)
            ctx.lineTo(bx + boxW, startY + boxH - r)
            ctx.quadraticCurveTo(bx + boxW, startY + boxH, bx + boxW - r, startY + boxH)
            ctx.lineTo(bx + r, startY + boxH)
            ctx.quadraticCurveTo(bx, startY + boxH, bx, startY + boxH - r)
            ctx.lineTo(bx, startY + r)
            ctx.quadraticCurveTo(bx, startY, bx + r, startY)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()

            // Value
            ctx.textAlign = 'center'
            ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
            ctx.fillStyle = stat.color
            ctx.fillText(stat.value, bx + boxW / 2, startY + 35)

            // Label
            ctx.font = 'bold 9px system-ui, -apple-system, sans-serif'
            ctx.fillStyle = '#64748B'
            ctx.letterSpacing = '2px'
            ctx.fillText(stat.label, bx + boxW / 2, startY + 58)
        })

        // Bottom branding
        ctx.textAlign = 'center'
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
        const brandGrad = ctx.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0)
        brandGrad.addColorStop(0, '#3b82f6')
        brandGrad.addColorStop(1, '#8b5cf6')
        ctx.fillStyle = brandGrad
        ctx.fillText('💊 SuppSync', W / 2, H - 30)

        ctx.font = '10px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = '#475569'
        ctx.fillText('Your Daily Supplement Companion', W / 2, H - 14)

        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    }

    const handleDownload = async () => {
        setIsGenerating(true)
        const blob = await generateCard()
        if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `suppsync_${userName}.png`
            a.click()
            URL.revokeObjectURL(url)
        }
        setIsGenerating(false)
    }

    const handleShare = async () => {
        setIsGenerating(true)
        const blob = await generateCard()
        if (blob && navigator.share) {
            const file = new File([blob], `suppsync_${userName}.png`, { type: 'image/png' })
            try {
                await navigator.share({
                    title: 'My SuppSync Stats',
                    text: `Check out my supplement tracking stats on SuppSync! 💊`,
                    files: [file],
                })
            } catch (err) {
                // User cancelled share - fallback to download
                handleDownload()
            }
        } else {
            await handleDownload()
        }
        setIsGenerating(false)
    }

    return (
        <div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-900 text-slate-300 h-11"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Download
                </Button>
                <Button
                    onClick={handleShare}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                    Share
                </Button>
            </div>
        </div>
    )
}
