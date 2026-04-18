'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Loader2, RefreshCw, Sun, Moon, Bell } from 'lucide-react'
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
    
    // Chronobiology State (V10)
    const [triggerType, setTriggerType] = useState('fixed') // 'fixed', 'sunrise', 'sunset', 'solar_noon'
    const [offsetMins, setOffsetMins] = useState('0')

    // Reminder Alarm State
    const [reminderTime, setReminderTime] = useState('') // HH:MM format

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            // Get current user id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const scheduleData: any = {
                user_id: user.id,
                supplement_id: supplementId,
                dosage_amount: parseFloat(dosageAmount),
                dosage_unit: dosageUnit,
                frequency,
                time_of_day: timeOfDay,
                trigger_type: triggerType,
                offset_mins: parseInt(offsetMins || '0'),
                is_active: true,
                ...(frequency === 'cycle' ? {
                    cycle_on_days: parseInt(cycleOnDays),
                    cycle_off_days: parseInt(cycleOffDays),
                    cycle_start_date: new Date().toLocaleDateString('en-CA')
                } : {})
            }

            // Only add reminder_time if user set one (column may not exist yet)
            if (reminderTime) {
                scheduleData.reminder_time = reminderTime
            }

            const { error } = await supabase
                .from('schedules')
                .insert([scheduleData])

            if (error) {
                // If reminder_time column doesn't exist, retry without it
                if (error.message?.includes('reminder_time')) {
                    delete scheduleData.reminder_time
                    const { error: retryError } = await supabase
                        .from('schedules')
                        .insert([scheduleData])
                    if (retryError) throw new Error(retryError.message || JSON.stringify(retryError))
                } else {
                    throw new Error(error.message || JSON.stringify(error))
                }
            }

            setOpen(false)
            router.refresh()

        } catch (error: any) {
            console.error('Error adding schedule:', error)
            alert('Failed to add schedule: ' + (error?.message || 'Unknown error'))
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
                        <Label>Timing Trigger (V10 Chronobiology)</Label>
                        <Select value={triggerType} onValueChange={setTriggerType}>
                            <SelectTrigger className="bg-slate-900 border-slate-800">
                                <SelectValue placeholder="Select trigger" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="fixed">Fixed Time (Legacy)</SelectItem>
                                <SelectItem value="sunrise">At Sunrise</SelectItem>
                                <SelectItem value="sunset">At Sunset</SelectItem>
                                <SelectItem value="solar_noon">At Solar Noon</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {triggerType !== 'fixed' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-center space-x-2 mb-1">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <Label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Circadian Offset</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="offset" className="text-xs text-slate-400">Offset (Minutes)</Label>
                                <div className="flex space-x-2 items-center">
                                    <Input
                                        id="offset"
                                        type="number"
                                        className="bg-slate-900 border-slate-700 h-10 w-24"
                                        value={offsetMins}
                                        onChange={(e) => setOffsetMins(e.target.value)}
                                        placeholder="e.g. 30"
                                    />
                                    <span className="text-xs text-slate-500">
                                        {parseInt(offsetMins || '0') > 0 ? 'mins after' : parseInt(offsetMins || '0') < 0 ? 'mins before' : 'exactly at'} {triggerType.replace('_', ' ')}.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {triggerType === 'fixed' && (
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
                    )}

                    {/* ⏰ Reminder Alarm Time Picker */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-2 mb-1">
                            <Bell className="w-4 h-4 text-emerald-400" />
                            <Label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Reminder Alarm</Label>
                        </div>
                        <p className="text-[10px] text-slate-500">Set an exact time to receive a push notification reminding you to take this supplement.</p>
                        <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                        />
                        {reminderTime && (
                            <p className="text-[10px] text-emerald-400 font-semibold">🔔 You will be reminded at {reminderTime} daily</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-600 mt-6" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Schedule'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
