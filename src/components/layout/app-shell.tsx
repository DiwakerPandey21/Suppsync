'use client'

import React from 'react'
import { BottomNav } from './bottom-nav'
import { Footer } from './footer'
import { usePathname } from 'next/navigation'

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Don't show footer on simple pages or chat page if desired
    const showFooter = !['/login', '/register', '/chat'].includes(pathname)

    return (
        <div className="min-h-screen bg-transparent text-foreground flex flex-col justify-between relative z-10 pb-24">
            <main className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10 flex-grow pb-16">
                {children}
            </main>
            {showFooter && <Footer />}
            <BottomNav />
        </div>
    )
}
