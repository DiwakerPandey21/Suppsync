'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Loader2, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

type ProtocolSupplement = {
    name: string
    dosage: string
    timing: string
}

export function CreateProtocolDialog() {
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [isSaving, setIsSaving] = useState(false)

    const [protocolName, setProtocolName] = useState('')
    const [description, setDescription] = useState('')
    const [supplements, setSupplements] = useState<ProtocolSupplement[]>([
        { name: '', dosage: '', timing: '' },
    ])

    const addSupplement = () => {
        setSupplements(prev => [...prev, { name: '', dosage: '', timing: '' }])
    }

    const updateSupplement = (index: number, field: keyof ProtocolSupplement, value: string) => {
        setSupplements(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    }

    const removeSupplement = (index: number) => {
        if (supplements.length <= 1) return
        setSupplements(prev => prev.filter((_, i) => i !== index))
    }

    const save = async () => {
        setIsSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('protocols').insert({
            name: protocolName,
            description,
            supplements: supplements.filter(s => s.name),
            creator_id: user.id,
            is_community: true,
        })

        if (!error) {
            setIsOpen(false)
            setStep(1)
            setProtocolName('')
            setDescription('')
            setSupplements([{ name: '', dosage: '', timing: '' }])
        }
        setIsSaving(false)
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 rounded-xl w-full"
            >
                <Plus className="w-4 h-4 mr-2" /> Create Protocol
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center">
                                    <Sparkles className="w-5 h-5 text-emerald-400 mr-2" />
                                    {step === 1 ? 'Protocol Info' : 'Add Supplements'}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Step indicator */}
                            <div className="flex space-x-2 mb-6">
                                {[1, 2].map(s => (
                                    <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                                ))}
                            </div>

                            {step === 1 ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Protocol Name</label>
                                        <Input
                                            value={protocolName}
                                            onChange={e => setProtocolName(e.target.value)}
                                            placeholder="e.g. Morning Energy Stack"
                                            className="bg-slate-900 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label>
                                        <Input
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="What this protocol is for..."
                                            className="bg-slate-900 border-slate-700 text-white"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!protocolName}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                                    >
                                        Next: Add Supplements
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {supplements.map((supp, i) => (
                                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-slate-500 font-bold">SUPPLEMENT {i + 1}</span>
                                                {supplements.length > 1 && (
                                                    <button onClick={() => removeSupplement(i)} className="text-slate-600 hover:text-red-400">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                value={supp.name}
                                                onChange={e => updateSupplement(i, 'name', e.target.value)}
                                                placeholder="Name"
                                                className="bg-slate-800 border-slate-700 text-white text-xs h-8 mb-2"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    value={supp.dosage}
                                                    onChange={e => updateSupplement(i, 'dosage', e.target.value)}
                                                    placeholder="Dosage"
                                                    className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                                                />
                                                <Input
                                                    value={supp.timing}
                                                    onChange={e => updateSupplement(i, 'timing', e.target.value)}
                                                    placeholder="Timing"
                                                    className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addSupplement}
                                        className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-xs text-slate-500 hover:text-white hover:border-slate-600 transition-colors"
                                    >
                                        + Add Another Supplement
                                    </button>

                                    <div className="flex space-x-2 mt-4">
                                        <Button variant="outline" className="flex-1 border-slate-700 h-10" onClick={() => setStep(1)}>
                                            Back
                                        </Button>
                                        <Button
                                            onClick={save}
                                            disabled={isSaving || !supplements.some(s => s.name)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Protocol'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
