import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SuppSync Watch',
    description: 'Gym Supplement Tracker for Apple Watch & Wear OS',
    appleWebApp: {
        title: 'SuppSync Watch',
        statusBarStyle: 'black-translucent',
        capable: true,
    },
}

export default function WatchLayout({ children }: { children: ReactNode }) {
    return (
        // For smartwatch screens, we remove global padding, bottom nav, and force entirely black background for OLED
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 selection:bg-blue-500/30">
            {/* Simulated Watch Bezel for Desktop viewing. On an actual watch, this just fills the screen */}
            <div className="bg-black w-full max-w-[320px] h-[380px] rounded-[48px] border-[12px] border-zinc-900 shadow-2xl overflow-y-auto relative ring-1 ring-white/10 no-scrollbar outline outline-1 outline-white/5 outline-offset-[-12px]">
                <main className="w-full min-h-full px-4 py-6 pb-12 relative flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}
