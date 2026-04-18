'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, BellOff, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// In production, you'd generate these with `web-push generate-vapid-keys`
// For now, we use a placeholder. The user must set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushNotificationToggle() {
    const supabase = createClient()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [justEnabled, setJustEnabled] = useState(false)

    useEffect(() => {
        // Check if push notifications are supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        }
    }, [])

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (err) {
            console.error('Error checking subscription:', err)
        }
    }

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            alert('Push notifications require VAPID keys. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your .env.local file.')
            return
        }

        setIsLoading(true)
        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            // Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                alert('Notification permission denied. Please enable notifications in your browser settings.')
                setIsLoading(false)
                return
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            const subJSON = subscription.toJSON()

            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
                await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    endpoint: subJSON.endpoint,
                    p256dh: subJSON.keys?.p256dh || '',
                    auth: subJSON.keys?.auth || '',
                    device_type: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                    timezone: userTimezone
                }, { onConflict: 'user_id' })
            }

            setIsSubscribed(true)
            setJustEnabled(true)
            setTimeout(() => setJustEnabled(false), 3000)
        } catch (err) {
            console.error('Push subscription failed:', err)
        }
        setIsLoading(false)
    }

    const unsubscribe = async () => {
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                await subscription.unsubscribe()
            }

            // Remove from Supabase
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
            }

            setIsSubscribed(false)
        } catch (err) {
            console.error('Unsubscribe failed:', err)
        }
        setIsLoading(false)
    }

    if (!isSupported) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                    <BellOff className="w-5 h-5 text-slate-600" />
                    <div>
                        <p className="text-sm font-medium text-slate-400">Push Notifications</p>
                        <p className="text-xs text-slate-600">Not supported in this browser.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {isSubscribed ? (
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-green-500" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <BellOff className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-white">Push Notifications</p>
                        <p className="text-xs text-slate-500">
                            {isSubscribed ? 'You will receive supplement reminders' : 'Get reminded when it\'s time to take your stack'}
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={isLoading}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${isSubscribed
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : justEnabled ? (
                        <><CheckCircle className="w-4 h-4 mr-1" /> Enabled!</>
                    ) : isSubscribed ? (
                        'Disable'
                    ) : (
                        'Enable'
                    )}
                </Button>
            </div>
        </div>
    )
}
