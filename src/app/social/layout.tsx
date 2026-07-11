export default function SocialLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">
            {children}
        </main>
    )
}
