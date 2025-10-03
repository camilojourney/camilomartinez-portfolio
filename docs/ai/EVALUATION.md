# 📊 AI Evaluation & Quality Assurance

> **Status:** Authoritative · **Scope:** Automated Evaluation, Feedback, Metrics · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Evaluation combines synthetic testing, human feedback, and continuous monitoring to guarantee accuracy and trust.
- The trainer agent automates question generation, execution, judgement, and recommendation loops.
- Use this playbook to interpret metrics, triage failures, and prioritize AI improvements.

---

## Table of Contents
- [🧪 Evaluation Cycle](#-evaluation-cycle)
- [📈 Metrics & Dashboards](#-metrics--dashboards)
- [📝 Feedback Loop](#-feedback-loop)
- [🚨 Incident Response](#-incident-response)
- [🛠️ Tooling](#-tooling)
- [🔗 References](#-references)

---

## 🧪 Evaluation Cycle

```
Seed Questions
  │
  ▼
Generation (Trainer Agent)
  │
  ▼
Execute via RAG Pipeline
  │
  ▼
Judge Results (LLM evaluator + heuristics)
  │
  ▼
Analyze Patterns (Consultant LLM + human review)
  │
  ▼
Recommendations (prompt tweaks, schema updates, training data)
```

### Step-by-Step
1. **Generation** – `TrainerAgentService.generate_questions(limit=50)` produces diverse prompts.
2. **Execution** – Each question runs through production pipeline (read-only staging database recommended).
3. **Judgement** – Evaluator LLM compares generated answer to ground truth (SQL results) using rubric.
4. **Consulting** – Third LLM aggregates failures → actionable insights.
5. **Recording** – Persist results in `evaluation_cycles`, `evaluation_examples` tables.

```sql
CREATE TABLE evaluation_cycles (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_questions INT,
  success_count INT,
  success_rate NUMERIC,
  notes TEXT,
  recommendations JSONB
);
```

---

## 📈 Metrics & Dashboards

| Metric | Definition | Target | Source |
|--------|------------|--------|--------|
| **Success Rate** | % of correct answers in evaluation cycle | ≥ 92% | `evaluation_cycles.success_rate` |
| **Precision@TopK** | Correct SQL for top-k retrieval contexts | ≥ 0.9 | Synthetic benchmark |
| **Latency p95** | 95th percentile query duration | ≤ 2.0 s | Prometheus `ai_query_latency_seconds` |
| **Token Usage** | Avg total tokens per query | ≤ 1200 | `ai_usage` table |
| **Regression Count** | Number of new failures vs previous cycle | 0 | Cycle diff |

Dashboards: Grafana `AI Quality` board (see `docs/operations/MONITORING.md`).

---

## 📝 Feedback Loop

### User Feedback
- Endpoint: `POST /api/v1/ai/feedback` capturing `rating`, `comment`, `context`.
- Stored in `ai_feedback` table; linked to `query_history` for traceability.
- Weekly triage meeting reviews low ratings; actions logged in `docs/knowledge/PROJECT_HISTORY.md`.

### Prioritization Matrix
| Impact | Effort | Action |
|--------|--------|--------|
| High / Low | Immediate fix | Prompt tweak or schema doc update |
| High / High | Roadmap item | Add to `PROJECT_ARCHITECTURE_PLAN.md` |
| Low / Low | Backlog | Monitor for trend |

---

## 🚨 Incident Response

1. **Detection**: Alert triggers (success rate < threshold, high error rate, negative feedback spike).
2. **Stabilize**: Disable problematic feature flag or revert to previous prompt version.
3. **Investigate**: Review evaluation logs, telemetry, correlation IDs.
4. **Mitigate**: Adjust prompts, fix schema docs, regenerate embeddings.
5. **Postmortem**: Document in `docs/knowledge/PROJECT_HISTORY.md` using template (summary, cause, action items).

Severity levels defined in `docs/operations/RUNBOOKS.md` (AI incident playbook).

---

## 🛠️ Tooling

| Tool | Command | Purpose |
|------|---------|---------|
| Trainer cycle | `poetry run python app/jobs/run_trainer_cycle.py --limit 50` | Run evaluation batch |
| Review cycle | `poetry run python app/jobs/review_trainer_cycle.py --cycle-id <id>` | Summarize results |
| Drift detector | `pnpm exec ts-node scripts/ai/checkEmbeddingDrift.ts` | Monitor vector drift |
| Prompt diff | `pnpm exec ts-node scripts/ai/promptDiff.ts` | Compare prompt versions |

Store evaluation artifacts (JSON, charts) in `evaluations/<cycle-id>/` for auditability.

---

## 🔗 References
- `docs/ai/TRAINING.md` – Synthetic dataset creation feeding evaluation.
- `docs/ai/PROMPTS.md` – Prompt templates referenced in recommendations.
- `docs/data/SCHEMA.md` – Valid tables/views for SQL generation.
- `docs/operations/RUNBOOKS.md` – Incident management procedures.

---

*Last Updated: October 2, 2025*
