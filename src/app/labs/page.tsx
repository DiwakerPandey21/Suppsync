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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Column 1: Genetics */}
                <div className="space-y-6">
                    <div className="w-full flex justify-between items-end pb-4 border-b border-white/[0.05]">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Genetics</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">DNA Sync for protocol AI</p>
                        </div>
                        {userId && <GenotypeLogger userId={userId} onUpdate={fetchData} />}
                    </div>

                    {isLoading ? (
                        <div className="w-full h-24 flex items-center justify-center">
                            <div className="w-6 h-6 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : genotypes.length === 0 ? (
                        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex items-center shadow-sm">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mr-4 border border-indigo-500/20">
                                <Dna className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">No DNA Data Logged</h3>
                                <p className="text-[10px] text-slate-400 max-w-[200px]">Log biological mutations like MTHFR to unlock highly customized AI stack suggestions.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {genotypes.map(g => (
                                <div key={g.id} className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06] rounded-3xl p-4 relative group hover:border-indigo-500/30 transition-all duration-300">
                                    <button 
                                        onClick={() => deleteGenotype(g.id)}
                                        className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <Dna className="w-4 h-4 text-indigo-400 mb-2" />
                                    <h3 className="font-bold text-white text-sm truncate">{g.marker_name}</h3>
                                    <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-wider">
                                        {g.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Column 2: Lab Results / Biomarkers */}
                <div className="space-y-6">
                    <div className="w-full flex justify-between items-end pb-4 border-b border-white/[0.05]">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Lab Results</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Biomarker tracking metrics</p>
                        </div>
                        <LogBiomarkerDialog />
                    </div>

                    {isLoading ? (
                        <div className="w-full h-48 flex items-center justify-center">
                            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : Object.keys(groupedBiomarkers).length === 0 ? (
                        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-md">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                                <Droplet className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Lab Records Yet</h3>
                            <p className="text-slate-400 text-xs mb-6 max-w-[240px] leading-relaxed">
                                Log blood panel biomarkers (like Vitamin D, Iron, or Lipids) to check supplement efficacy.
                            </p>
                            <LogBiomarkerDialog />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedBiomarkers).map(([name, history]) => {
                                const latest = history[0]

                                return (
                                    <div key={name} className="bg-white/[0.01] border border-white/[0.06] rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.06]">
                                                    <Activity className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-base leading-tight">{name}</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                                        Last Logged: {new Date(latest.record_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="flex items-baseline space-x-1 justify-end bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-xl">
                                                    <span className="text-xl font-black text-blue-400">{latest.value}</span>
                                                    <span className="text-[10px] font-bold text-blue-500">{latest.unit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recharts Graph */}
                                        <div className="w-full h-28 mt-2">
                                            <BiomarkerChart data={history} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
