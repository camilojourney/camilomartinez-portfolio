# 🗣️ Prompt Library & Governance

> **Status:** Authoritative · **Scope:** Prompt Templates, Guardrails, Versioning · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Prompts live in Markdown with YAML frontmatter capturing metadata, evaluation status, and rollout history.
- Each prompt is versioned, tested, and linked to evaluation cycles to ensure safe, consistent AI behavior.
- Use this library to maintain prompts, create new variants, and document governance decisions.

---

## Table of Contents
- [📁 Prompt Taxonomy](#-prompt-taxonomy)
- [🧱 Template Structure](#-template-structure)
- [🧪 Evaluation Metadata](#-evaluation-metadata)
- [🔐 Guardrails & Policies](#-guardrails--policies)
- [🛠️ Editing Workflow](#️-editing-workflow)
- [📈 Rollout Strategy](#-rollout-strategy)
- [🔗 References](#-references)

---

## 📁 Prompt Taxonomy

| Category | Identifier | Purpose |
|----------|------------|---------|
| **System** | `planner/system/v1` | Ground the planner model (SQL expert) |
| **Planner** | `planner/query/v3` | Convert question + context → plan + SQL |
| **Reviewer** | `reviewer/sql_guard/v2` | Critique plan and SQL for accuracy/safety |
| **Summarizer** | `summarizer/answer/v2` | Convert SQL results → narrative |
| **Consultant** | `trainer/consultant/v1` | Aggregate evaluation insights |
| **Persona** | `persona/camilo/v1` | Ensure tone matches Camilo’s voice |

---

## 🧱 Template Structure

Example: `planner/query/v3`
```yaml
---
id: planner/query/v3
model: gpt-4o
status: active
created_at: 2025-09-10
owner: camilo
last_evaluated: 2025-10-01
success_rate: 0.93
rollback_plan: planner/query/v2
---
```
```text
You are an elite fitness data analyst. Use the provided schema context to write SQL.
Rules:
1. Use only tables/views listed.
2. Never guess column names. If unsure, ask for clarification.
3. Return SQL only; no backticks.
4. Include CTEs for readability when necessary.
```

- **Sections**: Role definition, rules, worked examples, forbidden patterns, response format.
- Keep prompts concise (< 600 tokens) and deterministic.

---

## 🧪 Evaluation Metadata

- `success_rate`: Derived from latest evaluation cycle.
- `eval_cycle_id`: Link to `evaluation_cycles` entry.
- `test_suite`: Path to evaluation dataset (`datasets/evals/planner_v3.jsonl`).
- `notes`: Observations, rationale for changes.

Use `pnpm exec ts-node scripts/ai/promptLint.ts` to ensure metadata validity.

---

## 🔐 Guardrails & Policies

- **Forbidden instructions**: altering schema, returning personal data, using DDL/DML.
- **Safety override**: If user request conflicts with policy, respond with refusal template defined here.
- **Content filters**: Future integration with moderation endpoints; document thresholds.

---

## 🛠️ Editing Workflow

1. Create feature branch (`ai/prompt/<description>`).
2. Duplicate existing prompt entry; bump version ID.
3. Update metadata (`status: candidate`, `created_at`, `owner`).
4. Run evaluation suite:
   ```bash
   pnpm exec ts-node scripts/ai/runPromptEval.ts --prompt=planner/query/v4
   ```
5. Analyze results; ensure success rate ≥ baseline.
6. Submit PR with diff + evaluation artifacts attached.
7. On approval, set `status: active`, update `last_evaluated`.

---

## 📈 Rollout Strategy

- **Shadow Mode**: Route X% of traffic to new prompt; compare metrics.
- **Canary**: Start at 5%, escalate to 50%, then 100% over 48 hours.
- **Rollback**: Switch to `rollback_plan` prompt version if metrics degrade > threshold.
- Document rollout steps in `PROJECT_ARCHITECTURE_PLAN.md` and meeting notes.

---

## 🔗 References
- `docs/ai/RAG_SYSTEM.md` – Pipeline consuming prompts.
- `docs/ai/EVALUATION.md` – Evaluation loop measuring prompt performance.
- `docs/knowledge/CAMILO_PROFILE.md` – Persona prompt grounding data.
- `docs/operations/RUNBOOKS.md` – Playbook for prompt-induced incidents.

---

*Last Updated: October 2, 2025*
