import {
  CaseStudy,
  CaseStudyCta,
  CaseStudyFigure,
  CaseStudyHeader,
  CaseStudySection,
} from '@/components/projects/case-study'

export default function FitnessDashboardProject() {
  return (
    <CaseStudy>
      <CaseStudyHeader
        status="Live system"
        title="Fitness Dashboard: real-time health analytics"
        lede="Bringing together WHOOP and Strava data pipelines to power an always-on performance dashboard with real-time analytics, anomaly detection, and historical insight."
        facts={[
          ['Sources', 'WHOOP API, Strava webhooks'],
          ['Storage', 'PostgreSQL + TimescaleDB'],
          ['Refresh', 'ISR every 6 hours'],
        ]}
      />

      <CaseStudyFigure src="/images/previews_main/fitness.png" alt="Fitness dashboard recovery vs strain preview" />

      <div className="mt-6 md:mt-10">
        <CaseStudySection title="The challenge" id="challenge">
          <p>
            WHOOP exposes rich biometric streams, but turning that raw telemetry into actionable insights requires
            resilient ingestion, smart caching, and compelling visualization. I wanted a single pane of glass that
            captured training load, recovery, and workout patterns in one experience.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Technical architecture" id="architecture">
          <ul>
            <li>
              <strong>WHOOP API ingestion</strong> via authenticated collectors pushing to TimescaleDB with automatic
              backfills.
            </li>
            <li>
              <strong>Strava webhooks</strong> keep activities synchronized without polling and trigger enrichment jobs.
            </li>
            <li>
              <strong>PostgreSQL + TimescaleDB</strong> for hypertables, retention policies, and downsampled materialized
              views.
            </li>
            <li>
              <strong>Next.js 14</strong> Server Components streaming analytics to interactive charts with ISR refresh
              every 6 hours.
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Key challenges solved" id="challenges">
          <p>
            Built adaptive rate limiting to respect WHOOP quotas, created reconciliation jobs for data drift, and
            designed a correlation pipeline mapping previous-day strain to recovery. The result is a dashboard that stays
            fresh without manual refreshes and highlights the metrics that actually move training decisions.
          </p>
        </CaseStudySection>
      </div>

      <CaseStudyCta
        title="See it in action"
        body="Explore the live dashboard, updated automatically as new WHOOP and Strava data arrives."
        href="/apps/fitness-dashboard"
        label="View live dashboard"
      />
    </CaseStudy>
  )
}
