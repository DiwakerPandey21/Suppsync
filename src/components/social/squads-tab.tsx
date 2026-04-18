'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Users, Plus, KeyRound, Loader2, Trophy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'

type Squad = {
    id: string
    name: string
    description: string
    invite_code: string
    member_count?: number
}

type LeaderboardRank = {
    user_id: string
    username: string
    xp: number
}

export function SquadsTab() {
    const supabase = createClient()
    const [view, setView] = useState<'list' | 'create' | 'join' | 'squad'>('list')
    const [squads, setSquads] = useState<Squad[]>([])
    const [activeSquad, setActiveSquad] = useState<Squad | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardRank[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form states
    const [newSquadName, setNewSquadName] = useState('')
    const [newSquadDesc, setNewSquadDesc] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => { loadMySquads() }, [])

    const loadMySquads = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: members } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id)
        if (members && members.length > 0) {
            const squadIds = members.map(m => m.squad_id)
            const { data: mySquads } = await supabase.from('squads').select('*').in('id', squadIds)
            setSquads(mySquads || [])
        } else {
            setSquads([])
        }
        setIsLoading(false)
    }

    const createSquad = async () => {
        if (!newSquadName.trim()) return
        setIsSaving(true)
        setErrorMsg('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const { data, error } = await supabase.from('squads').insert({
            name: newSquadName,
            description: newSquadDesc,
            invite_code: inviteCode,
            created_by: user.id
        }).select().single()

        if (error) {
            setErrorMsg(error.message)
            setIsSaving(false)
            return
        }

        if (data) {
            await supabase.from('squad_members').insert({
                squad_id: data.id,
                user_id: user.id
            })
            setNewSquadName('')
            setNewSquadDesc('')
            setView('list')
            loadMySquads()
        }
        setIsSaving(false)
    }

    const joinSquad = async () => {
        if (!joinCode.trim()) return
        setIsSaving(true)
        setErrorMsg('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: squad, error: fetchErr } = await supabase.from('squads').select('id').eq('invite_code', joinCode.toUpperCase()).single()
        
        if (fetchErr || !squad) {
            setErrorMsg('Invalid invite code.')
            setIsSaving(false)
            return
        }

        const { error: joinErr } = await supabase.from('squad_members').insert({ squad_id: squad.id, user_id: user.id })
        
        if (joinErr) {
            setErrorMsg('You might already be in this squad.')
        } else {
            setJoinCode('')
            setView('list')
            loadMySquads()
        }
        setIsSaving(false)
    }

    const openSquad = async (squad: Squad) => {
        setActiveSquad(squad)
        setView('squad')
        setIsLoading(true)

        // Fetch members of this squad
        const { data: members } = await supabase.from('squad_members').select('user_id').eq('squad_id', squad.id)
        if (members) {
            const userIds = members.map(m => m.user_id)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, xp')
                .in('id', userIds)
                .order('xp', { ascending: false })
            
            if (profiles) {
                setLeaderboard(profiles.map(p => ({ user_id: p.id, username: p.username || 'User', xp: p.xp || 0 })))
            }
        }
        setIsLoading(false)
    }

    if (view === 'squad' && activeSquad) {
        return (
            <div className="space-y-4">
                <button onClick={() => setView('list')} className="text-xs text-slate-400 hover:text-white">← Back to My Squads</button>
                <GlassCard gradient="blue">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-xl font-black text-white">{activeSquad.name}</h2>
                            <p className="text-sm text-slate-400">{activeSquad.description}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Invite Code</p>
                            <p className="text-lg font-black text-blue-400 tracking-wider font-mono">{activeSquad.invite_code}</p>
                        </div>
                    </div>
                </GlassCard>

                <div className="mt-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                        <Trophy className="w-4 h-4 text-amber-400 mr-2" /> Squad Leaderboard
                    </h3>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((lb, index) => (
                                <div key={lb.user_id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                            index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                            index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                            index === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            #{index + 1}
                                        </div>
                                        <p className="text-sm font-bold text-white">{lb.username}</p>
                                    </div>
                                    <p className="text-sm font-black text-blue-400">{lb.xp} XP</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (view === 'create') {
        return (
            <GlassCard gradient="blue">
                <button onClick={() => { setView('list'); setErrorMsg('') }} className="text-xs text-slate-400 hover:text-white mb-4 block">← Back</button>
                <h3 className="text-lg font-bold text-white mb-4">Create a Squad</h3>
                <input
                    value={newSquadName}
                    onChange={e => setNewSquadName(e.target.value)}
                    placeholder="Squad Name (e.g. Morning Lifters)"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white mb-3 focus:outline-none focus:border-blue-500/50"
                />
                <input
                    value={newSquadDesc}
                    onChange={e => setNewSquadDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-blue-500/50"
                />
                {errorMsg && <p className="text-xs text-red-400 mb-3 text-center bg-red-900/20 p-2 rounded">{errorMsg}</p>}
                <Button onClick={createSquad} disabled={isSaving || !newSquadName.trim()} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Squad'}
                </Button>
            </GlassCard>
        )
    }

    if (view === 'join') {
        return (
            <GlassCard gradient="purple">
                <button onClick={() => setView('list')} className="text-xs text-slate-400 hover:text-white mb-4 block">← Back</button>
                <h3 className="text-lg font-bold text-white mb-4">Join a Squad</h3>
                <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder="Enter 6-character Invite Code"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-widest text-center mb-2 focus:outline-none focus:border-purple-500/50"
                    maxLength={6}
                />
                {errorMsg && <p className="text-xs text-red-400 mb-3 text-center">{errorMsg}</p>}
                <Button onClick={joinSquad} disabled={isSaving || joinCode.length < 6} className="w-full mt-2 bg-purple-600 hover:bg-purple-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Squad'}
                </Button>
            </GlassCard>
        )
    }

    // List View
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                    onClick={() => { setView('create'); setErrorMsg('') }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                        <Plus className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-white">Create Squad</span>
                </button>
                <button 
                    onClick={() => setView('join')}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl hover:bg-purple-500/20 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                        <KeyRound className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-white">Join via Code</span>
                </button>
            </div>

            <h3 className="text-sm font-bold text-white">My Squads</h3>
            
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
            ) : squads.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">You haven't joined any squads yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {squads.map(squad => (
                        <motion.div
                            key={squad.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => openSquad(squad)}
                            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{squad.name}</h4>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{squad.description}</p>
                                </div>
                                <div className="bg-slate-800 p-2 rounded-xl">
                                    <Users className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
