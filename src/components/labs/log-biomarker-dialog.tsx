'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function LogBiomarkerDialog() {
    const supabase = createClient()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [value, setValue] = useState('')
    const [unit, setUnit] = useState('')
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')

    // Common biomarker suggestions to pre-fill unit
    const commonMarkers = [
        { name: 'Vitamin D3 (25-OH)', unit: 'ng/mL' },
        { name: 'Total Testosterone', unit: 'ng/dL' },
        { name: 'Free Testosterone', unit: 'pg/mL' },
        { name: 'Ferritin / Iron', unit: 'ng/mL' },
        { name: 'Cortisol (AM)', unit: 'mcg/dL' },
        { name: 'HbA1c', unit: '%' },
        { name: 'Cholesterol (LDL)', unit: 'mg/dL' },
    ]

    const handleSuggestionClick = (marker: { name: string, unit: string }) => {
        setName(marker.name)
        setUnit(marker.unit)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !value || !unit || !recordDate) {
            setError('Please fill out all required fields.')
            return
        }

        const numVal = parseFloat(value)
        if (isNaN(numVal)) {
            setError('Value must be a valid number.')
            return
        }

        setIsLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('User not authenticated.')
            setIsLoading(false)
            return
        }

        const { error: insertError } = await supabase.from('biomarkers').insert([
            {
                user_id: user.id,
                name: name.trim(),
                value: numVal,
                unit: unit.trim(),
                record_date: recordDate,
                notes: notes.trim() || null
            }
        ])

        if (insertError) {
            console.error('Insert error:', insertError)
            setError(insertError.message)
            setIsLoading(false)
            return
        }

        // Success!
        setIsLoading(false)
        setOpen(false)

        // Reset form
        setName('')
        setValue('')
        setUnit('')
        setNotes('')
        setRecordDate(new Date().toISOString().split('T')[0])

        // Refresh the page data
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 font-semibold shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Log Result
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0F172A] border-slate-800 text-white max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-black">Log Lab Result</DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm">
                        Enter your bloodwork or test results to track progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {/* Common Suggestions */}
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-semibold uppercase">Common Markers</Label>
                        <div className="flex flex-wrap gap-2">
                            {commonMarkers.map((m) => (
                                <button
                                    key={m.name}
                                    type="button"
                                    onClick={() => handleSuggestionClick(m)}
                                    className="text-[10px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-full transition-colors whitespace-nowrap"
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-800/50">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-300 font-medium ml-1">Test Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Free Testosterone"
                                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 rounded-xl h-12"
                                required
                            />
                        </div>

                        <div className="flex space-x-3">
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="value" className="text-slate-300 font-medium ml-1">Result Value *</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="e.g. 50"
                                    className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 rounded-xl h-12 text-xl font-bold font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-2 w-28">
                                <Label htmlFor="unit" className="text-slate-300 font-medium ml-1">Unit *</Label>
                                <Input
                                    id="unit"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="e.g. ng/dL"
                                    className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 disabled:opacity-50 rounded-xl h-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-slate-300 font-medium ml-1">Date of Lab Draw *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={recordDate}
                                onChange={(e) => setRecordDate(e.target.value)}
                                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 rounded-xl h-12"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-300 font-medium ml-1">Notes (Optional)</Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Fasted 12h, Feeling fatigued"
                                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 rounded-xl h-12 text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold text-base mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving Result...
                            </>
                        ) : (
                            'Save Lab Result'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
