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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Algorithmic Trading Bot
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Designing an agentic trading platform that translates research hypotheses into executable strategies with live monitoring, safety rails, and automated reporting.
            </p>
          </header>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Strategy Pipeline</h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              The system ingests market data, fundamentals, and alt-data streams into an event bus. Strategy agents simulate ideas in a sandbox, stress-test risk scenarios, then promote approved strategies into production with circuit breakers attached.
            </p>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Stack &amp; Tooling</h2>
            <ul className="list-disc list-inside space-y-4 text-muted-foreground text-base md:text-lg">
              <li><span className="text-foreground font-medium">FastAPI + Redis Streams</span> orchestrate order flow, telemetry, and alerting.</li>
              <li><span className="text-foreground font-medium">Vectorized agent memory</span> helps LLM strategists recall prior trades and macro context.</li>
              <li><span className="text-foreground font-medium">DuckDB + Arrow</span> accelerate backtesting while maintaining reproducibility.</li>
              <li><span className="text-foreground font-medium">Next.js dashboard</span> delivers live P&amp;L, position monitoring, and manual intervention controls.</li>
            </ul>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Risk &amp; Compliance</h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              Automated guardrails enforce exposure limits per asset class, max drawdowns, and scenario-based halts. Every agent action is logged with lineage metadata for auditability.
            </p>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-amber-500/15 to-emerald-500/10 border-amber-400/30 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">Follow the build</h3>
            <p className="text-muted-foreground">The live trading interface is shipping soon. Preview the in-development UI and give feedback.</p>
            <Link
              href="/apps/trading-bot"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-foreground font-medium transition-all duration-300 hover:scale-105 hover:border-amber-300/60 hover:text-amber-100"
            >
            View App Preview →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}