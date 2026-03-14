'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, MessageCircle, Send, Loader2 } from 'lucide-react'

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
        }).select('id, created_at').single()

        if (data) {
            // Get my username for optimistic update
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', currentUserId).single()
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

    const getActivityText = (act: Activity) => {
        if (act.type === 'badge_unlock') return `earned the "${act.payload?.badge}" badge! 🏆`
        if (act.type === 'streak_milestone') return `hit a ${act.payload?.days}-day streak! 🔥`
        if (act.type === 'protocol_adopt') return `adopted the "${act.payload?.protocol}" protocol`
        return 'did something cool'
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

    return (
        <motion.div
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-start space-x-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {activity.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">
                        <span className="font-bold">{activity.display_name}</span>{' '}
                        <span className="text-slate-400">{getActivityText(activity)}</span>
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(activity.created_at)}</p>
                </div>
            </div>

            {/* Interaction Bar */}
            <div className="flex items-center space-x-3 mt-2 pt-3 border-t border-slate-800/50">
                <div className="flex items-center space-x-2">
                    <button onClick={() => toggleReaction('fire')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-colors ${myReactions.fire ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        <span>🔥</span> {reactionCounts.fire > 0 && <span>{reactionCounts.fire}</span>}
                    </button>
                    <button onClick={() => toggleReaction('muscle')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-colors ${myReactions.muscle ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        <span>💪</span> {reactionCounts.muscle > 0 && <span>{reactionCounts.muscle}</span>}
                    </button>
                    <button onClick={() => toggleReaction('100')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-colors ${myReactions.hundred ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        <span>💯</span> {reactionCounts.hundred > 0 && <span>{reactionCounts.hundred}</span>}
                    </button>
                </div>

                <div className="flex-1" />

                <button 
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs transition-colors ${showComments ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{comments.length}</span>
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                    >
                        <div className="space-y-2 mb-3">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-800/50 rounded-lg p-2.5">
                                    <p className="text-[11px] font-bold text-slate-300">{c.display_name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{c.comment_text}</p>
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-[10px] text-slate-500 italic">No comments yet. Be the first!</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && postComment()}
                                placeholder="Add a comment..."
                                className="flex-1 bg-slate-800 border-none rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                onClick={postComment}
                                disabled={!newComment.trim() || isSubmitting}
                                className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50"
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
