import Link from 'next/link'
import Image from 'next/image'
import { Instrument_Serif, Inter } from 'next/font/google'
import '@/styles/directions.css'
import type { ProjectMeta } from '@/data/projects'
import {
  EMAIL,
  GITHUB,
  LINKEDIN,
  MAILTO,
  appLabel,
  featuredProjects,
  personalProjects,
  statusLabel,
  supportingProjects,
} from './shared'

const instrument = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-dir-instrument' })
const inter = Inter({ subsets: ['latin'], variable: '--font-dir-inter' })

function ProjectLinks({ p }: { p: ProjectMeta }) {
  return (
    <div className="dir-links">
      <Link href={p.caseStudyHref}>Case study</Link>
      {p.appHref && (
        <a href={p.appHref} {...(p.isExternalApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {appLabel(p)}
        </a>
      )}
      {p.apiHref && (
        <a href={p.apiHref} target="_blank" rel="noopener noreferrer">
          {p.apiLabel || 'API docs'}
        </a>
      )}
    </div>
  )
}

function IndexRow({ p }: { p: ProjectMeta }) {
  return (
    <article className="dir-a-index">
      <h3>
        <Link href={p.caseStudyHref}>{p.title}</Link>
        <span className="dir-a-meta">
          {statusLabel[p.status]} · {p.tags.join(' · ')}
        </span>
      </h3>
      <p>{p.description}</p>
      <ProjectLinks p={p} />
    </article>
  )
}

export default function DirectionA() {
  return (
    <div className={`dir dir-a ${instrument.variable} ${inter.variable}`} data-direction="a">
      <div className="dir-wrap">
        <header className="dir-a-nav">
          <Link href="/" className="dir-a-brand">
            Juan Camilo Martinez
          </Link>
          <nav aria-label="Primary">
            <Link href="/projects" aria-current="page">
              Work
            </Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <a className="dir-a-btn" href={MAILTO}>
            Email me
          </a>
        </header>

        <section className="dir-a-hero">
          <div className="dir-enter">
            <h1 className="dir-serif">Camilo Martinez</h1>
            <p className="dir-a-statement">
              Applied AI engineer in New York. I ship <em>audio and speech ML</em> pipelines and{' '}
              <em>multi-agent systems</em> to production, from research papers to real users.
            </p>
            <div className="dir-a-ctas">
              <a className="dir-a-btn" href={MAILTO}>
                Email me
              </a>
              <a className="dir-a-btn dir-a-btn--ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a className="dir-a-btn dir-a-btn--ghost" href={GITHUB} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
          <aside className="dir-a-facts" aria-label="At a glance">
            <dl>
              <dt>Looking for</dt>
              <dd>Applied AI Engineer roles, full-time</dd>
              <dt>Location</dt>
              <dd>New York City or US remote</dd>
              <dt>Proof</dt>
              <dd>11-dimension speech scorer built from 46 papers; multi-agent orchestration in production</dd>
              <dt>Email</dt>
              <dd>
                <a href={MAILTO}>{EMAIL}</a>
              </dd>
            </dl>
          </aside>
        </section>

        <section className="dir-a-section" aria-labelledby="dir-a-featured">
          <div className="dir-a-section-head">
            <h2 id="dir-a-featured" className="dir-serif">
              Selected work
            </h2>
            <p>Production systems, research to deployment</p>
          </div>
          {featuredProjects.map((p) => (
            <article key={p.slug} className="dir-a-feature">
              <div>
                <span className="dir-live">{statusLabel[p.status]}</span>
                <h3 className="dir-serif">
                  <Link href={p.caseStudyHref}>{p.title}</Link>
                </h3>
                <p>{p.description}</p>
                <div className="dir-a-tags">{p.tags.join(' · ')}</div>
                <ProjectLinks p={p} />
              </div>
              <Link href={p.caseStudyHref} className={`dir-thumb ${p.slug === 'astoria-conquest' ? 'dir-thumb--contain' : ''}`} aria-label={`${p.title} case study`}>
                {p.previewImage && (
                  <Image src={p.previewImage} alt="" fill sizes="(min-width: 860px) 50vw, 100vw" priority />
                )}
              </Link>
            </article>
          ))}
        </section>

        <section className="dir-a-section" aria-labelledby="dir-a-more">
          <div className="dir-a-section-head">
            <h2 id="dir-a-more" className="dir-serif">
              More projects
            </h2>
            <p>Full-stack, AI tooling, and data systems</p>
          </div>
          {supportingProjects.map((p) => (
            <IndexRow key={p.slug} p={p} />
          ))}
        </section>

        <section className="dir-a-section" aria-labelledby="dir-a-personal">
          <div className="dir-a-section-head">
            <h2 id="dir-a-personal" className="dir-serif">
              Personal and research
            </h2>
          </div>
          {personalProjects.map((p) => (
            <IndexRow key={p.slug} p={p} />
          ))}
        </section>

        <footer className="dir-a-footer">
          <span>&copy; {new Date().getFullYear()} Juan Camilo Martinez</span>
          <nav aria-label="Footer" className="dir-links" style={{ fontWeight: 400 }}>
            <Link href="/blog">Blog</Link>
            <Link href="/bookshelf">Bookshelf</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
          </nav>
        </footer>
      </div>
    </div>
  )
}
