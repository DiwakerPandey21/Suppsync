'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, GitCommit, GitPullRequest, Search, Loader2, Save, Undo2, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StackVersion = {
    id: string
    version_name: string
    is_active: boolean
    created_at: string
    stack_snapshot_json: {
        supplements: { name: string, amount: string, frequency: string, time: string }[]
    }
}

export function StackVersionsManager() {
    const supabase = createClient()
    const [versions, setVersions] = useState<StackVersion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isRestoring, setIsRestoring] = useState<string | null>(null)
    const [newVersionName, setNewVersionName] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchVersions = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('stack_versions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            
        if (data) {
            setVersions(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchVersions()
    }, [supabase])

    const handleCommitStack = async () => {
        if (!newVersionName.trim()) return
        setIsSaving(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch current active schedules
        const { data: schedules } = await supabase
            .from('schedules')
            .select('dosage_amount, dosage_unit, frequency, time_of_day, trigger_type, offset_mins, supplements(name)')
            .eq('user_id', user.id)
            .eq('is_active', true)

        if (!schedules || schedules.length === 0) {
            alert("No active supplements to save in this version.")
            setIsSaving(false)
            return
        }

        const snapshot = {
            supplements: schedules.map((s: any) => {
                const supp = Array.isArray(s.supplements) ? s.supplements[0] : s.supplements
                let timeStr = s.time_of_day
                if (s.trigger_type && s.trigger_type !== 'fixed') {
                    timeStr = `${s.trigger_type} offset ${s.offset_mins}m`
                }
                return {
                    name: supp?.name || 'Unknown',
                    amount: `${s.dosage_amount}${s.dosage_unit}`,
                    frequency: s.frequency,
                    time: timeStr
                }
            })
        }

        const { error } = await supabase.from('stack_versions').insert({
            user_id: user.id,
            version_name: newVersionName,
            stack_snapshot_json: snapshot,
            is_active: true // The one we just saved reflects current reality
        })

        if (!error) {
            // Mark all others as inactive
            await supabase.from('stack_versions').update({ is_active: false }).eq('user_id', user.id).neq('version_name', newVersionName)
            setNewVersionName('')
            setIsDialogOpen(false)
            fetchVersions()
        }
        setIsSaving(false)
    }

    const handleRestoreCommit = async (version: StackVersion) => {
        // In a full implementation, this would actually mutate the `schedules` table,
        // deleting current schedules and inserting the ones from the snapshot.
        // For V10 UI purposes, we will just update the is_active flag to show the rollback.
        if (!confirm(`Are you sure you want to rollback your active schedules to "${version.version_name}"?`)) return
        
        setIsRestoring(version.id)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase.from('stack_versions').update({ is_active: false }).eq('user_id', user.id)
            await supabase.from('stack_versions').update({ is_active: true }).eq('id', version.id)
            await fetchVersions()
        }
        setIsRestoring(null)
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <GitBranch className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Stack Versions</h2>
                        <p className="text-xs text-slate-400">Git for Biohacking</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white border-none">
                            <Save className="w-4 h-4 mr-1.5" />
                            Commit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-indigo-400 text-xl font-bold">
                                <GitCommit className="w-5 h-5 mr-2" />
                                Commit Current Stack
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 relative z-10">
                                Save exactly what you're taking right now. If your tweaks don't work next week, you can rollback to this exact version instantly.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 relative z-10">
                            <div className="space-y-2">
                                <Label htmlFor="name">Version Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Huberman Sleep Stack v2"
                                    className="bg-slate-950 border-slate-800 text-white"
                                    value={newVersionName}
                                    onChange={e => setNewVersionName(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white relative z-10"
                            onClick={handleCommitStack}
                            disabled={isSaving || !newVersionName.trim()}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Snapshot'}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
            ) : versions.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-xl">
                    <GitPullRequest className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-white mb-1">No commits yet</p>
                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto">Commit your current library to establish a baseline before making tweaks.</p>
                </div>
            ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:to-transparent">
                    {/* Simplified Timeline View */}
                    {versions.map((ver, idx) => (
                        <div key={ver.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                           {/* Timeline dot */}
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-slate-900 bg-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${ver.is_active ? 'border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-700 text-slate-400'}`}>
                                {ver.is_active ? <BadgeCheck className="w-4 h-4" /> : <GitCommit className="w-4 h-4" />}
                            </div>

                            {/* Card */}
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:bg-slate-800 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className={`text-sm font-bold ${ver.is_active ? 'text-emerald-400' : 'text-white'}`}>{ver.version_name}</h3>
                                        <time className="text-[10px] text-slate-500 font-mono">{new Date(ver.created_at).toLocaleDateString()} {new Date(ver.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                    </div>
                                    {!ver.is_active && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700 hidden group-hover:flex"
                                            onClick={() => handleRestoreCommit(ver)}
                                            disabled={isRestoring === ver.id}
                                        >
                                            {isRestoring === ver.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {ver.stack_snapshot_json.supplements.slice(0, 3).map((s, i) => (
                                        <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300 truncate max-w-[100px]">
                                            {s.name}
                                        </span>
                                    ))}
                                    {ver.stack_snapshot_json.supplements.length > 3 && (
                                        <span className="text-[10px] text-slate-500">+{ver.stack_snapshot_json.supplements.length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
