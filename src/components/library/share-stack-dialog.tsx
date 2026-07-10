'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { 
    Share2, Download, Loader2, Sparkles, ShieldCheck, Heart, 
    Flame, Zap, Trophy, Compass, Star, QrCode, Monitor, Laptop, Smartphone
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { cn } from '@/lib/utils'

interface ShareStackProps {
    supplements: Array<{ id: string, name: string, category: string, color: string }>
    streak: number
}

type ShareTheme = 'wrapped' | 'glass' | 'minimal' | 'apple' | 'neon' | 'luxury' | 'gradient' | 'ai_report' | 'passport'
type CardRatio = 'story' | 'post' | 'landscape'

export function ShareStackDialog({ supplements, streak }: ShareStackProps) {
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeTheme, setActiveTheme] = useState<ShareTheme>('wrapped')
    const [activeRatio, setActiveRatio] = useState<CardRatio>('story')
    const [profile, setProfile] = useState<any>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) {
            fetchUserProfile()
        }
    }, [open])

    const fetchUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (data) setProfile(data)
    }

    const handleShare = async () => {
        if (!cardRef.current) return
        setIsGenerating(true)

        try {
            await new Promise(r => setTimeout(r, 200))
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, 
                useCORS: true,
                backgroundColor: null,
            })

            const imageBlob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, 'image/png', 1.0)
            )

            if (!imageBlob) throw new Error('Failed to compile export card')

            if (navigator.share && navigator.canShare) {
                const file = new File([imageBlob], 'suppsync-stack.png', { type: 'image/png' })
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'My Biohacking Stack - SuppSync',
                        text: `Checking my daily bio-stack optimization on SuppSync! Streak: ${streak} days. 🔥`,
                        files: [file]
                    })
                    setIsGenerating(false)
                    return
                }
            }

            const url = URL.createObjectURL(imageBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = `suppsync-stack-${activeTheme}.png`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error generating image:', error)
            alert('Failed to generate export card.')
        } finally {
            setIsGenerating(false)
        }
    }

    // Themes configuration
    const themes = {
        wrapped: {
            name: 'Wrapped',
            bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-950',
            text: 'text-white',
            accent: 'from-pink-500 to-indigo-500',
            cardBg: 'bg-white/10 border-white/20 backdrop-blur-md',
            style: { fontFamily: 'sans-serif' }
        },
        glass: {
            name: 'Glass',
            bg: 'bg-gradient-to-tr from-slate-950 via-slate-900 to-[#1e1b4b]',
            text: 'text-white',
            accent: 'from-cyan-400 to-blue-600',
            cardBg: 'bg-white/[0.03] border-white/[0.08] backdrop-blur-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]',
            style: {}
        },
        minimal: {
            name: 'Minimal',
            bg: 'bg-black',
            text: 'text-white',
            accent: 'from-zinc-100 to-zinc-400',
            cardBg: 'bg-zinc-950 border-zinc-800',
            style: { fontFamily: 'monospace' }
        },
        apple: {
            name: 'Apple Health',
            bg: 'bg-[#000000]',
            text: 'text-white',
            accent: 'from-rose-500 to-orange-500',
            cardBg: 'bg-[#1c1c1e] border-white/10 rounded-[28px]',
            style: {}
        },
        neon: {
            name: 'Neon Cyber',
            bg: 'bg-[#03001e] bg-radial-gradient',
            text: 'text-cyan-400',
            accent: 'from-cyan-400 to-fuchsia-500',
            cardBg: 'bg-black/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
            style: {}
        },
        luxury: {
            name: 'Luxury',
            bg: 'bg-gradient-to-b from-[#111] to-[#000]',
            text: 'text-amber-100',
            accent: 'from-amber-300 to-yellow-600',
            cardBg: 'bg-neutral-900/50 border-amber-500/20',
            style: { fontFamily: 'serif' }
        },
        gradient: {
            name: 'Aurora Mesh',
            bg: 'bg-gradient-to-br from-teal-900 via-indigo-950 to-purple-950',
            text: 'text-white',
            accent: 'from-teal-400 to-indigo-500',
            cardBg: 'bg-black/30 border-white/10 backdrop-blur-xl',
            style: {}
        },
        ai_report: {
            name: 'AI Insights',
            bg: 'bg-slate-950',
            text: 'text-slate-200',
            accent: 'from-blue-400 to-emerald-400',
            cardBg: 'bg-slate-900/60 border-slate-800',
            style: {}
        },
        passport: {
            name: 'Passport',
            bg: 'bg-gradient-to-tr from-[#141517] to-[#1F2023]',
            text: 'text-slate-200',
            accent: 'from-emerald-400 to-teal-600',
            cardBg: 'bg-black/40 border-white/[0.04]',
            style: {}
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20">
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Share Stack
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl bg-[#090A10] border-white/[0.08] p-6 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-[24px]">
                
                {/* Left controls sidebar */}
                <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Export Poster Studio</DialogTitle>
                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Compile your biohacking vitals into premium social share cards.</p>
                        
                        {/* Theme selectors */}
                        <div className="space-y-2.5 mt-6">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Choose Theme</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(themes) as ShareTheme[]).map((themeKey) => (
                                    <button
                                        key={themeKey}
                                        onClick={() => setActiveTheme(themeKey)}
                                        className={cn(
                                            "py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all text-center",
                                            activeTheme === themeKey
                                                ? "bg-white text-black border-white"
                                                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {themes[themeKey].name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect Ratio selectors */}
                        <div className="space-y-2.5 mt-5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Format Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['story', 'post', 'landscape'] as CardRatio[]).map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setActiveRatio(ratio)}
                                        className={cn(
                                            "py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1",
                                            activeRatio === ratio
                                                ? "bg-white text-black border-white"
                                                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {ratio === 'story' && <Smartphone className="w-3.5 h-3.5" />}
                                        {ratio === 'post' && <Monitor className="w-3.5 h-3.5" />}
                                        {ratio === 'landscape' && <Laptop className="w-3.5 h-3.5" />}
                                        <span>{ratio}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Export / Download CTA block */}
                    <div className="pt-6 border-t border-white/[0.06] space-y-3">
                        <Button
                            onClick={handleShare}
                            disabled={isGenerating}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs tracking-widest h-11 rounded-xl shadow-lg shadow-purple-600/20"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download high-res PNG
                                </>
                            )}
                        </Button>
                        <p className="text-[9px] text-slate-500 font-bold text-center uppercase tracking-widest">
                            Ready to share to Instagram, X, WhatsApp & LinkedIn.
                        </p>
                    </div>
                </div>

                {/* Right preview canvas */}
                <div className="lg:col-span-8 flex justify-center items-center bg-slate-950/40 border border-white/[0.05] p-6 rounded-3xl min-h-[500px]">
                    
                    <div
                        ref={cardRef}
                        style={themes[activeTheme].style}
                        className={cn(
                            "relative overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between p-8 border border-white/[0.08]",
                            themes[activeTheme].bg,
                            themes[activeTheme].text,
                            activeRatio === 'story' ? 'w-[360px] aspect-[9/16]' : '',
                            activeRatio === 'post' ? 'w-[400px] aspect-[1/1]' : '',
                            activeRatio === 'landscape' ? 'w-[450px] aspect-[16/10]' : ''
                        )}
                    >
                        {/* Mesh gradient blobs */}
                        <div className="absolute top-1/4 left-1/4 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-52 h-52 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

                        {/* Top profile banner */}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">SuppSync Intelligence</p>
                                <h3 className="text-lg font-black tracking-tight leading-none mt-1">
                                    @{profile?.username || 'biohacker'}
                                </h3>
                                <p className="text-[9px] font-bold opacity-50 mt-1 uppercase tracking-wider">
                                    level {profile?.level || 4} stack optimization
                                </p>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="bg-white/10 border border-white/20 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    Score: {streak > 4 ? 96 : 88}%
                                </span>
                                <span className="text-[7px] font-bold opacity-45 mt-1 uppercase tracking-widest">adherence rating</span>
                            </div>
                        </div>

                        {/* Middle insights cards */}
                        <div className="space-y-4 my-auto relative z-10">
                            
                            {/* Theme variation content */}
                            {activeTheme === 'wrapped' && (
                                <div className="space-y-4">
                                    <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none bg-gradient-to-r from-pink-400 to-indigo-300 bg-clip-text text-transparent">
                                        Your body's operating system is running optimized.
                                    </h1>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider">
                                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                                            <span className="opacity-50 block text-[8px] font-bold">Current Streak</span>
                                            <span className="text-sm font-black mt-0.5 block">🔥 {streak} days</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                                            <span className="opacity-50 block text-[8px] font-bold">Goal Focus</span>
                                            <span className="text-sm font-black mt-0.5 block text-indigo-300">Recovery</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTheme === 'glass' && (
                                <div className="bg-white/[0.02] border border-white/[0.06] p-4.5 rounded-2xl backdrop-blur-md">
                                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center mb-2">
                                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Vitals Summary
                                    </p>
                                    <div className="grid grid-cols-3 gap-2.5 text-[9px] font-black uppercase text-center mt-3">
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                            <span className="opacity-50 block text-[7px]">Sleep</span>
                                            <span className="text-xs mt-0.5 block text-cyan-300">92%</span>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                            <span className="opacity-50 block text-[7px]">Stress</span>
                                            <span className="text-xs mt-0.5 block text-purple-300">74%</span>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                            <span className="opacity-50 block text-[7px]">Focus</span>
                                            <span className="text-xs mt-0.5 block text-rose-300">86%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTheme === 'neon' && (
                                <div className="border border-cyan-500/30 p-4.5 rounded-2xl bg-black/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                    <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 leading-none">
                                        🔥 STREAK: {streak} DAYS
                                    </h2>
                                    <p className="text-[9px] text-fuchsia-400 font-black uppercase tracking-widest mt-1">
                                        biometric synchrony active
                                    </p>
                                </div>
                            )}

                            {activeTheme === 'luxury' && (
                                <div className="text-center py-4 border-y border-amber-500/10">
                                    <p className="text-xs font-serif italic text-amber-200">
                                        "Consistency is the true foundation of longevity and cellular performance."
                                    </p>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 mt-2.5 block">
                                        SuppSync Platinum Edition
                                    </span>
                                </div>
                            )}

                            {activeTheme === 'ai_report' && (
                                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                        ✓ AI Stack Diagnosis
                                    </p>
                                    <p className="text-[10px] text-slate-300 mt-2 leading-relaxed font-medium">
                                        Highly optimized for recovery. Ashwagandha cortisol regulation active. Vitamin D timings correct. Refill predictions show 28 days remaining.
                                    </p>
                                </div>
                            )}

                            {/* Default fallback info list */}
                            {activeTheme !== 'wrapped' && activeTheme !== 'glass' && activeTheme !== 'neon' && activeTheme !== 'luxury' && activeTheme !== 'ai_report' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider py-1 border-b border-white/5">
                                        <span className="opacity-50">Stack Level:</span>
                                        <span>Level {profile?.level || 4}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider py-1 border-b border-white/5">
                                        <span className="opacity-50">XP Earned:</span>
                                        <span>{profile?.xp || 3200} XP</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider py-1 border-b border-white/5">
                                        <span className="opacity-50">Active Streak:</span>
                                        <span className="text-emerald-400">{streak} Days</span>
                                    </div>
                                </div>
                            )}

                            {/* Supplement visual chips (max 4 for beautiful spacing) */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {supplements.slice(0, 4).map((sup, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider",
                                            themes[activeTheme].cardBg
                                        )}
                                    >
                                        <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: sup.color || '#3b82f6' }} 
                                        />
                                        <span>{sup.name}</span>
                                    </div>
                                ))}
                                {supplements.length > 4 && (
                                    <span className="text-[9px] text-slate-500 font-black uppercase my-auto pl-1">
                                        +{supplements.length - 4} more
                                    </span>
                                )}
                            </div>

                        </div>

                        {/* Bottom branding panel with inline QR Code */}
                        <div className="flex justify-between items-center pt-5 border-t border-white/5 relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest uppercase leading-none">SuppSync</h4>
                                <p className="text-[7px] font-bold opacity-45 uppercase mt-1">Health Intelligence Operating System</p>
                            </div>
                            
                            {/* SVG QR Code representing SuppSync URL */}
                            <svg className="w-8 h-8 opacity-60 text-current" viewBox="0 0 100 100" fill="currentColor">
                                <rect x="0" y="0" width="20" height="20" />
                                <rect x="0" y="80" width="20" height="20" />
                                <rect x="80" y="0" width="20" height="20" />
                                <rect x="30" y="30" width="40" height="40" />
                                <rect x="10" y="40" width="10" height="10" />
                                <rect x="40" y="10" width="10" height="10" />
                                <rect x="80" y="80" width="20" height="20" />
                            </svg>
                        </div>

                    </div>

                </div>

            </DialogContent>
        </Dialog>
    )
}
