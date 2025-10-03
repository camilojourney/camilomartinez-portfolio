# 🧪 Training & Evaluation Data Generation

> **Status:** Stable · **Scope:** Synthetic Dataset Generation, Fine-Tuning Roadmap · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** AI Assistant

---

## TL;DR
- Synthetic data powers continuous improvement: generate diverse questions, evaluate responses, and curate datasets for future fine-tuning.
- This guide covers question generation, annotation pipeline, storage, and the roadmap for training specialized models.
- Use these practices to grow high-quality datasets while preserving safety and explainability.

---

## Table of Contents
- [🎯 Objectives](#-objectives)
- [🧬 Data Generation Pipeline](#-data-generation-pipeline)
- [📝 Annotation & Labelling](#-annotation--labelling)
- [📦 Dataset Management](#-dataset-management)
- [🏋️ Fine-Tuning Roadmap](#️-fine-tuning-roadmap)
- [🛡️ Ethical & Safety Considerations](#️-ethical--safety-considerations)
- [🔗 References](#-references)

---

## 🎯 Objectives

1. **Coverage** – Generate questions spanning cardio, recovery, sleep, multi-metric comparisons, anomalies.
2. **Difficulty** – Include simple lookups, aggregations, joins, time-series analysis.
3. **Robustness** – Introduce ambiguous phrasing, synonyms, and noise to stress-test reasoning.
4. **Explainability** – Ensure every sample links to source SQL and evaluation rationale.

---

## 🧬 Data Generation Pipeline

```
Seed Questions (YAML/CSV)
      │
      ▼
Augmentation Prompts (LLM)
      │
      ▼
Generated Questions + Expected SQL
      │
      ▼
Validation (execute SQL, store result snapshot)
      │
      ▼
Evaluator (LLM + heuristics) → Pass/Fail + reasoning
      │
      ▼
Dataset Store (`ai_training_examples`)
```

### Step 1: Seed Library
- Store canonical questions in `datasets/seed_questions.yaml` with tags (topic, complexity, timeframe).

### Step 2: Augmentation
```python
prompt = f"""
Generate 5 new questions about sleep recovery over the last month.
Include variations in phrasing, timeframes, comparative analysis.
Return JSON with fields: question, sql, tags.
"""
```
- Use GPT-4o for quality; enforce JSON schema.

### Step 3: Validation
- Execute provided SQL using read-only role.
- Compare generated result with actual data; discard mismatches (mark `status=invalid`).

### Step 4: Evaluation
- Store expected answer (narrative) + metadata (tokens, difficulty).
- Feed into evaluation cycle (see `docs/ai/EVALUATION.md`).

---

## 📝 Annotation & Labelling

- **Metadata Fields**:
  - `question`, `canonical_sql`, `result_snapshot`, `topic`, `difficulty`, `created_by`, `validated_at`, `status`.
- **Difficulty Rubric**:
  - `1` (simple aggregate), `2` (dimension comparison), `3` (multi-table + window functions).
- **Quality Labels**: `good`, `needs_review`, `discarded`.
- Human annotators review ambiguous cases; log rationale for transparency.

---

## 📦 Dataset Management

### Storage
```sql
CREATE TABLE ai_training_examples (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  canonical_sql TEXT NOT NULL,
  topic TEXT,
  difficulty SMALLINT,
  expected_answer TEXT,
  result_snapshot JSONB,
  tags TEXT[],
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  created_by TEXT
);
```

### Versioning
- Export dataset snapshots to `datasets/exports/` with semantic versioning (e.g., `v2025.10`).
- Track commit hash + database snapshot ID for reproducibility.

### Tooling
- `scripts/ai/export_training_data.py` – Exports dataset to JSONL/CSV for fine-tuning.
- `scripts/ai/import_training_data.py` – Enables bootstrapping new environment.

---

## 🏋️ Fine-Tuning Roadmap

| Phase | Description | Goal |
|-------|-------------|------|
| **Phase 0** | Prompt-only (current) | Tune prompts/evaluations |
| **Phase 1** | Synthetic fine-tune dataset (OpenAI or Anthropic) | Improve SQL planning accuracy |
| **Phase 2** | Reinforcement learning from evaluations | Balance accuracy vs token usage |
| **Phase 3** | Custom model hosting (LLM + vector index) | Reduce latency, increase control |

Considerations: dataset size (≥ 2k high-quality pairs), cost budgets, evaluation harness.

---

## 🛡️ Ethical & Safety Considerations

- Exclude personal identifiable information; focus on aggregated metrics.
- Ensure generated questions respect user privacy (no names, sensitive data).
- Document provenance and maintain audit trail for dataset changes.
- Evaluate for harmful or biased outputs; escalate issues via incident response.

---

## 🔗 References
- `docs/ai/EVALUATION.md` – Automated evaluation loops.
- `docs/ai/RAG_SYSTEM.md` – Execution pipeline consuming training improvements.
- `docs/data/SCHEMA.md` – Source tables for generating valid SQL.
- `docs/operations/RUNBOOKS.md` – Response plan for AI anomalies.

---

*Last Updated: October 2, 2025*
