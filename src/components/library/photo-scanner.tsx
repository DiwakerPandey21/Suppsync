'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type ScanResult = {
    name: string
    dosage: string
    servings: string
    brand: string
}

export function PhotoScanner({ onResult }: { onResult: (result: ScanResult) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            setPreview(base64)
            analyzeImage(base64)
        }
        reader.readAsDataURL(file)
    }

    const analyzeImage = async (base64: string) => {
        setIsScanning(true)
        try {
            const prompt = `You are analyzing a supplement bottle label image. Extract the following information and respond with ONLY a JSON object (no markdown, no backticks):
{
  "name": "supplement name",
  "dosage": "serving size (e.g. 500mg)",
  "servings": "servings per container",
  "brand": "brand name"
}

If you cannot identify the product, use reasonable defaults. Respond ONLY with the JSON object.`

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
                onResult(parsed)
                setIsOpen(false)
                setPreview(null)
            }
        } catch (err) {
            console.error('Photo scanner error:', err)
        }
        setIsScanning(false)
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-400 hover:text-white h-9 text-xs"
                onClick={() => setIsOpen(true)}
            >
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Scan Label
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-6"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center">
                                    <Camera className="w-5 h-5 text-blue-400 mr-2" />
                                    Scan Supplement
                                </h3>
                                <button onClick={() => { setIsOpen(false); setPreview(null) }} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {preview ? (
                                <div className="text-center">
                                    <img src={preview} alt="Captured" className="w-full h-48 object-cover rounded-xl mb-4" />
                                    {isScanning && (
                                        <div className="flex items-center justify-center space-x-2 text-blue-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">AI is analyzing...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 mx-auto mb-4 flex items-center justify-center">
                                        <Camera className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <p className="text-sm text-slate-400 mb-6">Take a photo of the supplement bottle label</p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleCapture}
                                    />
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="w-4 h-4 mr-2" /> Take Photo
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
