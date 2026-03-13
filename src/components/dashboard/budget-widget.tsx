'use client'

import { DollarSign, TrendingDown } from 'lucide-react'

export type BudgetItem = {
    name: string
    costPerServing: number
    currency: string
    servingsRemaining: number
}

interface BudgetWidgetProps {
    items: BudgetItem[]
}

export function BudgetWidget({ items }: BudgetWidgetProps) {
    if (!items || items.length === 0) return null

    const totalDailyCost = items.reduce((sum, item) => sum + item.costPerServing, 0)
    const monthlyCost = totalDailyCost * 30
    const currency = items[0]?.currency || 'USD'

    const currencySymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

    return (
        <div className="w-full px-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center">
                            <DollarSign className="w-4 h-4 mr-1.5" />
                            Stack Budget
                        </h2>
                        <div className="flex items-baseline space-x-1 mt-1">
                            <span className="text-3xl font-black text-white">{currencySymbol}{monthlyCost.toFixed(0)}</span>
                            <span className="text-xs text-slate-500 font-medium">/mo</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end text-green-400 space-x-1 mb-1">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-sm font-bold">{currencySymbol}{totalDailyCost.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Per Day</span>
                    </div>
                </div>

                {/* Individual supplement costs */}
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-950 rounded-xl">
                            <span className="text-sm font-medium text-slate-300 truncate flex-1 mr-2">{item.name}</span>
                            <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-500">{item.servingsRemaining} left</span>
                                <span className="text-sm font-bold text-white">{currencySymbol}{item.costPerServing.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
