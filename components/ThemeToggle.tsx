'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
 const { theme, setTheme } = useTheme()
 const [mounted, setMounted] = React.useState(false)

 React.useEffect(() => {
 setMounted(true)
 }, [])

 if (!mounted) {
 return <div className="w-8 h-8 rounded-lg bg-brand-cream animate-pulse"></div>
 }

 return (
 <button
 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
 className="p-1.5 rounded-lg bg-brand-cream hover:bg-brand-cream/80 text-brand-charcoal/50 transition-colors shadow-sm"
 aria-label="Toggle Dark Mode"
 >
 {theme === 'dark' ? '☀️' : '🌙'}
 </button>
 )
}
