import { ReactNode } from 'react'
import LiquidNav from './liquid-nav'

interface StandardPageProps {
  children: ReactNode
  currentPage?: 'home' | 'apps' | 'projects' | 'blog' | 'about' | 'contact' | 'bookshelf' | 'tools' | 'my-data'
  maxWidth?: 'default' | 'wide' | 'full'
}

/**
 * Universal page component with consistent styling for all pages.
 * Features:
 * - Consistent gradient background matching home page
 * - Animated floating orbs
 * - Responsive padding and spacing
 * - Configurable max-width
 * 
 * Usage:
 * <StandardPage currentPage="projects">
 *   <YourContent />
 * </StandardPage>
 */
export default function StandardPage({ 
  children, 
  currentPage = 'home',
  maxWidth = 'default'
}: StandardPageProps) {
  const maxWidthClasses = {
    default: 'max-w-4xl',
    wide: 'max-w-6xl',
    full: 'max-w-7xl'
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage={currentPage} />

      {/* Universal Background - Same for ALL pages */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full`}>
          {children}
        </div>
      </div>
    </div>
  )
}
