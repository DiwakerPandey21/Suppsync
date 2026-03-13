'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

type TimelineEntry = {
    time: string
    name: string
    color: string
    hour: number
}

export function SupplementTimeline() {
    const supabase = createClient()
    const [entries, setEntries] = useState<TimelineEntry[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => { load() }, [])

    const load = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const todayStr = new Date().toLocaleDateString('en-CA')

        const { data: logs } = await supabase
            .from('logs')
            .select('created_at, schedules(time_of_day, supplements(name, color_hex))')
            .eq('user_id', user.id)
            .eq('log_date', todayStr)
            .eq('status', 'taken')

        if (!logs) return

        const mapped: TimelineEntry[] = logs.map((log: any) => {
            const sched = Array.isArray(log.schedules) ? log.schedules[0] : log.schedules
            const supp = sched ? (Array.isArray(sched.supplements) ? sched.supplements[0] : sched.supplements) : null

            const logTime = new Date(log.created_at)
            const hour = logTime.getHours()
            const timeStr = logTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

            return {
                time: timeStr,
                name: supp?.name || 'Supplement',
                color: supp?.color_hex || '#3b82f6',
                hour,
            }
        }).sort((a: TimelineEntry, b: TimelineEntry) => a.hour - b.hour)

        setEntries(mapped)

        // Auto-scroll to current hour
        setTimeout(() => {
            if (scrollRef.current) {
                const currentHour = new Date().getHours()
                const position = Math.max(0, (currentHour - 6) * 80)
                scrollRef.current.scrollLeft = position
            }
        }, 300)
    }

    if (entries.length === 0) return null

    // Build hour slots from 6 AM to 11 PM
    const hours = Array.from({ length: 18 }, (_, i) => i + 6)
    const currentHour = new Date().getHours()

    return (
        <div className="w-full px-4 mb-4">
            <div className="flex items-center space-x-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today&apos;s Timeline</p>
            </div>

            <div
                ref={scrollRef}
                className="overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
            >
                <div className="flex items-end space-x-0 min-w-max py-2 relative">
                    {/* Time axis line */}
                    <div className="absolute bottom-8 left-0 right-0 h-px bg-slate-800" />

                    {hours.map(hour => {
                        const entriesAtHour = entries.filter(e => e.hour === hour)
                        const isPast = hour < currentHour
                        const isCurrent = hour === currentHour
                        const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`

                        return (
                            <div key={hour} className="flex flex-col items-center w-[52px] flex-shrink-0">
                                {/* Pills stacked at this hour */}
                                <div className="flex flex-col items-center space-y-1 mb-2 min-h-[20px]">
                                    {entriesAtHour.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap max-w-[50px] truncate"
                                            style={{ backgroundColor: entry.color }}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1 * i }}
                                            title={`${entry.name} at ${entry.time}`}
                                        >
                                            {entry.name.slice(0, 5)}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Dot on axis */}
                                <div className={`w-2 h-2 rounded-full mb-1.5 ${
                                    isCurrent ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' :
                                    entriesAtHour.length > 0 ? 'bg-blue-500' :
                                    isPast ? 'bg-slate-700' : 'bg-slate-800'
                                }`} />

                                {/* Hour label */}
                                <span className={`text-[9px] ${
                                    isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-600'
                                }`}>{label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
