# Agentic Architecture

This repo follows the Fleet federated-agent standard.

## Boundary

- Fleet is the control plane for bootstrap, model policy, shared eval schemas,
  skill discovery, and dashboards.
- `camilomartinez-portfolio` is the domain plane for repo-specific agents, tools, memory, safety
  rules, tests, and runtime data.
- Fleet may invoke repo-local skills and read exported summaries, traces, and
  evals. Fleet must not copy private domain memory or bypass repo safety rules.

## Repo-Local Surface

| Path | Purpose |
|---|---|
| `agentic/manifest.yaml` | Machine-readable registry of repo skills and agents. |
| `agentic/permissions.yaml` | Allowed, ask-first, and forbidden actions. |
| `agentic/memory.yaml` | Four memory types and storage locations. |
| `agentic/evals.yaml` | Repo-local eval suites and scorecard export policy. |
| `agentic/tools.yaml` | CLI, MCP, API, and SQLite tool boundaries. |
| `agentic/skills/` | Repo-local `SKILL.md` packages installed by Fleet bootstrap. |
| `.cursor/rules/agentic-skills.mdc` | Cursor-facing index for repo-local skills. |

Repo-local skills: none yet.

## Memory

| Memory type | Purpose | Default locations |
|---|---|---|
| Working | Current task/session state | `.pipeline-state/`, `tasks/` |
| Episodic | Chronological run history | `.self-improvement/memory/trajectory.jsonl`, `.self-improvement/reports/`, `memory/`, `devlog/` |
| Semantic | Durable facts and lessons | `.self-improvement/MEMORY.md`, `.self-improvement/knowledge/`, `knowledge/`, `docs/` |
| Procedural | How agents behave | `AGENTS.md`, `CLAUDE.md`, `agentic/skills/`, `agents/`, `.claude/agents/`, `.codex/agents/`, `docs/playbooks/` |

The source of truth for the repo's exact memory policy is `agentic/memory.yaml`.
