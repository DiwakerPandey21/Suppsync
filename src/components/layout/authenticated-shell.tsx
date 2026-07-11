'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from './bottom-nav'
import { Footer } from './footer'

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    
    // Define public/unauthenticated pages that shouldn't show global shells
    const isAuthPage = ['/login', '/register', '/auth/callback', '/auth/signout', '/'].includes(pathname)
    
    // Chat page should have BottomNav but hide the scrollable footer
    const isChatPage = pathname === '/chat'

    if (isAuthPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground flex flex-col justify-between relative pb-24">
            <div className="w-full flex-grow relative z-10">
                {children}
            </div>
            {!isChatPage && <Footer />}
            <BottomNav />
        </div>
    )
}
