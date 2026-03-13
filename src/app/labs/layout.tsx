import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { BottomNav } from '@/components/layout/bottom-nav'

export const metadata: Metadata = {
    title: 'Labs - SuppSync',
    description: 'Track your biomarkers and lab results',
}

export default function LabsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            <main className="w-full max-w-md mx-auto min-h-screen relative">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
