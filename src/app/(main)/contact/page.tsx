import { Metadata } from 'next'
import PageShell from '@/components/shared/page-shell'
import { baseUrl, EMAIL, GITHUB, LINKEDIN, MAILTO, X_PROFILE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Juan Camilo Martinez. Applied AI Engineer in NYC, open to AI Engineer roles in audio/speech ML and multi-agent systems.',
  openGraph: {
    title: 'Contact | Juan Camilo Martinez',
    description: 'Applied AI Engineer in NYC. Open to AI Engineer roles in audio/speech ML and multi-agent systems.',
    url: `${baseUrl}/contact`,
    images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Get in Touch')}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Juan Camilo Martinez',
    description: 'Applied AI Engineer in NYC. Open to AI Engineer roles in audio/speech ML and multi-agent systems.',
  },
}

const bring = [
  { label: 'Production AI', detail: 'Speech ML and agent systems that real users depend on, not demos.' },
  { label: '46 papers', detail: 'Synthesized into one 11-dimension speech scoring pipeline.' },
  { label: 'Multi-agent systems', detail: 'Orchestration, event buses, guardrails and observability in production.' },
  { label: 'New York City', detail: 'Available immediately. Open to US remote.' },
]

export default function ContactPage() {
  return (
    <PageShell currentPage="contact" maxWidth="wide">
      <header className="rise-in grid gap-10 border-b border-line pb-12 md:grid-cols-12 md:gap-12 md:pb-16">
        <div className="md:col-span-7">
          <h1 className="display">Let&apos;s talk</h1>
          <p className="lede mt-6">
            Seeking <em>Applied AI Engineer</em> roles in audio/speech ML, multi-agent systems, and production AI.
            Email is the fastest way to reach me.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={MAILTO} className="btn-primary">
              Email {EMAIL}
            </a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Connect on LinkedIn
            </a>
          </div>
        </div>
        <dl className="facts self-end md:col-span-5">
          <dt>Location</dt>
          <dd>New York City, NY</dd>
          <dt>Availability</dt>
          <dd>
            <span className="status status-live text-ink">Open to opportunities</span>
          </dd>
          <dt>Best contact</dt>
          <dd>Email or LinkedIn</dd>
          <dt>Elsewhere</dt>
          <dd className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="link">
              GitHub
            </a>
            <a href={X_PROFILE} target="_blank" rel="noopener noreferrer" className="link">
              X
            </a>
          </dd>
        </dl>
      </header>

      <section className="py-12 md:py-16" aria-labelledby="bring-heading">
        <h2 id="bring-heading" className="title-lg">What I bring</h2>
        <dl className="row-list mt-6">
          {bring.map((b) => (
            <div key={b.label} className="grid gap-1 py-5 md:grid-cols-12 md:gap-8">
              <dt className="title-sm md:col-span-4">{b.label}</dt>
              <dd className="body-muted md:col-span-8">{b.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  )
}
