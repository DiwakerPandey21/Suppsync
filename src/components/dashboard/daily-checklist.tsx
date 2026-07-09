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
    timingDisplay?: string
    isSolar?: boolean
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
        <div className="space-y-4 w-full px-4 mb-6">
            <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">Today&apos;s Stack</h2>
                <span className="text-xs font-bold text-slate-500">{logs.filter(l => l.taken).length}/{logs.length} Done</span>
            </div>

            <div className="space-y-3">
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        whileHover={log.isWashout ? {} : { y: -2, scale: 1.01 }}
                        whileTap={log.isWashout ? {} : { scale: 0.99 }}
                        onClick={() => !log.isWashout && toggleLog(log.id, log.taken, log.log_id)}
                        className={cn(
                            "flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                            log.isWashout
                                ? "bg-amber-500/[0.02] border-amber-500/20 cursor-default"
                                : log.taken
                                    ? "glass-panel border-white/[0.04] opacity-50"
                                    : "glass-panel-interactive border-white/[0.07]"
                        )}
                    >
                        {/* Edge left glow line matching supplement theme color */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-[4px]" 
                            style={{ 
                                backgroundColor: log.color,
                                boxShadow: `0 0 10px ${log.color}`,
                                opacity: log.isWashout ? 0.2 : log.taken ? 0.3 : 1 
                            }}
                        />

                        <div className="flex items-center space-x-4 pl-2">
                            <div>
                                <p className={cn(
                                    "font-black text-sm tracking-tight transition-colors duration-300",
                                    log.isWashout ? "text-amber-500/70" : log.taken ? "text-slate-500 line-through" : "text-white"
                                )}>
                                    {log.name}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {log.amount} • {log.timingDisplay || 'Morning'}
                                    </p>
                                    {log.isSolar && (
                                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 tracking-widest uppercase">
                                            <span>Solar Sync</span>
                                        </div>
                                    )}
                                    {log.isWashout && (
                                        <span className="text-[8px] uppercase font-black tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                                            Washout Cycle
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Checkbox circle or Pause icon */}
                        {log.isWashout ? (
                            <PauseCircle className="w-5 h-5 text-amber-500/50" />
                        ) : (
                            <div className={cn(
                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm",
                                log.taken 
                                    ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" 
                                    : "border-white/20 hover:border-white/40 bg-white/[0.02]"
                            )}>
                                {log.taken && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
