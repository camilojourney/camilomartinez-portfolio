import Link from 'next/link'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

export default function RagSystemProjectPage() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-4 py-2 text-cyan-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
            In Progress
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Self-Improving RAG System
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            An autonomous Retrieval-Augmented Generation platform that evaluates its own answers, identifies knowledge gaps, and expands the corpus without human hand-holding.
          </p>
        </header>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">System Overview</h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              The system orchestrates a loop of question generation, answer evaluation, and document expansion. It detects low-confidence responses, spins up targeted web crawlers or API fetchers, and rewrites embeddings to close the knowledge gap—no manual curation required.
            </p>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Technical Highlights</h2>
            <ul className="list-disc list-inside space-y-4 text-muted-foreground text-base md:text-lg">
              <li>Hybrid retrieval with <span className="text-foreground font-medium">ColBERT + dense embeddings</span> for precision and recall.</li>
              <li><span className="text-foreground font-medium">Evaluation agents</span> score answers with rubric-driven critique and hallucination detection.</li>
              <li>Automated corpus expansion via <span className="text-foreground font-medium">task-specific crawlers</span> and PDF parsing flows.</li>
              <li>Feedback loop persisted in <span className="text-foreground font-medium">PostgreSQL + pgvector</span> with lineage metadata for audits.</li>
            </ul>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Why it Matters</h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              Traditional RAG systems decay quickly as source material evolves. By instrumenting evaluation and ingestion agents, this platform continuously improves coverage and answer quality—turning RAG from a static knowledge base into a living system.
            </p>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border-cyan-400/30 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">Live demo launching soon</h3>
            <p className="text-muted-foreground">Get notified when the autonomous RAG agents go live.</p>
            <Link
              href="/apps"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-foreground font-medium transition-all duration-300 hover:scale-105 hover:border-cyan-300/60 hover:text-cyan-100"
            >
            Explore All Apps →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}