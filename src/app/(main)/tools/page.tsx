import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'

interface Resource {
  title: string
  href?: string
  external?: boolean
  description: string
  features: string[]
  cta: string
  statusLabel: string
  live: boolean
}

const resources: Resource[] = [
  {
    title: 'Signal-Based Productivity',
    href: 'https://camilomartinez.notion.site/Management-253e98e30a3080cd84acca32ff86621a?pvs=74',
    external: true,
    description:
      "Battle-tested productivity system built on Ivy Lee's method. Clarity, focus, and execution for teams or solo work.",
    features: ['Task Ivy Lee for daily execution', 'Frontlines for strategic projects', 'Notion templates included'],
    cta: 'Get the free template',
    statusLabel: 'Free template',
    live: true,
  },
  {
    title: 'My Bookshelf',
    href: '/bookshelf',
    description:
      'Curated collection of must-read books on AI, data science, systems thinking, and personal development. Books that shaped my thinking and approach to problem-solving.',
    features: ['Technical deep dives', 'Systems and frameworks', 'Personal growth'],
    cta: 'Browse books',
    statusLabel: '12 books',
    live: true,
  },
  {
    title: 'Learning Frameworks',
    description:
      'Proven learning frameworks and mental models from Notion. Templates and systems for effective learning, note-taking, and knowledge management.',
    features: ['Learning systems', 'Mental models', 'Notion templates'],
    cta: 'Coming soon',
    statusLabel: 'In progress',
    live: false,
  },
  {
    title: 'Insights & Essays',
    description:
      'Collection of valuable insights, essays, and thought pieces on technology, AI, and building systems. Lessons learned from real projects and experiences.',
    features: ['Technical insights', 'Project retrospectives', 'Lessons learned'],
    cta: 'Coming soon',
    statusLabel: 'In progress',
    live: false,
  },
]

function ResourceLink({ r, className, children }: { r: Resource; className: string; children: React.ReactNode }) {
  if (!r.href) return <>{children}</>
  if (r.external) {
    return (
      <a href={r.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={r.href} className={className}>
      {children}
    </Link>
  )
}

export default function ToolsPage() {
  return (
    <PageShell currentPage="tools" maxWidth="wide">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <h1 className="display">Resources &amp; Templates</h1>
        <p className="lede mt-6">
          Curated learning resources, productivity templates, and insights from <em>books</em>, systems, and proven
          frameworks.
        </p>
      </header>

      <ul className="row-list" aria-label="Resources">
        {resources.map((r) => (
          <li key={r.title} className="grid gap-3 py-7 md:grid-cols-12 md:gap-8 md:py-8">
            <div className="md:col-span-4">
              <span className={`status ${r.live ? 'status-live' : 'status-warn'}`}>{r.statusLabel}</span>
              <h2 className="title-md mt-2">
                <ResourceLink r={r} className="mobile-link-target hover:text-accent">
                  {r.title}
                </ResourceLink>
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="body-muted">{r.description}</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {r.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3 md:text-right">
              {r.href ? (
                <ResourceLink r={r} className="btn-secondary btn-sm">
                  {r.cta}
                </ResourceLink>
              ) : (
                <span className="caption">{r.cta}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
