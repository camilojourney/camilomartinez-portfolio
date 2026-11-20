# camilomartinez-portfolio

My personal site and fitness analytics app (WHOOP + Strava), deployed on Vercel.

- Frontend: Next.js
- Backend: FastAPI

## Docs

- [`docs/README.md`](docs/README.md): Navigation and runbooks
- [`docs/playbooks/development.md`](docs/playbooks/development.md): Local setup and development
- [`ARCHITECTURE.md`](ARCHITECTURE.md): Frontend and backend architecture
- [`docs/ux-system.md`](docs/ux-system.md): Visual design and styling reference

## Quick Start

Frontend:

```bash
pnpm install
pnpm dev
```

Backend:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```


## Appearance and Navigation

Use the sun/moon button in the header to switch between light and dark themes.
Your choice is saved in this browser. Without a saved choice, the site uses your
OS color preference; if browser storage is unavailable, it starts in light mode.
The Work, About, Blog, and Contact links stay visible on mobile, on a separate
header row rather than behind a hamburger menu.

## Interactive Quantum Pair

The home page's Selected work heading includes two linked Bloch spheres (A and
B) and a travelling wave. This browser-only illustration has no live WHOOP
feed and does not appear on `/projects`.

- Move the pointer near either sphere to steer it; its partner stays opposite
  and the wave swells. Focus the pair and use arrow keys to rotate A.
- Click the pair or press Enter/Space to measure. The displayed `P(A=0)` gives
  A's probability of yielding |0⟩; B always takes the opposite outcome. The matching
  poles flash, with phase-aware state amplitudes and a measurement tally below.
- When the pointer is away and no arrow keys are held, both states drift together.
  After a measurement's brief hold, idle states ease away from the poles and
  resume drifting, even while the pair remains focused.

On narrow screens the pair stacks under the heading at full width and remains
interactive. With `prefers-reduced-motion`, the wave and idle drift stay still;
steering jumps directly to the new state, and measurement still works.

## Workflow: Explore → Plan → Execute → Review

Opus in VS Code plans and launches autonomous CLI agents in the background — the user never leaves the conversation. Agents run via `env -u CLAUDECODE claude --dangerously-skip-permissions --model [model] -p '...'` with output redirected to files. Multiple cycles ensure quality: Sonnet implements, Opus reviews. See `.claude/rules/workflow.md` for full details.

## Environment Variables

This repo ships with safe placeholders in `.env.example`. Secrets should be configured in Vercel env vars (and locally via `.env.local`), never committed.

The portfolio chat route supports OpenAI-compatible providers in this order:
`AI_PROXY_API_KEY` for the legacy proxy, `GROQ_API_KEY` for Groq using
`llama-3.3-70b-versatile` by default, then `OPENAI_API_KEY` with
`gpt-4.1-mini` by default. Optional model overrides are documented in
`.env.example`. Recruiter availability and contact answers use the authoritative
facts in `src/data/recruiter.ts`. If the chat API is unavailable, the widget
states that clearly, gives the same grounded availability summary, and provides
a direct email link.
