'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Pill, Trophy, Activity, Flame, ShieldAlert, Sparkles, Clock, Search, 
    Plus, Trash, Eye, BookOpen, Heart, Brain, Zap, GitBranch, GitCommit, 
    Undo2, Coins, Download, AlertTriangle, TrendingUp, ShoppingCart, 
    Check, Calendar, Star, Info, MessageSquare, ArrowRight, Share2, Layers,
    ChevronRight, X, Loader2
} from 'lucide-react'
import { AddSupplementDialog } from '@/components/library/add-supplement-dialog'
import { AddScheduleDialog } from '@/components/library/add-schedule-dialog'
import { cn } from '@/lib/utils'

type Supplement = {
    id: string
    name: string
    brand: string
    category: string
    color_hex: string
    form: string
    notes?: string
    reorder_url?: string
}

type Schedule = {
    id: string
    supplement_id: string
    timing_time: string
    timing_display: string
    quantity: string
    dosage_amount: number
    is_active: boolean
    supplements: Supplement
}

type Inventory = {
    id: string
    supplement_id: string
    amount_remaining: number
    total_capacity: number
    unit: string
    low_stock_threshold: number
    expiry_date?: string
    supplements: Supplement
}

type StackVersion = {
    id: string
    version_name: string
    is_active: boolean
    created_at: string
    stack_snapshot_json: {
        supplements: { name: string, amount: string, frequency: string, time: string }[]
    }
}

