'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, KeyRound, Loader2, Trophy, Share2, X, ClipboardCheck, ClipboardCopy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/glass-card'
import { cn } from '@/lib/utils'

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
    const [copied, setCopied] = useState(false)

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
        }).select().maybeSingle()

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

        const { data: squad, error: fetchErr } = await supabase.from('squads').select('id').eq('invite_code', joinCode.toUpperCase()).maybeSingle()
        
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

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Squads</h3>
                </div>
                {view === 'list' && (
                    <div className="flex space-x-2.5">
                        <button
                            onClick={() => { setView('create'); setErrorMsg('') }}
                            className="flex items-center space-x-1 text-xs font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create</span>
                        </button>
                        <button
                            onClick={() => { setView('join'); setErrorMsg('') }}
                            className="flex items-center space-x-1 text-xs font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Join</span>
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'squad' && activeSquad && (
                    <motion.div
                        key="squad-detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <button onClick={() => setView('list')} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-wider">
                                ← Back to list
                            </button>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-base font-black text-white">{activeSquad.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{activeSquad.description}</p>
                                </div>
                                <button 
                                    onClick={() => copyInviteCode(activeSquad.invite_code)}
                                    className="bg-slate-900 border border-white/[0.08] p-2.5 rounded-xl text-center group active:scale-95 transition-all flex flex-col items-center justify-center min-w-[70px]"
                                >
                                    <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Invite</span>
                                    <span className="text-sm font-black text-blue-400 tracking-wider font-mono my-0.5">{activeSquad.invite_code}</span>
                                    {copied ? (
                                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <ClipboardCopy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center">
                                <Trophy className="w-3.5 h-3.5 text-amber-500 mr-1.5" /> Standings
                            </h5>
                            {isLoading ? (
                                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                            ) : (
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                                    {leaderboard.map((lb, index) => (
                                        <div key={lb.user_id} className="flex items-center justify-between bg-white/[0.01] p-3 rounded-2xl border border-white/[0.04]">
                                            <div className="flex items-center space-x-2.5">
                                                <span className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]",
                                                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                                    index === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-slate-800 text-slate-500'
                                                )}>
                                                    #{index + 1}
                                                </span>
                                                <span className="text-xs font-black text-white">{lb.username}</span>
                                            </div>
                                            <span className="text-xs font-black text-blue-400">{lb.xp} XP</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div
                        key="squad-create"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Assemble Squad</h4>
                            <button onClick={() => setView('list')} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            value={newSquadName}
                            onChange={e => setNewSquadName(e.target.value)}
                            placeholder="Squad Name (e.g. AM Lifters)"
                            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                        <input
                            value={newSquadDesc}
                            onChange={e => setNewSquadDesc(e.target.value)}
                            placeholder="Focus (e.g. Cardio and sleep stacks)"
                            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                        {errorMsg && <p className="text-[10px] text-red-400 text-center bg-red-950/20 p-2 rounded-xl">{errorMsg}</p>}
                        <Button 
                            onClick={createSquad} 
                            disabled={isSaving || !newSquadName.trim()} 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs h-10 rounded-xl transition-all shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Squad'}
                        </Button>
                    </motion.div>
                )}

                {view === 'join' && (
                    <motion.div
                        key="squad-join"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Join Squad</h4>
                            <button onClick={() => setView('list')} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            placeholder="ENTER INVITE CODE"
                            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white font-mono uppercase tracking-widest text-center focus:outline-none focus:border-purple-500/50"
                            maxLength={6}
                        />
                        {errorMsg && <p className="text-[10px] text-red-400 text-center">{errorMsg}</p>}
                        <Button 
                            onClick={joinSquad} 
                            disabled={isSaving || joinCode.length < 6} 
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs h-10 rounded-xl transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Join'}
                        </Button>
                    </motion.div>
                )}

                {view === 'list' && (
                    <motion.div
                        key="squad-list"
                        className="space-y-2.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {isLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                        ) : squads.length === 0 ? (
                            <div className="text-center py-8 border border-white/[0.04] bg-white/[0.01] rounded-3xl">
                                <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">You haven&apos;t joined any squads yet.</p>
                            </div>
                        ) : (
                            squads.map(squad => (
                                <motion.div
                                    key={squad.id}
                                    whileHover={{ scale: 1.005, y: -1 }}
                                    onClick={() => openSquad(squad)}
                                    className="p-4 bg-white/[0.01] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl cursor-pointer transition-all flex items-center justify-between relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500/30" />
                                    <div className="pl-2">
                                        <h4 className="font-black text-white text-xs leading-none">{squad.name}</h4>
                                        <p className="text-[10px] text-slate-500 truncate mt-1.5 max-w-[170px]">{squad.description}</p>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.06] p-2 rounded-xl">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
