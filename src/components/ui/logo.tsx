import { cn } from "@/lib/utils"

export function LogoGraphic({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("w-12 h-12", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top Blue Arrow */}
            <path d="M 28 35 C 40 15, 60 15, 72 35" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" />
            <polygon points="72,35 80,25 64,25" fill="#2563EB" />

            {/* Bottom Green Arrow */}
            <path d="M 72 65 C 60 85, 40 85, 28 65" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" />
            <polygon points="28,65 20,75 36,75" fill="#22C55E" />

            {/* Center Bar (gray) */}
            <line x1="20" y1="50" x2="80" y2="50" stroke="#64748B" strokeWidth="4" />

            {/* Left Blue Dumbbell */}
            <rect x="23" y="38" width="10" height="24" rx="3" fill="#2563EB" />
            <rect x="18" y="42" width="5" height="16" rx="2" fill="#2563EB" />

            {/* Right Green Dumbbell */}
            <rect x="67" y="38" width="10" height="24" rx="3" fill="#22C55E" />
            <rect x="77" y="42" width="5" height="16" rx="2" fill="#22C55E" />

            {/* Center Pill */}
            <g transform="rotate(22, 50, 50)">
                {/* Blue half */}
                <path d="M 41 32 h 18 v 18 h -18 z" fill="#2563EB" />
                <path d="M 41 32 C 41 20 59 20 59 32" fill="#2563EB" />

                {/* Green half */}
                <path d="M 41 50 h 18 v 18 h -18 z" fill="#22C55E" />
                <path d="M 41 68 C 41 80 59 80 59 68" fill="#22C55E" />

                {/* Pill highlight */}
                <path d="M 45 25 Q 48 30 45 35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
        </svg>
    )
}

export function LogoText({ className }: { className?: string }) {
    return (
        <h1 className={cn("font-black tracking-tight", className)}>
            <span style={{ color: '#2563EB' }}>Supp</span>
            <span style={{ color: '#22C55E' }}>Sync</span>
        </h1>
    )
}

export function LogoFull({ className, textClassName }: { className?: string, textClassName?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            <LogoGraphic className="w-24 h-24 mb-3 drop-shadow-lg" />
            <LogoText className={cn("text-4xl", textClassName)} />
        </div>
    )
}
