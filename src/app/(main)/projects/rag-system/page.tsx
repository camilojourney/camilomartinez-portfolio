import Link from 'next/link'
import LiquidPage from '@/components/shared/liquid-page'

export default function RagSystemProjectPage() {
  return (
    <LiquidPage currentPage="projects" backgroundVariant="cool" className="pt-32 md:pt-40">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 py-12 space-y-12">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-4 py-2 text-cyan-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
            In Progress
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Self-Improving RAG System
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            An autonomous Retrieval-Augmented Generation platform that evaluates its own answers, identifies knowledge gaps, and expands the corpus without human hand-holding.
          </p>
        </header>

        <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.05] border border-white/[0.08] rounded-3xl p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">System Overview</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg">
            The system orchestrates a loop of question generation, answer evaluation, and document expansion. It detects low-confidence responses, spins up targeted web crawlers or API fetchers, and rewrites embeddings to close the knowledge gap—no manual curation required.
          </p>
        </section>

        <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Highlights</h2>
          <ul className="list-disc list-inside space-y-4 text-white/70 text-base md:text-lg">
            <li>Hybrid retrieval with <span className="text-white/90 font-medium">ColBERT + dense embeddings</span> for precision and recall.</li>
            <li><span className="text-white/90 font-medium">Evaluation agents</span> score answers with rubric-driven critique and hallucination detection.</li>
            <li>Automated corpus expansion via <span className="text-white/90 font-medium">task-specific crawlers</span> and PDF parsing flows.</li>
            <li>Feedback loop persisted in <span className="text-white/90 font-medium">PostgreSQL + pgvector</span> with lineage metadata for audits.</li>
          </ul>
        </section>

        <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Why it Matters</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg">
            Traditional RAG systems decay quickly as source material evolves. By instrumenting evaluation and ingestion agents, this platform continuously improves coverage and answer quality—turning RAG from a static knowledge base into a living system.
          </p>
        </section>

        <div className="liquid-glass-card backdrop-blur-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-400/30 rounded-3xl p-8 md:p-10 text-center space-y-4">
          <h3 className="text-2xl font-semibold text-white">Live demo launching soon</h3>
          <p className="text-white/70">Get notified when the autonomous RAG agents go live.</p>
          <Link
            href="/apps"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-cyan-300/60 hover:text-cyan-100"
          >
            Explore Live Apps →
          </Link>
        </div>
      </div>
    </LiquidPage>
  )
}
