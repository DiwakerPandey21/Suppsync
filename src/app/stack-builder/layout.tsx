import { BottomNav } from '@/components/layout/bottom-nav'

export default function StackBuilderLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <main className="max-w-md mx-auto w-full">{children}</main>
            <BottomNav />
        </div>
    )
}
