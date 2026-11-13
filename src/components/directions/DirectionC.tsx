import Link from 'next/link'
import Image from 'next/image'
import { Manrope } from 'next/font/google'
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

const manrope = Manrope({ subsets: ['latin'], variable: '--font-dir-manrope' })

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
    <article className="dir-c-row">
      <Link href={p.caseStudyHref} className={`dir-thumb ${p.slug === 'astoria-conquest' ? 'dir-thumb--contain' : ''}`} aria-label={`${p.title} case study`}>
        {p.previewImage && <Image src={p.previewImage} alt="" fill sizes="140px" />}
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

export default function DirectionC() {
  return (
    <div className={`dir dir-c ${manrope.variable}`} data-direction="c">
      <div className="dir-wrap dir-c-layout">
        <aside className="dir-c-side dir-enter">
          <nav className="dir-c-nav" aria-label="Primary">
            <Link href="/projects" aria-current="page">
              Work
            </Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/blog">Blog</Link>
          </nav>
          <h1>Camilo Martinez</h1>
          <p className="dir-c-role">Applied AI Engineer</p>
          <p className="dir-c-statement">
            I ship audio and speech ML pipelines and multi-agent systems to production, from research papers to
            real users. Based in New York, open to full-time AI roles in NYC or US remote.
          </p>
          <div className="dir-c-ctas">
            <a className="dir-c-btn" href={MAILTO}>
              Email me
            </a>
            <a className="dir-c-btn dir-c-btn--ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
          <div className="dir-c-facts">
            <span>
              <strong>Proof:</strong> 11-dimension speech scorer from 46 papers
            </span>
            <span>
              <strong>Proof:</strong> multi-agent orchestration system in production
            </span>
            <span>
              <strong>Email:</strong> <a href={MAILTO}>{EMAIL}</a>
            </span>
          </div>
          <div className="dir-c-social">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="https://x.com/camilojourney" target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
        </aside>

        <main className="dir-c-main">
          <section aria-labelledby="dir-c-featured">
            <h2 id="dir-c-featured">Featured work</h2>
            {featuredProjects.map((p) => (
              <article key={p.slug} className="dir-c-card">
                <Link href={p.caseStudyHref} className={`dir-thumb ${p.slug === 'astoria-conquest' ? 'dir-thumb--contain' : ''}`} aria-label={`${p.title} case study`}>
                  {p.previewImage && (
                    <Image src={p.previewImage} alt="" fill sizes="(min-width: 960px) 55vw, 100vw" priority />
                  )}
                </Link>
                <div className="dir-c-card-body">
                  <span className="dir-live">{statusLabel[p.status]}</span>
                  <h3>
                    <Link href={p.caseStudyHref}>{p.title}</Link>
                  </h3>
                  <p>{p.description}</p>
                  <div className="dir-c-tags">{p.tags.join(' · ')}</div>
                  <ProjectLinks p={p} />
                </div>
              </article>
            ))}
          </section>

          <section aria-labelledby="dir-c-more">
            <h2 id="dir-c-more">More projects</h2>
            {supportingProjects.map((p) => (
              <Row key={p.slug} p={p} />
            ))}
          </section>

          <section aria-labelledby="dir-c-personal">
            <h2 id="dir-c-personal">Personal and research</h2>
            {personalProjects.map((p) => (
              <Row key={p.slug} p={p} />
            ))}
          </section>
        </main>
      </div>

      <footer className="dir-c-footer">
        <div className="dir-wrap">
          <span>&copy; {new Date().getFullYear()} Juan Camilo Martinez</span>
          <nav aria-label="Footer" className="dir-links" style={{ fontWeight: 400 }}>
            <Link href="/bookshelf">Bookshelf</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
