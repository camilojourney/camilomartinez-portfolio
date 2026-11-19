import Link from 'next/link'
import ThemeToggle from './theme-toggle'
import { MAILTO } from '@/lib/site'

export type NavPage =
  | 'home'
  | 'apps'
  | 'projects'
  | 'blog'
  | 'about'
  | 'contact'
  | 'bookshelf'
  | 'tools'
  | 'my-data'

interface SiteHeaderProps {
  currentPage?: NavPage
}

const navItems = [
  { href: '/projects', label: 'Work', key: 'projects' },
  { href: '/about', label: 'About', key: 'about' },
  { href: '/blog', label: 'Blog', key: 'blog' },
  { href: '/contact', label: 'Contact', key: 'contact' },
] as const

function activeKey(page: NavPage | undefined) {
  if (!page) return undefined
  if (page === 'home' || page === 'apps' || page === 'tools' || page === 'my-data' || page === 'bookshelf') {
    return 'projects'
  }
  return page
}

export default function SiteHeader({ currentPage = 'home' }: SiteHeaderProps) {
  const active = activeKey(currentPage)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur-sm">
      <div className="shell flex flex-wrap items-center gap-x-6 gap-y-2 py-3 md:py-4">
        <Link
          href="/"
          className="nav-focus-target font-serif text-[1.375rem] leading-none text-ink"
          aria-label="Juan Camilo Martinez, home"
        >
          Juan Camilo Martinez
        </Link>

        <nav aria-label="Primary" className="order-3 flex w-full gap-3 pt-1 text-[0.9375rem] md:order-2 md:ml-6 md:w-auto md:gap-5 md:pt-0">
          {navItems.map((item) => {
            const isActive = active === item.key
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-focus-target mobile-link-target justify-center transition-colors md:min-w-0 ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <ThemeToggle />
          <a href={MAILTO} className="btn-primary btn-sm nav-focus-target">
            Email me
          </a>
        </div>
      </div>
    </header>
  )
}
