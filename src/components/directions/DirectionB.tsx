import Link from 'next/link'
import Image from 'next/image'
import { GeistMono } from 'geist/font/mono'
import '@/styles/directions.css'
import type { ProjectMeta } from '@/data/projects'
import TerminalDemo from '@/components/features/hero/TerminalDemo'
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

function Row({ p }: { p: ProjectMeta }) {
  return (
    <article className="dir-b-row">
      <Link href={p.caseStudyHref} className={`dir-thumb ${p.slug === 'astoria-conquest' ? 'dir-thumb--contain' : ''}`} aria-label={`${p.title} case study`}>
        {p.previewImage && <Image src={p.previewImage} alt="" fill sizes="120px" />}
      </Link>
      <div>
        <h3>
          <Link href={p.caseStudyHref}>{p.title}</Link>
        </h3>
        <p>{p.description}</p>
        <ProjectLinks p={p} />
      </div>
    </article>
  )
}

export default function DirectionB() {
  return (
    <div className={`dir dir-b ${GeistMono.variable}`} data-direction="b">
      <header className="dir-b-nav">
        <div className="dir-wrap">
          <Link href="/" className="dir-b-brand">
            camilomartinez
          </Link>
          <nav aria-label="Primary">
            <Link href="/projects" aria-current="page">
              Work
            </Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <a className="dir-b-btn" href={MAILTO}>
            Email me
          </a>
        </div>
      </header>

      <main className="dir-wrap">
        <section className="dir-b-hero">
          <div className="dir-enter">
            <h1>
              I ship audio ML and multi-agent systems to production.
              <br />
              <span>From research papers to real users.</span>
            </h1>
            <p className="dir-b-lede">
              I am Camilo Martinez, an applied AI engineer in New York. I built an 11-dimension speech scorer
              from 46 research papers and a multi-agent orchestration system that runs live. Open to full-time
              AI engineer roles in NYC or US remote.
            </p>
            <div className="dir-b-ctas">
              <a className="dir-b-btn" href={MAILTO}>
                Email me
              </a>
              <a className="dir-b-btn dir-b-btn--ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a className="dir-b-btn dir-b-btn--ghost" href={GITHUB} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
            <dl className="dir-b-facts">
              <div>
                <dt className="dir-mono">Status</dt>
                <dd>
                  <strong>
                    <span className="dir-live" style={{ color: 'inherit', fontSize: 'inherit' }}>
                      Open to roles
                    </span>
                  </strong>
                </dd>
              </div>
              <div>
                <dt className="dir-mono">Location</dt>
                <dd>
                  <strong>New York City</strong>
                </dd>
              </div>
              <div>
                <dt className="dir-mono">Email</dt>
                <dd>
                  <strong>
                    <a href={MAILTO}>{EMAIL}</a>
                  </strong>
                </dd>
              </div>
            </dl>
          </div>
          <div className="dir-b-terminal dir-enter">
            <TerminalDemo />
          </div>
        </section>

        <section className="dir-b-section" aria-labelledby="dir-b-featured">
          <div className="dir-b-section-head">
            <h2 id="dir-b-featured">Featured work</h2>
            <p className="dir-mono">{featuredProjects.length} production systems</p>
          </div>
          {featuredProjects.map((p) => (
            <article key={p.slug} className="dir-b-panel">
              <Link href={p.caseStudyHref} className={`dir-thumb ${p.slug === 'astoria-conquest' ? 'dir-thumb--contain' : ''}`} aria-label={`${p.title} case study`}>
                {p.previewImage && (
                  <Image src={p.previewImage} alt="" fill sizes="(min-width: 960px) 40vw, 100vw" priority />
                )}
              </Link>
              <div>
                <span className="dir-live">{statusLabel[p.status]}</span>
                <h3>
                  <Link href={p.caseStudyHref}>{p.title}</Link>
                </h3>
                <p>{p.description}</p>
                <div className="dir-b-tags">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <ProjectLinks p={p} />
              </div>
            </article>
          ))}
        </section>

        <section className="dir-b-section" aria-labelledby="dir-b-more">
          <div className="dir-b-section-head">
            <h2 id="dir-b-more">More projects</h2>
            <p className="dir-mono">Full-stack, AI tooling, data</p>
          </div>
          <div className="dir-b-list">
            {supportingProjects.map((p) => (
              <Row key={p.slug} p={p} />
            ))}
          </div>
        </section>

        <section className="dir-b-section" aria-labelledby="dir-b-personal">
          <div className="dir-b-section-head">
            <h2 id="dir-b-personal">Personal and research</h2>
          </div>
          <div className="dir-b-list">
            {personalProjects.map((p) => (
              <Row key={p.slug} p={p} />
            ))}
          </div>
        </section>
      </main>

      <footer className="dir-b-footer">
        <div className="dir-wrap">
          <span>&copy; {new Date().getFullYear()} Juan Camilo Martinez</span>
          <nav aria-label="Footer" className="dir-links" style={{ fontWeight: 400 }}>
            <Link href="/blog">Blog</Link>
            <Link href="/bookshelf">Bookshelf</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
