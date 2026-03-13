'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Image, Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/dashboard/glass-card'

type ProgressPhoto = {
    id: string
    url: string
    label: string
    created_at: string
}

export function ProgressPhotos() {
    const supabase = createClient()
    const [photos, setPhotos] = useState<ProgressPhoto[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [label, setLabel] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => { loadPhotos() }, [])

    const loadPhotos = async () => {
        // For now, use localStorage since file uploads require Supabase Storage setup
        const stored = localStorage.getItem('suppsync-progress-photos')
        if (stored) setPhotos(JSON.parse(stored))
    }

    const savePhotos = (updated: ProgressPhoto[]) => {
        setPhotos(updated)
        localStorage.setItem('suppsync-progress-photos', JSON.stringify(updated))
    }

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            const newPhoto: ProgressPhoto = {
                id: Date.now().toString(),
                url: dataUrl,
                label: label || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                created_at: new Date().toISOString(),
            }
            savePhotos([newPhoto, ...photos])
            setIsCapturing(false)
            setLabel('')
        }
        reader.readAsDataURL(file)
    }

    const deletePhoto = (id: string) => {
        savePhotos(photos.filter(p => p.id !== id))
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <p className="text-sm font-bold text-white">Progress Photos</p>
                </div>
                <button
                    onClick={() => setIsCapturing(!isCapturing)}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors"
                >
                    + Add Photo
                </button>
            </div>

            <AnimatePresence>
                {isCapturing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <GlassCard gradient="rose">
                            <input
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="Label (e.g. Week 4 Front)"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none mb-2"
                            />
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFile}
                                className="hidden"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="flex items-center justify-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-xs font-bold transition-colors"
                                >
                                    <Camera className="w-3 h-3" />
                                    <span>Camera</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (fileRef.current) {
                                            fileRef.current.removeAttribute('capture')
                                            fileRef.current.click()
                                            fileRef.current.setAttribute('capture', 'environment')
                                        }
                                    }}
                                    className="flex items-center justify-center space-x-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-xs font-bold transition-colors"
                                >
                                    <Image className="w-3 h-3" />
                                    <span>Gallery</span>
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {photos.length === 0 ? (
                <div className="text-center py-6">
                    <Camera className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Track your transformation</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, i) => (
                        <motion.div
                            key={photo.id}
                            className="relative group rounded-xl overflow-hidden border border-slate-800"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <img src={photo.url} alt={photo.label} className="w-full h-32 object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-[10px] text-white font-bold">{photo.label}</p>
                                <p className="text-[8px] text-slate-400">
                                    {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => deletePhoto(photo.id)}
                                className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
