'use client'

import { createClient } from '@/utils/supabase/client'
import { DailyChecklist, type Log } from '@/components/dashboard/daily-checklist'
import { ProgressRing } from '@/components/dashboard/progress-ring'
import { InventoryAlerts, type InventoryAlertItem } from '@/components/dashboard/inventory-alerts'
import { ConsistencyHeatmap, type AdherenceData } from '@/components/dashboard/consistency-heatmap'
import { DailyCheckIn } from '@/components/dashboard/daily-check-in'
import { CorrelationChart, type CorrelationData } from '@/components/dashboard/correlation-chart'
import { BudgetWidget, type BudgetItem } from '@/components/dashboard/budget-widget'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { ConfettiBurst } from '@/components/dashboard/confetti-burst'
import { SmartTimingOptimizer } from '@/components/dashboard/smart-timing'
import { LogWorkout } from '@/components/dashboard/log-workout'
import { VoiceLogger } from '@/components/dashboard/voice-logger'
import { StreakFreeze } from '@/components/dashboard/streak-freeze'
import { XpBar } from '@/components/dashboard/xp-bar'
import { WeeklyReport } from '@/components/dashboard/weekly-report'
import { DailyChallenge } from '@/components/dashboard/daily-challenge'
import { ExpiryAlerts } from '@/components/dashboard/expiry-alerts'
import { SupplementTimeline } from '@/components/dashboard/supplement-timeline'
import { MoodLogger } from '@/components/dashboard/mood-logger'
import { SmartRecs } from '@/components/dashboard/smart-recs'
import { HandfulScanner } from '@/components/dashboard/handful-scanner'
import { SyncbotAiSection } from '@/components/dashboard/syncbot-ai-section'
import { Flame, BarChart3, MessageCircle, Target, Sun, Moon, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { useEffect, useState, useRef } from 'react'

const getSolarTimes = () => {
    const now = new Date();
    
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    
    const solarNoon = new Date(now);
    solarNoon.setHours(12, 15, 0, 0);

    const sunset = new Date(now);
    sunset.setHours(19, 45, 0, 0);

    return { sunrise, solarNoon, sunset };
};

const formatSolarTime = (baseTime: Date, offsetMins: number) => {
    const targetTime = new Date(baseTime.getTime() + offsetMins * 60000);
    return targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
    const supabase = createClient()

    const [todayLogs, setTodayLogs] = useState<Log[]>([])
    const [lowStockAlerts, setLowStockAlerts] = useState<InventoryAlertItem[]>([])
    const [heatmapData, setHeatmapData] = useState<AdherenceData[]>([])
    const [correlationData, setCorrelationData] = useState<CorrelationData[]>([])
    const [hasCheckedInToday, setHasCheckedInToday] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const schedulesRef = useRef<any[]>([])

    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const todayStr = new Date().toLocaleDateString('en-CA')

    useEffect(() => {
        async function fetchLogs() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data: schedules } = await supabase
                .from('schedules')
                .select('id, dosage_amount, dosage_unit, time_of_day, trigger_type, offset_mins, cycle_on_days, cycle_off_days, cycle_start_date, supplements(id, name, color_hex)')
                .eq('user_id', user.id)
                .eq('is_active', true)

            const { data: logs } = await supabase
                .from('logs')
                .select('id, schedule_id, status')
                .eq('user_id', user.id)
                .eq('log_date', todayStr)

            if (schedules) {
                const mappedLogs: Log[] = schedules.map((sched: any) => {
                    const supplement = Array.isArray(sched.supplements) ? sched.supplements[0] : sched.supplements
                    const logForSchedule = logs?.find(l => l.schedule_id === sched.id)

                    let isWashout = false
                    if (sched.cycle_on_days && sched.cycle_off_days && sched.cycle_start_date) {
                        const startDate = new Date(sched.cycle_start_date)
                        const today = new Date(todayStr)
                        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                        const cycleLength = sched.cycle_on_days + sched.cycle_off_days
                        const dayInCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength
                        isWashout = dayInCycle >= sched.cycle_on_days
                    }

                    const solarTimes = getSolarTimes();
                    let timingDisplay = sched.time_of_day || 'Anytime'
                    let isSolar = false

                    if (sched.trigger_type && sched.trigger_type !== 'fixed') {
                        isSolar = true;
                        let baseTime: Date;
                        switch(sched.trigger_type) {
                            case 'sunrise': baseTime = solarTimes.sunrise; break;
                            case 'sunset': baseTime = solarTimes.sunset; break;
                            case 'solar_noon': baseTime = solarTimes.solarNoon; break;
                            default: baseTime = solarTimes.sunrise;
                        }
                        const exactTime = formatSolarTime(baseTime, sched.offset_mins || 0);
                        const offsetText = sched.offset_mins > 0 ? `+${sched.offset_mins}m` : sched.offset_mins < 0 ? `${sched.offset_mins}m` : '';
                        timingDisplay = `${sched.trigger_type} ${offsetText} (${exactTime})`
                    }

                    return {
                        id: sched.id,
                        supplement_id: supplement?.id,
                        dosage_amount: sched.dosage_amount,
                        name: supplement?.name || 'Unknown',
                        amount: `${sched.dosage_amount}${sched.dosage_unit}`,
                        taken: logForSchedule?.status === 'taken',
                        color: supplement?.color_hex || '#3b82f6',
                        log_id: logForSchedule?.id,
                        isWashout,
                        timingDisplay,
                        isSolar
                    }
                })
                setTodayLogs(mappedLogs)
                schedulesRef.current = schedules
            }

            const { data: inventoryItems } = await supabase
                .from('inventory')
                .select('id, amount_remaining, total_capacity, unit, low_stock_threshold, cost_per_bottle, currency, supplements(id, name, reorder_url)')
                .eq('user_id', user.id)

            if (inventoryItems) {
                const alerts: InventoryAlertItem[] = inventoryItems
                    .filter(inv => inv.amount_remaining <= inv.low_stock_threshold)
                    .map(inv => {
                        const supp = Array.isArray(inv.supplements) ? inv.supplements[0] : inv.supplements
                        return {
                            id: inv.id,
                            name: supp?.name || 'Unknown Supplement',
                            amount: Number(inv.amount_remaining),
                            unit: inv.unit,
                            reorderUrl: supp?.reorder_url || null
                        }
                    })
                setLowStockAlerts(alerts)
            }

            if (inventoryItems && schedules) {
                const budgetData: BudgetItem[] = (inventoryItems as any[])
                    .filter((inv: any) => inv.cost_per_bottle && inv.total_capacity)
                    .map((inv: any) => {
                        const supp = Array.isArray(inv.supplements) ? inv.supplements[0] : inv.supplements
                        const matchingSched = (schedules as any[]).find((s: any) => {
                            const schedSupp = Array.isArray(s.supplements) ? s.supplements[0] : s.supplements
                            return schedSupp?.id === supp?.id
                        })
                        const dosage = matchingSched?.dosage_amount || 1
                        const servingsTotal = inv.total_capacity / dosage
                        const costPerServing = inv.cost_per_bottle / servingsTotal
                        const servingsRemaining = Math.floor(inv.amount_remaining / dosage)
                        return {
                            name: supp?.name || 'Unknown',
                            costPerServing,
                            currency: inv.currency || 'USD',
                            servingsRemaining
                        }
                    })
                setBudgetItems(budgetData)
            }

            if (schedules && schedules.length > 0) {
                const twentyEightDaysAgo = new Date()
                twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)
                const startDateStr = twentyEightDaysAgo.toLocaleDateString('en-CA')

                const { data: pastLogs } = await supabase
                    .from('logs')
                    .select('log_date, status')
                    .eq('user_id', user.id)
                    .gte('log_date', startDateStr)
                    .eq('status', 'taken')

                const totalActiveSchedules = schedules.length

                const logsByDate = (pastLogs || []).reduce((acc: any, log: any) => {
                    acc[log.log_date] = (acc[log.log_date] || 0) + 1
                    return acc
                }, {})

                const adherenceArray: AdherenceData[] = []
                const corrArray: CorrelationData[] = []

                const { data: pastScores } = await supabase
                    .from('subjective_scores')
                    .select('record_date, energy_score')
                    .eq('user_id', user.id)
                    .gte('record_date', startDateStr)

                const scoresByDate = (pastScores || []).reduce((acc: any, score: any) => {
                    acc[score.record_date] = score.energy_score
                    return acc
                }, {})

                for (let i = 27; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateStr = d.toLocaleDateString('en-CA')

                    const takenCount = logsByDate[dateStr] || 0
                    const percentage = Math.min(100, Math.round((takenCount / totalActiveSchedules) * 100))

                    adherenceArray.push({
                        date: dateStr,
                        percentage
                    })

                    corrArray.push({
                        date: dateStr,
                        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        adherence: percentage,
                        energy: scoresByDate[dateStr] || null
                    })
                }
                setHeatmapData(adherenceArray)
                setCorrelationData(corrArray)
            }

            const { data: subjectiveScore } = await supabase
                .from('subjective_scores')
                .select('id')
                .eq('user_id', user.id)
                .eq('record_date', todayStr)
                .maybeSingle()

            setHasCheckedInToday(!!subjectiveScore)

            setIsLoading(false)
        }
        fetchLogs()
    }, [supabase, todayStr])

    const completed = todayLogs.filter(log => log.taken).length
    const total = todayLogs.length

    const streak = (() => {
        if (heatmapData.length === 0) return 0
        let count = 0
        const sorted = [...heatmapData].sort((a, b) => b.date.localeCompare(a.date))
        for (const day of sorted) {
            if (day.percentage > 0) {
                count++
            } else {
                break
            }
        }
        return count
    })()

    const [confettiTrigger, setConfettiTrigger] = useState(false)
    const prevCompleted = useRef(completed)
    useEffect(() => {
        if (total > 0 && completed === total && prevCompleted.current < total) {
            setConfettiTrigger(true)
            setTimeout(() => setConfettiTrigger(false), 100)
        }
        prevCompleted.current = completed
    }, [completed, total])

    const refreshLogs = async () => {
        const { data: logs } = await supabase
            .from('logs')
            .select('id, schedule_id, status')
            .eq('user_id', userId!)
            .eq('log_date', todayStr)

        if (schedulesRef.current.length > 0) {
            const mappedLogs: Log[] = schedulesRef.current.map((sched: any) => {
                const supplement = Array.isArray(sched.supplements) ? sched.supplements[0] : sched.supplements
                const logForSchedule = logs?.find(l => l.schedule_id === sched.id)
                let isWashout = false
                if (sched.cycle_on_days && sched.cycle_off_days && sched.cycle_start_date) {
                    const startDate = new Date(sched.cycle_start_date)
                    const today = new Date(todayStr)
                    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    const cycleLength = sched.cycle_on_days + sched.cycle_off_days
                    const dayInCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength
                    isWashout = dayInCycle >= sched.cycle_on_days
                }
                return {
                    id: sched.id,
                    supplement_id: supplement?.id,
                    dosage_amount: sched.dosage_amount,
                    name: supplement?.name || 'Unknown',
                    amount: `${sched.dosage_amount}${sched.dosage_unit}`,
                    taken: logForSchedule?.status === 'taken',
                    color: supplement?.color_hex || '#3b82f6',
                    log_id: logForSchedule?.id,
                    isWashout
                }
            })
            setTodayLogs(mappedLogs)
        }
    }

    if (isLoading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="flex min-h-screen flex-col items-center pt-8 pb-32">
            <ConfettiBurst trigger={confettiTrigger} />

            <div className="w-full px-4 flex justify-between items-end mb-8">
                <div>
                    <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">{date}</p>
                    <h1 className="text-4xl font-black text-white tracking-tight mt-1">Welcome Back!</h1>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-white text-sm">{streak}</span>
                    </div>
                    <Link href="/analytics" className="flex items-center space-x-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                    </Link>
                    <Link href="/chat" className="flex items-center space-x-1.5 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                        <MessageCircle className="w-4 h-4 text-violet-400" />
                    </Link>
                    <Link href="/goals" className="flex items-center space-x-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                        <Target className="w-4 h-4 text-emerald-400" />
                    </Link>
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start px-2">
                
                {/* Column 1: XP, Check-in, Mood, Challenges, Zen, Vision Scanner */}
                <div className="md:col-span-4 space-y-6">
                    <XpBar />

                    {!isLoading && !hasCheckedInToday && userId && (
                        <div className="w-full px-4">
                            <DailyCheckIn userId={userId} currentDate={todayStr} />
                        </div>
                    )}

                    <MoodLogger />
                    <DailyChallenge />

                    <div className="w-full px-4">
                        <Link href="/routine" className="block w-full">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-3xl p-5 flex items-center justify-between shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white/20 p-2.5 rounded-xl">
                                        <span className="text-xl">🧘‍♂️</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white text-sm">Zen Mode</h3>
                                        <p className="text-[10px] text-blue-100 uppercase tracking-wider font-bold">Distraction-free routine player</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-full px-4 py-2 text-xs font-bold text-white">
                                    Start →
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="w-full px-4">
                        <HandfulScanner onLogsCompleted={refreshLogs} />
                    </div>

                    {!isLoading && userId && (
                        <div className="w-full px-4">
                            <StreakFreeze currentStreak={streak} userId={userId} />
                        </div>
                    )}
                </div>

                {/* Column 2: Progress Ring, Timeline, Today's Checklist */}
                <div className="md:col-span-4 space-y-6">
                    <ProgressRing completed={completed} total={total} />
                    <SupplementTimeline />
                    <DailyChecklist logs={todayLogs} setLogs={setTodayLogs} dateStr={todayStr} />
                </div>

                {/* Column 3: Stock/Expiry Alerts, Weekly Report, recommendations, heatmaps, budget */}
                <div className="md:col-span-4 space-y-6">
                    <InventoryAlerts alerts={lowStockAlerts} />
                    <ExpiryAlerts />
                    <WeeklyReport />
                    <SmartRecs />
                    <ConsistencyHeatmap data={heatmapData} />

                    {!isLoading && correlationData.length > 0 && (
                        <CorrelationChart data={correlationData} />
                    )}

                    {!isLoading && budgetItems.length > 0 && (
                        <BudgetWidget items={budgetItems} />
                    )}

                    <SmartTimingOptimizer />
                    <LogWorkout />
                </div>
            </div>

            {/* Dedicated SyncBot AI 4.0 Section */}
            <SyncbotAiSection />

            {/* Voice Logger FAB */}
            <VoiceLogger onLogUpdate={refreshLogs} />
        </div>
    )
}
