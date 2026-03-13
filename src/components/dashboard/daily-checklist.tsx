import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Check, PauseCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { awardXp } from './xp-bar'

export type Log = {
    id: string
    supplement_id?: string
    name: string
    amount: string
    dosage_amount?: number
    taken: boolean
    color: string
    log_id?: string
    isWashout?: boolean
}

interface DailyChecklistProps {
    logs: Log[]
    setLogs: React.Dispatch<React.SetStateAction<Log[]>>
    dateStr: string
}

export function DailyChecklist({ logs, setLogs, dateStr }: DailyChecklistProps) {
    const supabase = createClient()

    const toggleLog = async (id: string, currentlyTaken: boolean, currentLogId?: string) => {
        // Optimistic UI update
        setLogs(currentLogs =>
            currentLogs.map(log =>
                log.id === id ? { ...log, taken: !log.taken } : log
            )
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (currentlyTaken && currentLogId) {
            await supabase.from('logs').delete().eq('id', currentLogId)
            setLogs(currentLogs =>
                currentLogs.map(log =>
                    log.id === id ? { ...log, log_id: undefined } : log
                )
            )

            // Increment inventory
            const logItem = logs.find(l => l.id === id)
            if (logItem?.supplement_id && logItem.dosage_amount) {
                const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', logItem.supplement_id).single()
                if (inv) {
                    await supabase.from('inventory').update({ amount_remaining: inv.amount_remaining + logItem.dosage_amount }).eq('id', inv.id)
                }
            }
        } else if (!currentlyTaken) {
            const { data } = await supabase.from('logs').insert([{
                schedule_id: id,
                user_id: user.id,
                log_date: dateStr,
                status: 'taken'
            }]).select('id').single()

            if (data?.id) {
                // Award XP for logging a supplement
                awardXp(10)
                setLogs(currentLogs =>
                    currentLogs.map(log =>
                        log.id === id ? { ...log, log_id: data.id } : log
                    )
                )

                // Decrement inventory
                const logItem = logs.find(l => l.id === id)
                if (logItem?.supplement_id && logItem.dosage_amount) {
                    const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', logItem.supplement_id).single()
                    if (inv) {
                        await supabase.from('inventory').update({ amount_remaining: Math.max(0, inv.amount_remaining - logItem.dosage_amount) }).eq('id', inv.id)
                    }
                }
            }
        }
    }

    return (
        <div className="space-y-4 w-full px-4">
            <h2 className="text-xl font-bold tracking-tight text-white mb-4">Today&apos;s Stack</h2>

            <div className="space-y-3">
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        whileTap={log.isWashout ? {} : { scale: 0.98 }}
                        onClick={() => !log.isWashout && toggleLog(log.id, log.taken, log.log_id)}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all",
                            log.isWashout
                                ? "bg-amber-950/20 border-amber-900/30 cursor-default"
                                : log.taken
                                    ? "bg-slate-900 border-slate-800 opacity-70 cursor-pointer"
                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Color indicator dot */}
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: log.color, opacity: log.isWashout ? 0.3 : log.taken ? 0.5 : 1 }}
                            />

                            <div>
                                <p className={cn(
                                    "font-medium transition-colors",
                                    log.isWashout ? "text-amber-500/70" : log.taken ? "text-slate-500 line-through" : "text-white"
                                )}>
                                    {log.name}
                                </p>
                                <div className="flex items-center space-x-2">
                                    <p className="text-xs text-slate-500">{log.amount}</p>
                                    {log.isWashout && (
                                        <span className="text-[9px] uppercase font-black tracking-wider bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                                            Washout
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Checkbox circle or Pause icon */}
                        {log.isWashout ? (
                            <PauseCircle className="w-6 h-6 text-amber-500/50" />
                        ) : (
                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                log.taken ? "bg-[#3b82f6] border-[#3b82f6]" : "border-slate-600"
                            )}>
                                {log.taken && <Check className="w-4 h-4 text-white" />}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
