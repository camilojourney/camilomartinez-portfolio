'use client'

import Link from 'next/link'
import LiquidNav from '@/components/shared/liquid-nav'

export default function HRVResearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Site Header Navigation */}
      <LiquidNav currentPage="projects" />

      {/* Presentation Container - takes available space */}
      <div className="flex-1 bg-white mt-20 md:mt-24 relative">
        <div className="w-full h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]">
          <iframe
            id="hrv-research"
            src="/hrv-research.html"
            className="w-full h-full border-0"
            title="HRV Research"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            loading="eager"
          />
        </div>

        {/* Back to Projects (floating button) */}
        <div className="absolute top-6 left-6 z-50">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-slate-900/90 px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300 text-sm font-medium backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </div>
      </div>

      {/* Footer will render here naturally from the layout */}
    </div>
  )
}
