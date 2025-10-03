# 🤖 AI Platform Overview

> **Status:** Authoritative · **Scope:** Retrieval, Reasoning, Evaluation Stack · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild (Camilo Martinez) · **Reviewer:** AI Assistant

---

## TL;DR
- The AI platform pairs deterministic retrieval (pgvector) with controlled LLM reasoning to deliver trustworthy, explainable insights.
- Safety is enforced at every step: prompt hardening, validation, rate limiting, telemetry, and continuous evaluation.
- This overview maps every subsystem—RAG, embeddings, prompts, evaluation—to their canonical documents and operational playbooks.

---

## Table of Contents
- [🏗️ System Architecture](#️-system-architecture)
- [🔍 Retrieval Layer](#-retrieval-layer)
- [🧠 Reasoning Layer](#-reasoning-layer)
- [🛡️ Safety & Governance](#-safety--governance)
- [📈 Evaluation & Feedback](#-evaluation--feedback)
- [🧪 Tooling & Automation](#-tooling--automation)
- [🔗 References](#-references)

---

## 🏗️ System Architecture

```
User Question
    │
    ▼
Intent Classifier (optional roadmap)
    │
    ▼
Schema Retriever (pgvector) ──┐
                              │
                              ▼
Planning LLM (GPT-4o)
    │            ▲
    ▼            │
SQL Validator ───┘ (regex + AST + policy)
    │
    ▼
SQL Executor (read-only role)
    │
    ▼
Answer Synthesizer (LLM) → Response + SQL + citations + metrics
    │
    ▼
Telemetry (query_history, evaluation_cycles)
```

- Primary service: `AIQueryService` (`backend/app/services/ai/query_service.py`).
- Embedding substrate: `schema_embeddings` + `document_embeddings` tables.
- Evaluation harness: `TrainerAgentService` and `docs/ai/EVALUATION.md`.

---

## 🔍 Retrieval Layer

- **Vector Store**: PostgreSQL + pgvector (HNSW index).
- **Documents**: Schema descriptions, table metadata, KPI definitions, domain glossaries.
- **Manifest**: `docs/ai/EMBEDDINGS.md` defines sources, chunking rules, and refresh cadence.
- **Retriever**: Cosine similarity, dynamic relevance threshold, fallback to keyword search.
- **Hybrid Retrieval (Roadmap)**: Combine vector search with symbol tables for deterministic filters.

---

## 🧠 Reasoning Layer

- **Planner Model**: GPT-4o (primary), GPT-4o-mini fallback; streaming disabled for determinism.
- **Prompt Architecture**: See `docs/ai/PROMPTS.md`; includes system prompt, planner template, reviewer template.
- **Reviewer Loop**: Second LLM validates SQL plan, checks constraints, ensures referential integrity.
- **Execution Sandbox**: Parameterized queries executed with read-only db role, 8-second timeout, 1000-row cap.
- **Narrative Synthesis**: LLM responds with natural language answer, bullet summary, SQL snippet, metadata (confidence, runtime).

---

## 🛡️ Safety & Governance

| Risk | Mitigation |
|------|------------|
| Prompt injection | Strict system prompt, schema whitelisting, sanitized user input |
| SQL injection | Parameterized queries + regex/AST guard for DDL/DML |
| Data exfiltration | Row limits, column allowlist, audit logging |
| Model drift | Embedding drift detection, evaluation cycles, manual review |
| Cost overrun | Rate limiter + budget monitor (`ai_usage` table) |

Governance tasks documented in `docs/ai/EVALUATION.md` (review cadence) and `docs/operations/RUNBOOKS.md` (incident response).

---

## 📈 Evaluation & Feedback

- **Trainer Agent**: Synthetic question generation, execution, judgement (pass/fail), recommendation.
- **Human Feedback**: `/api/v1/ai/feedback` endpoint; stored for prioritization.
- **Metrics**: Precision, recall, answer quality, latency, token usage.
- Detailed process → `docs/ai/EVALUATION.md`.

---

## 🧪 Tooling & Automation

| Task | Command | Notes |
|------|---------|-------|
| Refresh embeddings | `pnpm exec ts-node scripts/ai/refreshEmbeddings.ts` | Manifest-driven |
| Run trainer cycle | `poetry run python app/jobs/run_trainer_cycle.py --limit 50` | Weekly |
| Prompt lint | `pnpm exec ts-node scripts/ai/promptLint.ts` | Validates prompt metadata |
| SQL guard tests | `pnpm exec ts-node scripts/ai/validateSqlGuards.ts` | Prevents regressions |

---

## 🔗 References
- `docs/ai/RAG_SYSTEM.md` – End-to-end pipeline deep dive.
- `docs/ai/EMBEDDINGS.md` – Vector strategy & manifests.
- `docs/ai/PROMPTS.md` – Prompt catalog with evaluation metadata.
- `docs/ai/TRAINING.md` – Synthetic data generation, fine-tuning roadmaps.
- `docs/ai/EVALUATION.md` – Quality loops and telemetry interpretation.
- `docs/backend/SERVICES.md` – Backend orchestration.

---

*Last Updated: October 2, 2025*
