import { SupplementList } from '@/components/library/supplement-list'
import { InteractionChecker } from '@/components/library/interaction-checker'
import { CompareSupplements } from '@/components/library/compare-supplements'
import { InteractionMatrix } from '@/components/library/interaction-matrix'
import Link from 'next/link'

export default function LibraryPage() {
    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32">
            <div className="w-full px-4 mb-6">
                <h1 className="text-3xl font-black text-white tracking-tight">Library</h1>
                <p className="text-slate-400 text-sm mt-1">Manage all your currently tracked supplements.</p>
            </div>

            {/* Interaction Checker */}
            <InteractionChecker />

            {/* Stack Builder Link */}
            <div className="w-full px-4 mb-4">
                <Link href="/stack-builder" className="block bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 hover:from-amber-500/20 hover:to-orange-500/20 transition-all">
                    <p className="text-sm font-bold text-white">🧬 AI Stack Builder</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tell AI your goals → get a personalized stack</p>
                </Link>
            </div>

            {/* Supplement Comparison */}
            <div className="w-full px-4 mb-4">
                <CompareSupplements />
            </div>

            {/* Interaction Matrix */}
            <div className="w-full px-4 mb-6">
                <InteractionMatrix />
            </div>

            <div className="px-4">
                <SupplementList />
            </div>
        </div>
    )
}
