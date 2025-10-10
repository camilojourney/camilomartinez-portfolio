'use client'

import LiquidNav from '@/components/shared/liquid-nav'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function ThinkClearAppPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="apps" />

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-950"></div>
        <div className="absolute top-1/4 left-1/5 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-32 md:pt-40 pb-20 px-4 md:px-6 space-y-10">
        <header className="text-center space-y-6">
          <Link
            href="/projects/think-clear"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/70 transition-colors duration-300 hover:border-purple-400/40 hover:bg-purple-500/20 hover:text-purple-200"
          >
            <span>Read how I built this</span>
            <span aria-hidden className="text-lg">→</span>
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Think Clear
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            A cognitive bias detector that surfaces hidden framing, emotional triggers, and blind spots in your writing so you can reason through decisions with clarity.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-1 text-amber-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            In Development
          </div>
        </header>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 space-y-6">
          <h2 className="text-white text-2xl font-semibold">Planned Features</h2>
          <ul className="list-disc list-inside space-y-3 text-white/70 text-sm leading-relaxed">
            <li>Bias taxonomy grounded in cognitive science literature.</li>
            <li>Multi-agent critique pipeline with targeted interventions.</li>
            <li>Guided reframing recommendations and reflection prompts.</li>
            <li>Team workspace for collaborative decision memos.</li>
          </ul>
          <p className="text-white/60 text-sm">
            If you&apos;d like to beta test, send a note to{' '}
            <a href="mailto:hello@camilomartinez.co" className="text-purple-300 hover:text-purple-200 underline underline-offset-4 transition-colors">
              hello@camilomartinez.co
            </a>.
          </p>
        </Card>
      </div>
    </div>
  )
}
