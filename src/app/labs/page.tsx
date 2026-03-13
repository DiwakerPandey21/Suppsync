'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Activity, Droplet } from 'lucide-react'
import { LogBiomarkerDialog } from '@/components/labs/log-biomarker-dialog'
import { BiomarkerChart } from '@/components/labs/biomarker-chart'

type Biomarker = {
    id: string
    name: string
    value: number
    unit: string
    record_date: string
    notes: string | null
}

export default function LabsPage() {
    const supabase = createClient()
    const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchBiomarkers() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('biomarkers')
                .select('*')
                .eq('user_id', user.id)
                .order('record_date', { ascending: false })

            if (data) {
                setBiomarkers(data)
            }
            setIsLoading(false)
        }

        fetchBiomarkers()
    }, [supabase])

    // Group biomarkers by name to aggregate history and find the latest reading
    const groupedBiomarkers = biomarkers.reduce((acc, current) => {
        if (!acc[current.name]) {
            acc[current.name] = []
        }
        acc[current.name].push(current)
        return acc
    }, {} as Record<string, Biomarker[]>)

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            <div className="w-full flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Lab Results</h1>
                    <p className="text-slate-400 text-sm mt-1">Track biomarkers to measure ROI.</p>
                </div>
                <LogBiomarkerDialog />
            </div>

            {isLoading ? (
                <div className="w-full h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : Object.keys(groupedBiomarkers).length === 0 ? (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center mt-4 shadow-xl">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                        <Droplet className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Lab Data Yet</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-[250px]">
                        Start logging your periodic blood work (like Vitamin D or Testosterone) to track the effectiveness of your supplements.
                    </p>
                    <LogBiomarkerDialog />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Render latest values and a trend line for each unique biomarker */}
                    {Object.entries(groupedBiomarkers).map(([name, history]) => {
                        const latest = history[0] // Sorted by date desc in SQL

                        return (
                            <div key={name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                                            <Activity className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{name}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Last active: {new Date(latest.record_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-baseline space-x-1 justify-end">
                                            <span className="text-2xl font-black text-white">{latest.value}</span>
                                            <span className="text-xs font-semibold text-slate-400">{latest.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recharts Graph representing historical data */}
                                <div className="w-full h-32 mt-2">
                                    <BiomarkerChart data={history} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
