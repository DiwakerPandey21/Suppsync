'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        const goOffline = () => setIsOffline(true)
        const goOnline = () => setIsOffline(false)

        setIsOffline(!navigator.onLine)
        window.addEventListener('offline', goOffline)
        window.addEventListener('online', goOnline)

        return () => {
            window.removeEventListener('offline', goOffline)
            window.removeEventListener('online', goOnline)
        }
    }, [])

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white text-center py-2 text-xs font-semibold flex items-center justify-center space-x-2"
                    initial={{ y: -40 }}
                    animate={{ y: 0 }}
                    exit={{ y: -40 }}
                >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>You're offline. Some features may be limited.</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
