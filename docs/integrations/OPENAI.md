# 🤖 OpenAI Integration Guide

> **Status:** Production · **Scope:** GPT/Embeddings Usage, Cost Control, Safety · **Last Updated:** October 2, 2025  
> **Owner:** AI Platform Guild · **Reviewer:** Security Guild

---

## TL;DR
- OpenAI powers planning, summarization, evaluation, and embeddings; interactions happen through async client wrappers with guardrails.
- Cost, rate limits, and safety controls are enforced via middleware, token budgets, and monitoring.
- Use this guide for API usage patterns, configuration, and operational best practices.

---

## Table of Contents
- [🔑 Configuration](#-configuration)
- [🧱 Client Abstractions](#-client-abstractions)
- [📦 Model Portfolio](#-model-portfolio)
- [💰 Cost & Rate Limits](#-cost--rate-limits)
- [🛡️ Safety Controls](#-safety-controls)
- [🧪 Testing & Mocking](#-testing--mocking)
- [🔗 References](#-references)

---

## 🔑 Configuration

Environment variables (`backend/.env`):
- `OPENAI_API_KEY`
- `OPENAI_ORG_ID` (optional)
- `OPENAI_BASE_URL` (optional for Azure/OpenAI proxies)
- `OPENAI_TIMEOUT_SECONDS` (default 30)

Set in Railway/Vercel secrets; rotate monthly. Store encrypted in secret manager (roadmap).

---

## 🧱 Client Abstractions

```python
from openai import AsyncOpenAI

class OpenAIClient:
    def __init__(self, api_key: str, timeout: int = 30):
        self.client = AsyncOpenAI(api_key=api_key, timeout=timeout)

    async def chat(self, messages: list[dict], **kwargs) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            **kwargs,
        )
        return response.choices[0].message.content

    async def embed(self, chunks: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
        response = await self.client.embeddings.create(input=chunks, model=model)
        return [data.embedding for data in response.data]
```

- Wrapped with retry/backoff (handles rate limits, network errors).
- Structured logging captures prompt metadata (tokens, latency, cost).
- Supports streaming (for chat) but disabled in backend pipeline for deterministic evaluation.

---

## 📦 Model Portfolio

| Use Case | Model | Notes |
|----------|-------|-------|
| Planning (SQL) | `gpt-4o` | High reasoning quality |
| Reviewer | `gpt-4o-mini` | Faster, sufficient for critique |
| Summarizer | `gpt-4o-mini` | Balance cost/performance |
| Embeddings | `text-embedding-3-small` | 1536 dims, cost-effective |
| Evaluator | `gpt-4o` | Ensures high accuracy in judgements |

Fallback strategy: degrade to smaller model or cached responses when hitting rate limits.

---

## 💰 Cost & Rate Limits

- **Rate Limits**: 10k RPM, 1M TPM (subject to account tier). Monitor via response headers.
- **Budget Controls**:
  - Track tokens per request in `ai_usage` table.
  - Alerts when monthly spend approaches budget (config in `docs/operations/MONITORING.md`).
  - Cache repeated embedding requests (content hash key).
- **Batching**: Embed up to 64 chunks per request.
- **Retry**: Exponential backoff (up to 5 retries) on rate limit errors.

---

## 🛡️ Safety Controls

- System prompts enforce boundaries (no personal data, no destructive instructions).
- SQL guard ensures no DML/DDL regardless of LLM output.
- Content moderation (roadmap): integrate OpenAI Moderation API for user prompts.
- Logging ensures sensitive data not stored; redaction middleware removes tokens before logging.

---

## 🧪 Testing & Mocking

- `respx` mocks for HTTP calls in unit tests.
- `fake_openai_client.py` returns deterministic responses for pipeline tests.
- Contract tests ensure prompt templates produce expected structures.
- Smoke tests call OpenAI (live) using low-cost model (`gpt-4o-mini`) in staging daily.

---

## 🔗 References
- `docs/ai/PROMPTS.md` – Prompt catalog.
- `docs/ai/RAG_SYSTEM.md` – Pipeline using OpenAI.
- `docs/operations/RUNBOOKS.md` – Incident response for OpenAI outages.
- `docs/data/ETL_PROCESSES.md` – Embedding refresh job interactions.

---

*Last Updated: October 2, 2025*
