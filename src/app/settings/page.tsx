import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PushNotificationToggle } from '@/components/settings/push-notification-toggle'
import { ExportDataSection } from '@/components/settings/export-data'

export default function SettingsPage() {
    return (
        <div className="flex min-h-screen flex-col px-4 pt-8 pb-32">
            <div className="w-full mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
                <p className="text-zinc-400 text-sm mt-1">Manage your account and preferences.</p>
            </div>

            <div className="space-y-4">
                {/* Push Notifications */}
                <PushNotificationToggle />

                {/* Export Data */}
                <ExportDataSection />

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Smartwatch Companion</h3>
                    <p className="text-sm text-zinc-400 mb-4">Open the minimalist display designed for Apple Watch and Wear OS browsers.</p>
                    <Link href="/watch">
                        <Button variant="outline" className="w-full bg-slate-900 border-blue-500/50 hover:bg-slate-800 text-blue-400">
                            Launch Watch App
                        </Button>
                    </Link>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-2">Account</h3>
                    <p className="text-sm text-zinc-400 mb-4">Signed in currently.</p>
                    <form action="/auth/signout" method="POST">
                        <Button variant="destructive" className="w-full">Sign Out</Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
