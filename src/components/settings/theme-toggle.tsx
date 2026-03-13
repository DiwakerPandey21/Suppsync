'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('suppsync-theme')
        if (saved === 'light') {
            setIsDark(false)
            document.documentElement.classList.remove('dark')
            document.documentElement.style.colorScheme = 'light'
        } else {
            setIsDark(true)
            document.documentElement.classList.add('dark')
            document.documentElement.style.colorScheme = 'dark'
        }
    }, [])

    const toggle = () => {
        const next = !isDark
        setIsDark(next)
        if (next) {
            document.documentElement.classList.add('dark')
            document.documentElement.style.colorScheme = 'dark'
            localStorage.setItem('suppsync-theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.style.colorScheme = 'light'
            localStorage.setItem('suppsync-theme', 'light')
        }
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {isDark ? (
                        <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                        <Sun className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                        <h3 className="font-semibold text-white text-sm">Appearance</h3>
                        <p className="text-[11px] text-zinc-500">{isDark ? 'Dark mode' : 'Light mode'}</p>
                    </div>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={toggle}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-indigo-600' : 'bg-amber-400'
                        }`}
                >
                    <motion.div
                        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                        animate={{ x: isDark ? 28 : 2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {isDark ? (
                            <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                        )}
                    </motion.div>
                </button>
            </div>
        </div>
    )
}
