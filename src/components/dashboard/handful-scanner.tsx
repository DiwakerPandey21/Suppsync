'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

type IdentifiedPill = {
    name: string
    dosage_amount: number
    dosage_unit: string
    confidence: number // 1-100
    reason: string // e.g., "Large white oval pill matches your Calcium"
    schedule_id?: string
}

export function HandfulScanner({ onLogsCompleted }: { onLogsCompleted: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [results, setResults] = useState<IdentifiedPill[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const supabase = createClient()

    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            setPreview(base64)
            analyzeHandful(base64)
        }
        reader.readAsDataURL(file)
    }

    const analyzeHandful = async (base64: string) => {
        setIsScanning(true)
        setResults([])
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            // 1. Fetch user's active schedules to build context for the AI
            const { data: schedules } = await supabase
                .from('schedules')
                .select('id, dosage_amount, dosage_unit, supplements(name, form)')
                .eq('user_id', user.id)
                .eq('is_active', true)

            // 2. Build the context string
            const inventoryContext = schedules?.map(s => {
                const supp = Array.isArray(s.supplements) ? s.supplements[0] : s.supplements
                return `- ${supp?.name} (${s.dosage_amount}${s.dosage_unit}, Form: ${supp?.form}) [ID: ${s.id}]`
            }).join('\n')

            const prompt = `You are an expert Vision AI designed to identify supplements in a user's hand. 
You will be given an image of a handful of pills/capsules/gummies.
Here is the user's known active inventory:
${inventoryContext}

Task: Identify EVERY distinct pill in the image by cross-referencing visual traits (color, size, shape, form) with the user's inventory.
Respond with ONLY a JSON array of objects (no markdown, no backticks).
Format:
[
  {
    "name": "Matched Supplement Name",
    "dosage_amount": 1,
    "dosage_unit": "pill",
    "confidence": 95,
    "reason": "Clear visual match (red capsule)",
    "schedule_id": "the ID from the context"
  }
]

If a pill does not match the inventory, try to guess what it is but omit the schedule_id and lower the confidence. RETURN ONLY PARSABLE JSON.`

            // Call the same Gemini endpoint we use for the single photo scanner, but with our advanced prompt
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, image: base64 })
            })

            if (res.ok) {
                const data = await res.json()
                let parsed = data.response
                if (typeof parsed === 'string') {
                    parsed = parsed.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    parsed = JSON.parse(parsed)
                }
                setResults(parsed)
            }
        } catch (err) {
            console.error('Handful scanner error:', err)
            alert("Failed to analyze image. Please try again.")
            setPreview(null)
        }
        setIsScanning(false)
    }

    const confirmAndLog = async () => {
        setIsScanning(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const dateStr = new Date().toLocaleDateString('en-CA')
            
            // Only log items that matched an active schedule
            const validLogs = results.filter(r => r.schedule_id).map(r => ({
                user_id: user.id,
                schedule_id: r.schedule_id,
                log_date: dateStr,
                status: 'taken'
            }))

            if (validLogs.length > 0) {
                await supabase.from('logs').upsert(validLogs, { onConflict: 'schedule_id,log_date' })
                
                // Note: In a full robust app, we'd also decrement inventory here based on dosages
            }
            
            setIsOpen(false)
            setPreview(null)
            setResults([])
            onLogsCompleted() // trigger dashboard refresh

        } catch (err) {
            console.error('Error logging handful:', err)
        }
        setIsScanning(false)
    }

    return (
        <>
            <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-none h-12 rounded-xl font-bold"
                onClick={() => setIsOpen(true)}
            >
                <Wand2 className="w-5 h-5 mr-2 text-violet-200" />
                Vision AI: Scan Handful
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-500/30">
                                        <Sparkles className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-lg leading-tight">Handful Scanner</h3>
                                        <p className="text-[10px] text-slate-400">Log multiple pills at once</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsOpen(false); setPreview(null); setResults([]) }} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!preview ? (
                                <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-dashed border-slate-700">
                                    <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 mx-auto mb-4 flex items-center justify-center relative">
                                        <Camera className="w-8 h-8 text-violet-400" />
                                        <div className="absolute inset-0 border-2 border-violet-500/20 rounded-full animate-ping opacity-20" />
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Put pills in your palm</h4>
                                    <p className="text-xs text-slate-400 mb-6 max-w-[200px] mx-auto">
                                        Take one clear photo of all the supplements you are about to take.
                                    </p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleCapture}
                                    />
                                    <Button
                                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="w-4 h-4 mr-2" /> Open Camera
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-48">
                                        <img src={preview} alt="Captured handful" className="w-full h-full object-cover" />
                                        {isScanning && !results.length && (
                                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                                <p className="text-sm font-bold text-violet-400">AI mapping to inventory...</p>
                                            </div>
                                        )}
                                    </div>

                                    {results.length > 0 && (
                                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-[250px] overflow-y-auto">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Identified ({results.length})</h4>
                                            <div className="space-y-2">
                                                {results.map((pill, idx) => (
                                                    <div key={idx} className="flex flex-col p-3 rounded-xl bg-slate-900 border border-slate-800">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-sm font-bold text-white">{pill.name}</span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pill.confidence > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                {pill.confidence}% Match
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-500 truncate">{pill.reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <Button 
                                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                                onClick={confirmAndLog}
                                                disabled={isScanning}
                                            >
                                                {isScanning ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Log All ${results.filter(r => r.schedule_id).length} Matches`}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
