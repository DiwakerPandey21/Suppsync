// Service Worker for SuppSync PWA - Push Notifications & Reminders

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {}

    const title = data.title || '💊 SuppSync Reminder'
    const options = {
        body: data.body || "Time to take your supplements!",
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: data.vibrate || [200, 100, 200],
        tag: data.tag || 'supplement-reminder',
        renotify: true,
        requireInteraction: true, // Keep notification visible until user interacts
        data: {
            url: data.url || '/dashboard',
            tag: data.tag || 'supplement-reminder'
        },
        actions: [
            { action: 'open', title: '📋 Open App' },
            { action: 'snooze', title: '⏰ Snooze 10m' },
            { action: 'dismiss', title: '✓ Dismiss' }
        ]
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    const url = event.notification.data?.url || '/dashboard'
    const tag = event.notification.data?.tag || 'supplement-reminder'

    // SNOOZE: Re-show the notification after 10 minutes
    if (event.action === 'snooze') {
        event.waitUntil(
            new Promise(resolve => {
                setTimeout(() => {
                    self.registration.showNotification('⏰ Snoozed Reminder!', {
                        body: "Your 10-minute snooze is up! Time to take your supplements 💊",
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-72x72.png',
                        vibrate: [200, 100, 200, 100, 200],
                        tag: 'snooze-' + tag,
                        renotify: true,
                        requireInteraction: true,
                        data: { url: '/dashboard' },
                        actions: [
                            { action: 'open', title: '📋 Open App' },
                            { action: 'snooze', title: '⏰ Snooze 10m' },
                            { action: 'dismiss', title: '✓ Dismiss' }
                        ]
                    }).then(resolve)
                }, 10 * 60 * 1000) // 10 minutes
            })
        )
        return
    }

    // DISMISS: Just close, do nothing
    if (event.action === 'dismiss') {
        return
    }

    // OPEN: Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    return client.focus()
                }
            }
            return clients.openWindow(url)
        })
    )
})

// Activate immediately 
self.addEventListener('activate', function (event) {
    event.waitUntil(clients.claim())
})
