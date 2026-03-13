import { BottomNav } from '@/components/layout/bottom-nav'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="max-w-md mx-auto w-full">{children}</main>
            <BottomNav />
        </div>
    )
}
