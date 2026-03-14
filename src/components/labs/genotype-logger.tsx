'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Dna, Plus, X, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'

const COMMON_MARKERS = [
    { name: 'MTHFR C677T', desc: 'Folate metabolism. Affects B-vitamin methylation.' },
    { name: 'COMT V158M', desc: 'Dopamine/Estrogen breakdown. Affects stress response to stimulants.' },
    { name: 'APOE4', desc: 'Lipid metabolism. Associated with saturated fat response.' },
    { name: 'VDR Taq', desc: 'Vitamin D receptor efficiency.' },
    { name: 'FTO', desc: 'Fat mass and obesity-associated.' },
    { name: 'CYP1A2', desc: 'Caffeine metabolism speed.' }
]

export function GenotypeLogger({ userId, onUpdate }: { userId: string, onUpdate: () => void }) {
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [search, setSearch] = useState('')
    
    // Form state
    const [selectedMarker, setSelectedMarker] = useState(COMMON_MARKERS[0].name)
    const [customMarker, setCustomMarker] = useState('')
    const [status, setStatus] = useState('Heterozygous')
    const [notes, setNotes] = useState('')

    const filteredMarkers = COMMON_MARKERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

    const handleSave = async () => {
        setIsSubmitting(true)
        const finalMarker = selectedMarker === 'custom' ? customMarker : selectedMarker

        if (!finalMarker.trim()) {
            setIsSubmitting(false)
            return
        }

        const { error } = await supabase.from('genotypes').insert({
            user_id: userId,
            marker_name: finalMarker,
            status,
            notes
        })

        if (!error) {
            setIsOpen(false)
            onUpdate()
            // Reset
            setSelectedMarker(COMMON_MARKERS[0].name)
            setCustomMarker('')
            setStatus('Heterozygous')
            setNotes('')
        }
        setIsSubmitting(false)
    }

    return (
        <>
            <Button 
                onClick={() => setIsOpen(true)}
                className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 h-9"
                size="sm"
            >
                <Plus className="w-4 h-4 mr-1.5" />
                Add DNA Marker
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                                        <Dna className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">Log DNA Profile</h2>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Search/Select Marker */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Genetic Marker</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50"
                                        value={selectedMarker}
                                        onChange={e => setSelectedMarker(e.target.value)}
                                    >
                                        {COMMON_MARKERS.map(m => (
                                            <option key={m.name} value={m.name}>{m.name}</option>
                                        ))}
                                        <option value="custom">-- Add Custom Marker --</option>
                                    </select>
                                    
                                    {selectedMarker !== 'custom' && (
                                        <p className="text-xs text-indigo-400/70 mt-2 px-1">
                                            {COMMON_MARKERS.find(m => m.name === selectedMarker)?.desc}
                                        </p>
                                    )}

                                    {selectedMarker === 'custom' && (
                                        <input 
                                            placeholder="Enter marker name (e.g. BDNF Val66Met)"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white mt-2 focus:ring-2 focus:ring-indigo-500/50"
                                            value={customMarker}
                                            onChange={e => setCustomMarker(e.target.value)}
                                        />
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mutation Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Normal', 'Heterozygous', 'Homozygous'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setStatus(s)}
                                                className={`py-2 px-1 text-xs rounded-lg font-bold transition-colors border ${status === s ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                                        {status === 'Normal' && "No mutation (Wild type)."}
                                        {status === 'Heterozygous' && "1 mutated allele. Usually a ~30-40% reduction in enzyme function."}
                                        {status === 'Homozygous' && "2 mutated alleles. Most significant impact (~70%+ reduction)."}
                                    </p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notes (Optional)</label>
                                    <textarea 
                                        placeholder="E.g., Doctor advised avoiding synthetic folic acid."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 resize-none h-20"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button 
                                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-12 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                onClick={handleSave}
                                disabled={isSubmitting || (selectedMarker === 'custom' && !customMarker.trim())}
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save DNA Marker'}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
