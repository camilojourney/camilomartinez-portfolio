import Link from 'next/link'
import Image from 'next/image'
import PageShell from '@/components/shared/page-shell'
import EntangledBlochSpheres from '@/components/projects/EntangledBlochSpheres'
import { projects, type ProjectMeta, type ProjectStatus } from '@/data/projects'
import { EMAIL, GITHUB, LINKEDIN, MAILTO } from '@/lib/site'

type NavKey = 'projects' | 'about' | 'blog' | 'contact'

const statusLabel: Record<ProjectStatus, string> = {
  live: 'Live',
  'in-progress': 'In progress',
  prototype: 'Prototype',
  concept: 'Concept',
}

const featured = projects.filter((p) => p.tier === 1)
const supporting = projects.filter((p) => p.tier === 2)
const personal = projects.filter((p) => p.tier === 3)

function appLabel(p: ProjectMeta): string {
  return p.appLabel || (p.isExternalApp ? 'Launch live app' : 'View live app')
}

function ProjectLinks({ p, className = '' }: { p: ProjectMeta; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem] font-medium ${className}`}>
      <Link href={p.caseStudyHref} className="link mobile-link-target">
        Case study
      </Link>
      {p.appHref && (
        <a
          href={p.appHref}
          {...(p.isExternalApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="link mobile-link-target"
        >
          {appLabel(p)}
        </a>
      )}
      {p.apiHref && (
        <a href={p.apiHref} target="_blank" rel="noopener noreferrer" className="link mobile-link-target">
          {p.apiLabel || 'API docs'}
        </a>
      )}
    </div>
  )
}

function Thumb({
  p,
  sizes,
  priority = false,
  className = '',
}: {
  p: ProjectMeta
  sizes: string
  priority?: boolean
  className?: string
}) {
  const contain = p.slug === 'astoria-conquest'
  return (
    <Link
      href={p.caseStudyHref}
      className={`thumb aspect-[16/10] ${contain ? 'thumb-contain' : ''} ${className}`}
      aria-label={`${p.title} case study`}
    >
      {p.previewImage ? (
        <Image src={p.previewImage} alt={`${p.title} preview`} fill sizes={sizes} priority={priority} />
      ) : (
        <span className="flex h-full items-center justify-center text-sm text-muted">Preview coming soon</span>
      )}
    </Link>
  )
}

function FeatureRow({ p }: { p: ProjectMeta }) {
  return (
    <article className="grid gap-8 py-10 first:pt-0 md:grid-cols-2 md:items-center md:gap-16 md:py-14">
      <div>
        <span className={`status ${p.status === 'live' ? 'status-live' : ''}`}>{statusLabel[p.status]}</span>
        <h3 className="title-md mt-3">
          <Link href={p.caseStudyHref} className="mobile-link-target hover:text-accent">
            {p.title}
          </Link>
        </h3>
        <p className="body-muted mt-3 max-w-[52ch]">{p.description}</p>
        <ul className="dotted-list caption mt-4 flex flex-wrap gap-x-2" aria-label="Topics">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <ProjectLinks p={p} className="mt-5" />
      </div>
      <div className="order-first md:order-none">
        <Thumb p={p} sizes="(min-width: 768px) 50vw, 100vw" priority />
      </div>
    </article>
  )
}

function IndexRow({ p }: { p: ProjectMeta }) {
  return (
    <article className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-5 md:grid-cols-12 md:gap-8 md:py-6">
      <Thumb p={p} sizes="(min-width: 768px) 12vw, 5rem" className="self-start md:col-span-2" />
      <div className="md:col-span-3">
        <h3 className="title-sm">
          <Link href={p.caseStudyHref} className="mobile-link-target hover:text-accent">
            {p.title}
          </Link>
        </h3>
        <ul className="dotted-list caption mt-1 flex flex-wrap gap-x-2 text-[0.8125rem]" aria-label="Status and topics">
          <li>{statusLabel[p.status]}</li>
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <p className="body-muted col-span-2 text-[0.9375rem] md:col-span-4">{p.description}</p>
      <ProjectLinks p={p} className="col-span-2 text-sm md:col-span-3" />
    </article>
  )
}

export default function ProjectsShowcase({
  currentPage = 'projects',
  showEntangledSpheres = false,
}: {
  currentPage?: NavKey
  showEntangledSpheres?: boolean
}) {
  return (
    <PageShell currentPage={currentPage} maxWidth="full" className="pt-0 md:pt-0">
      {/* Hero */}
      <section className="grid gap-12 border-b border-line py-12 md:grid-cols-12 md:gap-16 md:py-20" aria-labelledby="hero-heading">
        <div className="rise-in md:col-span-7">
          <h1 id="hero-heading" className="display">
            Camilo Martinez
          </h1>
          <p className="lede mt-6">
            Applied AI engineer in New York. I ship <em>audio and speech ML</em> pipelines and{' '}
            <em>multi-agent systems</em> to production, from research papers to real users.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={MAILTO} className="btn-primary">
              Email me
            </a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              LinkedIn
            </a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              GitHub
            </a>
          </div>
        </div>
        <aside className="rise-in rise-in-2 self-end md:col-span-5" aria-label="At a glance">
          <dl className="facts">
            <dt>Looking for</dt>
            <dd>Open to roles</dd>
            <dt>Location</dt>
            <dd>New York City or US remote</dd>
            <dt>Proof</dt>
            <dd>11-dimension speech scorer built from 46 papers; multi-agent orchestration in production</dd>
            <dt>Email</dt>
            <dd>
              <a href={MAILTO} className="link mobile-link-target">
                {EMAIL}
              </a>
            </dd>
          </dl>
        </aside>
      </section>

      {/* Featured */}
      <section className="border-b border-line py-12 md:py-20" aria-labelledby="featured-heading">
        {showEntangledSpheres ? (
          <div className="entangled-head mb-8 md:mb-12">
            <h2 id="featured-heading" className="title-lg">
              Selected work
            </h2>
            <EntangledBlochSpheres />
            <p className="caption">Production systems, research to deployment</p>
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 md:mb-12">
            <h2 id="featured-heading" className="title-lg">
              Selected work
            </h2>
            <p className="caption">Production systems, research to deployment</p>
          </div>
        )}
        <div className="row-list">
          {featured.map((p) => (
            <FeatureRow key={p.slug} p={p} />
          ))}
        </div>
      </section>

      {/* Supporting */}
      <section className="border-b border-line py-12 md:py-20" aria-labelledby="more-heading">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 md:mb-8">
          <h2 id="more-heading" className="title-lg">
            More projects
          </h2>
          <p className="caption">Full-stack, AI tooling, and data systems</p>
        </div>
        <div className="row-list">
          {supporting.map((p) => (
            <IndexRow key={p.slug} p={p} />
          ))}
        </div>
      </section>

      {/* Personal */}
      {personal.length > 0 && (
        <section className="py-12 md:py-20" aria-labelledby="personal-heading">
          <div className="mb-6 md:mb-8">
            <h2 id="personal-heading" className="title-lg">
              Personal and research
            </h2>
          </div>
          <div className="row-list">
            {personal.map((p) => (
              <IndexRow key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
