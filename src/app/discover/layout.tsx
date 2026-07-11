import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Discover - SuppSync',
    description: 'Discover and adopt famous supplement protocols',
}

export default function DiscoverLayout({ children }: { children: ReactNode }) {
    return (
        <main className="w-full max-w-md mx-auto relative">
            {children}
        </main>
    )
}
