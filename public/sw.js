// Service Worker for SuppSync PWA - Push Notifications

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {}

    const title = data.title || '💊 SuppSync Reminder'
    const options = {
        body: data.body || "Time to take your supplements!",
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'supplement-reminder',
        renotify: true,
        data: {
            url: data.url || '/dashboard'
        },
        actions: [
            { action: 'open', title: '📋 Open Dashboard' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    )
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    const url = event.notification.data?.url || '/dashboard'

    if (event.action === 'dismiss') {
        return
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If there's already a window open, focus it
            for (const client of clientList) {
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    return client.focus()
                }
            }
            // Otherwise open a new window
            return clients.openWindow(url)
        })
    )
})
