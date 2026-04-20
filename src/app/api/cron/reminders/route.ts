import { NextResponse } from 'next/server'

// GET /api/cron/reminders?secret=xxx
// This endpoint is meant to be called by an external cron service (cron-job.org, Vercel Cron)
// every 15 minutes. It triggers the push/send logic internally.

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Construct baseUrl dynamically from the request itself.
        // This flawlessly guarantees the fetch hits the correct Vercel prod domain!
        const host = request.headers.get('host')
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000'

        const res = await fetch(`${baseUrl}/api/push/send?secret=${encodeURIComponent(secret)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`Fetch to push/send failed: ${res.status} - ${errorText}`)
        }

        const result = await res.json()

        return NextResponse.json({
            cronRun: true,
            timestamp: new Date().toISOString(),
            pushResult: result
        })
    } catch (err: any) {
        console.error('Cron reminder error:', err)
        return NextResponse.json({ error: 'Cron execution failed', details: err.message }, { status: 500 })
    }
}
