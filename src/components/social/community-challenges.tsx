'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Clock, Plus, X, Loader2, Sparkles, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'
import { cn } from '@/lib/utils'

type Challenge = {
    id: string
    title: string
    description: string
    goal_type: string
    goal_value: number
    start_date: string
    end_date: string
    participant_count: number
    joined: boolean
    my_progress: number
}

export function CommunityChallenges() {
    const supabase = createClient()
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newDays, setNewDays] = useState(7)
    const [creating, setCreating] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => { load() }, [])

    const load = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: chals } = await supabase
            .from('challenges')
            .select('*')
            .gte('end_date', new Date().toLocaleDateString('en-CA'))
            .order('created_at', { ascending: false })
            .limit(10)

        if (!chals) { setIsLoading(false); return }

        const withParticipants = await Promise.all(chals.map(async (c: any) => {
            const { count } = await supabase
                .from('challenge_participants')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', c.id)

            const { data: myPart } = await supabase
                .from('challenge_participants')
                .select('progress')
                .eq('challenge_id', c.id)
                .eq('user_id', user.id)
                .maybeSingle()

            return {
                ...c,
                participant_count: count || 0,
                joined: !!myPart,
                my_progress: myPart?.progress || 0,
            }
        }))

        setChallenges(withParticipants)
        setIsLoading(false)
    }

    const create = async () => {
        if (!newTitle.trim()) return
        setCreating(true)
        setErrorMsg('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setCreating(false); return }

        const start = new Date()
        const end = new Date()
        end.setDate(end.getDate() + newDays)

        const { error } = await supabase.from('challenges').insert({
            creator_id: user.id,
            title: newTitle,
            description: newDesc,
            goal_type: 'consistency',
            goal_value: newDays,
            start_date: start.toLocaleDateString('en-CA'),
            end_date: end.toLocaleDateString('en-CA'),
        })

        if (error) {
            setErrorMsg(error.message)
            setCreating(false)
            return
        }

        setNewTitle('')
        setNewDesc('')
        setShowCreate(false)
        setCreating(false)
        load()
    }

    const join = async (chalId: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase.from('challenge_participants').insert({ challenge_id: chalId, user_id: user.id })
        setChallenges(prev => prev.map(c => c.id === chalId ? { ...c, joined: true, participant_count: c.participant_count + 1 } : c))
    }

    const daysLeft = (endDate: string) => {
        const diff = new Date(endDate).getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Marketplace</h3>
                </div>
                <button
                    onClick={() => { setShowCreate(!showCreate); setErrorMsg(''); }}
                    className="flex items-center space-x-1 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create</span>
                </button>
            </div>

            {/* Create form dialog */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 shadow-2xl space-y-4 mb-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">New Challenge Quest</h4>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Challenge name..."
                                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                            <input
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Quest Duration</span>
                                <select
                                    value={newDays}
                                    onChange={e => setNewDays(parseInt(e.target.value))}
                                    className="bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                                >
                                    <option value={3}>3 days</option>
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                </select>
                            </div>
                            {errorMsg && <p className="text-[10px] text-red-400 text-center bg-red-950/20 p-2 rounded-xl">{errorMsg}</p>}
                            <Button 
                                onClick={create} 
                                disabled={creating || !newTitle.trim()} 
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs h-10 rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Quest'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
            ) : challenges.length === 0 ? (
                <div className="text-center py-8 border border-white/[0.04] bg-white/[0.01] rounded-3xl">
                    <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No active challenges. Launch one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {challenges.map((c, i) => {
                        const days = daysLeft(c.end_date)
                        return (
                            <motion.div
                                key={c.id}
                                className={cn(
                                    "p-5 rounded-3xl border transition-all relative overflow-hidden group",
                                    c.joined 
                                        ? "bg-gradient-to-br from-amber-500/[0.03] to-transparent border-amber-500/20 hover:border-amber-500/30" 
                                        : "bg-white/[0.01] border-white/[0.05] hover:border-white/[0.1]"
                                )}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {/* Left indicator */}
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-[3px]",
                                    c.joined ? "bg-amber-500" : "bg-blue-500"
                                )} />

                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div>
                                        <h4 className="text-sm font-black text-white leading-tight">{c.title}</h4>
                                        {c.description && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{c.description}</p>}
                                    </div>
                                    <div className="flex items-center space-x-1 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full flex-shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{days}d left</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pl-2">
                                    <div className="flex items-center space-x-1.5">
                                        <Users className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.participant_count} Adopted</span>
                                    </div>

                                    {c.joined ? (
                                        <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
                                            <Sparkles className="w-3 h-3 text-amber-400" />
                                            <span className="text-[9px] font-black text-amber-400 uppercase">Joined ✓</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => join(c.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:scale-105"
                                        >
                                            Join Quest
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
