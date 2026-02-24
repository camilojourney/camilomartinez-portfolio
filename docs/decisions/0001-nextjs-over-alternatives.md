# ADR 0001 — Next.js for Portfolio Frontend

**Date:** 2026-02-01
**Status:** Accepted
**Deciders:** Camilo Martinez

## Context

The portfolio needed a frontend framework. Options evaluated: plain HTML/CSS, SvelteKit, Astro, Remix, Next.js. The site has two distinct needs: (1) marketing/portfolio pages that should be statically generated for SEO and performance, and (2) a dynamic fitness dashboard pulling live data from WHOOP and Strava that requires server-side rendering with auth.

## Decision

Use Next.js (App Router) with TypeScript and Tailwind CSS.

## Consequences

### Positive
- **SSR + SSG in one framework.** Portfolio pages can be statically generated (fast, SEO-friendly). Dashboard pages use SSR with session auth — no client-side secrets.
- **Vercel-native.** Zero-config deployment, edge functions, automatic preview deployments on every PR.
- **React ecosystem.** Recharts for data visualization, NextAuth for OAuth, large community for troubleshooting.
- **App Router.** Server Components by default reduces client bundle size — important for LCP on the portfolio pages.
- **TypeScript first-class.** Strict mode enforced across the project.

### Negative
- **Heavier than Astro** for pure static pages. Astro would have smaller bundles for the portfolio sections.
- **Next.js major version churn.** App Router is relatively new; patterns are still evolving.
- **Cold starts on Vercel free tier.** Serverless functions have cold start latency that can affect Time to First Byte.

### Neutral
- Python backend (FastAPI) is decoupled — framework choice doesn't affect it.
- Tailwind CSS works with any React framework equally well.

## Alternatives Considered

| Option | Reason rejected |
|--------|----------------|
| Astro | Excellent for static sites, but poor story for the authenticated dashboard portion requiring SSR + session management |
| SvelteKit | Strong performance, but smaller ecosystem for data visualization and OAuth integrations |
| Remix | Good SSR story but weaker SSG, and Vercel deployment is less seamless |
| Plain HTML/CSS | No component reuse, no TypeScript, maintenance burden grows quickly |

## References
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [NextAuth.js docs](https://next-auth.js.org/)
- [Vercel deployment](https://vercel.com/docs)
