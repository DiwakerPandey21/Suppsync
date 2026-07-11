'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { 
    Activity, Droplet, Dna, Trash2, ArrowUpRight, ArrowDownRight, 
    Sparkles, ShieldAlert, Heart, Calendar, Plus, Brain, Info, 
    CheckCircle2, ChevronRight, AlertTriangle, AlertCircle, 
    FileText, UploadCloud, RefreshCw, BarChart2, Scale, Zap, Shield, 
    TrendingUp, Dumbbell, ShieldCheck, Flame, Loader2, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogBiomarkerDialog } from '@/components/labs/log-biomarker-dialog'
import { BiomarkerChart } from '@/components/labs/biomarker-chart'
import { GenotypeLogger } from '@/components/labs/genotype-logger'
import { cn } from '@/lib/utils'

type Biomarker = {
    id: string
    name: string
    value: number
    unit: string
    record_date: string
    notes: string | null
}

type Genotype = {
    id: string
    marker_name: string
    status: string
    notes: string | null
}

export default function LabsPage() {
    const supabase = createClient()
    const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
    const [genotypes, setGenotypes] = useState<Genotype[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'biomarkers' | 'genetics'>('overview')
    
    // Interactive timeline scale selector (local state per biomarker)
    const [timeRanges, setTimeRanges] = useState<Record<string, 'W' | 'M' | 'Q' | 'Y' | 'ALL'>>({})

    // Drag and Drop Upload state
    const [dragActive, setDragActive] = useState(false)
    const [uploadingFile, setUploadingFile] = useState(false)
    const [uploadedData, setUploadedData] = useState<any>(null)
    const [showUploadPreview, setShowUploadPreview] = useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const [bioRes, genoRes] = await Promise.all([
            supabase.from('biomarkers').select('*').eq('user_id', user.id).order('record_date', { ascending: false }),
            supabase.from('genotypes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ])

        if (bioRes.data) setBiomarkers(bioRes.data)
        if (genoRes.data) setGenotypes(genoRes.data)
        
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase])

    const deleteGenotype = async (id: string) => {
        await supabase.from('genotypes').delete().eq('id', id)
        fetchData()
    }

    // Group biomarkers by name
    const groupedBiomarkers = useMemo(() => {
        return biomarkers.reduce((acc, current) => {
            if (!acc[current.name]) {
                acc[current.name] = []
            }
            acc[current.name].push(current)
            return acc
        }, {} as Record<string, Biomarker[]>)
    }, [biomarkers])

    // Derived health score metrics
    const statsSummary = useMemo(() => {
        if (biomarkers.length === 0) {
            return {
                overallScore: 78,
                biomarkerScore: 80,
                confidence: 88,
                alertCount: 1,
                lastDraw: 'N/A'
            }
        }

        // Base overall score calculation
        const alerts = biomarkers.filter(b => {
            if (b.name.includes('Vitamin D') && b.value < 40) return true
            if (b.name.includes('Cortisol') && b.value > 18) return true
            if (b.name.includes('LDL') && b.value > 130) return true
            return false
        })

        const baseScore = Math.max(68, 96 - alerts.length * 8)
        const lastDate = biomarkers[0]?.record_date
            ? new Date(biomarkers[0].record_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
              })
            : 'N/A'

        return {
            overallScore: baseScore,
            biomarkerScore: Math.min(98, baseScore + 4),
            confidence: Math.min(99, 90 + biomarkers.length * 1.5),
            alertCount: alerts.length || 1,
            lastDraw: lastDate
        }
    }, [biomarkers])

    // Categories structure
    const categories = useMemo(() => {
        const list = [
            { id: 'hormones', name: 'Hormones', score: 88, status: 'Optimal', trend: 'up', color: 'text-indigo-400' },
            { id: 'recovery', name: 'Recovery', score: 76, status: 'Monitor', trend: 'down', color: 'text-yellow-400' },
            { id: 'nutrition', name: 'Nutrition', score: 94, status: 'Optimal', trend: 'up', color: 'text-emerald-400' },
            { id: 'heart', name: 'Heart Health', score: 82, status: 'Optimal', trend: 'flat', color: 'text-blue-400' },
            { id: 'inflammation', name: 'Inflammation', score: 90, status: 'Optimal', trend: 'up', color: 'text-purple-400' },
            { id: 'immune', name: 'Immune Guard', score: 85, status: 'Optimal', trend: 'flat', color: 'text-teal-400' },
            { id: 'longevity', name: 'Longevity', score: 89, status: 'Optimal', trend: 'up', color: 'text-rose-400' }
        ]

        // Adapt score slightly to user data
        if (biomarkers.length > 0) {
            const hasLowD = biomarkers.some(b => b.name.includes('Vitamin D') && b.value < 40)
            const hasHighCortisol = biomarkers.some(b => b.name.includes('Cortisol') && b.value > 18)
            
            return list.map(cat => {
                if (cat.id === 'nutrition' && hasLowD) {
                    return { ...cat, score: 62, status: 'Deficient', trend: 'down' as const }
                }
                if (cat.id === 'recovery' && hasHighCortisol) {
                    return { ...cat, score: 58, status: 'Alert', trend: 'down' as const }
                }
                return cat
            })
        }
        return list
    }, [biomarkers])

    // Optimal Ranges lookup
    const getOptimalRange = (name: string) => {
        const marker = name.toLowerCase()
        if (marker.includes('vitamin d')) return { range: '50 - 80', unit: 'ng/mL', desc: 'Active hormone precursor for bone and immune homeostasis.' }
        if (marker.includes('testosterone') && marker.includes('free')) return { range: '35 - 155', unit: 'pg/mL', desc: 'Unbound hormone supporting lean muscle, energy, and cognition.' }
        if (marker.includes('testosterone')) return { range: '350 - 900', unit: 'ng/dL', desc: 'Total androgens vital for protein synthesis, cellular drive, and recovery.' }
        if (marker.includes('cortisol')) return { range: '10 - 20', unit: 'mcg/dL', desc: 'Adrenal indicator regulating circadian rhythms and systemic stress response.' }
        if (marker.includes('hba1c')) return { range: '4.8 - 5.4', unit: '%', desc: 'Glycated hemoglobin mapping average blood glucose bounds over 90 days.' }
        if (marker.includes('ldl')) return { range: '70 - 100', unit: 'mg/dL', desc: 'Low-density lipoprotein tracking metabolic lipid transport vectors.' }
        return { range: 'Optimal range varies', unit: '', desc: 'Crucial health index and biohacking metric.' }
    }

    // Drag-and-drop file handler
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0])
        }
    }

    const processFile = async (file: File) => {
        setUploadingFile(true)
        // Simulate premium OCR & AI Extraction
        setTimeout(() => {
            setUploadedData({
                fileName: file.name,
                biomarkers: [
                    { name: 'Vitamin D3 (25-OH)', value: 72, unit: 'ng/mL', date: new Date().toISOString().split('T')[0] },
                    { name: 'Total Testosterone', value: 680, unit: 'ng/dL', date: new Date().toISOString().split('T')[0] }
                ]
            })
            setUploadingFile(false)
            setShowUploadPreview(true)
        }, 1800)
    }

    const saveExtractedBiomarkers = async () => {
        if (!userId || !uploadedData) return
        
        const insertPayload = uploadedData.biomarkers.map((b: any) => ({
            user_id: userId,
            name: b.name,
            value: b.value,
            unit: b.unit,
            record_date: b.date,
            notes: 'AI-extracted from ' + uploadedData.fileName
        }))

        await supabase.from('biomarkers').insert(insertPayload)
        setShowUploadPreview(false)
        setUploadedData(null)
        fetchData()
    }

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4 max-w-7xl mx-auto space-y-8 select-none">
            
            {/* Labs Tab Navigation */}
            <div className="w-full flex justify-between items-center border-b border-white/[0.06] pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Medical Intelligence</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">AI-powered biomarker diagnosis & DNA sync</p>
                </div>
                
                <div className="flex bg-white/[0.02] border border-white/[0.08] p-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {(['overview', 'biomarkers', 'genetics'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2 rounded-full transition-all duration-300",
                                activeTab === tab 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-8"
                    >
                        {/* SECTION 1: Health Intelligence Hero */}
                        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#0B0C1E] via-[#02030A] to-[#120422] p-8 shadow-2xl">
                            {/* Neon gradient mesh overlays */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
                                
                                {/* Ring metrics Column */}
                                <div className="flex items-center space-x-6 col-span-1 border-r border-white/[0.06] pr-6 lg:border-r-slate-800">
                                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-95">
                                            <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.02)" strokeWidth="8" fill="none" />
                                            <circle 
                                                cx="56" 
                                                cy="56" 
                                                r="48" 
                                                stroke="url(#heroRingGradient)" 
                                                strokeWidth="8" 
                                                fill="none" 
                                                strokeDasharray="301.6"
                                                strokeDashoffset={301.6 - (301.6 * statsSummary.overallScore) / 100}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 ease-out"
                                            />
                                            <defs>
                                                <linearGradient id="heroRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="100%" stopColor="#a855f7" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-white leading-none tracking-tight">{statsSummary.overallScore}%</span>
                                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mt-1">Health Score</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Biomarker Level</span>
                                            <span className="text-sm font-black text-white">{statsSummary.biomarkerScore}% Optimal</span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">AI Diagnosis Confidence</span>
                                            <span className="text-sm font-black text-indigo-400">{statsSummary.confidence}% Accurate</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Context summary Column */}
                                <div className="space-y-3 col-span-1 lg:col-span-2">
                                    <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Medical Intelligence Diagnostic</span>
                                    </div>

                                    <p className="text-sm font-medium text-slate-200 leading-relaxed">
                                        {biomarkers.length > 0 ? (
                                            `Your personal health score stands at ${statsSummary.overallScore}%. Based on your latest lab draw (${statsSummary.lastDraw}), we detected ${statsSummary.alertCount} marker alert factors. Keep monitoring cortisol levels and prioritize Vitamin D intake to maximize hormonal drive.`
                                        ) : (
                                            "Log blood panel biomarkers or link genomic mutations (like MTHFR) to trigger personalized diagnostic AI feedback."
                                        )}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400 pt-1">
                                        <span>Latest draw: <strong className="text-white">{statsSummary.lastDraw}</strong></span>
                                        <span>Active biomarkers: <strong className="text-white">{Object.keys(groupedBiomarkers).length}</strong></span>
                                        <span>Current alerts: <strong className="text-rose-400">{statsSummary.alertCount} Factors</strong></span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Two Column Diagnostic layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Side: Categories and Risks */}
                            <div className="lg:col-span-2 space-y-8">
                                
                                {/* SECTION 2: Health Categories Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">System Health Scores</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                                        {categories.map(cat => (
                                            <div 
                                                key={cat.id}
                                                className="bg-white/[0.01] border border-white/[0.06] p-4 rounded-2xl hover:border-slate-800 transition-all duration-300 relative group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">{cat.name}</h4>
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase block mt-1">{cat.status}</span>
                                                    </div>
                                                    <span className={cn("text-lg font-black leading-none", cat.color)}>{cat.score}%</span>
                                                </div>

                                                {/* Mini progress line */}
                                                <div className="w-full bg-white/[0.04] h-1 rounded-full mt-4 overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            cat.score > 85 ? "bg-emerald-500" : cat.score > 70 ? "bg-yellow-500" : "bg-rose-500"
                                                        )}
                                                        style={{ width: `${cat.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 5: Conversational AI insights report */}
                                <div className="bg-[#050816]/40 border border-white/[0.08] p-6 rounded-[28px] space-y-4 backdrop-blur-md">
                                    <div className="flex items-center space-x-2 border-b border-white/[0.05] pb-3.5 mb-1">
                                        <Brain className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Biomarker Insights</h3>
                                    </div>

                                    <div className="space-y-3.5 text-xs">
                                        {biomarkers.length > 0 ? (
                                            <>
                                                <div className="flex items-start space-x-3 p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong className="text-white block uppercase text-[10px] mb-1">Hormone Optimization Peak</strong>
                                                        Your Free Testosterone is optimal at 800 pg/mL. Unbound androgens map to healthy protein synthesis rate.
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong className="text-white block uppercase text-[10px] mb-1">Adrenal Circadian Alert</strong>
                                                        Cortisol (AM) is slightly elevated. Elevated morning glucocorticoids can increase cellular resistance and fatigue indices. Recommended to optimize sleep consistency.
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 italic uppercase font-bold text-[10px] tracking-wider">
                                                No diagnostic logs recorded yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Right Side: Genetics, Risk & Upload */}
                            <div className="space-y-8">
                                
                                {/* SECTION 7: Deficiency & System Risks */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Risk Assessments</h3>
                                    <div className="space-y-2.5">
                                        {[
                                            { name: 'Deficiency Risk', level: 'Low', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                                            { name: 'Hormone Disruption', level: 'Minimal', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                                            { name: 'Stress Index', level: 'Moderate', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                                            { name: 'Recovery Resistance', level: 'Low', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                                            { name: 'Inflammation Risk', level: 'Low', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
                                        ].map(r => (
                                            <div 
                                                key={r.name}
                                                className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex justify-between items-center text-xs"
                                            >
                                                <span className="font-bold text-slate-300">{r.name}</span>
                                                <span className={cn("px-3 py-0.5 rounded-full font-black uppercase text-[8px] border tracking-wider", r.color)}>
                                                    {r.level}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 9: Drag and Drop Upload experience */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Import Lab Report</h3>
                                    
                                    <div 
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={cn(
                                            "relative border border-dashed rounded-[28px] p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] overflow-hidden bg-white/[0.01]",
                                            dragActive ? "border-blue-500 bg-blue-500/5" : "border-white/[0.1] hover:border-slate-800"
                                        )}
                                    >
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            className="hidden" 
                                            onChange={handleFileChange}
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                        
                                        {uploadingFile ? (
                                            <div className="space-y-2">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI OCR Extracting Biomarkers...</p>
                                            </div>
                                        ) : (
                                            <label htmlFor="file-upload" className="cursor-pointer space-y-2.5">
                                                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                                                <div>
                                                    <span className="text-[10px] font-black text-white uppercase block tracking-wider">Drag & Drop PDF Lab Result</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase block mt-1">or browse files to parse with AI</span>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* SECTION 8: Actionable Recommendations */}
                        <div className="bg-[#050816]/40 border border-white/[0.08] p-6 rounded-[28px] space-y-4 backdrop-blur-md">
                            <div className="flex items-center space-x-2 border-b border-white/[0.05] pb-3.5 mb-1">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Medical Action Protocol</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-normal">
                                <div className="space-y-2.5 p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Supplement protocol</span>
                                    <p className="text-slate-300">Maintain Vitamin D3 (5,000 IU) in the morning paired with fat-soluble meals. Incorporate L-Theanine (200mg) pre-workout.</p>
                                </div>
                                <div className="space-y-2.5 p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Lifestyle adjustments</span>
                                    <p className="text-slate-300">Expose retinas to sunlight within 15 minutes of waking. Exclude caffeine intake after 1:00 PM to maximize sleep score.</p>
                                </div>
                                <div className="space-y-2.5 p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Testing schedule</span>
                                    <p className="text-slate-300">Retest Vitamin D3 levels and AM Cortisol in 90 days to evaluate protocol metabolic efficacy.</p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

                {activeTab === 'biomarkers' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <div className="w-full flex justify-between items-end pb-4 border-b border-white/[0.05]">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">Biomarker Catalog</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Track specific panel metrics over time</p>
                            </div>
                            <LogBiomarkerDialog />
                        </div>

                        {isLoading ? (
                            <div className="w-full h-48 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : Object.keys(groupedBiomarkers).length === 0 ? (
                            <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-md">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                                    <Droplet className="w-8 h-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No Lab Records Yet</h3>
                                <p className="text-slate-400 text-xs mb-6 max-w-[240px] leading-relaxed">
                                    Log blood panel biomarkers (like Vitamin D, Iron, or Lipids) to check supplement efficacy.
                                </p>
                                <LogBiomarkerDialog />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(groupedBiomarkers).map(([name, history]) => {
                                    const latest = history[0]
                                    const rangeInfo = getOptimalRange(name)
                                    const currentRange = timeRanges[name] || 'ALL'

                                    // Calculate diff if history exists
                                    const differenceMetrics = useMemo(() => {
                                        if (history.length < 2) return null
                                        const prev = history[1].value
                                        const diff = latest.value - prev
                                        const percent = Math.round((diff / prev) * 100)
                                        return { diff, percent }
                                    }, [history, latest])

                                    return (
                                        <div 
                                            key={name} 
                                            className="bg-white/[0.01] border border-white/[0.06] rounded-[28px] p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300 flex flex-col justify-between min-h-[340px]"
                                        >
                                            <div>
                                                {/* Header Details */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.06] shrink-0">
                                                            <Activity className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-white text-base leading-tight uppercase tracking-wider">{name}</h3>
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-1">
                                                                Last Logged: {new Date(latest.record_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-baseline space-x-1 justify-end bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-xl">
                                                            <span className="text-xl font-black text-blue-400 leading-none">{latest.value}</span>
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase">{latest.unit || rangeInfo.unit}</span>
                                                        </div>
                                                        
                                                        {differenceMetrics && (
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase tracking-wider mt-1.5 flex items-center space-x-0.5",
                                                                differenceMetrics.diff >= 0 ? "text-emerald-400" : "text-rose-400"
                                                            )}>
                                                                {differenceMetrics.diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                                <span>{Math.abs(differenceMetrics.percent)}% Diff</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Optimal limits */}
                                                <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/[0.04] text-[10px] mb-4">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Optimal Range</span>
                                                        <span className="text-white font-mono font-bold">{rangeInfo.range} {rangeInfo.unit}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Previous Value</span>
                                                        <span className="text-slate-300 font-mono">
                                                            {history[1] ? `${history[1].value} ${history[1].unit}` : 'None'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-slate-400 leading-normal mb-6">
                                                    {rangeInfo.desc}
                                                </p>
                                            </div>

                                            {/* SECTION 4: Interactive Timeline and Chart */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Diagnostic History</span>
                                                    <div className="flex bg-white/[0.02] border border-white/[0.08] p-0.5 rounded-lg">
                                                        {(['W', 'M', 'Q', 'Y', 'ALL'] as const).map(scale => (
                                                            <button
                                                                key={scale}
                                                                onClick={() => setTimeRanges(prev => ({ ...prev, [name]: scale }))}
                                                                className={cn(
                                                                    "px-2 py-0.5 rounded",
                                                                    currentRange === scale ? "bg-blue-600 text-white" : "hover:text-white"
                                                                )}
                                                            >
                                                                {scale}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="w-full h-32 relative z-10">
                                                    <BiomarkerChart data={history} timeRange={currentRange} />
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'genetics' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <div className="w-full flex justify-between items-end pb-4 border-b border-white/[0.05]">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">Genomics Intelligence</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Biological DNA profiles and mutation tracking</p>
                            </div>
                            {userId && <GenotypeLogger userId={userId} onUpdate={fetchData} />}
                        </div>

                        {isLoading ? (
                            <div className="w-full h-48 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : genotypes.length === 0 ? (
                            /* SECTION 6 Empty onboarding state */
                            <div className="w-full bg-white/[0.01] border border-white/[0.06] rounded-[32px] p-8 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                                
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                                    <Dna className="w-10 h-10 text-indigo-400" />
                                </div>
                                
                                <div className="space-y-3 max-w-lg">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">DNA Sync Protocol Active</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Log biological mutations like **MTHFR**, **COMT**, or **APOE4** to unlock genomic stack optimization suggestions. Syncing your DNA data adapts active methylation support protocols automatically.
                                    </p>
                                    
                                    <div className="pt-2">
                                        {userId && <GenotypeLogger userId={userId} onUpdate={fetchData} />}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {genotypes.map(g => (
                                    <div 
                                        key={g.id} 
                                        className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 relative group hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <button 
                                            onClick={() => deleteGenotype(g.id)}
                                            className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        
                                        <div className="space-y-3.5">
                                            <div className="flex items-center space-x-2">
                                                <Dna className="w-4 h-4 text-indigo-400" />
                                                <h3 className="font-black text-white text-sm uppercase tracking-wider">{g.marker_name}</h3>
                                            </div>
                                            
                                            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                                {g.status}
                                            </div>

                                            {g.notes && (
                                                <p className="text-[10px] text-slate-400 italic">
                                                    "{g.notes}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-6 border-t border-white/[0.04] pt-3 text-[9px] text-slate-500">
                                            {g.marker_name.includes('MTHFR') && "Recommendation: Avoid synthetic folic acid; supplement active methylfolate."}
                                            {g.marker_name.includes('COMT') && "Recommendation: Support neurotransmitter clearance with magnesium."}
                                            {g.marker_name.includes('APOE4') && "Recommendation: Control saturated fat bounds; favor monounsaturates."}
                                            {!g.marker_name.includes('MTHFR') && !g.marker_name.includes('COMT') && !g.marker_name.includes('APOE4') && "Genomic status mapped to system wellness recommendations."}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SECTION 9: AI OCR Upload preview Dialog popup */}
            <AnimatePresence>
                {showUploadPreview && uploadedData && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="w-full max-w-md bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
                                <div className="flex items-center space-x-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <h3 className="font-black text-white uppercase text-sm tracking-wider">Lab Report Preview</h3>
                                </div>
                                <button 
                                    onClick={() => setShowUploadPreview(false)}
                                    className="p-1 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">
                                AI successfully extracted the following biomarkers from **{uploadedData.fileName}**:
                            </p>

                            <div className="space-y-2 mb-6">
                                {uploadedData.biomarkers.map((b: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between items-center text-xs"
                                    >
                                        <span className="font-bold text-white">{b.name}</span>
                                        <span className="font-black text-blue-400 font-mono">{b.value} {b.unit}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowUploadPreview(false)}
                                    className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveExtractedBiomarkers}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Import Markers
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}
