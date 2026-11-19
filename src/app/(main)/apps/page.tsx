import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'

type AppStatus = 'live' | 'in-development'

interface AppEntry {
  title: string
  href?: string
  description: string
  features: string[]
  cta: string
  status: AppStatus
  statusLabel: string
}

const apps: AppEntry[] = [
  {
    title: 'Fitness Dashboard',
    href: '/apps/fitness-dashboard',
    description:
      'Real-time WHOOP + Strava analytics with interactive visualizations. Daily strain, recovery trends, and performance insights.',
    features: ['Updated daily with latest data', 'Interactive charts and heatmaps', 'Performance metrics tracking'],
    cta: 'Open dashboard',
    status: 'live',
    statusLabel: 'Live, updated daily',
  },
  {
    title: 'Social Media Pipeline',
    href: '/apps/social-media-pipeline',
    description:
      'AI-powered content generator for social media. Transform ideas into optimized tweets, threads, and multi-language content.',
    features: ['Tweet and thread optimization', 'English and Spanish support', 'Instant content generation'],
    cta: 'Try the tool',
    status: 'live',
    statusLabel: 'Live',
  },
  {
    title: 'Trading Bot',
    description:
      'Algorithmic trading platform with real-time market analysis, strategy backtesting, and risk management.',
    features: ['Real-time market data', 'Strategy backtesting engine', 'Advanced risk management'],
    cta: 'Coming soon',
    status: 'in-development',
    statusLabel: 'In development',
  },
  {
    title: 'Think Clear',
    description:
      'Cognitive bias detection tool powered by AI. Analyze decisions, identify thinking patterns, and make clearer choices.',
    features: ['Real-time bias detection', 'Decision analysis framework', 'AI-powered insights'],
    cta: 'Coming soon',
    status: 'in-development',
    statusLabel: 'In development',
  },
]

export default function AppsPage() {
  return (
    <PageShell currentPage="apps" maxWidth="wide">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <h1 className="display">Apps</h1>
        <p className="lede mt-6">
          Interactive tools you can <em>use right now</em>. Real-time dashboards, AI-powered tools, and data visualizations.
        </p>
      </header>

      <ul className="row-list" aria-label="Applications">
        {apps.map((app) => (
          <li key={app.title} className="grid gap-3 py-7 md:grid-cols-12 md:gap-8 md:py-8">
            <div className="md:col-span-4">
              <span className={`status ${app.status === 'live' ? 'status-live' : 'status-warn'}`}>{app.statusLabel}</span>
              <h2 className="title-md mt-2">
                {app.href ? (
                  <Link href={app.href} className="hover:text-accent">
                    {app.title}
                  </Link>
                ) : (
                  app.title
                )}
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="body-muted">{app.description}</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {app.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3 md:text-right">
              {app.href ? (
                <Link href={app.href} className="btn-secondary btn-sm">
                  {app.cta}
                </Link>
              ) : (
                <span className="caption">{app.cta}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
