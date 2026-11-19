import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import PageShell from '@/components/shared/page-shell'

type Tone = 'live' | 'warn' | 'none'

const toneClass: Record<Tone, string> = {
  live: 'status-live',
  warn: 'status-warn',
  none: '',
}

/** Page frame for a narrative case study: header, hairline sections, closing call to action. */
export function CaseStudy({ children }: { children: ReactNode }) {
  return (
    <PageShell currentPage="projects" maxWidth="wide">
      <Link href="/projects" className="link-quiet mobile-link-target inline-flex items-center gap-2 text-sm">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        All projects
      </Link>
      {children}
    </PageShell>
  )
}

interface HeaderProps {
  status: string
  tone?: Tone
  title: string
  lede: ReactNode
  facts?: Array<[string, ReactNode]>
  actions?: ReactNode
}

export function CaseStudyHeader({ status, tone = 'live', title, lede, facts, actions }: HeaderProps) {
  return (
    <header className="rise-in mt-6 grid gap-8 border-b border-line pb-10 md:grid-cols-12 md:gap-12 md:pb-14">
      <div className={facts ? 'md:col-span-8' : 'md:col-span-10'}>
        <span className={`status ${toneClass[tone]}`}>{status}</span>
        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.75rem)]">{title}</h1>
        <p className="lede mt-6">{lede}</p>
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {facts && (
        <dl className="facts self-end md:col-span-4">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}

export function CaseStudyFigure({ src, alt, contain = true }: { src: string; alt: string; contain?: boolean }) {
  return (
    <figure className={`thumb mt-10 aspect-[2/1] md:mt-14 ${contain ? 'thumb-contain' : ''}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1280px) 72rem, 100vw" className={contain ? 'object-contain' : 'object-cover'} priority />
    </figure>
  )
}

/** Title in the left column, body in the right. Body is prose, so plain p/ul/strong render correctly. */
export function CaseStudySection({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="grid gap-4 border-b border-line py-10 md:grid-cols-12 md:gap-12 md:py-14" aria-labelledby={id}>
      <h2 id={id} className="title-md md:col-span-4">
        {title}
      </h2>
      <div className="prose text-muted md:col-span-8 [&_strong]:text-ink">{children}</div>
    </section>
  )
}

export function TechList({ items }: { items: string[] }) {
  return (
    <ul className="not-prose flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="tag">
          {t}
        </li>
      ))}
    </ul>
  )
}

interface CtaProps {
  title: string
  body: ReactNode
  href: string
  label: string
  external?: boolean
  secondary?: { href: string; label: string; external?: boolean }
}

export function CaseStudyCta({ title, body, href, label, external, secondary }: CtaProps) {
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const ext2 = secondary?.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <section className="py-12 md:py-16" aria-label="Next step">
      <h2 className="title-lg">{title}</h2>
      <p className="body-muted mt-3 max-w-xl">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={href} {...ext} className="btn-primary">
          {label}
        </Link>
        {secondary && (
          <Link href={secondary.href} {...ext2} className="btn-secondary">
            {secondary.label}
          </Link>
        )}
      </div>
    </section>
  )
}
