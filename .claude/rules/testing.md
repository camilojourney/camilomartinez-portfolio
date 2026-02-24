# Testing — camilomartinez-portfolio

## Frontend: Vitest

**Config:** `vitest.config.ts`
**Test files:** `src/**/*.test.ts` and `src/**/*.test.tsx`
**Run:** `pnpm test:run` (single run) or `pnpm test` (watch mode)
**Coverage:** `pnpm test:coverage`

### Test File Location
Co-locate tests with the code they test:
```
src/components/DashboardCard.tsx
src/components/DashboardCard.test.tsx   <-- here
src/lib/formatDate.ts
src/lib/formatDate.test.ts              <-- here
```

### What to Test (Frontend)
- Pure utility functions in `src/lib/` — 100% coverage target
- Data transformation functions (API response -> display format)
- Validation logic

### What NOT to Test (Frontend)
- Next.js page routing (framework handles this)
- Tailwind class presence (brittle, changes too often)
- Third-party library internals (Recharts, Leaflet)

### Vitest Patterns
```typescript
import { describe, it, expect } from 'vitest';

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    expect(formatDate('2026-02-24T10:00:00Z')).toBe('Feb 24, 2026');
  });

  it('returns empty string for null input', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

### Import Alias
The `@/` alias resolves to `src/`:
```typescript
import { formatDate } from '@/lib/formatDate';
```

## Backend: pytest

**Run:** `pnpm test:backend` or `cd backend && uv run pytest`
**Location:** `backend/tests/`

### What to Test (Backend)
- Service layer functions in `backend/app/services/`
- Token refresh logic (mock the OAuth endpoints)
- Data transformation functions in `backend/app/services/`
- API route handlers (use FastAPI `TestClient`)

### pytest Patterns
```python
import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_strava_token_refresh(mock_strava_api):
    # Test that token refresh fires before 6h expiry
    ...
```

## Run Both (CI)
```bash
pnpm test:all
```
Runs `vitest run` then `pytest` in sequence.

## Coverage Targets
- `src/lib/`: 80% minimum
- `backend/app/services/`: 70% minimum
- No coverage requirement for UI components (tested via manual QA)
