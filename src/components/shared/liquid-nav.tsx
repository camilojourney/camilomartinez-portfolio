'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { systemService } from '@/lib/api/config'
import { ThemeToggle } from './theme-toggle'

interface LiquidNavProps {
    currentPage?: 'home' | 'apps' | 'projects' | 'blog' | 'about' | 'contact' | 'bookshelf' | 'tools' | 'my-data'
}

export default function LiquidNav({ currentPage = 'home' }: LiquidNavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading')

    useEffect(() => {
        //Skip API calls during build time
        if (typeof window === 'undefined') {
            return
        }

        let isMounted = true

        const fetchStatus = async () => {
            try {
                const response = await systemService.healthCheck()
                if (isMounted) {
                    // Always show as OK if health check succeeds (whether FastAPI or fallback)
                    setApiStatus('ok')
                }
            } catch (error) {
                console.error('Backend health check failed:', error)
                if (isMounted) {
                    setApiStatus('error')
                }
            }
        }

        fetchStatus()

        return () => {
            isMounted = false
        }
    }, [])

    const navItems = [
        { href: '/projects', label: 'work', key: 'projects' },
        { href: '/about', label: 'about', key: 'about' },
        { href: '/contact', label: 'contact', key: 'contact' },
    ]

    const normalizedCurrentPage = (() => {
        if (!currentPage) return undefined
        if (currentPage === 'home' || currentPage === 'apps' || currentPage === 'tools' || currentPage === 'my-data' || currentPage === 'bookshelf') {
            return 'projects'
        }
        return navItems.some(item => item.key === currentPage) ? currentPage : undefined
    })()

    return (
        <>
            {/* Desktop Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 p-4 pt-safe-area-inset-top md:p-5 hidden md:block">
                <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-5 py-3 max-w-4xl mx-auto shadow-2xl shadow-black/10 relative">
                    <div className="flex justify-center space-x-8 text-base font-medium">
                        {navItems.map((item) => (
                            <a
                                key={item.key}
                                href={item.href}
                                className={`nav-item transition-all duration-300 relative px-4 py-2 rounded-lg ${
                                    normalizedCurrentPage === item.key 
                                        ? 'text-foreground bg-white/10' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                {item.label}
                                {normalizedCurrentPage === item.key && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                                )}
                            </a>
                        ))}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ThemeToggle />
                    </div>
                </nav>
            </div>

            {/* Mobile Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 p-4 md:hidden">
                <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-5 py-3 shadow-2xl shadow-black/10">
                    <div className="flex justify-between items-center">
                        <a href="/" className="text-foreground font-semibold text-lg tracking-tight">CM</a>
                        <div className="flex items-center space-x-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                    
                    {/* Mobile Menu Dropdown */}
                    {isMenuOpen && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-2">
                                {navItems.map((item) => (
                                    <a
                                        key={item.key}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`nav-item transition-all duration-300 px-4 py-3 rounded-lg text-center capitalize ${
                                            normalizedCurrentPage === item.key 
                                                ? 'text-foreground bg-white/10 border border-white/20' 
                                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </>
    )
}
