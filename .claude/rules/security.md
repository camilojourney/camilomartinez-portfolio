# Security Rules — camilomartinez-portfolio

## Critical: Secrets Management

- **Never commit secrets.** `.env.local` is git-ignored. Use Vercel environment variables for production.
- **No `NEXT_PUBLIC_` on sensitive values.** Any variable prefixed `NEXT_PUBLIC_` is embedded in the client bundle and visible to all visitors.
- **Secrets that must stay server-side:** `NEXTAUTH_SECRET`, `WHOOP_CLIENT_SECRET`, `STRAVA_CLIENT_SECRET`, `CRON_SECRET`, `POSTGRES_URL`
- **Safe to be NEXT_PUBLIC:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` (never credentials)

## OAuth Token Security

- **Strava tokens expire every 6 hours.** Auto-refresh logic must run before expiry, not on 401 alone.
- **WHOOP tokens** must be refreshed before expiry; never log raw tokens.
- **Store tokens in the database, not in cookies or localStorage.**
- **Never log OAuth tokens, refresh tokens, or client secrets** — check all `console.log` and logger calls near auth code.

## API Route Protection

- **All `/api/` routes must check authentication** unless explicitly public.
- **Cron endpoints must validate `CRON_SECRET` header** — unauthenticated cron endpoints allow unlimited API calls to WHOOP/Strava.
- **`ALLOW_PUBLIC_DASHBOARD_DATA`** must be checked server-side in the API route handler, not just in the frontend.
- **Admin routes** must verify `ADMIN_EMAILS` or `ADMIN_USER_IDS` — cannot rely on client-side checks.

## Frontend Security

- **No API keys in client code** — any key used in a `src/` file (other than NEXT_PUBLIC vars) is a leak.
- **Sanitize all user inputs** before sending to backend.
- **Content Security Policy** — if implementing inline scripts, use nonces. Avoid `unsafe-inline`.
- **HTTPS only in production** — never serve dashboard data over HTTP.

## Dependency Security

- **Pin dependencies with exact versions** for auth/crypto libraries.
- **Flag nextauth beta versions** — `next-auth@5.0.0-beta.30` has known pre-release behavior. Note this in security audit.
- **Run `pnpm audit` in CI** — block on HIGH or CRITICAL vulnerabilities.

## Data Privacy

- **This dashboard displays personal health data.** `ALLOW_PUBLIC_DASHBOARD_DATA` must default to `false`.
- **No PII in logs** — HRV values, sleep scores, workout details should not appear in server logs.
- **No third-party analytics** that could receive health data via referrer headers or query params.
