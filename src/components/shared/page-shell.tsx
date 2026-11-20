import type { ReactNode } from 'react'
import SiteHeader, { type NavPage } from './site-header'

interface PageShellProps {
  children: ReactNode
  currentPage?: NavPage
  /** Content measure. `narrow` is a reading column, `full` spans the shell. */
  maxWidth?: 'narrow' | 'default' | 'wide' | 'full'
  className?: string
}

const widths = {
  narrow: 'max-w-3xl',
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
}

export default function PageShell({ children, currentPage = 'home', maxWidth = 'default', className = '' }: PageShellProps) {
  return (
    <>
      <SiteHeader currentPage={currentPage} />
      <div className={`shell pb-20 pt-10 md:pb-28 md:pt-16 ${className}`}>
        <div className={`${widths[maxWidth]} w-full`}>{children}</div>
      </div>
    </>
  )
}
