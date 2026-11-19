'use client'

import Link from 'next/link'
import SiteHeader from '@/components/shared/site-header'

export default function HRVResearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Site Header Navigation */}
      <SiteHeader currentPage="projects" />

      {/* Presentation Container - takes available space */}
      <div className="relative flex-1 bg-white">
        <div className="w-full h-[calc(100vh-4rem)]">
          <iframe
            id="hrv-research"
            src="/hrv-research.html"
            className="w-full h-full border-0"
            title="HRV Research"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            loading="eager"
          />
        </div>

        {/* All work (floating button) */}
        <div className="absolute top-6 left-6 z-50">
          <Link
            href="/projects"
            className="btn-primary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            All projects
          </Link>
        </div>
      </div>

      {/* Footer will render here naturally from the layout */}
    </div>
  )
}
