import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Configure VAPID
webpush.setVapidDetails(
    'mailto:suppsync@suppsync.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

// Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ScheduleWithSupplement = {
    id: string
    user_id: string
    reminder_time: string | null
    time_of_day: string
    dosage_amount: number
    dosage_unit: string
    supplements: { name: string } | { name: string }[]
}

type PushSub = {
    user_id: string
    endpoint: string
    p256dh: string
    auth: string
    timezone: string
}

// Map time_of_day labels to approximate clock times (fallback if no reminder_time set)
function getDefaultTime(timeOfDay: string): string {
    const map: Record<string, string> = {
        'morning': '08:00',
        'afternoon': '13:00',
        'evening': '18:00',
        'night': '21:00',
        'before_bed': '22:00',
        'with_meals': '12:00',
        'pre_workout': '16:00',
        'post_workout': '17:00',
    }
    return map[timeOfDay] || '09:00'
}

// Get the current time in a specific timezone as HH:MM
function getCurrentTimeInTz(tz: string): string {
    try {
        const now = new Date()
        const formatted = now.toLocaleTimeString('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
        return formatted // "HH:MM"
    } catch {
        // Fallback to Asia/Kolkata
        const now = new Date()
        const formatted = now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
        return formatted
    }
}

// Check if a time is within a window (e.g., within 15 min of now)
function isWithinWindow(scheduleTime: string, currentTime: string, windowMinutes: number): boolean {
    const [sh, sm] = scheduleTime.split(':').map(Number)
    const [ch, cm] = currentTime.split(':').map(Number)
    const scheduleMins = sh * 60 + sm
    const currentMins = ch * 60 + cm
    const diff = currentMins - scheduleMins
    return diff >= 0 && diff < windowMinutes
}

// Check if schedule time has passed (for nag logic)
function minutesPast(scheduleTime: string, currentTime: string): number {
    const [sh, sm] = scheduleTime.split(':').map(Number)
    const [ch, cm] = currentTime.split(':').map(Number)
    return (ch * 60 + cm) - (sh * 60 + sm)
}

async function sendPush(sub: PushSub, title: string, body: string, tag: string) {
    const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
    }

    try {
        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
                title,
                body,
                tag,
                url: '/dashboard',
                vibrate: [200, 100, 200, 100, 200]
            })
        )
        return true
    } catch (err: any) {
        // If subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
        }
        console.error('Push failed for', sub.endpoint, err.message)
        return false
    }
}

export async function POST(request: Request) {
    try {
        // Verify cron secret
        const { searchParams } = new URL(request.url)
        const cronSecret = searchParams.get('secret')

        if (cronSecret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

        // 1. Fetch all active schedules with reminder_time or time_of_day
        const { data: schedules, error: schedErr } = await supabaseAdmin
            .from('schedules')
            .select('id, user_id, reminder_time, time_of_day, dosage_amount, dosage_unit, supplements(name)')
            .eq('is_active', true)

        if (schedErr || !schedules) {
            return NextResponse.json({ error: 'Failed to fetch schedules', details: schedErr?.message }, { status: 500 })
        }

        // 2. Fetch all push subscriptions
        const { data: subscriptions, error: subErr } = await supabaseAdmin
            .from('push_subscriptions')
            .select('user_id, endpoint, p256dh, auth, timezone')

        if (subErr || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No push subscriptions found', sent: 0 })
        }

        // 3. Fetch today's logs to check what's already taken
        const { data: todayLogs } = await supabaseAdmin
            .from('logs')
            .select('schedule_id, status')
            .eq('log_date', todayStr)

        const takenSet = new Set(
            (todayLogs || [])
                .filter(l => l.status === 'taken')
                .map(l => l.schedule_id)
        )

        // Group subscriptions by user_id
        const subsByUser = new Map<string, PushSub[]>()
        for (const sub of subscriptions) {
            if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, [])
            subsByUser.get(sub.user_id)!.push(sub)
        }

        let sentCount = 0
        let nagCount = 0

        // 4. Process each schedule
        for (const sched of schedules as ScheduleWithSupplement[]) {
            const userSubs = subsByUser.get(sched.user_id)
            if (!userSubs || userSubs.length === 0) continue

            // Already taken today? Skip
            if (takenSet.has(sched.id)) continue

            const tz = userSubs[0].timezone || 'Asia/Kolkata'
            const currentTime = getCurrentTimeInTz(tz)
            const scheduleTime = sched.reminder_time || getDefaultTime(sched.time_of_day)

            const suppObj = Array.isArray(sched.supplements) ? sched.supplements[0] : sched.supplements
            const suppName = suppObj?.name || 'Supplement'

            // Check if it's time for the initial reminder (within 15-min window)
            if (isWithinWindow(scheduleTime, currentTime, 15)) {
                for (const sub of userSubs) {
                    const sent = await sendPush(
                        sub,
                        `💊 Time for ${suppName}!`,
                        `Take ${sched.dosage_amount} ${sched.dosage_unit} of ${suppName} now. Don't break your streak! 🔥`,
                        `reminder-${sched.id}`
                    )
                    if (sent) sentCount++
                }
            }

            // NAG LOGIC: If 30-60 min past due and still not taken, send a follow-up nag
            const mPast = minutesPast(scheduleTime, currentTime)
            if (mPast >= 30 && mPast < 45) {
                for (const sub of userSubs) {
                    const sent = await sendPush(
                        sub,
                        `⚠️ You missed ${suppName}!`,
                        `It's been ${mPast} minutes since your scheduled dose. Take it now before you forget! 💪`,
                        `nag-${sched.id}`
                    )
                    if (sent) nagCount++
                }
            }

            // SECOND NAG: 60-75 min past due
            if (mPast >= 60 && mPast < 75) {
                for (const sub of userSubs) {
                    const sent = await sendPush(
                        sub,
                        `🚨 Last reminder for ${suppName}!`,
                        `You still haven't taken ${suppName}. This is your final reminder — stay consistent! 🏆`,
                        `final-nag-${sched.id}`
                    )
                    if (sent) nagCount++
                }
            }
        }

        return NextResponse.json({
            success: true,
            sent: sentCount,
            nags: nagCount,
            totalSchedules: schedules.length,
            totalSubscriptions: subscriptions.length,
            timestamp: new Date().toISOString()
        })

    } catch (err) {
        console.error('Push send error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
