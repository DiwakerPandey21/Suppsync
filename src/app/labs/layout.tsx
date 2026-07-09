import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { BottomNav } from '@/components/layout/bottom-nav'

export const metadata: Metadata = {
    title: 'Labs - SuppSync',
    description: 'Track your biomarkers and lab results',
}

export default function LabsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <main className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
