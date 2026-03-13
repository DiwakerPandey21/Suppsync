'use client'

import { useState } from 'react'
import { Plus, Check, Loader2, Sparkles, User2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adoptProtocol } from '@/app/discover/actions'
import { useRouter } from 'next/navigation'

type Protocol = {
    id: string
    title: string
    description: string
    author: string
    tags: string[]
    supplements: any[] // JSONB
}

export function ProtocolCard({ protocol }: { protocol: Protocol }) {
    const [isAdopting, setIsAdopting] = useState(false)
    const [adopted, setAdopted] = useState(false)
    const router = useRouter()

    const handleAdopt = async () => {
        setIsAdopting(true)
        const result = await adoptProtocol(protocol.id)
        if (result.success) {
            setAdopted(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)
        }
        setIsAdopting(false)
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Subtle backdrop glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-start mb-3 relative z-10">
                <h3 className="font-black text-xl text-white leading-tight">{protocol.title}</h3>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 shadow-inner">
                    <User2 className="w-4 h-4 text-blue-400" />
                </div>
            </div>

            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {protocol.author}
            </p>

            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                {protocol.description}
            </p>

            <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Includes {protocol.supplements.length} Supplements</p>
                <div className="flex flex-wrap gap-2">
                    {protocol.supplements.map((s, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded-md font-medium flex items-center">
                            <span
                                className="w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: s.color_hex || '#3b82f6' }}
                            />
                            {s.name} <span className="text-slate-500 ml-1">{s.dosage_amount}{s.dosage_unit}</span>
                        </span>
                    ))}
                </div>
            </div>

            <Button
                onClick={handleAdopt}
                disabled={isAdopting || adopted}
                className={`w-full h-12 rounded-xl font-bold transition-all duration-300 ${adopted
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 hover:text-green-400'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-t border-blue-400/30'
                    }`}
            >
                {isAdopting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : adopted ? (
                    <span className="flex items-center justify-center">
                        <Check className="w-5 h-5 mr-2" />
                        Stack Adopted!
                    </span>
                ) : (
                    <span className="flex items-center justify-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Adopt This Stack
                    </span>
                )}
            </Button>
        </div>
    )
}
