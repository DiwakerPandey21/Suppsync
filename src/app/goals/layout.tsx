export default function GoalsLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {children}
        </main>
    )
}
