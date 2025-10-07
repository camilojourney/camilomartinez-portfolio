# 📚 Documentation Hub

> **Status:** Active · **Version:** 1.0  
> **Last Updated:** October 2, 2025  
> **Maintainers:** Camilo Martinez (@camilojourney), AI Assistant (Codex)

---

## TL;DR
- This hub is the authoritative map of every knowledge artifact in the portfolio, optimized for both human experts and AI copilots.
- Navigate by role, domain, or task; every entry links to a deep-dive document with progressive disclosure down to implementation specifics.
- Trust the source-of-truth pointers and governance workflows here to keep the entire system fresh, consistent, and production-ready.

---

## Table of Contents
- [🎯 Information Architecture](#-information-architecture)
- [🧭 Role-Based Entry Points](#-role-based-entry-points)
- [🤖 AI-Augmented Navigation](#-ai-augmented-navigation)
- [🛠 Maintainer Workflow](#-maintainer-workflow)
- [📊 Quality Metrics & SLAs](#-quality-metrics--slas)
- [🔗 References & Crosslinks](#-references--crosslinks)
- [📅 Change Log](#-change-log)

---

## 🎯 Information Architecture

### Multi-Layer Model
| Layer | Purpose | Source of Truth |
|-------|---------|----------------|
| **Orientation** | Rapid onboarding, vision, principles | `docs/README.md`, `docs/GETTING_STARTED.md` |
| **System Overview** | Architecture, stack, domain boundaries | `docs/ARCHITECTURE.md`, `docs/TECH_STACK.md` |
| **Domain Deep-Dives** | Frontend, backend, AI, data, operations, integrations | `docs/<domain>/*.md` |
| **Execution Aids** | Runbooks, checklists, SOPs | `docs/operations/*.md`, `docs/operations/scripts/README.md` |
| **Knowledge Base** | Personal context, history, glossary, references | `docs/knowledge/*.md` |

### Canonical Directory Map
```
docs/
├── README.md                # Master navigation (this file)
├── GETTING_STARTED.md       # Zero-to-productive in 30 minutes
├── ARCHITECTURE.md          # System-level blueprint
├── TECH_STACK.md            # Technology decisions & trade-offs
├── overview/                # Portfolio narrative and storytelling assets
├── updates/                 # Change logs and implementation summaries
├── frontend/                # Next.js delivery layer
├── backend/                 # FastAPI services & orchestration
├── ai/                      # RAG, embeddings, evaluation systems
├── data/                    # Schema, ETL, analytics, data quality
├── projects/                # Quarto projects and portfolio artefacts
├── integrations/            # WHOOP, Strava, OpenAI, future partners
├── operations/              # DevOps, monitoring, incident response
└── knowledge/               # Human context, glossary, references
```

---

## 🧭 Role-Based Entry Points

> **Tip:** Each entry is paired with a "90-minute mastery" path—read in order and execute the checklists.

### 🧑‍💻 Full-Stack Engineer
1. `docs/GETTING_STARTED.md`
2. `docs/ARCHITECTURE.md`
3. `docs/frontend/README.md`
4. `docs/backend/README.md`
5. `docs/frontend/API_INTEGRATION.md` ↔ `docs/backend/DEVELOPER_GUIDE.md`

### 🤖 AI / ML Engineer
1. `docs/ai/README.md`
2. `docs/ai/RAG_SYSTEM.md`
3. `docs/ai/EMBEDDINGS.md`
4. `docs/ai/TRAINING.md`
5. `docs/ai/EVALUATION.md`
6. `docs/knowledge/CAMILO_PROFILE.md`

### 📊 Data Engineer / Analyst
1. `docs/data/README.md`
2. `docs/data/SCHEMA.md`
3. `docs/data/ETL_PROCESSES.md`
4. `docs/data/ANALYTICS.md`
5. `docs/data/DATA_QUALITY.md`

### 🛠️ Operations / DevOps
1. `docs/operations/README.md`
2. `docs/operations/MONITORING.md`
3. `docs/operations/CRON_JOBS.md`
4. `docs/operations/TROUBLESHOOTING.md`
5. `docs/operations/RUNBOOKS.md`
6. `docs/operations/scripts/README.md`

### 🔌 Integrations Specialist
1. `docs/integrations/README.md`
2. `docs/integrations/WHOOP.md`
3. `docs/integrations/STRAVA.md`
4. `docs/integrations/OPENAI.md`

### 🎯 Stakeholders & Leadership
- `docs/ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- `docs/knowledge/PROJECT_HISTORY.md`
- `docs/knowledge/REFERENCES.md`

---

## 🤖 AI-Augmented Navigation

### Embedding-Aware Structure
- **Schema Embeddings:** `docs/ai/EMBEDDINGS.md` defines the embedding taxonomy and ingestion rules for `schema_embedding_service.py`.
- **Profile Context:** `docs/knowledge/CAMILO_PROFILE.md` is the canonical persona source for AI assistants.
- **Prompt Library:** `docs/ai/PROMPTS.md` provides reusable prompt circuits with guardrails and evaluation metadata.

### Retrieval Strategies
1. **Vector Search** (`/backend/app/services/ai/schema_embedding_service.py`)
   - Index `docs/ai/*.md`, `docs/data/SCHEMA.md`, `docs/knowledge/*.md`.
   - Refresh embeddings weekly or on schema change (see `docs/ai/EMBEDDINGS.md` schedule).
2. **Hybrid Search**
   - Combine vector retrieval with keyword filtering for sensitive operations.
3. **Human-in-the-Loop**
   - Complex architectural decisions require manual review using `docs/ARCHITECTURE.md` decision logs.

### Format Guarantees
- Frontmatter metadata follows `[Key]: [Value]` convention for deterministic parsing.
- Section headers use emojis only at level-2 to retain token consistency.
- Tables include header alignment markers for Markdown-to-HTML converters.

---

## 🛠 Maintainer Workflow

### Change Management
1. **Proposal**: Capture changes in `PROJECT_ARCHITECTURE_PLAN.md` or issue tracker.
2. **Draft**: Update relevant docs; include TL;DR + change summary block.
3. **Review**: Request technical review from domain owner + AI assistant validation.
4. **Merge**: Squash commits with `docs:` prefix; update `📅 Change Log` below.
5. **Embed**: Trigger embedding refresh script (`scripts/refresh_embeddings.sh`).

### Quality Gates
- **Freshness**: Touch high-signal docs (architecture, AI, data) every 30 days.
- **Traceability**: Link every doc change to code (`git commit --signoff`, references in doc footer).
- **Observability**: Run `scripts/validate_docs.ts` to lint links, anchors, and metadata.

### Templates & Style
- Use the template snippets in `docs/knowledge/GLOSSARY.md` for consistent metadata.
- Prefer diagrams-as-code (Mermaid) for architecture visuals.
- Provide runnable code blocks (`python`, `bash`, `sql`) with inline comments where ambiguity exists.

---

## 📊 Quality Metrics & SLAs

| Metric | Target | Owner | Tooling |
|--------|--------|-------|---------|
| **Freshness Index** | ≥ 0.9 | Domain Docs Lead | `scripts/docs_freshness.py` |
| **Broken Links** | 0 | Documentation Ops | `scripts/validate_docs.ts` |
| **Embedding Drift** | < 5% per month | AI Platform Lead | `notebooks/embedding-drift.ipynb` |
| **Incident Runbook Coverage** | 100% Sev1/Sev2 | Operations Lead | `docs/operations/RUNBOOKS.md` |
| **Glossary Completeness** | 100% of new terms within 48h | Knowledge Steward | `docs/knowledge/GLOSSARY.md` |

---

## 🔗 References & Crosslinks
- `PROJECT_ARCHITECTURE_PLAN.md` – Roadmap for upcoming structural changes.
- `DOCUMENTATION_ARCHITECTURE.md` – Rationale for the documentation system design.
- `docs/operations/scripts/README.md` – Automation catalog, including documentation tooling.
- `backend/README.md` → `../docs/backend` – Pointer README keeps IDE navigation nearby.
- `src/docs` → `../docs/frontend` – Symlink for frontend developers.

---

## 📅 Change Log
- **2025-10-02** · Architecture upgraded to multi-layer doc stack; added AI-first navigation guidance.

---

*Last Updated: October 2, 2025*
