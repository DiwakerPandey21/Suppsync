import { createClient } from '@/utils/supabase/server'
import { seedProtocols } from '@/app/discover/actions'
import { ProtocolCard } from '@/components/discover/protocol-card'
import { CreateProtocolDialog } from '@/components/discover/create-protocol-dialog'

// Revalidate occasionally so we don't spam the DB with count queries for a mostly static list.
export const revalidate = 60

export default async function DiscoverPage() {
    const supabase = await createClient()

    // Ensure protocols exist
    const { count } = await supabase.from('protocols').select('*', { count: 'exact', head: true })
    if (count === 0) {
        await seedProtocols()
    }

    const { data: protocols } = await supabase
        .from('protocols')
        .select('*')
        .order('created_at', { ascending: true })

    return (
        <div className="flex min-h-screen flex-col pt-8 pb-32 px-4">
            <div className="w-full flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Discover</h1>
                    <p className="text-slate-400 text-sm mt-1">Adopt protocols from the pros.</p>
                </div>
            </div>

            {/* Create Your Own Protocol */}
            <div className="mb-6">
                <CreateProtocolDialog />
            </div>

            <div className="space-y-6">
                {protocols && protocols.length > 0 ? (
                    protocols.map((protocol) => (
                        <ProtocolCard key={protocol.id} protocol={protocol} />
                    ))
                ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center px-4">
                <p className="text-xs text-slate-500 font-medium">
                    Legal Disclaimer: These protocols are for educational purposes only and do not constitute medical advice.
                </p>
            </div>
        </div>
    )
}
