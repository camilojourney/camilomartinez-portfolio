# NEXT — camilomartinez-portfolio

## P0 — Critical
- Implement Strava token auto-refresh logic (6h TTL — must fire before expiry, not just on 401)
- Verify WHOOP token refresh handles 401 without leaking token in logs

## P1 — High Priority
- Implement backend service layer: `backend/app/services/` stubs need real logic
- Verify ALLOW_PUBLIC_DASHBOARD_DATA is checked server-side in API route handlers
- Verify CRON_SECRET is validated on all `/api/cron/*` endpoints
- Fix any WCAG 2.1 AA violations (UX Mission C)
- Core Web Vitals: LCP <2.5s on portfolio pages

## P2 — Improvements
- Mobile responsiveness audit (touch targets, nav collapse, breakpoints)
- Bundle size analysis — flag heavy client components
- Add 2-3 detailed project case studies to portfolio section

## Notes from Previous Cycles

(none yet — first cycle)
