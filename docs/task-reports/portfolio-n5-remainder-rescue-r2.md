# Portfolio n5 remainder rescue (r2)

Rescued unlanded hunks from `59a677d` and `8d8a979` onto `main`, reconciled with PRs 9–11.

## Applied

| Area | Evidence |
|------|----------|
| `public/bot-avatar.png` + manifest icon | Missing on main (`ls public/bot-avatar.png` failed before rescue) |
| `src/lib/chat/format.tsx` + tests; ChatWidget wiring | Module absent on main; frame-based SSE parsing + React markdown rendering |
| Vercel telemetry gating in `layout.tsx` | `Analytics`/`SpeedInsights` always rendered on main |
| Whoop dashboard polling refs | `whoop-dashboard/page.tsx` called unstable callbacks inside `useEffect([session])` |
| Whoop chart hydration (`ActivityDistributionChart`, `ActivityHeatmap`, `TrainingAnalytics`) | Early return before hooks; `new Date().getFullYear()` SSR/client mismatch |
| DB missing-config log suppression | `accountability-partner/page.tsx`, `fitness-dashboard/page.tsx` |
| Fitness dashboard background overflow | `fitness-dashboard-client.tsx` animated background lacked `overflow-hidden` |
| `GlobalChatbot` mount guard removal | Redundant `isMounted` localStorage gate |
| `liquid-nav` dead health-check state | `apiStatus` written never read |
| Astoria unused import | `client.tsx` imported `Link` without use |
| `package.json` `typecheck` script | Present in `59a677d`, absent on main |
| `sitemap.ts` `today` helper + unit test | Regression guard for doubled-origin URLs |
| Case-study hero `imageUrl` paths in `projects/[slug]/page.tsx` | Three broken `/images/project-*.png` refs on main; `59a677d` pointed to existing `previews_main` assets |
| Case-study asset existence test | New coverage from `59a677d` |

## Dropped (already satisfied)

| Hunk | Evidence |
|------|----------|
| Chat route hardening (`route.ts`, rate limits, abort/cancel, recruiter facts) | Landed in PR #11 (`90b0313`); main has `pruneRateLimitStore`, `isClientAbort`, `chat_stream_cancelled` |
| ChatWidget cancellation, touch targets, pending-message cleanup | PR #11 + `e2e/acceptance/public-critical-fixes.spec.ts` already covers abort/empty assistant cases |
| `globals.css` `footer a` 44px rule | PR #10 `mobile-link-target` classes + `mobile-link-targets.spec.ts` |
| `use-prefers-reduced-motion` hook + PascalCase motion components | PR #11 removed `MagneticButton.tsx`/`ScrollReveal.tsx`/`TextReveal.tsx`; main uses kebab-case components with `useReducedMotion` from framer-motion |
| Recruiter/knowledge/project destination rewrites | PR #9 (`06ec568`) and PR #10 (`29fba73`) |
| E2E selector/copy reversions in `case-studies`, `projects-grid`, `external-links` | PR #10 tests are authoritative (e.g. Holus Observatory live link removed, Holusight unlinked) |
| Chat commits `31f1f73`, `a1d0838`, `d2212c7` | Explicitly excluded; content in PR #11 |
| `public-critical-fixes` chat resilience tests from n5 that duplicate PR #11 | Main file is superset (350 lines vs 203 in `59a677d`) |
