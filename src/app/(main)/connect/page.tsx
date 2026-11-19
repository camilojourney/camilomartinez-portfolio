import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowDownToLine, ArrowUpRight, ContactRound, Instagram, Linkedin } from 'lucide-react'
import { baseUrl, LINKEDIN } from '@/lib/site'

const profileLinks = [
  {
    label: 'Add to Contacts',
    handle: 'iPhone contact card',
    href: '/juan-camilo-martinez-contact.vcf',
    Icon: ContactRound,
    primary: true,
    download: true,
  },
  {
    label: 'Connect on LinkedIn',
    handle: 'camilomartinez-ai',
    href: LINKEDIN,
    Icon: Linkedin,
    primary: false,
    download: false,
    showAtPrefix: true,
  },
  {
    label: 'Follow on Instagram',
    handle: 'camiloexperience',
    href: 'https://www.instagram.com/camiloexperience/',
    Icon: Instagram,
    primary: false,
    download: false,
    showAtPrefix: true,
  },
]

export const metadata: Metadata = {
  title: 'Connect',
  description:
    'Connect with Juan Camilo Martinez on LinkedIn and Instagram.',
  alternates: {
    canonical: `${baseUrl}/connect`,
  },
  openGraph: {
    title: 'Connect | Juan Camilo Martinez',
    description:
      'Applied AI engineer building workflow systems, agent orchestration, and evaluation-driven AI products.',
    url: `${baseUrl}/connect`,
    images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Connect with Camilo')}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect | Juan Camilo Martinez',
    description:
      'Applied AI engineer building workflow systems, agent orchestration, and evaluation-driven AI products.',
  },
}

/** Quick-connect card used behind a QR code. Standalone: no header, footer or chat. */
export default function ConnectPage() {
  return (
    <div data-connect-page className="relative min-h-screen">
      <style>{`
        body:has([data-connect-page]) footer,
        body:has([data-connect-page]) [data-chat-widget] {
          display: none !important;
        }
      `}</style>

      <section className="rise-in mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12 md:px-6">
        <div className="mb-8 text-center">
          <Image
            src="/vcard/juan-camilo-contact.jpg"
            alt="Camilo Martinez"
            width={88}
            height={88}
            priority
            className="mx-auto mb-5 h-22 w-22 rounded-full border border-line object-cover"
          />
          <p className="caption mb-2">Quick connect</p>
          <h1 className="font-serif text-4xl text-ink">Camilo Martinez</h1>
          <p className="body-muted mx-auto mt-3 max-w-xs text-sm">
            Applied AI engineer building workflow systems, agents, and evaluation-driven products.
          </p>
        </div>

        <div className="space-y-3" aria-label="Quick contact links">
          {profileLinks.map(({ label, handle, href, Icon, primary, download, showAtPrefix }) => {
            const ActionIcon = download ? ArrowDownToLine : ArrowUpRight

            return (
              <a
                key={label}
                href={href}
                target={download ? undefined : '_blank'}
                rel={download ? undefined : 'noopener noreferrer'}
                download={download ? 'juan-camilo-martinez-contact.vcf' : undefined}
                className={`group flex items-center justify-between rounded-xl border px-5 py-4 transition-colors ${
                  primary
                    ? 'border-ink bg-ink text-page hover:bg-accent hover:text-accent-ink'
                    : 'border-line bg-surface text-ink hover:border-ink'
                }`}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      primary ? 'bg-page/15' : 'bg-surface-2'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-base font-semibold leading-tight">{label}</span>
                    <span className={`mt-1 block truncate text-sm ${primary ? 'opacity-70' : 'text-muted'}`}>
                      {showAtPrefix ? '@' : ''}
                      {handle}
                    </span>
                  </span>
                </span>
                <ActionIcon className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            )
          })}
        </div>

        <p className="caption mt-8 text-center text-xs">NYC · Applied AI · Business Analytics</p>
      </section>
    </div>
  )
}
