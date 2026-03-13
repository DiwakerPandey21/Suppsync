'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AiAnalysisDialogProps {
    supplements: any[] // We pass the loaded supplements here
}

export function AiAnalysisDialog({ supplements }: AiAnalysisDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [goals, setGoals] = useState('Muscle Hypertrophy and Recovery')

    const analyzeStack = async () => {
        setIsLoading(true)
        setAnalysis(null)

        try {
            const response = await fetch('/api/analyze-stack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ supplements, goals }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze stack')
            }

            setAnalysis(data.result)
        } catch (error: any) {
            console.error(error)
            setAnalysis('An error occurred while analyzing your stack. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-[#22C55E] hover:bg-green-600 text-white border-none shadow-lg shadow-green-900/20"
                    disabled={supplements.length === 0}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Stack Analysis
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-[#0F172A] border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-[#22C55E]">
                        <Sparkles className="w-5 h-5 mr-2" />
                        SuppSync AI Analysis
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col mt-4">
                    {!analysis && !isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-[#2563EB]" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="font-bold text-lg">Analyze Your Stack</h3>
                                <p className="text-sm text-slate-400">
                                    Our AI will review the {supplements.length} supplements in your library for potential interactions, optimal timings, and missing staples based on your goals.
                                </p>
                            </div>

                            <div className="w-full max-w-xs space-y-2 text-left">
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Primary Goal</label>
                                <input
                                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]"
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                    placeholder="e.g. Muscle Hypertrophy"
                                />
                            </div>

                            <Button onClick={analyzeStack} className="bg-[#2563EB] hover:bg-blue-600 w-full max-w-xs mt-4">
                                Generate Report
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin" />
                            <p className="text-slate-400 text-sm animate-pulse">Analyzing chemical interactions and timings...</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="prose prose-invert prose-emerald max-w-none text-sm leading-relaxed prose-headings:text-white prose-a:text-[#2563EB] prose-strong:text-white pb-6">
                                <ReactMarkdown>
                                    {analysis || ''}
                                </ReactMarkdown>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {analysis && !isLoading && (
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setAnalysis(null)}>
                            Start New Analysis
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
