import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'

export default function ThinkClearAppPage() {
  return (
    <PageShell currentPage="apps" maxWidth="narrow">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <span className="status status-warn">In development</span>
        <h1 className="display mt-3">Think Clear</h1>
        <p className="lede mt-6">
          A cognitive bias detector that surfaces hidden framing, emotional triggers, and blind spots in your writing
          so you can reason through decisions with clarity.
        </p>
        <Link href="/projects/think-clear" className="link mt-6 inline-block">
          Read how I built this
        </Link>
      </header>

      <section className="py-10 md:py-14" aria-labelledby="planned-heading">
        <h2 id="planned-heading" className="title-md">
          Planned features
        </h2>
        <ul className="row-list mt-4">
          <li className="body-muted py-3">Bias taxonomy grounded in cognitive science literature.</li>
          <li className="body-muted py-3">Multi-agent critique pipeline with targeted interventions.</li>
          <li className="body-muted py-3">Guided reframing recommendations and reflection prompts.</li>
          <li className="body-muted py-3">Team workspace for collaborative decision memos.</li>
        </ul>
        <p className="caption mt-6">
          If you&apos;d like to beta test, send a note to{' '}
          <a href="mailto:hello@camilomartinez.co" className="link">
            hello@camilomartinez.co
          </a>
          .
        </p>
      </section>
    </PageShell>
  )
}
