'use client'

import LiquidNav from '@/components/shared/liquid-nav'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function TradingBotAppPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="apps" />

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-950"></div>
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-32 md:pt-40 pb-20 px-4 md:px-6 space-y-10">
        <header className="text-center space-y-6">
          <Link
            href="/projects/trading-bot"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/70 transition-colors duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-200"
          >
            <span>Read how I built this</span>
            <span aria-hidden className="text-lg">→</span>
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Trading Bot
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            A systematic trading platform that connects real-time market data with agentic strategy orchestration, execution monitoring, and risk controls.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-1 text-amber-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            In Development
          </div>
        </header>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 space-y-6">
          <h2 className="text-white text-2xl font-semibold">What&apos;s Coming</h2>
          <ul className="list-disc list-inside space-y-3 text-white/70 text-sm leading-relaxed">
            <li>Multi-exchange execution with latency-aware order routing.</li>
            <li>LLM-assisted strategy design with historical simulation harness.</li>
            <li>FastAPI + Redis control plane coordinating agent workflows.</li>
            <li>Interactive monitoring dashboard built with Next.js and websockets.</li>
          </ul>
          <p className="text-white/60 text-sm">
            Want early access or to collaborate? Reach out via{' '}
            <a href="mailto:hello@camilomartinez.co" className="text-emerald-300 hover:text-emerald-200 underline underline-offset-4 transition-colors">
              hello@camilomartinez.co
            </a>.
          </p>
        </Card>
      </div>
    </div>
  )
}
