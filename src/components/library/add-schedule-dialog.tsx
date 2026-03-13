'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Loader2, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddScheduleDialogProps {
    supplementId: string
    supplementName: string
    supplementForm: string
}

export function AddScheduleDialog({ supplementId, supplementName, supplementForm }: AddScheduleDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Form State
    const [dosageAmount, setDosageAmount] = useState('1')
    const [dosageUnit, setDosageUnit] = useState(supplementForm === 'Powder' ? 'scoop' : 'pill')
    const [frequency, setFrequency] = useState('daily')
    const [timeOfDay, setTimeOfDay] = useState('morning')
    const [cycleOnDays, setCycleOnDays] = useState('5')
    const [cycleOffDays, setCycleOffDays] = useState('2')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            // Get current user id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('schedules')
                .insert([
                    {
                        user_id: user.id,
                        supplement_id: supplementId,
                        dosage_amount: parseFloat(dosageAmount),
                        dosage_unit: dosageUnit,
                        frequency,
                        time_of_day: timeOfDay,
                        is_active: true,
                        ...(frequency === 'cycle' ? {
                            cycle_on_days: parseInt(cycleOnDays),
                            cycle_off_days: parseInt(cycleOffDays),
                            cycle_start_date: new Date().toLocaleDateString('en-CA')
                        } : {})
                    }
                ])

            if (error) throw error

            setOpen(false)
            router.refresh()

        } catch (error) {
            console.error('Error adding schedule:', error)
            alert('Failed to add schedule')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0F172A] border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Schedule {supplementName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="any"
                                required
                                className="bg-slate-900 border-slate-800"
                                value={dosageAmount}
                                onChange={(e) => setDosageAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                required
                                className="bg-slate-900 border-slate-800"
                                value={dosageUnit}
                                onChange={(e) => setDosageUnit(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="bg-slate-900 border-slate-800">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="workout_days">Workout Days Only</SelectItem>
                                <SelectItem value="rest_days">Rest Days Only</SelectItem>
                                <SelectItem value="cycle">Cycle (On/Off)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cycle Configuration - Only visible when frequency is 'cycle' */}
                    {frequency === 'cycle' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center space-x-2 mb-1">
                                <RefreshCw className="w-4 h-4 text-blue-400" />
                                <Label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tolerance Cycling</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="cycleOn" className="text-xs text-slate-400">Days ON</Label>
                                    <Input
                                        id="cycleOn"
                                        type="number"
                                        min="1"
                                        required
                                        className="bg-slate-900 border-slate-700 h-10"
                                        value={cycleOnDays}
                                        onChange={(e) => setCycleOnDays(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cycleOff" className="text-xs text-slate-400">Days OFF</Label>
                                    <Input
                                        id="cycleOff"
                                        type="number"
                                        min="1"
                                        required
                                        className="bg-slate-900 border-slate-700 h-10"
                                        value={cycleOffDays}
                                        onChange={(e) => setCycleOffDays(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500">e.g., 5 days on / 2 days off to prevent tolerance buildup.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Time of Day</Label>
                        <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                            <SelectTrigger className="bg-slate-900 border-slate-800">
                                <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="pre-workout">Pre-Workout</SelectItem>
                                <SelectItem value="intra-workout">Intra-Workout</SelectItem>
                                <SelectItem value="post-workout">Post-Workout</SelectItem>
                                <SelectItem value="evening">Evening / Bedtime</SelectItem>
                                <SelectItem value="anytime">Anytime</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-600 mt-6" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Schedule'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
