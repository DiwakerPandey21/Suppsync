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
        // Call the push/send endpoint internally
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                        'http://localhost:3000'

        const res = await fetch(`${baseUrl}/api/push/send?secret=${encodeURIComponent(secret)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })

        const result = await res.json()

        return NextResponse.json({
            cronRun: true,
            timestamp: new Date().toISOString(),
            pushResult: result
        })
    } catch (err) {
        console.error('Cron reminder error:', err)
        return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 })
    }
}
