import Link from 'next/link'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

export default function TradingBotProjectPage() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
          <header className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-amber-200 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              In Development
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Trading Research Engine
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              Designing a paper-trading research system that turns market-data hypotheses into tested strategies with monitoring, safety rails, and reviewable reporting.
            </p>
          </header>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Strategy Pipeline</h2>
            <p className="text-white/70 leading-relaxed text-base md:text-lg">
              The system ingests market data and research signals into a controlled pipeline. Strategy agents simulate ideas in a sandbox, stress-test risk scenarios, and require statistical gates before any live-capital claim would be appropriate.
            </p>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Stack &amp; Tooling</h2>
            <ul className="list-disc list-inside space-y-4 text-white/70 text-base md:text-lg">
              <li><span className="text-white/90 font-medium">FastAPI + event-driven workers</span> orchestrate research jobs, telemetry, and alerting.</li>
              <li><span className="text-white/90 font-medium">Research memory</span> helps compare hypotheses, prior tests, and market context.</li>
              <li><span className="text-white/90 font-medium">DuckDB + Arrow</span> accelerate backtesting while maintaining reproducibility.</li>
              <li><span className="text-white/90 font-medium">Next.js dashboard</span> shows paper-trading state, risk checks, and review controls.</li>
            </ul>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Risk &amp; Compliance</h2>
            <p className="text-white/70 leading-relaxed text-base md:text-lg">
              Automated guardrails enforce exposure limits, drawdown checks, and scenario-based halts in the research environment. Public summaries avoid real-money performance, account data, and live-capital claims.
            </p>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-amber-500/15 to-emerald-500/10 border-amber-400/30 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-2xl font-semibold text-white">Follow the build</h3>
            <p className="text-white/70">Preview the in-development research UI and give feedback.</p>
            <Link
              href="/apps/trading-bot"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-amber-300/60 hover:text-amber-100"
            >
            View App Preview →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}
