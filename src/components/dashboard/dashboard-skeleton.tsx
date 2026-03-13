'use client'

export function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen flex-col items-center pt-8 pb-32 animate-pulse">
            {/* Header */}
            <div className="w-full px-6 flex justify-between items-end mb-6">
                <div>
                    <div className="h-4 w-32 bg-slate-800 rounded-md mb-2" />
                    <div className="h-8 w-48 bg-slate-800 rounded-md" />
                </div>
                <div className="h-8 w-16 bg-slate-800 rounded-full" />
            </div>

            {/* Progress Ring placeholder */}
            <div className="py-6 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-[12px] border-slate-800" />
            </div>

            {/* Heatmap placeholder */}
            <div className="w-full px-4 mb-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
                    <div className="h-4 w-24 bg-slate-800 rounded mb-4" />
                    <div className="grid grid-cols-7 grid-rows-4 gap-1.5">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className="w-full pt-[100%] rounded-sm bg-slate-800/50" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Checklist placeholders */}
            <div className="space-y-3 w-full px-4">
                <div className="h-5 w-28 bg-slate-800 rounded mb-4" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 rounded-full bg-slate-700" />
                            <div>
                                <div className="h-4 w-28 bg-slate-800 rounded mb-1.5" />
                                <div className="h-3 w-16 bg-slate-800/60 rounded" />
                            </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-slate-700" />
                    </div>
                ))}
            </div>
        </div>
    )
}
