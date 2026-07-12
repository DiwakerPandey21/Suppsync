'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function DisclaimerPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-slate-300">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full w-fit">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Medical Disclaimer</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Medical Disclaimer</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Critical Information for all users
                </p>
            </div>

            {/* Content text */}
            <div className="space-y-6 text-xs text-slate-400 leading-relaxed">
                <div className="space-y-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center">
                        ⚠️ NOT MEDICAL ADVICE
                    </h3>
                    <p className="font-bold text-slate-300">
                        SuppSync is NOT a licensed healthcare provider, medical clinic, or diagnostic laboratory. All content, insights, recommendations, genomic evaluations, and AI summary suggestions generated within this application are provided for informational and educational purposes only.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">1. No Clinical Diagnostic Value</h3>
                    <p>
                        The biomarker charts, Optimal Range mappings, and AI-predicted deficiencies are designed for health tracking optimization and do not constitute clinical diagnoses of disease. Never delay seeking professional medical treatment due to information seen on SuppSync.
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Always Consult Your Doctor</h3>
                    <p>
                        Always consult with a primary care physician, immunologist, or medical specialist before starting any new vitamin, mineral, or biohacking supplement stack, or before adjusting dosages based on biomarker results.
                    </p>
                </div>
            </div>
        </div>
    )
}
