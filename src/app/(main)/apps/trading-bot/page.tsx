import Link from 'next/link'
import PageShell from '@/components/shared/page-shell'

export default function TradingBotAppPage() {
  return (
    <PageShell currentPage="apps" maxWidth="narrow">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <span className="status status-warn">In development</span>
        <h1 className="display mt-3">Trading Bot</h1>
        <p className="lede mt-6">
          A systematic trading platform that connects real-time market data with agentic strategy orchestration,
          execution monitoring, and risk controls.
        </p>
        <Link href="/projects/trading-bot" className="link mt-6 inline-block">
          Read how I built this
        </Link>
      </header>

      <section className="py-10 md:py-14" aria-labelledby="coming-heading">
        <h2 id="coming-heading" className="title-md">
          What&apos;s coming
        </h2>
        <ul className="row-list mt-4">
          <li className="body-muted py-3">Multi-exchange execution with latency-aware order routing.</li>
          <li className="body-muted py-3">LLM-assisted strategy design with historical simulation harness.</li>
          <li className="body-muted py-3">FastAPI + Redis control plane coordinating agent workflows.</li>
          <li className="body-muted py-3">Interactive monitoring dashboard built with Next.js and websockets.</li>
        </ul>
        <p className="caption mt-6">
          Want early access or to collaborate? Reach out via{' '}
          <a href="mailto:hello@camilomartinez.co" className="link">
            hello@camilomartinez.co
          </a>
          .
        </p>
      </section>
    </PageShell>
  )
}
