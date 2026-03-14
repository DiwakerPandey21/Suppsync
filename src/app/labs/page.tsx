'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Activity, Droplet, Dna, Trash2 } from 'lucide-react'
import { LogBiomarkerDialog } from '@/components/labs/log-biomarker-dialog'
import { BiomarkerChart } from '@/components/labs/biomarker-chart'
import { GenotypeLogger } from '@/components/labs/genotype-logger'

type Biomarker = {
    id: string
    name: string
    value: number
    unit: string
    record_date: string
    notes: string | null
}

type Genotype = {
    id: string
    marker_name: string
    status: string
    notes: string | null
}

export default function LabsPage() {
    const supabase = createClient()
    const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
    const [genotypes, setGenotypes] = useState<Genotype[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const [bioRes, genoRes] = await Promise.all([
            supabase.from('biomarkers').select('*').eq('user_id', user.id).order('record_date', { ascending: false }),
            supabase.from('genotypes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ])

        if (bioRes.data) setBiomarkers(bioRes.data)
        if (genoRes.data) setGenotypes(genoRes.data)
        
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase])

    const deleteGenotype = async (id: string) => {
        await supabase.from('genotypes').delete().eq('id', id)
        fetchData()
    }

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
            {/* Genotypes Section (V10) */}
            <div className="w-full flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Genetics</h1>
                    <p className="text-slate-400 text-sm mt-1">Deep biological sync for AI.</p>
                </div>
                {userId && <GenotypeLogger userId={userId} onUpdate={fetchData} />}
            </div>

            {isLoading ? (
                <div className="w-full h-24 flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : genotypes.length === 0 ? (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center mb-10">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mr-4 border border-indigo-500/20">
                        <Dna className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">No DNA Data</h3>
                        <p className="text-xs text-slate-400 max-w-[200px]">Log mutations like MTHFR to get highly personalized protocol AI recommendations.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mb-10">
                    {genotypes.map(g => (
                        <div key={g.id} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-4 relative group">
                            <button 
                                onClick={() => deleteGenotype(g.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Dna className="w-4 h-4 text-indigo-400 mb-2" />
                            <h3 className="font-bold text-white text-sm truncate">{g.marker_name}</h3>
                            <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">
                                {g.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Biomarker Section */}
            <div className="w-full flex justify-between items-end mb-8 border-t border-slate-800 pt-8">
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
