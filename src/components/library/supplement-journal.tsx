'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BookOpen, Plus, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/dashboard/glass-card'

type Note = { id: string; note: string; created_at: string }

export function SupplementJournal({ supplementId, supplementName }: { supplementId: string; supplementName: string }) {
    const supabase = createClient()
    const [notes, setNotes] = useState<Note[]>([])
    const [newNote, setNewNote] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const load = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('supplement_notes')
            .select('id, note, created_at')
            .eq('supplement_id', supplementId)
            .order('created_at', { ascending: false })
            .limit(10)
        setNotes(data || [])
        setIsLoading(false)
    }

    const addNote = async () => {
        if (!newNote.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('supplement_notes').insert({
            user_id: user.id,
            supplement_id: supplementId,
            note: newNote,
        })
        setNewNote('')
        load()
    }

    const deleteNote = async (id: string) => {
        await supabase.from('supplement_notes').delete().eq('id', id)
        setNotes(prev => prev.filter(n => n.id !== id))
    }

    useEffect(() => { if (isOpen) load() }, [isOpen])

    return (
        <div className="mt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 text-[10px] text-slate-500 hover:text-violet-400 transition-colors"
            >
                <BookOpen className="w-3 h-3" />
                <span>Journal</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="mt-2 space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="flex space-x-2">
                            <input
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addNote()}
                                placeholder="Add note..."
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none"
                            />
                            <button
                                onClick={addNote}
                                disabled={!newNote.trim()}
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-2 disabled:opacity-40"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>

                        {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-500 mx-auto" />
                        ) : notes.length === 0 ? (
                            <p className="text-[10px] text-slate-600 italic">No notes yet</p>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="flex items-start justify-between bg-slate-900/30 rounded-lg p-2">
                                    <div>
                                        <p className="text-[11px] text-slate-300">{note.note}</p>
                                        <p className="text-[9px] text-slate-600 mt-0.5">
                                            {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button onClick={() => deleteNote(note.id)} className="text-slate-600 hover:text-red-400 ml-2 flex-shrink-0">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
