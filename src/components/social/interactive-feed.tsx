'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, MessageCircle, Send, Loader2, Trophy, Sparkles, Plus, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

type Activity = {
    id: string
    user_id: string
    display_name?: string
    type: string
    payload: any
    created_at: string
}

type Comment = {
    id: string
    user_id: string
    display_name: string
    comment_text: string
    created_at: string
}

type Reaction = {
    user_id: string
    reaction_type: string
}

export function InteractiveFeedItem({ activity, currentUserId }: { activity: Activity, currentUserId: string }) {
    const supabase = createClient()
    const [reactions, setReactions] = useState<Reaction[]>([])
    const [comments, setComments] = useState<Comment[]>([])
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadInteractions()
    }, [activity.id])

    const loadInteractions = async () => {
        const [recsRes, commsRes] = await Promise.all([
            supabase.from('feed_reactions').select('user_id, reaction_type').eq('activity_id', activity.id),
            supabase.from('feed_comments').select('id, user_id, comment_text, created_at, profiles(username)').eq('activity_id', activity.id).order('created_at', { ascending: true })
        ])

        if (recsRes.data) setReactions(recsRes.data)
        if (commsRes.data) {
            setComments(commsRes.data.map((c: any) => ({
                id: c.id,
                user_id: c.user_id,
                display_name: c.profiles?.username || 'User',
                comment_text: c.comment_text,
                created_at: c.created_at
            })))
        }
    }

    const toggleReaction = async (type: string) => {
        const existing = reactions.find(r => r.user_id === currentUserId && r.reaction_type === type)
        
        // Optimistic UI
        if (existing) {
            setReactions(prev => prev.filter(r => !(r.user_id === currentUserId && r.reaction_type === type)))
            await supabase.from('feed_reactions').delete().match({ activity_id: activity.id, user_id: currentUserId, reaction_type: type })
        } else {
            setReactions(prev => [...prev, { user_id: currentUserId, reaction_type: type }])
            await supabase.from('feed_reactions').insert({ activity_id: activity.id, user_id: currentUserId, reaction_type: type })
        }
    }

    const postComment = async () => {
        if (!newComment.trim() || isSubmitting) return
        setIsSubmitting(true)

        const { data } = await supabase.from('feed_comments').insert({
            activity_id: activity.id,
            user_id: currentUserId,
            comment_text: newComment
        }).select('id, created_at').maybeSingle()

        if (data) {
            // Get my username for optimistic update
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', currentUserId).maybeSingle()
            setComments(prev => [...prev, {
                id: data.id,
                user_id: currentUserId,
                display_name: profile?.username || 'Me',
                comment_text: newComment,
                created_at: data.created_at
            }])
            setNewComment('')
        }
        setIsSubmitting(false)
    }

    const getActivityTheme = () => {
        if (activity.type === 'badge_unlock') return { glow: 'rgba(234,179,8,0.2)', border: 'border-yellow-500/20', line: 'bg-yellow-500', icon: Trophy, iconColor: 'text-yellow-400' }
        if (activity.type === 'streak_milestone') return { glow: 'rgba(249,115,22,0.2)', border: 'border-orange-500/20', line: 'bg-orange-500', icon: Flame, iconColor: 'text-orange-400' }
        return { glow: 'rgba(59,130,246,0.2)', border: 'border-blue-500/20', line: 'bg-blue-500', icon: Sparkles, iconColor: 'text-blue-400' }
    }

    const getActivityText = () => {
        if (activity.type === 'badge_unlock') return `unlocked the "${activity.payload?.badge}" achievement!`
        if (activity.type === 'streak_milestone') return `set a new personal milestone of ${activity.payload?.days}-days consecutive check-ins!`
        if (activity.type === 'protocol_adopt') return `fully integrated the "${activity.payload?.protocol}" stack protocol!`
        return 'logged custom health activity'
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    const reactionCounts = {
        fire: reactions.filter(r => r.reaction_type === 'fire').length,
        muscle: reactions.filter(r => r.reaction_type === 'muscle').length,
        hundred: reactions.filter(r => r.reaction_type === '100').length,
    }

    const myReactions = {
        fire: reactions.some(r => r.user_id === currentUserId && r.reaction_type === 'fire'),
        muscle: reactions.some(r => r.user_id === currentUserId && r.reaction_type === 'muscle'),
        hundred: reactions.some(r => r.user_id === currentUserId && r.reaction_type === '100'),
    }

    const theme = getActivityTheme()
    const IconComponent = theme.icon

    return (
        <motion.div
            className={cn(
                "p-5 rounded-3xl border bg-white/[0.01] hover:bg-white/[0.02] transition-all relative overflow-hidden",
                theme.border
            )}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
            {/* Color bar glow on the left */}
            <div 
                style={{ 
                    boxShadow: `0 0 10px ${theme.glow}` 
                }}
                className={cn("absolute left-0 top-0 bottom-0 w-[3px]", theme.line)}
            />

            {/* Content header */}
            <div className="flex items-start space-x-3.5 pl-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-white/[0.08] flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                    {activity.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-white">{activity.display_name}</span>
                        <div className={cn("p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]", theme.iconColor)}>
                            <IconComponent className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {getActivityText()}
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1">{timeAgo(activity.created_at)}</p>
                </div>
            </div>

            {/* Interactive reaction & comment actions */}
            <div className="flex items-center justify-between pt-3 pl-2 border-t border-white/[0.04]">
                <div className="flex items-center space-x-1.5">
                    <button 
                        onClick={() => toggleReaction('fire')} 
                        className={cn(
                            "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-90",
                            myReactions.fire 
                                ? "bg-orange-500/10 border border-orange-500/25 text-orange-400" 
                                : "bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white"
                        )}
                    >
                        <span>🔥</span> 
                        {reactionCounts.fire > 0 && <span className="font-bold text-[10px] ml-0.5">{reactionCounts.fire}</span>}
                    </button>
                    <button 
                        onClick={() => toggleReaction('muscle')} 
                        className={cn(
                            "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-90",
                            myReactions.muscle 
                                ? "bg-amber-500/10 border border-amber-500/25 text-amber-400" 
                                : "bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white"
                        )}
                    >
                        <span>💪</span> 
                        {reactionCounts.muscle > 0 && <span className="font-bold text-[10px] ml-0.5">{reactionCounts.muscle}</span>}
                    </button>
                    <button 
                        onClick={() => toggleReaction('100')} 
                        className={cn(
                            "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-90",
                            myReactions.hundred 
                                ? "bg-red-500/10 border border-red-500/25 text-red-400" 
                                : "bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white"
                        )}
                    >
                        <span>💯</span> 
                        {reactionCounts.hundred > 0 && <span className="font-bold text-[10px] ml-0.5">{reactionCounts.hundred}</span>}
                    </button>
                </div>

                <button 
                    onClick={() => setShowComments(!showComments)}
                    className={cn(
                        "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95",
                        showComments 
                            ? "bg-blue-600/10 border border-blue-500/25 text-blue-400" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="font-bold text-[10px]">{comments.length}</span>
                </button>
            </div>

            {/* Collapsible comments section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden pl-2 border-t border-white/[0.04] pt-3"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    >
                        <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                            {comments.map(c => (
                                <div key={c.id} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-300">{c.display_name}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.comment_text}</p>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider py-2">No comments yet. Share your thoughts!</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && postComment()}
                                placeholder="Add a comment..."
                                className="flex-1 bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <button
                                onClick={postComment}
                                disabled={!newComment.trim() || isSubmitting}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-2xl disabled:opacity-50 transition-colors active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
