export default function InsightsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="max-w-md mx-auto w-full">
            {children}
        </main>
    )
}
