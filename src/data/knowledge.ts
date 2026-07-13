// Auto-generated knowledge base — embedded at build time
export const KNOWLEDGE_BASE = `
# Juan Camilo Martinez — Bio

Juan Camilo Martinez (also called Camilo) is an Applied AI Engineer based in New York City, specializing in audio/speech ML and multi-agent systems.

## Education
- Master of Science in Business Analytics (MSA), Baruch College, City University of New York — May 2026
- Background in petroleum engineering; pivoted to AI/data engineering

## Career
- Applied AI Engineer specializing in audio/speech ML and multi-agent systems
- Built a speech ML pipeline from 46 research papers with 7-dimension intelligibility-focused scoring
- Designed a multi-agent orchestration framework with health checks, guardrails, and self-improvement loops
- Built and deployed 10+ end-to-end AI projects
- Based in NYC; open to remote and hybrid roles
- Target role: Applied AI Engineer / AI Systems Engineer / ML Engineer
- Target compensation: role-dependent; public materials should not use a hard compensation floor
- Available to start: immediately

## Personal
- Originally from Colombia
- Morning workout streak — documents daily workouts publicly
- Running every street in Astoria, Queens (Astoria Conquest)
- Bartends 4 nights/week while building AI projects and job searching full-time

---

# Technical Skills

## Audio/Speech ML (Primary Expertise)
- Built a speech scoring pipeline from 46 research papers
- Whisper (transcription), wav2vec2 (pronunciation scoring), Parselmouth (prosody analysis)
- Silero VAD (voice activity detection), phoneme alignment
- 7-dimension hybrid scoring: GOPT-style acoustic scoring for accuracy, fluency, prosody, and intelligibility, plus transcript/LLM scoring for vocabulary, grammar, and coherence
- Acoustic scoring trained and evaluated on labeled SpeechOcean762 data, with about 0.75 average PCC on held-out labeled evaluation
- LLM-based coaching feedback generation
- Cost-per-inference analysis at the architecture stage to keep the pipeline production-viable

## Multi-Agent Systems
- LangGraph orchestration with phase-gated verification
- Redis pub/sub event bus for inter-agent communication
- Guardrails, health preflight checks, observability dashboards
- Silo isolation (trading silo, content silo)
- Self-improving content engine with adaptive thresholds
- Specialist spawner pattern with 50+ reviewer pool

## AI / ML Engineering
- LLMs: Claude, GPT-4, Gemini — prompt engineering, evals, structured output
- RAG: pgvector, hybrid BM25 + vector + RRF retrieval, chunking strategies
- Phase-gated verification: AST-based deterministic checks, quality scoring
- Video AI: smart cuts, word-by-word captions, audio normalization

## Data Engineering
- Python pipelines: Pandas, Polars, NumPy
- PostgreSQL, pgvector, Redis
- GCP (BigQuery, Cloud Run, Cloud Storage)
- Real-time analytics and streaming
- 228-test analytics warehouse with platform integrations

## Full-Stack
- TypeScript / Next.js / React
- FastAPI (Python)
- Tailwind CSS, Framer Motion
- Vercel, Docker, Render

---

# Projects

## Invoz.ai — Multimodel Speech Coaching System (Flagship)
Status: In Progress | URL: invoz.io
Speech ML pipeline built from 46 research papers with 7-dimension hybrid scoring: GOPT-style acoustic scoring for accuracy, fluency, prosody, and intelligibility, plus LLM scoring for vocabulary, grammar, and coherence. Public demo at invoz.io; private learner audio and transcripts are not exposed.

## Holus — Multi-Agent AI Orchestration Framework (Flagship)
Status: Live | URL: holus-observatory.vercel.app
Multi-agent orchestration framework that coordinates content, product, and execution workflows across multiple AI projects. Agents communicate through Redis eventing with domain isolation, guardrails, health preflight, and an Observatory dashboard. Built with Python, LangGraph-style workflows, Claude API, and Redis.

## Pilaster — AI Workflow Memory Platform
Status: Live | URL: pilaster.ai
Version control and memory system for AI generation workflows. Tracks iterations with intent notes, parameter diffs, and failure pattern warnings across ComfyUI and multi-backend pipelines.

## Genpeli — AI Video Editing Pipeline
Status: Live | URL: editai.ai
Local-first AI video editing pipeline. Smart cuts, word-by-word captions, audio normalization, and social media delivery for short-form content.

## Holusight — AI Document Search Engine
Status: Live | URL: holusight.com
Hybrid BM25 + vector + RRF retrieval with Claude answer synthesis. Local-first, no cloud required.

## AI Advisor Board
Status: Live | URL: ai-advisor-board.vercel.app
Multi-agent advisory panel — strategic debate between advisory directors using different LLM personas.

## Social Media Automatization
Status: Live
LLM-powered content pipeline with analytics warehouse. 228 tests. Platform integrations for Instagram, Facebook, Threads, Twitter.

## Fitness Dashboard
Status: Live
Auth-gated health analytics combining WHOOP and Strava APIs with RAG-style contextual retrieval. Public summaries avoid exposing raw health metrics, routes, or private notes.

---

# Values & How He Works

## Core Values
1. Systems over motivation — structures work, willpower doesn't
2. Truth over comfort — honest self-assessment, no self-deception
3. Wealth = freedom — money is a tool for autonomy
4. Autonomy — don't outsource emotional regulation
5. Ship then measure then delete — 90% of features die

## Operating System
- Morning: meditate, set ONE intention, gym
- Evening: three wins + three gratitudes + tomorrow's priority
- One thing at a time. Depth beats breadth.
- Nothing scales until one instance works end-to-end.
- Output is the proof. No performing.

---

# FAQ

## Is Camilo available for work?
Yes — actively looking for full-time Applied AI Engineer roles. Available immediately.

## What kind of roles?
Applied AI Engineer, AI Systems Engineer, ML Engineer. Especially strong fit for audio/speech ML roles and companies building multi-agent systems.

## What is his target compensation?
Compensation is role-dependent. Public materials should avoid a hard floor and discuss scope, level, and total compensation during recruiter conversations.

## Where is he located?
New York City. Open to on-site, hybrid, or remote.

## What makes him different?
Three things: (1) He built an audio ML pipeline from 46 research papers with 7-dimension intelligibility-focused scoring and labeled-data acoustic evaluation. (2) He designed a multi-agent orchestration framework with Redis eventing, guardrails, and self-improvement loops. (3) His business analytics background means he thinks about cost and feasibility at the architecture stage, not after. Most AI engineers can build; few think about whether it can run in production.

## What is his strongest technical skill?
Audio/speech ML. He went deep on Whisper, wav2vec2, Parselmouth, Silero VAD, prosody analysis, and phoneme alignment. This is a scarce skill set — most ML engineers work on text/image, not audio.

## How can I contact him?
Visit the contact page at camilomartinez.co/contact or email juancamilomabe@gmail.com.

---

# Fitness & Health

## Routine
- Works out 4-5 days/week, morning sessions
- Tracks with WHOOP: sleep, HRV, recovery score daily
- Runs every street in Astoria, Queens (Astoria Conquest)
- Public morning workout streak on the portfolio

## Live Metrics
For specific health numbers, use the auth-gated Fitness Dashboard only. Public chatbot and portfolio summaries should describe the analytics architecture without exposing raw WHOOP or Strava records.
`;