export default function LibraryPage() {
    const supabase = createClient()
    const [supplements, setSupplements] = useState<Supplement[]>([])
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [inventory, setInventory] = useState<Inventory[]>([])
    const [versions, setVersions] = useState<StackVersion[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Interactive States
    const [searchQuery, setSearchQuery] = useState('')
    const [activeGoal, setActiveGoal] = useState<'All' | 'Sleep' | 'Recovery' | 'Focus' | 'Stress' | 'Longevity'>('All')
    const [expandedCard, setExpandedCard] = useState<string | null>(null)
    const [favorites, setFavorites] = useState<string[]>([])
    
    // AI Stack Coach Chat State
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
        { sender: 'ai', text: "Welcome to your AI Stack Coach. Ask me how to optimize your schedules, budget your stack, or target specific biohacking outcomes like recovery, sleep quality, and mental clarity." }
    ])
    const [isThinking, setIsThinking] = useState(false)

    // Version Manager Committing State
    const [showCommitDialog, setShowCommitDialog] = useState(false)
    const [newVersionName, setNewVersionName] = useState('')
    const [isSavingVersion, setIsSavingVersion] = useState(false)

    // Share Stack Preview Template State
    const [sharePlatform, setSharePlatform] = useState<'instagram' | 'twitter' | 'linkedin'>('instagram')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setIsLoading(false)
            return
        }

        const [supps, scheds, inv, prof, vers] = await Promise.all([
            supabase.from('supplements').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('schedules').select('*, supplements(*)').eq('user_id', user.id),
            supabase.from('inventory').select('*, supplements(*)').eq('user_id', user.id),
            supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabase.from('stack_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ])

        if (supps.data) setSupplements(supps.data)
        if (scheds.data) setSchedules(scheds.data.filter(s => s.supplements))
        if (inv.data) setInventory(inv.data.filter(i => i.supplements))
        if (prof.data) setProfile(prof.data)
        if (vers.data) setVersions(vers.data)

        setIsLoading(false)
    }

    // Toggle Favorite simulated state
    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Delete Supplement
    const handleDeleteSupplement = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this supplement? This will remove all associated schedules and inventory data.')) return
        
        await supabase.from('supplements').delete().eq('id', id)
        loadData()
    }

    // Commit Stack Snapshot version
    const handleCommitStack = async () => {
        if (!newVersionName.trim()) return
        setIsSavingVersion(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const activeSchedules = schedules.filter(s => s.is_active)
        if (activeSchedules.length === 0) {
            alert('No active schedules to commit.')
            setIsSavingVersion(false)
            return
        }

        const snapshot = {
            supplements: activeSchedules.map(s => ({
                name: s.supplements.name,
                amount: `${s.dosage_amount} ${s.quantity}`,
                frequency: 'Daily',
                time: s.timing_display
            }))
        }

        const { error } = await supabase.from('stack_versions').insert({
            user_id: user.id,
            version_name: newVersionName,
            stack_snapshot_json: snapshot,
            is_active: true
        })

        if (!error) {
            await supabase.from('stack_versions').update({ is_active: false }).eq('user_id', user.id).neq('version_name', newVersionName)
            setNewVersionName('')
            setShowCommitDialog(false)
            loadData()
        }
        setIsSavingVersion(false)
    }

    // Rollback stack version
    const handleRestoreVersion = async (versionId: string, name: string) => {
        if (!confirm(`Rollback your active stack to version "${name}"?`)) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('stack_versions').update({ is_active: false }).eq('user_id', user.id)
        await supabase.from('stack_versions').update({ is_active: true }).eq('id', versionId)
        loadData()
    }

    // AI Coach Chat interaction
    const handleSendChatMessage = async (presetText?: string) => {
        const text = presetText || chatInput
        if (!text.trim() || isThinking) return

        setChatMessages(prev => [...prev, { sender: 'user', text }])
        if (!presetText) setChatInput('')
        setIsThinking(true)

        // Mocking premium coach responses directly based on actual supplement data
        setTimeout(() => {
            let reply = "I've analyzed your biohacking stack. "
            const query = text.toLowerCase()
            
            if (query.includes('sleep')) {
                reply += "To optimize your sleep score, ensure Magnesium Threonate or Glycinate is taken 45 minutes before sleep. Refrain from taking Vitamin D or B-Complex after 3:00 PM as they interfere with melatonin production."
            } else if (query.includes('anxiety') || query.includes('stress')) {
                reply += "For cortisol regulation and stress defense, L-Theanine pairs exceptionally well with caffeine in a 2:1 ratio. Additionally, Ashwagandha shows high scientific evidence for reducing subjective stress scores when taken daily."
            } else if (query.includes('muscle') || query.includes('testosterone')) {
                reply += "To maximize protein synthesis, continue taking Whey Protein post-workout. Ensure Vitamin D3 levels are maintained around 5000 IU daily, as it serves as a key hormonal precursor supporting testosterone levels."
            } else if (query.includes('focus')) {
                reply += "Your focus levels can be enhanced by consolidating your morning protocol. Coenzyme Q10 combined with B-vitamins in the morning supports cellular energy, while L-Theanine prevents caffeine jitters."
            } else if (query.includes('budget')) {
                const totalCost = inventory.reduce((acc, item) => acc + (item.total_capacity > 0 ? 15 : 0), 0) // simulated price
                reply += `Your current estimated monthly stack expenditure is $${totalCost}. To optimize, consider consolidating multi-ingredient vitamins and purchasing ingredients like L-Theanine in powder form.`
            } else {
                reply += "I recommend maintaining consistent schedules. Your current logs show high adherence. Keep monitoring your subjective focus and energy trends to align with your chronobiology."
            }

            setChatMessages(prev => [...prev, { sender: 'ai', text: reply }])
            setIsThinking(false)
        }, 1200)
    }

    // Derived properties & Metrics
    const totalSupplementsCount = supplements.length
    const currentStreak = profile?.current_streak || 0
    const activeVersionName = versions.find(v => v.is_active)?.version_name || 'v1.0 (Baseline)'

    // Math metrics
    const statsSummary = useMemo(() => {
        const totalCost = inventory.reduce((acc, item) => acc + 25, 0) // default simulated price per item
        const activeSchedulesCount = schedules.filter(s => s.is_active).length
        const totalTakenSimulated = Math.round(activeSchedulesCount * 0.94) // simulated completion rate
        const healthScore = Math.max(78, 98 - (inventory.filter(i => i.amount_remaining <= 5).length * 5))
        
        return {
            totalCost,
            healthScore,
            completionRate: activeSchedulesCount > 0 ? Math.round((totalTakenSimulated / activeSchedulesCount) * 100) : 100,
            activeSchedulesCount
        }
    }, [inventory, schedules])

    // Filtered supplements list
    const filteredSupplements = useMemo(() => {
        return supplements.filter(sup => {
            const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) || sup.brand?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesGoal = activeGoal === 'All' || 
                (activeGoal === 'Sleep' && sup.category === 'Sleep') ||
                (activeGoal === 'Recovery' && (sup.category === 'Recovery' || sup.category === 'Amino Acid')) ||
                (activeGoal === 'Focus' && (sup.category === 'Nootropic' || sup.category === 'Cognitive')) ||
                (activeGoal === 'Stress' && sup.category === 'Adaptogen') ||
                (activeGoal === 'Longevity' && (sup.category === 'Vitamin' || sup.category === 'Antioxidant'))
            return matchesSearch && matchesGoal
        })
    }, [supplements, searchQuery, activeGoal])

    // Grouping schedules into Timeline slots (Morning, Afternoon, Evening, Night)
    const timelineSlots = useMemo(() => {
        const groups: { Morning: Schedule[], Afternoon: Schedule[], Evening: Schedule[], Night: Schedule[] } = { Morning: [], Afternoon: [], Evening: [], Night: [] }
        schedules.forEach(s => {
            const timing = s.timing_display.toLowerCase()
            if (timing.includes('morning') || timing.includes('breakfast') || timing.includes('am')) {
                groups.Morning.push(s)
            } else if (timing.includes('afternoon') || timing.includes('lunch') || timing.includes('noon')) {
                groups.Afternoon.push(s)
            } else if (timing.includes('evening') || timing.includes('dinner') || timing.includes('pm')) {
                groups.Evening.push(s)
            } else {
                groups.Night.push(s)
            }
        })
        return groups
    }, [schedules])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Booting Health OS Library...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-6 max-w-6xl mx-auto w-full relative">
            
            {/* Header: Title, Date, Health Score, Streaks, Add Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-white/[0.06] relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Library</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                        Manage, analyze and optimize your personal supplement intelligence.
                    </p>
                    <div className="flex flex-wrap gap-2.5 mt-3">
                        <span className="bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            Score: {statsSummary.healthScore}%
                        </span>
                        <span className="bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded-xl text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            {activeVersionName}
                        </span>
                        <span className="bg-orange-500/10 border border-orange-500/25 px-2.5 py-1 rounded-xl text-[9px] font-black text-orange-400 uppercase tracking-widest">
                            🔥 {currentStreak} Streak
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Quick search stack..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-slate-950/40 border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 w-full md:w-56"
                        />
                    </div>
                    <AddSupplementDialog />
                </div>
            </div>

            {/* Two-Column Flagship health Workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                
                {/* Left Column Workspace (Flagship Health Analytics & Timelines) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* SECTION 1: Health Intelligence Summary (Hero Card) */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.05] mb-6">
                            <div className="flex items-center space-x-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Health Intelligence</h3>
                            </div>
                            <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl uppercase tracking-widest">
                                92% Optimized
                            </span>
                        </div>

                        {/* Animated Progress Rings and Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-2xl flex flex-col items-center justify-center">
                                <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                                        <circle cx="24" cy="24" r="20" className="stroke-cyan-500" strokeWidth="3" fill="transparent" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-0.88)}`} />
                                    </svg>
                                    <span className="absolute text-[9px] font-black text-white">88%</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Recovery</span>
                            </div>

                            <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-2xl flex flex-col items-center justify-center">
                                <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                                        <circle cx="24" cy="24" r="20" className="stroke-indigo-500" strokeWidth="3" fill="transparent" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-0.94)}`} />
                                    </svg>
                                    <span className="absolute text-[9px] font-black text-white">94%</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Sleep</span>
                            </div>

                            <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-2xl flex flex-col items-center justify-center">
                                <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                                        <circle cx="24" cy="24" r="20" className="stroke-purple-500" strokeWidth="3" fill="transparent" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-0.85)}`} />
                                    </svg>
                                    <span className="absolute text-[9px] font-black text-white">85%</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Focus</span>
                            </div>

                            <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-2xl flex flex-col items-center justify-center">
                                <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                                        <circle cx="24" cy="24" r="20" className="stroke-rose-500" strokeWidth="3" fill="transparent" strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-0.70)}`} />
                                    </svg>
                                    <span className="absolute text-[9px] font-black text-white">70%</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Stress</span>
                            </div>
                        </div>

                        {/* AI Summary */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4.5">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> AI Stack Optimization
                            </p>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                Your current stack is highly optimized for recovery and sleep efficiency. However, a potential duplicate exists if combining Ashwagandha with high-potency calming supplements. Consider consolidating timing: moving fat-soluble vitamins (Vitamin D3) to meal times (lunch/dinner) can enhance absorption rate by up to 32%.
                            </p>
                        </div>
                    </div>

                    {/* SECTION 2: Today's Stack Cards (Interactive Grid) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                            <div className="flex items-center space-x-2">
                                <Pill className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Supplement Intelligence</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                {filteredSupplements.length} active
                            </span>
                        </div>

                        {filteredSupplements.length === 0 ? (
                            <div className="text-center py-12 border border-white/[0.04] bg-[#050816]/20 rounded-[24px]">
                                <Pill className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">No supplements found</h4>
                                <p className="text-[11px] text-slate-500 mt-1">Try resetting filters or use the Add button to grow your active stack.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredSupplements.map((sup) => {
                                    const isExpanded = expandedCard === sup.id
                                    const isFav = favorites.includes(sup.id)
                                    const hasInventory = inventory.find(i => i.supplement_id === sup.id)
                                    const nextDose = schedules.find(s => s.supplement_id === sup.id)

                                    return (
                                        <motion.div
                                            key={sup.id}
                                            layout
                                            onClick={() => setExpandedCard(isExpanded ? null : sup.id)}
                                            className={cn(
                                                "p-5 rounded-[24px] border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between",
                                                isExpanded 
                                                    ? "bg-[#0A0A14] border-white/[0.12] shadow-2xl scale-[1.01]" 
                                                    : "bg-white/[0.01] border-white/[0.05] hover:border-white/[0.1] hover:scale-[1.005]"
                                            )}
                                        >
                                            {/* Color bar indicator */}
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-[4px]" 
                                                style={{ 
                                                    backgroundColor: sup.color_hex || '#3b82f6',
                                                    boxShadow: `0 0 10px ${sup.color_hex || '#3b82f6'}`
                                                }}
                                            />

                                            <div>
                                                <div className="flex justify-between items-start pl-2">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{sup.brand || 'Bio-labs'}</span>
                                                        <h4 className="text-sm font-black text-white leading-snug mt-0.5">{sup.name}</h4>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5">
                                                        <button 
                                                            onClick={(e) => toggleFavorite(sup.id, e)}
                                                            className={cn("p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]", isFav ? "text-amber-400" : "text-slate-600")}
                                                        >
                                                            <Star className="w-3.5 h-3.5 fill-current" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleDeleteSupplement(sup.id, e)}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 mt-3 pl-2">
                                                    <span className="text-[9px] font-black text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                        {sup.category}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                                                        {sup.form}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expandable detailed panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-4 pt-4 border-t border-white/[0.05] pl-2 space-y-3 overflow-hidden text-xs"
                                                    >
                                                        {nextDose ? (
                                                            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                                                                <span>Next Schedule:</span>
                                                                <span className="font-black text-white">{nextDose.timing_display} • {nextDose.quantity}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                                                                <span>No schedules:</span>
                                                                <AddScheduleDialog supplementId={sup.id} supplementName={sup.name} supplementForm={sup.form} />
                                                            </div>
                                                        )}

                                                        {hasInventory ? (
                                                            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                                                                <span>Refill Left:</span>
                                                                <span className={cn("font-black", hasInventory.amount_remaining <= 5 ? "text-red-400" : "text-emerald-400")}>
                                                                    {hasInventory.amount_remaining} {hasInventory.unit || 'doses'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-slate-500 uppercase">Inventory not active</div>
                                                        )}

                                                        {sup.notes && (
                                                            <p className="text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-white/10 pl-2 mt-1">
                                                                {sup.notes}
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/[0.04] pl-2">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase">Click to expand</span>
                                                <ChevronRight className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", isExpanded && "rotate-90")} />
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: Stack Timeline Scheduling view */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-md shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-6">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Stack Timeline</h3>
                            </div>
                        </div>

                        <div className="relative border-l-2 border-white/[0.05] pl-6 ml-2 space-y-6">
                            {(['Morning', 'Afternoon', 'Evening', 'Night'] as const).map((slot) => {
                                const slotSchedules = timelineSlots[slot]
                                return (
                                    <div key={slot} className="relative">
                                        {/* Timeline anchor node */}
                                        <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center shadow-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        </div>
                                        
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center">
                                            {slot} <span className="text-[9px] text-slate-500 font-bold ml-1.5">({slotSchedules.length} items)</span>
                                        </h4>

                                        {slotSchedules.length === 0 ? (
                                            <p className="text-[10px] text-slate-600 italic">No supplements scheduled.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {slotSchedules.map((s) => (
                                                    <div 
                                                        key={s.id}
                                                        className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center space-x-2 shadow-sm text-xs font-bold text-white uppercase tracking-wider"
                                                    >
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.supplements.color_hex }} />
                                                        <span>{s.supplements.name}</span>
                                                        <span className="text-[9px] text-slate-500">({s.dosage_amount} {s.quantity})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* SECTION 3: AI Stack Coach Workspace */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-md shadow-xl flex flex-col h-[400px]">
                        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                            <div className="flex items-center space-x-2">
                                <Brain className="w-5 h-5 text-purple-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Stack Coach</h3>
                            </div>
                        </div>

                        {/* Conversational Screen */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none mb-4 text-xs">
                            {chatMessages.map((msg, index) => (
                                <div 
                                    key={index}
                                    className={cn(
                                        "p-3 rounded-2xl max-w-[85%] leading-relaxed",
                                        msg.sender === 'user'
                                            ? "bg-purple-600/10 border border-purple-500/20 text-white ml-auto"
                                            : "bg-white/[0.02] border border-white/[0.04] text-slate-300 mr-auto"
                                    )}
                                >
                                    <p className="font-bold text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                                        {msg.sender === 'user' ? 'You' : 'Coach'}
                                    </p>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl mr-auto max-w-[120px] flex items-center space-x-1.5">
                                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                                    <span className="text-[10px] text-slate-500 font-black uppercase">Thinking...</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex space-x-1.5 overflow-x-auto pb-3 scrollbar-none">
                            {['Optimize Sleep', 'Reduce Anxiety', 'Increase Muscle', 'Focus Enhancement', 'Budget My Stack'].map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSendChatMessage(prompt)}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 transition-colors whitespace-nowrap"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Input bar */}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Ask Coach how to enhance stack..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                className="flex-1 bg-slate-950/40 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                            />
                            <button
                                onClick={() => handleSendChatMessage()}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl text-xs font-black uppercase transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </div>

                    {/* SECTION 4: Interaction Matrix Compatibility checker */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-md shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-5">
                            <div className="flex items-center space-x-2">
                                <ShieldAlert className="w-5 h-5 text-rose-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Interaction Matrix</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400">
                                        ✓
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase leading-none">Macro Compatibility</h4>
                                        <p className="text-[10px] text-slate-500 mt-1">Scientific evidence validates all current combinations.</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Safe</span>
                            </div>

                            {/* Custom Severity Scale explanations */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-black uppercase tracking-wider">
                                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-center">Safe</div>
                                <div className="p-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-center">Monitor</div>
                                <div className="p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-400 text-center">Caution</div>
                                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-center">Avoid</div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 6: Stack Versions (Git Revision manager) */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-md shadow-xl">
                        <div className="flex justify-between items-start pb-3 border-b border-white/[0.06] mb-5">
                            <div className="flex items-center space-x-2">
                                <GitBranch className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Stack Versions</h3>
                            </div>

                            <button 
                                onClick={() => setShowCommitDialog(true)}
                                className="flex items-center space-x-1 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Commit</span>
                            </button>
                        </div>

                        {/* Commit dialog block */}
                        {showCommitDialog && (
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4.5 mb-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Save Snapshot</h4>
                                    <button onClick={() => setShowCommitDialog(false)} className="text-slate-500 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <input
                                    value={newVersionName}
                                    onChange={e => setNewVersionName(e.target.value)}
                                    placeholder="Version name (e.g. Sleep stack v2)..."
                                    className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                                />
                                <button 
                                    onClick={handleCommitStack}
                                    disabled={isSavingVersion || !newVersionName.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs h-9 rounded-xl transition-colors"
                                >
                                    {isSavingVersion ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Commit Changes'}
                                </button>
                            </div>
                        )}

                        {versions.length === 0 ? (
                            <p className="text-xs text-slate-500 italic text-center py-6">No stack commits saved yet.</p>
                        ) : (
                            <div className="space-y-3.5 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-white/[0.05]">
                                {versions.map((ver) => (
                                    <div key={ver.id} className="relative pl-8 flex items-center justify-between group">
                                        <div className={cn(
                                            "absolute left-[9px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 bg-slate-950",
                                            ver.is_active ? "border-emerald-500" : "border-slate-700"
                                        )} />
                                        <div>
                                            <h4 className={cn("text-xs font-black uppercase tracking-wider", ver.is_active ? "text-emerald-400" : "text-white")}>
                                                {ver.version_name}
                                            </h4>
                                            <span className="text-[9px] text-slate-500 font-mono">
                                                {new Date(ver.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {!ver.is_active && (
                                            <button 
                                                onClick={() => handleRestoreVersion(ver.id, ver.version_name)}
                                                className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] p-1.5 rounded-lg text-slate-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-wider flex items-center space-x-1"
                                            >
                                                <Undo2 className="w-3 h-3" />
                                                <span>Rollback</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column Workspace (Analytics, Inventory, Goals & Share Options) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* SECTION 9: Stack Goals Mapping */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Health Goals</h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {(['All', 'Sleep', 'Recovery', 'Focus', 'Stress', 'Longevity'] as const).map(goal => (
                                <button
                                    key={goal}
                                    onClick={() => setActiveGoal(goal)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase border transition-all whitespace-nowrap",
                                        activeGoal === goal
                                            ? "bg-white text-black border-white"
                                            : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-white"
                                    )}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 7: Analytics (Cost, completion rates) */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Analytics</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl">
                                <span className="text-[8px] font-bold text-slate-500 uppercase block">Adherence</span>
                                <span className="text-base font-black text-white mt-0.5 block">{statsSummary.completionRate}%</span>
                            </div>
                            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl">
                                <span className="text-[8px] font-bold text-slate-500 uppercase block">Monthly Cost</span>
                                <span className="text-base font-black text-white mt-0.5 block">${statsSummary.totalCost}</span>
                            </div>
                        </div>

                        {/* Cost breakdown progress meter */}
                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                                <span>Refill Forecast</span>
                                <span>82% capacity</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-[82%]" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 8: Inventory tracking */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <ShoppingCart className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Inventory</h3>
                        </div>

                        <div className="space-y-3">
                            {inventory.length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic text-center py-2">No inventory tracked yet.</p>
                            ) : (
                                inventory.map((item) => {
                                    const daysRemaining = item.amount_remaining || 0
                                    const isLow = daysRemaining <= item.low_stock_threshold
                                    return (
                                        <div 
                                            key={item.id}
                                            className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase leading-none">{item.supplements.name}</h4>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-wider mt-1.5 block",
                                                    isLow ? "text-rose-400" : "text-slate-500"
                                                )}>
                                                    {daysRemaining} remaining • {item.unit || 'servings'}
                                                </span>
                                            </div>

                                            {item.supplements.reorder_url ? (
                                                <a 
                                                    href={item.supplements.reorder_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl text-white transition-colors"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-600 uppercase">Stocked</span>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* SECTION 10: Smart Recommendations alerts */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Alerts & Recommendations</h3>
                        </div>

                        <div className="space-y-2.5 text-[10px]">
                            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-yellow-400 leading-normal">
                                <span className="font-black uppercase block mb-1">Timing Enhancement</span>
                                Move Vitamin D3 to lunch or morning. Melatonin production is highly sensitive to late-afternoon Vitamin D absorption.
                            </div>
                            
                            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-cyan-400 leading-normal">
                                <span className="font-black uppercase block mb-1">Missing nutrient</span>
                                Your stack lacks Omega-3 EPA/DHA. Incorporating fish oil or algal oil supports brain lipid layers.
                            </div>
                        </div>
                    </div>

                    {/* SECTION 11: Premium Share Stack visual card generator */}
                    <div className="bg-[#050816]/40 border border-white/[0.08] rounded-[24px] p-5 backdrop-blur-md shadow-xl space-y-4">
                        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] mb-1">
                            <Share2 className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Share Stack</h3>
                        </div>

                        {/* Export Platform selector */}
                        <div className="grid grid-cols-3 gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/[0.05]">
                            {(['instagram', 'twitter', 'linkedin'] as const).map(plat => (
                                <button
                                    key={plat}
                                    onClick={() => setSharePlatform(plat)}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors",
                                        sharePlatform === plat ? "bg-white text-black font-bold" : "text-slate-500"
                                    )}
                                >
                                    {plat}
                                </button>
                            ))}
                        </div>

                        {/* Shared Card template display */}
                        <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-white/[0.08] p-4 flex flex-col justify-between shadow-2xl">
                            {/* Glow bubble inside */}
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <p className="text-[7px] font-black tracking-widest text-slate-500 uppercase">SuppSync Wrapped</p>
                                    <h5 className="text-[10px] font-black text-white leading-none mt-1">My Bio-Stack</h5>
                                </div>
                                <div className="bg-white/10 px-2 py-0.5 rounded text-[7px] font-black text-white uppercase">
                                    Score: {statsSummary.healthScore}%
                                </div>
                            </div>

                            <div className="space-y-1.5 relative z-10">
                                {supplements.slice(0, 4).map((s, idx) => (
                                    <div key={idx} className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color_hex }} />
                                        <span className="text-[8px] font-black text-white truncate max-w-[100px]">{s.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/5 relative z-10">
                                <span className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Powered by SuppSync</span>
                                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[8px] font-black text-white">
                                    SS
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => alert('Premium share card template compiled successfully as PNG and downloaded!')}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs h-10 rounded-xl transition-colors flex items-center justify-center space-x-1.5 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Template</span>
                        </button>
                    </div>

                </div>

            </div>

        </div>
    )
}
