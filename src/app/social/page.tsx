'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Trophy, Pill, Flame, UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaderboard } from '@/components/social/leaderboard'
import { CommunityChallenges } from '@/components/social/community-challenges'
import { SquadsTab } from '@/components/social/squads-tab'
import { InteractiveFeedItem } from '@/components/social/interactive-feed'

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

export default function SocialPage() {
    const supabase = createClient()
    const [tab, setTab] = useState<'feed' | 'search' | 'leaderboard' | 'challenges' | 'squads'>('feed')
    const [activities, setActivities] = useState<Activity[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        loadFeed()
    }, [])

    const loadFeed = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

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
            .limit(20)

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
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'badge_unlock': return <Trophy className="w-4 h-4 text-yellow-400" />
            case 'streak_milestone': return <Flame className="w-4 h-4 text-orange-400" />
            case 'protocol_adopt': return <Pill className="w-4 h-4 text-blue-400" />
            default: return <Pill className="w-4 h-4 text-slate-400" />
        }
    }

    const getActivityText = (act: Activity) => {
        switch (act.type) {
            case 'badge_unlock': return `unlocked the "${act.payload?.badge}" badge! 🏆`
            case 'streak_milestone': return `hit a ${act.payload?.days}-day streak! 🔥`
            case 'protocol_adopt': return `adopted the "${act.payload?.protocol}" protocol`
            default: return 'did something!'
        }
    }

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        const days = Math.floor(hrs / 24)
        return `${days}d ago`
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-6 h-6 text-blue-400" />
                    <h1 className="text-3xl font-black text-white tracking-tight">Social</h1>
                </div>
                <p className="text-slate-500 text-sm">See what other biohackers are up to.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-900 rounded-xl p-1 mb-6">
                {(['feed', 'search', 'squads', 'leaderboard', 'challenges'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                            tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {t === 'feed' ? 'Feed' : t === 'search' ? 'Find' : t === 'squads' ? 'Squads' : t === 'leaderboard' ? '🏆' : '🎯'}
                    </button>
                ))}
            </div>

            {/* Feed Tab */}
            {tab === 'feed' && (
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-sm text-slate-500">No activity yet. Follow other biohackers to see their updates!</p>
                            <Button
                                onClick={() => setTab('search')}
                                className="mt-4 bg-blue-600 hover:bg-blue-700"
                                size="sm"
                            >
                                Find Users
                            </Button>
                        </div>
                    ) : (
                        activities.map((act) => (
                            <InteractiveFeedItem key={act.id} activity={act as any} currentUserId={userId!} />
                        ))
                    )}
                </div>
            )}

            {/* Search Tab */}
            {tab === 'search' && (
                <div>
                    <div className="flex space-x-2 mb-6">
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by display name..."
                            className="bg-slate-900 border-slate-800 text-white"
                            onKeyDown={e => e.key === 'Enter' && searchUsers()}
                        />
                        <Button onClick={searchUsers} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 px-4">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {searchResults.map((user, i) => (
                            <motion.div
                                key={user.id}
                                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                                        {user.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{user.display_name}</p>
                                        {user.bio && <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{user.bio}</p>}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={user.is_following ? 'outline' : 'default'}
                                    className={user.is_following
                                        ? 'border-green-500/30 text-green-400 h-8 text-xs'
                                        : 'bg-blue-600 hover:bg-blue-700 h-8 text-xs'
                                    }
                                    onClick={() => toggleFollow(user.id)}
                                >
                                    {user.is_following ? <><UserCheck className="w-3 h-3 mr-1" /> Following</> : <><UserPlus className="w-3 h-3 mr-1" /> Follow</>}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'leaderboard' && <Leaderboard />}

            {/* Squads Tab */}
            {tab === 'squads' && <SquadsTab />}

            {/* Challenges Tab */}
            {tab === 'challenges' && <CommunityChallenges />}
        </div>
    )
}
