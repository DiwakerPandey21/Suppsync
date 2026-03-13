'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ExportType = 'logs' | 'biomarkers' | 'scores'

export function ExportDataSection() {
    const supabase = createClient()
    const [isExporting, setIsExporting] = useState<ExportType | null>(null)

    const exportToCSV = async (type: ExportType) => {
        setIsExporting(type)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let csvContent = ''
            let filename = ''

            if (type === 'logs') {
                const { data } = await supabase
                    .from('logs')
                    .select('log_date, status, schedules(dosage_amount, dosage_unit, supplements(name))')
                    .eq('user_id', user.id)
                    .order('log_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Supplement,Dosage,Status\n'
                    + (data || []).map((log: any) => {
                        const sched = Array.isArray(log.schedules) ? log.schedules[0] : log.schedules
                        const supp = sched?.supplements
                        const suppName = Array.isArray(supp) ? supp[0]?.name : supp?.name
                        return `${log.log_date},"${suppName || 'Unknown'}",${sched?.dosage_amount || ''}${sched?.dosage_unit || ''},${log.status}`
                    }).join('\n')
                filename = 'suppsync_logs.csv'
            }

            if (type === 'biomarkers') {
                const { data } = await supabase
                    .from('biomarkers')
                    .select('marker_name, value, unit, test_date')
                    .eq('user_id', user.id)
                    .order('test_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Marker,Value,Unit\n'
                    + (data || []).map((b: any) => `${b.test_date},"${b.marker_name}",${b.value},${b.unit}`).join('\n')
                filename = 'suppsync_biomarkers.csv'
            }

            if (type === 'scores') {
                const { data } = await supabase
                    .from('subjective_scores')
                    .select('record_date, energy_score, focus_score, sleep_score')
                    .eq('user_id', user.id)
                    .order('record_date', { ascending: false })
                    .limit(500)

                csvContent = 'Date,Energy,Focus,Sleep\n'
                    + (data || []).map((s: any) => `${s.record_date},${s.energy_score},${s.focus_score},${s.sleep_score}`).join('\n')
                filename = 'suppsync_scores.csv'
            }

            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.click()
            URL.revokeObjectURL(url)

        } catch (err) {
            console.error('Export error:', err)
        }
        setIsExporting(null)
    }

    const exports = [
        { type: 'logs' as ExportType, label: 'Supplement Logs', desc: 'All dose history' },
        { type: 'biomarkers' as ExportType, label: 'Biomarker Labs', desc: 'Blood work entries' },
        { type: 'scores' as ExportType, label: 'Daily Scores', desc: 'Energy, Focus, Sleep' },
    ]

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Export Your Data</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Download your data as CSV files for healthcare providers or personal records.</p>

            <div className="space-y-2">
                {exports.map(exp => (
                    <Button
                        key={exp.type}
                        variant="outline"
                        className="w-full justify-between border-slate-800 hover:bg-slate-900 text-slate-300 h-12"
                        onClick={() => exportToCSV(exp.type)}
                        disabled={isExporting !== null}
                    >
                        <div className="text-left">
                            <span className="text-sm font-medium">{exp.label}</span>
                            <span className="text-xs text-slate-500 ml-2">{exp.desc}</span>
                        </div>
                        {isExporting === exp.type ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                    </Button>
                ))}
            </div>
        </div>
    )
}
