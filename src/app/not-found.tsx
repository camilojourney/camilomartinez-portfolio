import { Metadata } from 'next'
import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.',
  openGraph: {
    title: '404 - Page Not Found | Juan Camilo Martinez',
    description: 'The page you are looking for does not exist or has been moved.',
  },
}

export default function NotFound() {
  return (
    <PageShell maxWidth="default">
      <div className="rise-in py-10 md:py-20">
        <p className="font-serif text-[clamp(5rem,16vw,10rem)] leading-none text-line" aria-hidden>
          404
        </p>
        <h1 className="title-lg mt-4">Lost in the latent space</h1>
        <p className="body-muted mt-4 max-w-md">
          This page does not exist, was moved, or perhaps it was just a hallucination. Here is the way back.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            Back to home
          </Link>
          <Link href="/projects" className="btn-secondary">
            View work
          </Link>
        </div>
        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Quick links">
          <Link href="/blog" className="link-quiet mobile-link-target">Blog</Link>
          <Link href="/about" className="link-quiet mobile-link-target">About</Link>
          <Link href="/contact" className="link-quiet mobile-link-target">Contact</Link>
        </nav>
      </div>
    </PageShell>
  )
}
