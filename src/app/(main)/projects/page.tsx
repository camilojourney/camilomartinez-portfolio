"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to home page since all projects are now displayed there
export default function ProjectsRedirect() {
    const router = useRouter()
    
    useEffect(() => {
        router.replace('/')
    }, [router])
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30">
            <div className="text-white/80 text-center">
                <p className="mb-2">Redirecting to home...</p>
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    )
}
