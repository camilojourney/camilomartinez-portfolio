import Link from 'next/link'
import Image from 'next/image'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

export default function FitnessDashboardProject() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
          <header className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-emerald-200 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Live System
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Fitness Dashboard: Real-Time Health Analytics
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              Bringing together WHOOP and Strava data pipelines to power an always-on performance dashboard with real-time analytics, anomaly detection, and historical insight.
            </p>
          </header>

          <Card className="border-white/10 bg-white/[0.05] overflow-hidden">
            <div className="relative w-full h-64 md:h-80 bg-black">
              <Image
                src="/images/previews_main/fitness.png"
                alt="Fitness dashboard recovery vs strain preview"
                fill
                className="object-contain object-center md:scale-95 scale-95"
                priority
              />
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">The Challenge</h2>
            <p className="text-white/70 leading-relaxed text-base md:text-lg">
              WHOOP exposes rich biometric streams, but turning that raw telemetry into actionable insights requires resilient ingestion, smart caching, and compelling visualization. I wanted a single pane of glass that captured training load, recovery, and workout patterns in one experience.
            </p>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Architecture</h2>
            <ul className="list-disc list-inside space-y-4 text-white/70 text-base md:text-lg">
              <li><span className="text-white/90 font-medium">WHOOP API ingestion</span> via authenticated collectors pushing to TimescaleDB with automatic backfills.</li>
              <li><span className="text-white/90 font-medium">Strava webhooks</span> keep activities synchronized without polling and trigger enrichment jobs.</li>
              <li><span className="text-white/90 font-medium">PostgreSQL + TimescaleDB</span> for hypertables, retention policies, and downsampled materialized views.</li>
              <li><span className="text-white/90 font-medium">Next.js 14</span> Server Components streaming analytics to interactive charts with ISR refresh every 6 hours.</li>
            </ul>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Key Challenges Solved</h2>
            <p className="text-white/70 leading-relaxed text-base md:text-lg">
              Built adaptive rate limiting to respect WHOOP quotas, created reconciliation jobs for data drift, and designed a correlation pipeline mapping previous-day strain to recovery. The result is a dashboard that stays fresh without manual refreshes and highlights the metrics that actually move training decisions.
            </p>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border-emerald-400/30 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-2xl font-semibold text-white">See it in action</h3>
            <p className="text-white/70">Explore the live dashboard, updated automatically as new WHOOP and Strava data arrives.</p>
            <Link
              href="/apps/fitness-dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-emerald-300/60 hover:text-emerald-100"
            >
            View Live Dashboard →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}