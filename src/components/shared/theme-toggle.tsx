'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = document.documentElement.getAttribute('data-theme') || 'dark'
    setTheme(t as 'dark' | 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={theme === 'light'}
      className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 text-white/70 hover:text-foreground hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      {theme === 'dark' ? <Sun size={20} className="transition-all" /> : <Moon size={20} className="transition-all" />}
    </button>
  )
}
