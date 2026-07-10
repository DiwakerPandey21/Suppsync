'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Users, Search, Trophy, Pill, Flame, UserPlus, UserCheck, 
    Loader2, Sparkles, Plus, X, Share2, Award, Zap, KeyRound
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaderboard } from '@/components/social/leaderboard'
import { CommunityChallenges } from '@/components/social/community-challenges'
import { SquadsTab } from '@/components/social/squads-tab'
import { InteractiveFeedItem } from '@/components/social/interactive-feed'
import { cn } from '@/lib/utils'

type Activity = {
    id: string
    user_id: string
    type: string
    payload: any
    created_at: string
    display_name?: string
}

type SearchResult = {
    id: string
    display_name: string
    bio: string
    is_following: boolean
}

type PartnerProfile = {
    id: string
    display_name: string
    current_streak: number
}

export default function SocialPage() {
    const supabase = createClient()
    const [activities, setActivities] = useState<Activity[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    
    // Live Backend Profile States
    const [userId, setUserId] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<{ xp: number; level: number } | null>(null)
    const [myStreak, setMyStreak] = useState(0)
    const [activeChallengesCount, setActiveChallengesCount] = useState(0)
    const [followedPartners, setFollowedPartners] = useState<PartnerProfile[]>([])

    // Filter chip state for unified feed
    const [feedFilter, setFeedFilter] = useState<'All' | 'Milestones' | 'Protocol Adopts' | 'Badge Unlocks'>('All')

    // FAB Speed-dial states
    const [isFabOpen, setIsFabOpen] = useState(false)
    const [modalView, setModalView] = useState<'none' | 'squad-create' | 'squad-join' | 'challenge-create'>('none')

    // Form inputs for modal
    const [newSquadName, setNewSquadName] = useState('')
    const [newSquadDesc, setNewSquadDesc] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [newChallengeTitle, setNewChallengeTitle] = useState('')
    const [newChallengeDesc, setNewChallengeDesc] = useState('')
    const [newChallengeDays, setNewChallengeDays] = useState(7)
    
    const [modalSaving, setModalSaving] = useState(false)
    const [modalError, setModalError] = useState('')
    const [modalSuccessMsg, setModalSuccessMsg] = useState('')

    // Refresh triggers to child components
    const [squadsRefreshKey, setSquadsRefreshKey] = useState(0)
    const [challengesRefreshKey, setChallengesRefreshKey] = useState(0)

    useEffect(() => {
        loadFeed()
        loadUserProfile()
    }, [])

    const loadUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        // Load own profile stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, level, current_streak')
            .eq('id', user.id)
            .maybeSingle()

        if (profile) {
            setUserProfile({ xp: profile.xp || 0, level: profile.level || 1 })
            setMyStreak(profile.current_streak || 0)
        }

        // Load active challenges count
        const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        
        setActiveChallengesCount(count || 0)

        // Load followed partners and their streaks from backend (follows table -> profiles table)
        const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)

        const followIds = follows?.map(f => f.following_id) || []

        if (followIds.length > 0) {
            const { data: followedProfiles } = await supabase
                .from('profiles')
                .select('id, display_name, current_streak')
                .in('id', followIds)
            
            setFollowedPartners((followedProfiles || []).map(p => ({
                id: p.id,
                display_name: p.display_name || 'Partner',
                current_streak: p.current_streak || 0
            })))
        } else {
            setFollowedPartners([])
        }
    }

    const loadFeed = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get users I follow
        const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)

        const followIds = following?.map(f => f.following_id) || []
        followIds.push(user.id) // include own activity

        if (followIds.length > 0) {
            const { data: acts } = await supabase
                .from('activities')
                .select('*')
                .in('user_id', followIds)
                .order('created_at', { ascending: false })
                .limit(30)

            // Fetch display names
            const userIds = [...new Set(acts?.map(a => a.user_id) || [])]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', userIds)

            const nameMap = new Map(profiles?.map(p => [p.id, p.display_name || 'User']) || [])

            setActivities((acts || []).map(a => ({
                ...a,
                display_name: nameMap.get(a.user_id) || 'User',
            })))
        }
        setIsLoading(false)
    }

    const searchUsers = async () => {
        if (!searchQuery.trim()) return
        setIsSearching(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, bio')
            .eq('is_public', true)
            .ilike('display_name', `%${searchQuery}%`)
            .neq('id', user.id)
            .limit(10)

        const { data: myFollows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)

        const followSet = new Set(myFollows?.map(f => f.following_id) || [])

        setSearchResults((profiles || []).map(p => ({
            id: p.id,
            display_name: p.display_name || 'User',
            bio: p.bio || '',
            is_following: followSet.has(p.id),
        })))
        setIsSearching(false)
    }

    const toggleFollow = async (targetId: string) => {
        if (!userId) return

        const result = searchResults.find(r => r.id === targetId)
        if (!result) return

        if (result.is_following) {
            await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetId)
        } else {
            await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
        }

        setSearchResults(prev => prev.map(r =>
            r.id === targetId ? { ...r, is_following: !r.is_following } : r
        ))
        
        // Refresh feed & partner list after change
        loadFeed()
        loadUserProfile()
    }

    // Modal submit handlers
    const handleCreateSquad = async () => {
        if (!newSquadName.trim() || !userId) return
        setModalSaving(true)
        setModalError('')
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const { data, error } = await supabase.from('squads').insert({
            name: newSquadName,
            description: newSquadDesc,
            invite_code: inviteCode,
            created_by: userId
        }).select().maybeSingle()

        if (error) {
            setModalError(error.message)
            setModalSaving(false)
            return
        }

        if (data) {
            await supabase.from('squad_members').insert({ squad_id: data.id, user_id: userId })
            setNewSquadName('')
            setNewSquadDesc('')
            setModalSuccessMsg(`Squad "${data.name}" created!`)
            setSquadsRefreshKey(prev => prev + 1)
            setTimeout(() => {
                setModalView('none')
                setModalSuccessMsg('')
            }, 1500)
        }
        setModalSaving(false)
    }

    const handleJoinSquad = async () => {
        if (!joinCode.trim() || !userId) return
        setModalSaving(true)
        setModalError('')

        const { data: squad, error: fetchErr } = await supabase
            .from('squads')
            .select('id, name')
            .eq('invite_code', joinCode.toUpperCase())
            .maybeSingle()
        
        if (fetchErr || !squad) {
            setModalError('Invalid invite code.')
            setModalSaving(false)
            return
        }

        const { error: joinErr } = await supabase.from('squad_members').insert({ squad_id: squad.id, user_id: userId })
        
        if (joinErr) {
            setModalError('You might already be in this squad.')
        } else {
            setJoinCode('')
            setModalSuccessMsg(`Joined "${squad.name}"!`)
            setSquadsRefreshKey(prev => prev + 1)
            setTimeout(() => {
                setModalView('none')
                setModalSuccessMsg('')
            }, 1500)
        }
        setModalSaving(false)
    }

    const handleCreateChallenge = async () => {
        if (!newChallengeTitle.trim() || !userId) return
        setModalSaving(true)
        setModalError('')

        const start = new Date()
        const end = new Date()
        end.setDate(end.getDate() + newChallengeDays)

        const { error } = await supabase.from('challenges').insert({
            creator_id: userId,
            title: newChallengeTitle,
            description: newChallengeDesc,
            goal_type: 'consistency',
            goal_value: newChallengeDays,
            start_date: start.toLocaleDateString('en-CA'),
            end_date: end.toLocaleDateString('en-CA'),
        })

        if (error) {
            setModalError(error.message)
            setModalSaving(false)
            return
        }

        setNewChallengeTitle('')
        setNewChallengeDesc('')
        setModalSuccessMsg('Quest launched successfully!')
        setChallengesRefreshKey(prev => prev + 1)
        setTimeout(() => {
            setModalView('none')
            setModalSuccessMsg('')
        }, 1500)
        setModalSaving(false)
    }

    const handleInviteFriend = () => {
        navigator.clipboard.writeText('https://suppsync.vercel.app/register')
        alert('SuppSync register link copied to clipboard! Share it with your friends.')
        setIsFabOpen(false)
    }

    // Filtered Feed items
    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            if (feedFilter === 'All') return true
            if (feedFilter === 'Milestones') return act.type === 'streak_milestone'
            if (feedFilter === 'Protocol Adopts') return act.type === 'protocol_adopt'
            if (feedFilter === 'Badge Unlocks') return act.type === 'badge_unlock'
            return true
        })
    }, [activities, feedFilter])

    // Compute online count of followed partners (we consider them online if their streak > 0)
    const onlineCount = useMemo(() => {
        return followedPartners.filter(p => p.current_streak > 0).length
    }, [followedPartners])

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-6 max-w-6xl mx-auto w-full relative">
            
            {/* Dynamic Hero Section */}
            <div className="relative rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 mb-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 left-12 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">SuppSync Hub</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Community Hub</h1>
                        <p className="text-xs text-slate-400 mt-1">Strengthen your habits alongside top biohackers.</p>
                    </div>

                    {/* Streak & XP Stats */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/25">
                                <Flame className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Daily Streak</p>
                                <p className="text-sm font-black text-white">{myStreak} Days</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                                <Award className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Level {userProfile?.level || 1}</p>
                                <p className="text-sm font-black text-white">{userProfile?.xp || 0} XP</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/25">
                                <Trophy className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Quests</p>
                                <p className="text-sm font-black text-white">{activeChallengesCount} Joined</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Live Followed Partners Streaks */}
                <div className="flex items-center space-x-4 mt-6 pt-5 border-t border-white/[0.05] relative z-10">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Partner Streaks</span>
                    
                    {followedPartners.length > 0 ? (
                        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-0.5">
                            <div className="flex -space-x-2">
                                {followedPartners.slice(0, 5).map((partner) => (
                                    <div 
                                        key={partner.id}
                                        title={`${partner.display_name} • Streak: ${partner.current_streak}d`}
                                        className="w-7 h-7 rounded-full bg-slate-900 border border-white/[0.12] flex items-center justify-center text-[10px] font-black text-white relative shadow-md uppercase"
                                    >
                                        {partner.display_name.charAt(0)}
                                        {partner.current_streak > 0 && (
                                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {onlineCount} active • {followedPartners.length} total partners
                            </span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">
                            No active partners yet
                        </span>
                    )}
                </div>
            </div>

            {/* Standardized 12-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (Leaderboard & User Search) - Span 3 */}
                <div className="lg:col-span-3 space-y-6 md:order-1">
                    {/* Podium Leaderboard */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl">
                        <Leaderboard />
                    </div>

                    {/* Find Users / Discover */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <Search className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Discover</h3>
                        </div>

                        <div className="flex space-x-2">
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search usernames..."
                                className="bg-slate-950/40 border-white/[0.08] text-xs text-white placeholder:text-slate-600 rounded-xl h-9"
                                onKeyDown={e => e.key === 'Enter' && searchUsers()}
                            />
                            <button 
                                onClick={searchUsers} 
                                disabled={isSearching} 
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl h-9 w-9 flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-none">
                            {searchResults.map((user, i) => (
                                <motion.div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                                            {user.display_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate leading-tight">{user.display_name}</p>
                                            {user.bio && <p className="text-[9px] text-slate-500 truncate mt-0.5 max-w-[100px]">{user.bio}</p>}
                                        </div>
                                    </div>
                                    <button
                                        className={cn(
                                            "h-7 px-3 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider",
                                            user.is_following
                                                ? 'border border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                        )}
                                        onClick={() => toggleFollow(user.id)}
                                    >
                                        {user.is_following ? 'Joined' : 'Follow'}
                                    </button>
                                </motion.div>
                            ))}
                            {searchQuery && searchResults.length === 0 && !isSearching && (
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider text-center py-4">No biohackers match search.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Column (Activity Feed) - Span 6 */}
                <div className="lg:col-span-6 space-y-6 md:order-2">
                    
                    {/* Feed Filters */}
                    <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {(['All', 'Milestones', 'Protocol Adopts', 'Badge Unlocks'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setFeedFilter(filter)}
                                className={cn(
                                    "px-4 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all whitespace-nowrap",
                                    feedFilter === filter
                                        ? "bg-white text-black border-white shadow-md"
                                        : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-white"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Feed Item List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-16 border border-white/[0.04] bg-white/[0.01] rounded-[24px] p-6">
                                <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Feed is quiet</h4>
                                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">Follow other biohackers to view their daily logs and achievements, or launch a new squad to kickstart activity!</p>
                            </div>
                        ) : (
                            filteredActivities.map((act) => (
                                <InteractiveFeedItem key={act.id} activity={act as any} currentUserId={userId!} />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column (Squads & Challenges) - Span 3 */}
                <div className="md:col-span-2 lg:col-span-3 space-y-6 md:order-3">
                    {/* Squads Component */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl">
                        <SquadsTab key={squadsRefreshKey} />
                    </div>

                    {/* Challenges Marketplace */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl">
                        <CommunityChallenges key={challengesRefreshKey} />
                    </div>
                </div>

            </div>

            {/* Central Modal dialogs for FAB creation forms */}
            <AnimatePresence>
                {modalView !== 'none' && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalView('none')}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 pointer-events-auto"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-[20%] md:inset-auto md:top-[30%] md:left-1/2 md:-translate-x-1/2 bg-[#050816]/95 border border-white/[0.08] rounded-[24px] p-6 z-50 max-w-md w-full shadow-2xl pointer-events-auto mx-auto"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-black text-white uppercase tracking-tight">
                                    {modalView === 'squad-create' && 'Assemble Squad'}
                                    {modalView === 'squad-join' && 'Join via Invite'}
                                    {modalView === 'challenge-create' && 'Launch Quest'}
                                </h3>
                                <button onClick={() => setModalView('none')} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Create Squad Panel */}
                            {modalView === 'squad-create' && (
                                <div className="space-y-4">
                                    <input
                                        value={newSquadName}
                                        onChange={e => setNewSquadName(e.target.value)}
                                        placeholder="Squad Name (e.g. Cardio Elite)"
                                        className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <input
                                        value={newSquadDesc}
                                        onChange={e => setNewSquadDesc(e.target.value)}
                                        placeholder="Goal / Description"
                                        className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                    {modalError && <p className="text-[10px] text-red-400 bg-red-950/20 p-2 rounded-xl text-center">{modalError}</p>}
                                    {modalSuccessMsg && <p className="text-[10px] text-emerald-400 bg-emerald-950/20 p-2 rounded-xl text-center">{modalSuccessMsg}</p>}
                                    <Button 
                                        onClick={handleCreateSquad}
                                        disabled={modalSaving || !newSquadName.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs h-10 rounded-xl"
                                    >
                                        {modalSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Squad'}
                                    </Button>
                                </div>
                            )}

                            {/* Join Squad Panel */}
                            {modalView === 'squad-join' && (
                                <div className="space-y-4">
                                    <input
                                        value={joinCode}
                                        onChange={e => setJoinCode(e.target.value)}
                                        placeholder="ENTER 6-DIGIT CODE"
                                        className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3.5 text-xs text-white font-mono uppercase tracking-widest text-center focus:outline-none focus:border-purple-500/50"
                                        maxLength={6}
                                    />
                                    {modalError && <p className="text-[10px] text-red-400 bg-red-950/20 p-2 rounded-xl text-center">{modalError}</p>}
                                    {modalSuccessMsg && <p className="text-[10px] text-emerald-400 bg-emerald-950/20 p-2 rounded-xl text-center">{modalSuccessMsg}</p>}
                                    <Button 
                                        onClick={handleJoinSquad}
                                        disabled={modalSaving || joinCode.length < 6}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs h-10 rounded-xl"
                                    >
                                        {modalSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Join'}
                                    </Button>
                                </div>
                            )}

                            {/* Create Challenge Panel */}
                            {modalView === 'challenge-create' && (
                                <div className="space-y-4">
                                    <input
                                        value={newChallengeTitle}
                                        onChange={e => setNewChallengeTitle(e.target.value)}
                                        placeholder="Quest Title (e.g. 7-Day Sleep Sync)"
                                        className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                                    />
                                    <input
                                        value={newChallengeDesc}
                                        onChange={e => setNewChallengeDesc(e.target.value)}
                                        placeholder="Description / Requirements"
                                        className="w-full bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                                    />
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Quest Duration</span>
                                        <select
                                            value={newChallengeDays}
                                            onChange={e => setNewChallengeDays(parseInt(e.target.value))}
                                            className="bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                                        >
                                            <option value={3}>3 days</option>
                                            <option value={7}>7 days</option>
                                            <option value={14}>14 days</option>
                                            <option value={30}>30 days</option>
                                        </select>
                                    </div>
                                    {modalError && <p className="text-[10px] text-red-400 bg-red-950/20 p-2 rounded-xl text-center">{modalError}</p>}
                                    {modalSuccessMsg && <p className="text-[10px] text-emerald-400 bg-emerald-950/20 p-2 rounded-xl text-center">{modalSuccessMsg}</p>}
                                    <Button 
                                        onClick={handleCreateChallenge}
                                        disabled={modalSaving || !newChallengeTitle.trim()}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs h-10 rounded-xl"
                                    >
                                        {modalSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Quest'}
                                    </Button>
                                </div>
                            )}

                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating FAB & Glass Speed Dial */}
            <div className="fixed bottom-24 right-6 z-40 pointer-events-auto">
                <div className="relative">
                    {/* Speed Dial Menu options */}
                    <AnimatePresence>
                        {isFabOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                className="absolute bottom-16 right-0 bg-[#050816]/90 border border-white/[0.08] rounded-[24px] p-2.5 shadow-2xl backdrop-blur-xl flex flex-col space-y-1.5 w-44"
                            >
                                <button
                                    onClick={() => { setModalView('squad-create'); setIsFabOpen(false); }}
                                    className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] text-left text-xs font-black text-slate-300 hover:text-white uppercase tracking-wider transition-colors"
                                >
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span>New Squad</span>
                                </button>

                                <button
                                    onClick={() => { setModalView('squad-join'); setIsFabOpen(false); }}
                                    className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] text-left text-xs font-black text-slate-300 hover:text-white uppercase tracking-wider transition-colors"
                                >
                                    <KeyRound className="w-4 h-4 text-purple-400" />
                                    <span>Join Squad</span>
                                </button>

                                <button
                                    onClick={() => { setModalView('challenge-create'); setIsFabOpen(false); }}
                                    className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] text-left text-xs font-black text-slate-300 hover:text-white uppercase tracking-wider transition-colors"
                                >
                                    <Trophy className="w-4 h-4 text-amber-400" />
                                    <span>New Quest</span>
                                </button>

                                <button
                                    onClick={handleInviteFriend}
                                    className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] text-left text-xs font-black text-slate-300 hover:text-white uppercase tracking-wider transition-colors border-t border-white/[0.05] pt-3"
                                >
                                    <Share2 className="w-4 h-4 text-emerald-400" />
                                    <span>Invite Link</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main toggle FAB button */}
                    <motion.button
                        onClick={() => setIsFabOpen(!isFabOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl transition-all",
                            isFabOpen 
                                ? "bg-red-600 shadow-red-600/20 rotate-45" 
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-indigo-600/30"
                        )}
                    >
                        <Plus className="w-6 h-6 stroke-[2.5px]" />
                    </motion.button>
                </div>
            </div>

        </div>
    )
}
