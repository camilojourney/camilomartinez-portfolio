# Agentic Control Plane

This directory is the repo-local agentic surface for `camilomartinez-portfolio`.

Fleet remains the central control plane for bootstrap, model policy, dispatch,
shared eval contracts, and dashboards. This repo owns its domain agents, tools,
memory, safety rules, and product-specific evaluation data.

## Files

| File | Purpose |
|---|---|
| `manifest.yaml` | Machine-readable registry of repo agents and repo-local skills. |
| `permissions.yaml` | Allowed, ask-first, and forbidden actions. |
| `memory.yaml` | Four memory types and their storage locations. |
| `evals.yaml` | Repo-local eval suites and thresholds exported to Fleet. |
| `tools.yaml` | MCP/API/CLI contracts exposed to agents and Fleet. |
| `events.schema.json` | Repo event rows that Fleet may ingest. |
| `traces.schema.json` | Repo run traces that Fleet may ingest. |
| `skills/` | Repo-local `SKILL.md` packages discovered by Fleet bootstrap. |

## Boundary

Fleet can discover, invoke, and evaluate this repo's agentic surface. Fleet must
not copy domain runtime truth into Fleet or bypass repo-local safety rules.
