import { SupplementList } from '@/components/library/supplement-list'
import { InteractionChecker } from '@/components/library/interaction-checker'
import { CompareSupplements } from '@/components/library/compare-supplements'
import { InteractionMatrix } from '@/components/library/interaction-matrix'
import { StackVersionsManager } from '@/components/library/stack-versions'
import Link from 'next/link'

export default function LibraryPage() {
    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32">
            <div className="w-full px-4 mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Library</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Manage your active biohacking stack</p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-2">
                
                {/* Column 1: Config, builder, comparisons */}
                <div className="space-y-6">
                    {/* V10 Stack Versions Manager */}
                    <div className="w-full px-4">
                        <StackVersionsManager />
                    </div>

                    {/* Stack Builder Link */}
                    <div className="w-full px-4">
                        <Link href="/stack-builder" className="block bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 rounded-3xl p-5 hover:from-amber-500/20 hover:to-orange-500/20 transition-all shadow-md">
                            <p className="text-sm font-black text-white">🧬 AI Stack Builder</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Configure goals → get a custom protocol</p>
                        </Link>
                    </div>

                    {/* Interaction Checker */}
                    <div className="w-full">
                        <InteractionChecker />
                    </div>

                    {/* Supplement Comparison */}
                    <div className="w-full px-4">
                        <CompareSupplements />
                    </div>
                </div>

                {/* Column 2: Lists and Matrices */}
                <div className="space-y-6">
                    {/* Interaction Matrix */}
                    <div className="w-full px-4">
                        <InteractionMatrix />
                    </div>

                    {/* Supplement List */}
                    <div className="px-4">
                        <SupplementList />
                    </div>
                </div>

            </div>
        </div>
    )
}
