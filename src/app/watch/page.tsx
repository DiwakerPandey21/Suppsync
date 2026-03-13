'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Check, Loader2, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

type WatchLog = {
    id: string
    name: string
    dosage: string
    taken: boolean
    color: string
    log_id?: string
    supplement_id?: string
    dosage_amount?: number
}

export default function WatchDashboard() {
    const supabase = createClient()
    const [logs, setLogs] = useState<WatchLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const todayStr = new Date().toLocaleDateString('en-CA')

    useEffect(() => {
        async function fetchWatchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError("Please log in on your phone first.")
                setIsLoading(false)
                return
            }

            // Fetch schedules and today's logs
            const { data: schedules } = await supabase
                .from('schedules')
                .select('id, dosage_amount, dosage_unit, supplements(id, name, color_hex)')
                .eq('user_id', user.id)
                .eq('is_active', true)

            const { data: todayLogs } = await supabase
                .from('logs')
                .select('id, schedule_id, status')
                .eq('user_id', user.id)
                .eq('log_date', todayStr)

            if (schedules) {
                const mappedLogs: WatchLog[] = schedules.map(sched => {
                    const supplement = Array.isArray(sched.supplements) ? sched.supplements[0] : sched.supplements
                    const logForSchedule = todayLogs?.find(l => l.schedule_id === sched.id)

                    return {
                        id: sched.id,
                        supplement_id: supplement?.id,
                        dosage_amount: sched.dosage_amount,
                        name: supplement?.name || 'Unknown',
                        dosage: `${sched.dosage_amount}${sched.dosage_unit}`,
                        taken: logForSchedule?.status === 'taken',
                        color: supplement?.color_hex || '#3b82f6',
                        log_id: logForSchedule?.id
                    }
                })

                // Sort with untaken at the top for easy wrist access
                mappedLogs.sort((a, b) => (a.taken === b.taken) ? 0 : a.taken ? 1 : -1)

                setLogs(mappedLogs)
            }
            setIsLoading(false)
        }
        fetchWatchData()
    }, [supabase, todayStr])

    const toggleLog = async (id: string, currentlyTaken: boolean, currentLogId?: string) => {
        // Find the index to keep scroll position stable-ish, though we sort later
        setLogs(currentLogs =>
            currentLogs.map(log =>
                log.id === id ? { ...log, taken: !log.taken } : log
            )
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (currentlyTaken && currentLogId) {
            // UN-TAKE
            await supabase.from('logs').delete().eq('id', currentLogId)
            setLogs(currentLogs => currentLogs.map(log => log.id === id ? { ...log, log_id: undefined } : log))

            // Revert inventory
            const item = logs.find(l => l.id === id)
            if (item?.supplement_id && item.dosage_amount) {
                const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', item.supplement_id).single()
                if (inv) await supabase.from('inventory').update({ amount_remaining: inv.amount_remaining + item.dosage_amount }).eq('id', inv.id)
            }
        } else if (!currentlyTaken) {
            // TAKE
            const { data } = await supabase.from('logs').insert([{
                schedule_id: id,
                user_id: user.id,
                log_date: todayStr,
                status: 'taken'
            }]).select('id').single()

            if (data?.id) {
                setLogs(currentLogs => currentLogs.map(log => log.id === id ? { ...log, log_id: data.id } : log))

                // Decrement inventory
                const item = logs.find(l => l.id === id)
                if (item?.supplement_id && item.dosage_amount) {
                    const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', item.supplement_id).single()
                    if (inv) await supabase.from('inventory').update({ amount_remaining: Math.max(0, inv.amount_remaining - item.dosage_amount) }).eq('id', inv.id)
                }
            }
        }

        // Vibrate watch to confirm action
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
                <Dumbbell className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">{error}</p>
            </div>
        )
    }

    const completedCount = logs.filter(l => l.taken).length
    const isAllDone = logs.length > 0 && completedCount === logs.length

    return (
        <div className="flex flex-col w-full pb-8">
            {/* Minimalist Watch Header */}
            <div className="mb-4 mt-2 px-1">
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">Today</h1>
                <p className="text-xs font-semibold text-blue-500 mt-1 uppercase tracking-wider">
                    {completedCount} / {logs.length} Done
                </p>
            </div>

            {/* Huge Tap Targets for Watch Fingers */}
            <div className="space-y-2">
                {logs.length === 0 ? (
                    <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-800">
                        <p className="text-sm text-slate-500">No supplements scheduled today.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            onClick={() => toggleLog(log.id, log.taken, log.log_id)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl transition-colors w-full cursor-pointer",
                                log.taken
                                    ? "bg-slate-900 border border-slate-800"
                                    : "bg-slate-800 border-l-4"
                            )}
                            style={{
                                borderLeftColor: !log.taken ? log.color : '',
                                opacity: log.taken ? 0.6 : 1
                            }}
                        >
                            <div className="flex-1 pr-3">
                                <h3 className={cn(
                                    "font-bold text-base leading-tight w-full truncate",
                                    log.taken ? "text-slate-500 line-through" : "text-white"
                                )}>
                                    {log.name}
                                </h3>
                                <p className={cn(
                                    "text-xs font-medium mt-0.5",
                                    log.taken ? "text-slate-600" : "text-slate-400"
                                )}>
                                    {log.dosage}
                                </p>
                            </div>

                            {/* Massive Check Circle */}
                            <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
                                log.taken ? "bg-blue-600 opacity-50" : "bg-slate-700"
                            )}>
                                {log.taken && <Check className="w-5 h-5 text-white" />}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isAllDone && (
                <div className="mt-6 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm font-bold text-green-500">All Done!</p>
                </div>
            )}
        </div>
    )
}
