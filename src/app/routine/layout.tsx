import { ReactNode } from 'react'

export const metadata = {
    title: 'SuppSync - Zen Routine',
    description: 'Distraction-free routine player',
}

export default function RoutineLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            <main className="max-w-md mx-auto h-screen relative overflow-hidden">
                {children}
            </main>
        </div>
    )
}
