'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import PageShell from '@/components/shared/page-shell'

const MAC_DOWNLOAD =
  'https://github.com/camilojourney/Focusing-App/releases/download/v1.0.0/Hyper.Awareness_1.0.0_aarch64.dmg'
const WINDOWS_DOWNLOAD = '/downloads/focus-time-windows.exe'

const features = [
  {
    title: 'Hyperfocus aware',
    description: 'Gentle check-ins every 15 minutes keep you grounded without breaking deep work flow.',
  },
  {
    title: 'Privacy first',
    description: 'All data stays local. No cloud sync, no analytics, no tracking. Your focus is yours alone.',
  },
  {
    title: 'Calendar smart',
    description: 'Auto-suggests your current meeting as a focus goal with macOS Calendar integration.',
  },
  {
    title: 'Pattern insights',
    description: 'Review session timelines to understand your focus patterns and task-switching behavior.',
  },
]

export default function FocusTimeDownloadPage() {
  const [platform, setPlatform] = useState<'mac' | 'windows'>('mac')
  const other = platform === 'mac' ? 'windows' : 'mac'
  const label = (p: 'mac' | 'windows') => (p === 'mac' ? 'macOS' : 'Windows')

  return (
    <PageShell currentPage="apps" maxWidth="wide">
      <Link href="/apps" className="link-quiet mobile-link-target inline-flex items-center gap-2 text-sm">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        All apps
      </Link>

      <header className="rise-in mt-6 grid gap-10 border-b border-line pb-12 md:grid-cols-12 md:items-center md:gap-12 md:pb-16">
        <div className="md:col-span-7">
          <span className="status status-live">Live app</span>
          <h1 className="display mt-3">Focus Time</h1>
          <p className="lede mt-6">
            A menu bar app for <em>hyperfocus awareness</em>. Periodic check-ins, session reviews, and calendar
            integration, built for ADHD minds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={platform === 'mac' ? MAC_DOWNLOAD : WINDOWS_DOWNLOAD} download className="btn-primary">
              Download for {label(platform)}
            </a>
            <button type="button" onClick={() => setPlatform(other)} className="btn-secondary">
              Switch to {label(other)}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link href="/projects/focus-time" className="link mobile-link-target">
              How I built this
            </Link>
            <a
              href="https://github.com/camilojourney/Focusing-App"
              target="_blank"
              rel="noopener noreferrer"
              className="link mobile-link-target"
            >
              View source
            </a>
          </div>
        </div>
        <div className="thumb thumb-contain aspect-square md:col-span-5">
          <Image src="/images/previews_main/Hyper-awareness.png" alt="Focus Time logo" fill sizes="(min-width: 768px) 40vw, 100vw" priority />
        </div>
      </header>

      <section className="grid gap-8 border-b border-line py-12 md:grid-cols-3 md:py-16" aria-label="Focus Time benefits">
        {[
          ['Boost Awareness', 'Periodic check-ins every 15 minutes'],
          ['Sharpen Focus', 'Stay grounded during hyperfocus'],
          ['Enhance Insights', 'Review your focus patterns'],
        ].map(([title, description]) => (
          <div key={title}>
            <h2 className="title-md">{title}</h2>
            <p className="body-muted mt-3">{description}</p>
          </div>
        ))}
      </section>

      <section className="border-b border-line py-12 md:py-16" aria-labelledby="preview-heading">
        <h2 id="preview-heading" className="title-lg">App Preview</h2>
        <div className="panel relative mt-6 flex aspect-video items-center justify-center bg-surface-2">
          <Brain className="h-16 w-16 text-muted" aria-hidden />
          <span className="tag absolute left-4 top-4 bg-surface text-ink">🧠 15:00</span>
          <span className="tag absolute bottom-4 right-4 bg-surface text-ink">Check-in ready</span>
        </div>
      </section>

      <section className="border-b border-line py-12 md:py-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="title-lg">
          Built for ADHD minds
        </h2>
        <dl className="row-list mt-6">
          {features.map((f) => (
            <div key={f.title} className="grid gap-1 py-5 md:grid-cols-12 md:gap-8">
              <dt className="title-sm md:col-span-4">{f.title}</dt>
              <dd className="body-muted md:col-span-8">{f.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-10 md:py-12" aria-label="Technology">
        <p className="caption mb-3">Built with</p>
        <ul className="flex flex-wrap gap-2">
          {['Tauri 2', 'Rust', 'macOS', 'EventKit'].map((tech) => (
            <li key={tech} className="tag">
              {tech}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
