'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Share2, Download, Loader2, Dumbbell, Flame } from 'lucide-react'
import html2canvas from 'html2canvas'
import { LogoGraphic } from '@/components/ui/logo'

interface ShareStackProps {
    supplements: Array<{ id: string, name: string, category: string, color: string }>
    streak: number
}

export function ShareStackDialog({ supplements, streak }: ShareStackProps) {
    const [open, setOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleShare = async () => {
        if (!cardRef.current) return
        setIsGenerating(true)

        try {
            // Give the browser a moment to ensure fonts/images are rendered
            await new Promise(r => setTimeout(r, 100))

            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // High resolution
                useCORS: true,
                backgroundColor: '#0F172A', // Match our slate-900 theme
            })

            const imageBlob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, 'image/png', 1.0)
            )

            if (!imageBlob) throw new Error('Failed to generate image')

            // Try native share API if supported (mobile usually)
            if (navigator.share && navigator.canShare) {
                const file = new File([imageBlob], 'my-stack.png', { type: 'image/png' })
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'My Daily Stack',
                        text: `Check out my daily fitness stack! Currently on a ${streak} day streak. 🔥`,
                        files: [file]
                    })
                    setIsGenerating(false)
                    return
                }
            }

            // Fallback to download for Desktop or unsupported browsers
            const url = URL.createObjectURL(imageBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'my-gym-stack.png'
            a.click()
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Error generating image:', error)
            alert('Failed to generate share graphic.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Stack
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[400px] bg-[#0F172A] border-slate-800 p-0 overflow-hidden text-white">
                <DialogTitle className="sr-only">Share Your Daily Supplement Stack</DialogTitle>

                {/* The "Hidden" Card we actually screenshot. We display it on screen so the user sees a preview */}
                <div className="p-6 bg-slate-900 w-full relative flex justify-center">

                    {/* The exact DOM element html2canvas will target */}
                    <div
                        ref={cardRef}
                        className="w-[340px] overflow-hidden relative shadow-2xl"
                        style={{
                            aspectRatio: '4/5',
                            backgroundColor: '#0F172A',
                            background: 'linear-gradient(to bottom right, #0F172A, #020617)',
                            borderColor: 'rgba(30, 41, 59, 0.5)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: '#ffffff'
                        }}
                    >
                        {/* Background glow effects - explicit hex to avoid lab() errors */}
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" style={{ backgroundColor: '#2563eb', opacity: 0.15 }} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" style={{ backgroundColor: '#a855f7', opacity: 0.15 }} />

                        <div className="relative z-10 p-6 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight uppercase italic mb-1" style={{ color: '#ffffff' }}>My Daily Stack</h2>
                                    <div
                                        className="flex items-center space-x-1.5 w-fit px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(51, 65, 85, 0.5)', borderWidth: '1px', borderStyle: 'solid' }}
                                    >
                                        <Flame className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
                                        <span className="font-bold text-xs" style={{ color: '#ffffff' }}>{streak} Day Streak</span>
                                    </div>
                                </div>
                                <LogoGraphic className="w-8 h-8 opacity-50" />
                            </div>

                            {/* Supplements List */}
                            <div className="flex-1 space-y-3 relative z-10">
                                {supplements.slice(0, 6).map((sup, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center space-x-3 p-3 rounded-lg backdrop-blur-sm"
                                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', borderColor: 'rgba(30, 41, 59, 0.5)', borderWidth: '1px', borderStyle: 'solid' }}
                                    >
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: sup.color }} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm leading-none" style={{ color: '#ffffff' }}>{sup.name}</p>
                                            <p className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#94a3b8' }}>{sup.category}</p>
                                        </div>
                                    </div>
                                ))}

                                {supplements.length > 6 && (
                                    <p className="text-xs font-medium italic text-center mt-2" style={{ color: '#64748b' }}>
                                        + {supplements.length - 6} more supplements...
                                    </p>
                                )}
                            </div>

                            {/* Footer Logo Watermark */}
                            <div className="mt-6 flex flex-col items-center justify-center opacity-40">
                                <Dumbbell className="w-5 h-5 mb-1" style={{ color: '#60a5fa' }} />
                                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>Gym Supplement Tracker</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <Button
                        onClick={handleShare}
                        disabled={isGenerating}
                        className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-medium"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : typeof navigator !== 'undefined' && 'share' in navigator ? (
                            <>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Stack
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PNG
                            </>
                        )}
                    </Button>
                    <p className="text-center text-[10px] text-slate-500 mt-3 font-medium">
                        Generates an Instagram-ready portrait graphic of your routine.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
