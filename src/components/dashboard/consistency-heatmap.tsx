import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'

export type AdherenceData = {
    date: string // YYYY-MM-DD
    percentage: number // 0 to 100
}

interface ConsistencyHeatmapProps {
    data: AdherenceData[]
}

export function ConsistencyHeatmap({ data }: ConsistencyHeatmapProps) {
    // Generate the last 28 days (4 weeks exactly for a neat grid)
    const days = useMemo(() => {
        const result = []
        for (let i = 27; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toLocaleDateString('en-CA')

            // Find user data for this day
            const dayData = data.find(d => d.date === dateStr)

            result.push({
                date: dateStr,
                displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                percentage: dayData ? dayData.percentage : 0,
                isToday: i === 0
            })
        }
        return result
    }, [data])

    // Calculate overall stats
    const averageAdherence = useMemo(() => {
        if (data.length === 0) return 0
        const total = data.reduce((sum, day) => sum + day.percentage, 0)
        return Math.round(total / data.length)
    }, [data])

    const perfectDays = data.filter(d => d.percentage === 100).length

    // Determine color intensity based on percentage
    const getColorClass = (percentage: number) => {
        if (percentage === 0) return 'bg-slate-800/50 outline outline-1 outline-slate-800' // Empty
        if (percentage < 33) return 'bg-[#3b82f6]/20 outline outline-1 outline-[#3b82f6]/30' // Low
        if (percentage < 66) return 'bg-[#3b82f6]/50 outline outline-1 outline-[#3b82f6]/60' // Medium
        if (percentage < 100) return 'bg-[#3b82f6]/80 outline outline-1 outline-[#3b82f6]/90' // High
        return 'bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]' // Perfect 100%
    }

    return (
        <div className="w-full px-4 mb-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm">

                {/* Header Stats */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            Consistency
                        </h2>
                        <div className="flex items-baseline space-x-1 mt-1">
                            <span className="text-3xl font-black text-white">{averageAdherence}%</span>
                            <span className="text-xs text-slate-500 font-medium">Avg</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center justify-end text-green-400 space-x-1 mb-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-sm font-bold">{perfectDays}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Perfect Days</span>
                    </div>
                </div>

                {/* The Grid - 4 weeks (7 days per column) */}
                <div className="flex space-x-2">
                    {/* Day Labels - Y Axis */}
                    <div className="flex flex-col justify-around text-[9px] text-slate-600 font-medium py-1 pr-1">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-1.5 grid-flow-col">
                        {days.map((day, idx) => (
                            <div
                                key={day.date}
                                title={`${day.displayDate}: ${day.percentage}%`}
                                className={cn(
                                    "w-full pt-[100%] rounded-sm relative transition-all duration-300 hover:scale-110 cursor-help",
                                    getColorClass(day.percentage),
                                    day.isToday && "ring-1 ring-white ring-offset-1 ring-offset-slate-900"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end mt-4 space-x-1.5 text-[10px] text-slate-500">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800/50" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]/20" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]/50" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]/80" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]" />
                    <span>More</span>
                </div>
            </div>
        </div>
    )
}
