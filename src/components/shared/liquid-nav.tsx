'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface LiquidNavProps {
    currentPage?: 'home' | 'my-data' | 'blog' | 'projects' | 'contact' | 'about' | 'tools'
}

export default function LiquidNav({ currentPage = 'home' }: LiquidNavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const navItems = [
        { href: '/', label: 'home', key: 'home' },
        { href: '/my-data', label: 'my data', key: 'my-data' },
        { href: '/projects', label: 'projects', key: 'projects' },
        { href: '/blog', label: 'blog', key: 'blog' },
        { href: '/about', label: 'about', key: 'about' },
        { href: '/contact', label: 'contact', key: 'contact' },
    ]

    return (
        <>
            {/* Desktop Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 p-4 pt-safe-area-inset-top md:p-6 hidden md:block">
                <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-10 py-4 max-w-4xl mx-auto shadow-2xl shadow-black/10">
                    <div className="flex justify-center space-x-8 text-base font-medium">
                        {navItems.map((item) => (
                            <a
                                key={item.key}
                                href={item.href}
                                className={`nav-item transition-all duration-300 relative px-4 py-2 rounded-lg ${
                                    currentPage === item.key 
                                        ? 'text-white bg-white/10' 
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.label}
                                {currentPage === item.key && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                                )}
                            </a>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Mobile Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 p-4 md:hidden">
                <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-6 py-4 shadow-2xl shadow-black/10">
                    <div className="flex justify-between items-center">
                        <a href="/" className="text-white font-semibold text-lg">
                            Camilo Martinez
                        </a>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-white/70 hover:text-white transition-colors p-2"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
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
                                            currentPage === item.key 
                                                ? 'text-white bg-white/10 border border-white/20' 
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
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
