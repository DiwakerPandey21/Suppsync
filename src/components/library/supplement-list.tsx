import { Pill } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { AddSupplementDialog } from './add-supplement-dialog'
import { AddScheduleDialog } from './add-schedule-dialog'
import { AiAnalysisDialog } from './ai-analysis-dialog'
import { ShareStackDialog } from './share-stack-dialog'

export async function SupplementList() {
    const supabase = await createClient()

    // Get current user id
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch supplements for user
    const { data: librarySups, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    // Fetch user's current streak
    const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', user?.id)
        .single()

    if (error) {
        console.error('Error fetching supplements:', error)
    }

    const supplements = librarySups || []

    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">Your Stack</h2>
                <div className="flex space-x-2">
                    <ShareStackDialog
                        supplements={supplements.map(s => ({
                            id: s.id,
                            name: s.name,
                            category: s.category,
                            color: s.color_hex
                        }))}
                        streak={profile?.current_streak || 0}
                    />
                    <AiAnalysisDialog supplements={supplements} />
                    <AddSupplementDialog />
                </div>
            </div>

            <div className="space-y-3">
                {supplements.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                        <Pill className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-white">No supplements</h3>
                        <p className="text-xs text-slate-500 mt-1">Add your first supplement to the library.</p>
                    </div>
                ) : (
                    supplements.map((sup) => (
                        <Card key={sup.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center space-x-4">
                                {/* Color indicator dot */}
                                <div
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: sup.color_hex }}
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{sup.name}</h3>
                                    <div className="flex text-xs text-slate-500 mt-1 space-x-2">
                                        {sup.brand && (
                                            <>
                                                <span>{sup.brand}</span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>{sup.form}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="bg-slate-800 px-2 py-1 rounded text-[10px] font-medium text-slate-300">
                                        {sup.category}
                                    </div>
                                    <AddScheduleDialog
                                        supplementId={sup.id}
                                        supplementName={sup.name}
                                        supplementForm={sup.form}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
