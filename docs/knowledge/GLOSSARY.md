# 📚 Glossary & Terminology

> **Status:** Living Document · **Last Updated:** October 2, 2025  
> **Owner:** Knowledge Steward · **Reviewer:** AI Assistant

---

## TL;DR
- Defines key terms, acronyms, and concepts used across the portfolio to ensure consistent communication between humans and AI systems.
- Add new entries whenever introducing new terminology in code, docs, or UI.

---

## Table of Contents
- [AI & Data](#ai--data)
- [Fitness & Health](#fitness--health)
- [Product & Operations](#product--operations)
- [Templates](#templates)

---

## AI & Data

| Term | Definition | Linked Docs |
|------|------------|-------------|
| **RAG** | Retrieval-Augmented Generation: AI pattern combining vector retrieval with LLM reasoning. | `docs/ai/RAG_SYSTEM.md` |
| **Embedding Drift** | Change in embedding vectors over time affecting similarity performance. | `docs/ai/EMBEDDINGS.md`, `docs/ai/EVALUATION.md` |
| **Trainer Agent** | Automated system generating, executing, and evaluating AI queries for quality assurance. | `docs/ai/EVALUATION.md` |
| **Hybrid Retrieval** | Combining vector similarity search with symbolic/keyword filtering. | `docs/ai/RAG_SYSTEM.md` |
| **AI Reader Role** | PostgreSQL role limited to AI-serving views ensuring read-only access. | `docs/data/SCHEMA.md` |

---

## Fitness & Health

| Term | Definition | Linked Docs |
|------|------------|-------------|
| **Recovery Score** | WHOOP readiness metric (0-100) indicating physiological recovery. | `docs/data/ANALYTICS.md` |
| **Strain Score** | WHOOP training load metric (0-21) measuring cardiovascular load. | `docs/data/ANALYTICS.md` |
| **Sleep Efficiency** | Percentage of time asleep vs time in bed. | `docs/data/ANALYTICS.md` |
| **Training Load Ratio (TLR)** | Acute vs chronic training load comparison. | `docs/data/ANALYTICS.md` |
| **HRV RMSSD** | Heart Rate Variability measured via root mean square of successive differences. | `docs/data/ANALYTICS.md` |

---

## Product & Operations

| Term | Definition | Linked Docs |
|------|------------|-------------|
| **Sev1/Sev2/Sev3** | Incident severity levels (critical to minor). | `docs/operations/RUNBOOKS.md` |
| **Golden Path** | Recommended workflow producing quickest successful outcome. | `docs/GETTING_STARTED.md` |
| **Feature Flag** | Toggle enabling/disabling functionality; stored in DB `feature_flags`. | `docs/backend/SERVICES.md` |
| **ISR** | Incremental Static Regeneration (Next.js) for caching pages. | `docs/frontend/README.md` |
| **Embeddings Manifest** | YAML config describing embedding sources and parameters. | `docs/ai/EMBEDDINGS.md` |

---

## Templates

Add new term using this template:
```
| **<Term>** | <Definition> | `<link>` |
```

---

*Last Updated: October 2, 2025*
