import { BottomNav } from '@/components/layout/bottom-nav'

export default function SocialLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-transparent text-foreground pb-24">
            <main className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">{children}</main>
            <BottomNav />
        </div>
    )
}
