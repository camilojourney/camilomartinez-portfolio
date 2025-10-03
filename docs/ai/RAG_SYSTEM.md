# 🧠 RAG System: Text-to-SQL Intelligence

> **Status:** Authoritative · **Scope:** Retrieval-Augmented Generation Pipeline · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** AI Assistant

---

## TL;DR
- The RAG system converts natural language questions into verified SQL across curated fitness datasets with deterministic safeguards.
- Pipeline phases: intent normalization → context retrieval → planning → validation → execution → narrative synthesis → telemetry.
- Follow this document to understand each component, failure mode, and optimization lever.

---

## Table of Contents
- [🚦 Pipeline Overview](#-pipeline-overview)
- [🧾 Inputs & Context Assembly](#-inputs--context-assembly)
- [🧮 Planning & Validation](#-planning--validation)
- [🗄️ Execution & Post-Processing](#️-execution--post-processing)
- [⚠️ Failure Modes & Mitigations](#️-failure-modes--mitigations)
- [📈 KPIs & Monitoring](#-kpis--monitoring)
- [🛠️ Extensibility](#️-extensibility)
- [🔗 References](#-references)

---

## 🚦 Pipeline Overview

```
Question
  │
  ▼
Normalize → Detect domain / metrics
  │
  ▼
Retrieve schema context (pgvector)
  │
  ▼
Plan SQL (LLM) + natural language rationale
  │
  ▼
Validate (policy + AST + reviewer LLM)
  │
  ▼
Execute read-only SQL (pg)
  │
  ▼
Synthesize answer + include SQL + sources + metrics
  │
  ▼
Log telemetry + feedback hooks
```

---

## 🧾 Inputs & Context Assembly

- **User Input**: Plain text question, optional filters (`timeRange`, `activityType`).
- **Intent Normalization**: Upcoming classification layer to detect question archetypes (trend, comparison, anomaly).
- **Schema Retrieval**:
  - Embed question with `text-embedding-3-small`.
  - Query `schema_embeddings` (HNSW) with dynamic similarity threshold (default 0.72).
  - Return top N (3-5) schema fragments (view + column descriptions) for prompt context.
- **Supplemental Context**:
  - KPI definitions from `docs/data/ANALYTICS.md`.
  - Glossary definitions for terminology alignment.

---

## 🧮 Planning & Validation

### Planner Prompt (excerpt)
```text
You are an expert fitness data analyst. Given schema context and question, plan the SQL query.
1. Restate the question.
2. Outline reasoning steps.
3. Produce SQL using available views only.
4. Include metrics definitions if needed.
```

### Validation Layers
1. **Static Guards** – Regex filter blocking DDL/DML keywords, semicolons, comment injections.
2. **AST Parser** – Parse SQL using `sqlglot`; ensure only allowed tables/columns.
3. **Reviewer Model** – Secondary LLM critiques plan vs question; returns approval or corrections.
4. **Policy Checks** – Row limit, column whitelist, banned functions (e.g., `pg_sleep`).

If validation fails at any stage, the pipeline either auto-corrects (reviewer provides patch) or responds with safe fallback message.

---

## 🗄️ Execution & Post-Processing

- **Execution Role**: `ai_reader` (read-only, limited schema access).
- **Timeout**: 8 seconds; queries terminated beyond limit.
- **Row Limit**: 1000 rows; aggregator enforced to prevent large result sets.
- **Post-Processing**:
  - Convert numeric values to analytics-friendly format (e.g., pace mm:ss).
  - Compute derived metrics if requested (e.g., deltas, moving averages).
  - Compose narrative answer with sections: Summary, Key Metrics, SQL Snippet, Next Steps (if relevant).
- **Explainability**: Response includes `sql`, `sources`, `confidence`, `executionTimeMs`, `tokens`.

---

## ⚠️ Failure Modes & Mitigations

| Failure | Detection | Response |
|---------|-----------|----------|
| Low similarity context | Retriever returns < threshold | Ask user for clarification or broaden search via fallback keywords |
| SQL validation failure | Regex/AST catch | Auto-correct via reviewer; if persistent, return safe error |
| Empty result set | Query returns 0 rows | Communicate absence + suggest alternative timeframe |
| High latency | Execution >8s | Cancel query, advise user to narrow scope |
| Model outage | OpenAI error | Failover to backup model or degrade gracefully |

Incidents logged in `docs/operations/RUNBOOKS.md` with remediation steps.

---

## 📈 KPIs & Monitoring

| Metric | Target | Source |
|--------|--------|--------|
| Precision | ≥ 0.92 | Trainer agent evaluations |
| Recall | ≥ 0.9 | Benchmark set |
| Answer latency p95 | ≤ 2 s | Prometheus metric `ai_query_latency_seconds` |
| Token spend per query | ≤ 1200 tokens | `ai_usage` table |
| Fallback rate | < 5% | Query history flag |

Dashboards documented in `docs/operations/MONITORING.md`.

---

## 🛠️ Extensibility

- **New Data Domains**: Add materialized view + schema documentation → regen embeddings → update prompt context.
- **Advanced Reasoning**: Introduce planner agents (chain of thought, tool use) with guardrails.
- **Fine-Tuning**: Use dataset from `docs/ai/TRAINING.md` to train specialized SQL generator.
- **Multi-Modal (Roadmap)**: Extend to incorporate sensor data (HRV trends) + textual insights.

---

## 🔗 References
- `docs/ai/EMBEDDINGS.md` – Schema embeddings manifest.
- `docs/ai/PROMPTS.md` – Prompt templates and evaluation metadata.
- `docs/backend/SERVICES.md` – Implementation details of `AIQueryService`.
- `docs/data/SCHEMA.md` – Materialized view definitions.
- `docs/data/ANALYTICS.md` – KPI formulas used in answers.

---

*Last Updated: October 2, 2025*
