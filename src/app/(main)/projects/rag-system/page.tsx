import { CaseStudy, CaseStudyCta, CaseStudyHeader, CaseStudySection } from '@/components/projects/case-study'

export default function RagSystemProjectPage() {
  return (
    <CaseStudy>
      <CaseStudyHeader
        status="In progress"
        tone="warn"
        title="Self-improving RAG system"
        lede="An autonomous Retrieval-Augmented Generation platform that evaluates its own answers, identifies knowledge gaps, and expands the corpus without human hand-holding."
        facts={[
          ['Retrieval', 'ColBERT + dense embeddings'],
          ['Storage', 'PostgreSQL + pgvector'],
          ['Status', 'Live demo in development'],
        ]}
      />

      <div className="mt-2 md:mt-4">
        <CaseStudySection title="System overview" id="overview">
          <p>
            The system orchestrates a loop of question generation, answer evaluation, and document expansion. It detects
            low-confidence responses, spins up targeted web crawlers or API fetchers, and rewrites embeddings to close
            the knowledge gap. No manual curation required.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Technical highlights" id="highlights">
          <ul>
            <li>
              Hybrid retrieval with <strong>ColBERT + dense embeddings</strong> for precision and recall.
            </li>
            <li>
              <strong>Evaluation agents</strong> score answers with rubric-driven critique and hallucination detection.
            </li>
            <li>
              Automated corpus expansion via <strong>task-specific crawlers</strong> and PDF parsing flows.
            </li>
            <li>
              Feedback loop persisted in <strong>PostgreSQL + pgvector</strong> with lineage metadata for audits.
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Why it matters" id="why">
          <p>
            Traditional RAG systems decay quickly as source material evolves. By instrumenting evaluation and ingestion
            agents, this platform continuously improves coverage and answer quality, turning RAG from a static knowledge
            base into a living system.
          </p>
        </CaseStudySection>
      </div>

      <CaseStudyCta
        title="Live demo launching soon"
        body="Get notified when the autonomous RAG agents go live."
        href="/apps"
        label="Explore all apps"
      />
    </CaseStudy>
  )
}
