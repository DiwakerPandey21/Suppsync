'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

type ExpiryAlert = {
    id: string
    name: string
    expiry_date: string
    days_left: number
}

export function ExpiryAlerts() {
    const supabase = createClient()
    const [alerts, setAlerts] = useState<ExpiryAlert[]>([])

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: inv } = await supabase
            .from('inventory')
            .select('id, expiry_date, supplements(name)')
            .eq('user_id', user.id)
            .not('expiry_date', 'is', null)

        if (!inv) return

        const today = new Date()
        const expiring = inv
            .map((item: any) => {
                const supp = Array.isArray(item.supplements) ? item.supplements[0] : item.supplements
                const expDate = new Date(item.expiry_date)
                const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                return {
                    id: item.id,
                    name: supp?.name || 'Unknown',
                    expiry_date: item.expiry_date,
                    days_left: daysLeft,
                }
            })
            .filter((a: ExpiryAlert) => a.days_left <= 30 && a.days_left > -7) // 30 days warning, keep showing 7 days after
            .sort((a: ExpiryAlert, b: ExpiryAlert) => a.days_left - b.days_left)

        setAlerts(expiring)
    }

    if (alerts.length === 0) return null

    return (
        <div className="w-full px-4 mb-4 space-y-2">
            {alerts.map((alert, i) => (
                <motion.div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                        alert.days_left <= 0
                            ? 'bg-red-500/10 border-red-500/20'
                            : alert.days_left <= 7
                                ? 'bg-amber-500/10 border-amber-500/20'
                                : 'bg-slate-900/50 border-slate-800'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-4 h-4 ${
                            alert.days_left <= 0 ? 'text-red-400' : alert.days_left <= 7 ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                        <span className="text-xs font-medium text-white">{alert.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span className={`text-[10px] font-bold ${
                            alert.days_left <= 0 ? 'text-red-400' : alert.days_left <= 7 ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                            {alert.days_left <= 0 ? 'EXPIRED' : `${alert.days_left}d left`}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
