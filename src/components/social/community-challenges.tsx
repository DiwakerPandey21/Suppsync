'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Trophy, Users, Clock, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'

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
                .single()

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const start = new Date()
        const end = new Date()
        end.setDate(end.getDate() + newDays)

        await supabase.from('challenges').insert({
            creator_id: user.id,
            title: newTitle,
            description: newDesc,
            goal_type: 'consistency',
            goal_value: newDays,
            start_date: start.toLocaleDateString('en-CA'),
            end_date: end.toLocaleDateString('en-CA'),
        })

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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-bold text-white">Challenges</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} size="sm" variant="outline" className="h-7 text-[10px] border-slate-700">
                    <Plus className="w-3 h-3 mr-1" /> Create
                </Button>
            </div>

            {showCreate && (
                <GlassCard gradient="amber">
                    <input
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Challenge name..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none mb-2"
                    />
                    <input
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none mb-2"
                    />
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-[10px] text-slate-500">Duration:</span>
                        <select
                            value={newDays}
                            onChange={e => setNewDays(parseInt(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        >
                            <option value={3}>3 days</option>
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                        </select>
                    </div>
                    <Button onClick={create} disabled={creating || !newTitle.trim()} className="w-full bg-amber-600 hover:bg-amber-700 text-sm">
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Challenge'}
                    </Button>
                </GlassCard>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
            ) : challenges.length === 0 ? (
                <div className="text-center py-8">
                    <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No active challenges. Create one!</p>
                </div>
            ) : (
                challenges.map((c, i) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <GlassCard gradient={c.joined ? 'amber' : 'blue'}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="text-xs font-bold text-white">{c.title}</h4>
                                    {c.description && <p className="text-[10px] text-slate-400 mt-0.5">{c.description}</p>}
                                </div>
                                <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                                    <span className="text-[9px] text-slate-400">{daysLeft(c.end_date)}d left</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] text-slate-400">{c.participant_count} joined</span>
                                </div>

                                {c.joined ? (
                                    <span className="text-[10px] font-bold text-amber-400">Joined ✓</span>
                                ) : (
                                    <button
                                        onClick={() => join(c.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
                                    >
                                        Join
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                ))
            )}
        </div>
    )
}
