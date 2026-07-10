'use client'

import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, PauseCircle, Search, X, Clock, Calendar, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react'
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

const getTimingGroup = (display: string = '') => {
    const d = display.toLowerCase()
    if (d.includes('morning') || d.includes('breakfast') || d.includes('am')) return 'Morning'
    if (d.includes('afternoon') || d.includes('lunch') || d.includes('noon') || d.includes('pm') && !d.includes('evening') && !d.includes('night')) return 'Afternoon'
    if (d.includes('evening') || d.includes('dinner')) return 'Evening'
    if (d.includes('night') || d.includes('bed') || d.includes('sleep')) return 'Night'
    return 'Morning' // default fallback
}

export function DailyChecklist({ logs, setLogs, dateStr }: DailyChecklistProps) {
    const supabase = createClient()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerFilter, setDrawerFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('All')
    
    // Auto-select current time of day as default dashboard tab
    const [dashboardFilter, setDashboardFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('All')

    useEffect(() => {
        // Default to All first to allow overview, user can filter
        setDashboardFilter('All')
    }, [])

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
                const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', logItem.supplement_id).maybeSingle()
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
            }]).select('id').maybeSingle()

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
                    const { data: inv } = await supabase.from('inventory').select('id, amount_remaining').eq('supplement_id', logItem.supplement_id).maybeSingle()
                    if (inv) {
                        await supabase.from('inventory').update({ amount_remaining: Math.max(0, inv.amount_remaining - logItem.dosage_amount) }).eq('id', inv.id)
                    }
                }
            }
        }
    }

    // Calculations
    const totalCount = logs.length
    const takenCount = logs.filter(l => l.taken).length

    // Next supplement to take
    const nextItem = useMemo(() => {
        return logs.find(l => !l.taken && !l.isWashout)
    }, [logs])

    // Categorized logs for counts
    const counts = useMemo(() => {
        const c = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0, All: logs.length }
        logs.forEach(l => {
            const grp = getTimingGroup(l.timingDisplay) as keyof typeof c
            if (grp in c) c[grp]++
        })
        return c
    }, [logs])

    // Filtered logs for dashboard display
    const dashboardVisibleLogs = useMemo(() => {
        if (dashboardFilter === 'All') return logs
        return logs.filter(l => getTimingGroup(l.timingDisplay) === dashboardFilter)
    }, [logs, dashboardFilter])

    const displayLogs = dashboardVisibleLogs.slice(0, 4)
    const extraCount = Math.max(0, dashboardVisibleLogs.length - 4)

    // Filtered logs for drawer view
    const drawerVisibleLogs = useMemo(() => {
        return logs.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter = drawerFilter === 'All' || getTimingGroup(l.timingDisplay) === drawerFilter
            return matchesSearch && matchesFilter
        })
    }, [logs, searchQuery, drawerFilter])

    return (
        <div className="space-y-4 w-full px-4 mb-6">
            {/* Header: Today's Stack Title and progress ring */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-lg font-black tracking-tight text-white uppercase">Today&apos;s Stack</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Active Protocol</p>
                </div>
                
                <div className="flex items-center space-x-2.5 bg-white/[0.02] border border-white/[0.06] py-1.5 px-3 rounded-2xl">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r="13" className="stroke-slate-800" strokeWidth="2.5" fill="transparent" />
                            <circle cx="16" cy="16" r="13" className="stroke-blue-500 transition-all duration-500" strokeWidth="2.5" fill="transparent"
                                    strokeDasharray={`${2 * Math.PI * 13}`}
                                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - (takenCount / (totalCount || 1)))}`} />
                        </svg>
                        <span className="absolute text-[8px] font-black text-white">{Math.round((takenCount / (totalCount || 1)) * 100)}%</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{takenCount}/{totalCount} Done</span>
                </div>
            </div>

            {/* Next Supplement highlighted card */}
            {nextItem ? (
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-white/[0.08] rounded-3xl p-5 flex items-center justify-between shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> Up Next
                        </p>
                        <h3 className="font-black text-white text-base tracking-tight mt-1">{nextItem.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {nextItem.amount} • {nextItem.timingDisplay || 'Morning'}
                        </p>
                    </div>
                    <button 
                        onClick={() => toggleLog(nextItem.id, nextItem.taken, nextItem.log_id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105"
                    >
                        Log Taken
                    </button>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 text-center flex items-center justify-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">All supplements logged for today!</span>
                </div>
            )}

            {/* Time-of-Day Filter Navigation tabs */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(['All', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setDashboardFilter(tab)}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all whitespace-nowrap",
                            dashboardFilter === tab
                                ? "bg-white text-black border-white shadow-md"
                                : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-white"
                        )}
                    >
                        {tab} ({counts[tab]})
                    </button>
                ))}
            </div>

            {/* Supplement Items List (max 4) */}
            <div className="space-y-2.5">
                {displayLogs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 border border-white/[0.04] bg-white/[0.01] rounded-3xl">
                        No supplements scheduled for this slot.
                    </div>
                ) : (
                    displayLogs.map((log) => (
                        <motion.div
                            key={log.id}
                            whileHover={log.isWashout ? {} : { y: -1, scale: 1.005 }}
                            whileTap={log.isWashout ? {} : { scale: 0.995 }}
                            onClick={() => !log.isWashout && toggleLog(log.id, log.taken, log.log_id)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                                log.isWashout
                                    ? "bg-amber-500/[0.02] border-amber-500/20 cursor-default"
                                    : log.taken
                                        ? "glass-panel border-white/[0.04] opacity-50"
                                        : "glass-panel-interactive border-white/[0.07]"
                            )}
                        >
                            {/* Color bar glow */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-[4px]" 
                                style={{ 
                                    backgroundColor: log.color,
                                    boxShadow: `0 0 10px ${log.color}`,
                                    opacity: log.isWashout ? 0.2 : log.taken ? 0.3 : 1 
                                }}
                            />

                            <div className="flex items-center space-x-3 pl-2">
                                <div>
                                    <p className={cn(
                                        "font-black text-sm tracking-tight transition-colors duration-300",
                                        log.isWashout ? "text-amber-500/70" : log.taken ? "text-slate-500 line-through" : "text-white"
                                    )}>
                                        {log.name}
                                    </p>
                                    <div className="flex items-center space-x-1.5 mt-0.5">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                            {log.amount} • {log.timingDisplay || 'Morning'}
                                        </p>
                                        {log.isSolar && (
                                            <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded uppercase">Solar</span>
                                        )}
                                        {log.isWashout && (
                                            <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded uppercase">Washout</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* State icon */}
                            {log.isWashout ? (
                                <PauseCircle className="w-5 h-5 text-amber-500/50" />
                            ) : (
                                <div className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300",
                                    log.taken 
                                        ? "bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                                        : "border-white/20 bg-white/[0.02]"
                                )}>
                                    {log.taken && <Check className="w-3 h-3 text-white stroke-[3.5px]" />}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2 px-1">
                {extraCount > 0 ? (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        + {extraCount} More Supplements
                    </span>
                ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        Complete Stack Displayed
                    </span>
                )}
                
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center space-x-1 text-xs font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                >
                    <span>View Full Stack</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Beautiful Floating Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 pointer-events-auto"
                        />
                        {/* Drawer content */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#050816]/95 border-t border-white/[0.08] rounded-t-[32px] z-50 flex flex-col pointer-events-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-w-lg mx-auto overflow-hidden"
                        >
                            {/* Drag Indicator handle */}
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 flex-shrink-0" />

                            {/* Sticky Progress Header */}
                            <div className="px-6 pb-4 border-b border-white/[0.06] flex-shrink-0 sticky top-0 bg-[#050816]/95 backdrop-blur-md z-20 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Supplement Stack</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Manage details and completion</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                {/* Progress meter bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                        <span>Daily Protocol Progress</span>
                                        <span>{Math.round((takenCount / (totalCount || 1)) * 100)}% ({takenCount}/{totalCount})</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                            style={{ width: `${(takenCount / (totalCount || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search supplement by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Drawer Filters */}
                                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                                    {(['All', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setDrawerFilter(tab)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase border transition-all whitespace-nowrap",
                                                drawerFilter === tab
                                                    ? "bg-white text-black border-white"
                                                    : "bg-white/[0.02] border-white/[0.05] text-slate-400"
                                            )}
                                        >
                                            {tab} ({counts[tab]})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Scrollable Checklist View */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0 scrollbar-none pb-12">
                                {drawerVisibleLogs.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-slate-500">
                                        No supplements match your criteria.
                                    </div>
                                ) : (
                                    drawerVisibleLogs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            whileHover={log.isWashout ? {} : { scale: 1.005 }}
                                            onClick={() => !log.isWashout && toggleLog(log.id, log.taken, log.log_id)}
                                            className={cn(
                                                "flex items-center justify-between p-4.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                                                log.isWashout
                                                    ? "bg-amber-500/[0.02] border-amber-500/20 cursor-default"
                                                    : log.taken
                                                        ? "glass-panel border-white/[0.04] opacity-50"
                                                        : "glass-panel-interactive border-white/[0.07]"
                                            )}
                                        >
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-[4px]" 
                                                style={{ 
                                                    backgroundColor: log.color,
                                                    boxShadow: `0 0 10px ${log.color}`,
                                                    opacity: log.isWashout ? 0.2 : log.taken ? 0.3 : 1 
                                                }}
                                            />

                                            <div className="flex items-center space-x-3 pl-2">
                                                <div>
                                                    <p className={cn(
                                                        "font-black text-sm tracking-tight transition-colors duration-300",
                                                        log.isWashout ? "text-amber-500/70" : log.taken ? "text-slate-500 line-through" : "text-white"
                                                    )}>
                                                        {log.name}
                                                    </p>
                                                    <div className="flex items-center space-x-1.5 mt-0.5">
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                            {log.amount} • {log.timingDisplay || 'Morning'}
                                                        </p>
                                                        {log.isSolar && (
                                                            <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded uppercase">Solar</span>
                                                        )}
                                                        {log.isWashout && (
                                                            <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded uppercase">Washout</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {log.isWashout ? (
                                                <PauseCircle className="w-5 h-5 text-amber-500/50" />
                                            ) : (
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300",
                                                    log.taken 
                                                        ? "bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                                                        : "border-white/20 bg-white/[0.02]"
                                                )}>
                                                    {log.taken && <Check className="w-3 h-3 text-white stroke-[3.5px]" />}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
