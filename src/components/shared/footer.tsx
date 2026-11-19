import Link from 'next/link'
import { EMAIL, GITHUB, LINKEDIN, MAILTO, X_PROFILE } from '@/lib/site'

const pages = [
  { href: '/projects', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/bookshelf', label: 'Bookshelf' },
  { href: '/contact', label: 'Contact' },
]

const connect = [
  { href: GITHUB, label: 'GitHub', external: true },
  { href: LINKEDIN, label: 'LinkedIn', external: true },
  { href: X_PROFILE, label: 'X', external: true },
  { href: MAILTO, label: EMAIL, external: false },
]

export default function Footer() {
  return (
    <footer className="border-t border-line" role="contentinfo">
      <div className="shell py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <p className="font-serif text-2xl text-ink">Juan Camilo Martinez</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Applied AI engineer in New York. Audio and speech ML pipelines, multi-agent systems, production
              infrastructure.
            </p>
            <p className="status status-live mt-4">Open to Applied AI Engineer roles</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-sm font-semibold text-ink">Pages</p>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Footer navigation">
              {pages.map((p) => (
                <Link key={p.href} href={p.href} className="mobile-link-target w-fit text-sm text-muted hover:text-ink">
                  {p.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-3">
            <p className="text-sm font-semibold text-ink">Connect</p>
            <div className="mt-3 flex flex-col gap-2">
              {connect.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="mobile-link-target w-fit text-sm text-muted hover:text-ink [overflow-wrap:anywhere]"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Juan Camilo Martinez</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="mobile-link-target hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="mobile-link-target hover:text-ink">
              Terms
            </Link>
            <Link href="/sitemap.xml" className="mobile-link-target hover:text-ink">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
