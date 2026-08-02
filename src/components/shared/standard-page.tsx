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

      {/* Universal Background - Brand consistent */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#050810]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-[#080d1c] to-[#050810]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] bg-blue-600/[0.04] rounded-full blur-[160px]"></div>
          <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px]"></div>
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
