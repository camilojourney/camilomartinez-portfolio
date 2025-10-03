# 🧠 Embeddings Strategy & Manifest

> **Status:** Authoritative · **Scope:** Vectorization, Storage, Retrieval · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** Data Platform Guild

---

## TL;DR
- Embeddings encode schema, documents, and persona context into pgvector to power retrieval and personalization.
- This manifest defines sources, chunking rules, refresh cadence, and monitoring to keep embeddings consistent and high-quality.
- Follow the procedures here before updating data models, documentation, or AI behavior.

---

## Table of Contents
- [📦 Embedding Corpora](#-embedding-corpora)
- [⚙️ Generation Pipeline](#️-generation-pipeline)
- [🏛️ Storage Model](#-storage-model)
- [📈 Drift Monitoring](#-drift-monitoring)
- [🛠️ Operations](#️-operations)
- [🔗 References](#-references)

---

## 📦 Embedding Corpora

| Corpus | Source | Purpose | Refresh |
|--------|--------|---------|---------|
| **Schema** | `docs/data/SCHEMA.md`, materialized view DDL | Text-to-SQL context | Weekly or schema change |
| **Analytics** | `docs/data/ANALYTICS.md`, KPI definitions | Clarify metric semantics | Weekly |
| **Persona** | `docs/knowledge/CAMILO_PROFILE.md` | Personalization, tone | Monthly |
| **Playbooks** | `docs/ai/RAG_SYSTEM.md`, `docs/ai/EVALUATION.md` | Agent reasoning, evaluation context | Monthly |
| **Glossary** | `docs/knowledge/GLOSSARY.md` | Terminology alignment | Weekly |

### Source Configuration (YAML)
```yaml
schema:
  path: docs/data/SCHEMA.md
  chunk_size: 900
  overlap: 150
  metadata:
    type: schema
    version: 2025-10-02
persona:
  path: docs/knowledge/CAMILO_PROFILE.md
  chunk_size: 1100
  overlap: 200
  metadata:
    type: persona
```

---

## ⚙️ Generation Pipeline

1. **Extract** – For Markdown sources, parse headings & sections; for SQL, introspect via Alembic.
2. **Normalize** – Remove boilerplate, convert tables/columns to human-readable sentences.
3. **Chunk** – Use sliding window (size defined per corpus) to balance context vs cost.
4. **Embed** – `text-embedding-3-small` (1536 dimensions); fallback to large model for high recall tasks.
5. **Store** – Insert into `schema_embeddings` or `document_embeddings` with metadata.
6. **Index** – Maintain HNSW index with `vector_cosine_ops`.

```python
embedding = await openai_client.embeddings.create(
    input=chunks,
    model="text-embedding-3-small"
)
```

- Batching: 64 chunks per request for efficiency.
- Deduplication: use SHA-256 hash to skip unchanged content.

---

## 🏛️ Storage Model

### Tables
```sql
CREATE TABLE schema_embeddings (
  id SERIAL PRIMARY KEY,
  object_type TEXT NOT NULL,
  object_name TEXT NOT NULL,
  column_name TEXT,
  description TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_embeddings (
  id SERIAL PRIMARY KEY,
  document_path TEXT NOT NULL,
  section_heading TEXT,
  chunk_index INT,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_schema_embeddings_hnsw
  ON schema_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_document_embeddings_hnsw
  ON document_embeddings USING hnsw (embedding vector_cosine_ops);
```

### Versioning
- `version` column matches git commit SHA or semantic version.
- Only one active version per corpus; old versions archived for rollback.

---

## 📈 Drift Monitoring

- **Cosine Drift**: Compare new embeddings to baseline; alert if average similarity < 0.85.
- **Recall Benchmarks**: Maintain evaluation set of questions referencing each corpus.
- **Change Detection**: Git hook triggers embedding refresh when source files change.
- **Logging**: Store embedding stats (min/max similarity, tokens used) in `embedding_runs` table.

```sql
CREATE TABLE embedding_runs (
  id SERIAL PRIMARY KEY,
  corpus TEXT,
  version TEXT,
  chunks INTEGER,
  tokens INTEGER,
  avg_similarity NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Operations

| Task | Command | Notes |
|------|---------|-------|
| Full refresh | `pnpm exec ts-node scripts/ai/refreshEmbeddings.ts --full` | Regenerates all corpora |
| Incremental refresh | `pnpm exec ts-node scripts/ai/refreshEmbeddings.ts --corpus=schema` | Pass comma-separated corpora |
| Dry run | Add `--dry-run` flag | Prints summary without writing |
| Vacuum/Analyze | `psql -c "VACUUM (ANALYZE) schema_embeddings;"` | Run monthly |

Lock all refresh operations with distributed lock (Redis) to prevent concurrent runs.

---

## 🔗 References
- `docs/ai/README.md` – AI platform overview.
- `docs/data/SCHEMA.md` – Source for schema embeddings.
- `docs/knowledge/CAMILO_PROFILE.md` – Persona data source.
- `docs/ai/RAG_SYSTEM.md` – Retrieval pipeline depending on embeddings.
- `docs/operations/CRON_JOBS.md` – Scheduling details for refresh jobs.

---

*Last Updated: October 2, 2025*
