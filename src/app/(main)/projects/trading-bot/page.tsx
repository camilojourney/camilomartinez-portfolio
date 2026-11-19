import { CaseStudy, CaseStudyCta, CaseStudyHeader, CaseStudySection } from '@/components/projects/case-study'

export default function TradingBotProjectPage() {
  return (
    <CaseStudy>
      <CaseStudyHeader
        status="In development"
        tone="warn"
        title="Algorithmic trading bot"
        lede="Designing an agentic trading platform that translates research hypotheses into executable strategies with live monitoring, safety rails, and automated reporting."
        facts={[
          ['Orchestration', 'FastAPI + Redis Streams'],
          ['Backtesting', 'DuckDB + Arrow'],
          ['Status', 'Interface shipping soon'],
        ]}
      />

      <div className="mt-2 md:mt-4">
        <CaseStudySection title="Strategy pipeline" id="pipeline">
          <p>
            The system ingests market data, fundamentals, and alt-data streams into an event bus. Strategy agents
            simulate ideas in a sandbox, stress-test risk scenarios, then promote approved strategies into production
            with circuit breakers attached.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Stack and tooling" id="stack">
          <ul>
            <li>
              <strong>FastAPI + Redis Streams</strong> orchestrate order flow, telemetry, and alerting.
            </li>
            <li>
              <strong>Vectorized agent memory</strong> helps LLM strategists recall prior trades and macro context.
            </li>
            <li>
              <strong>DuckDB + Arrow</strong> accelerate backtesting while maintaining reproducibility.
            </li>
            <li>
              <strong>Next.js dashboard</strong> delivers live P&amp;L, position monitoring, and manual intervention
              controls.
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Risk and compliance" id="risk">
          <p>
            Automated guardrails enforce exposure limits per asset class, max drawdowns, and scenario-based halts. Every
            agent action is logged with lineage metadata for auditability.
          </p>
        </CaseStudySection>
      </div>

      <CaseStudyCta
        title="Follow the build"
        body="The live trading interface is shipping soon. Preview the in-development UI and give feedback."
        href="/apps/trading-bot"
        label="View app preview"
      />
    </CaseStudy>
  )
}
