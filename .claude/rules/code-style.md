# Code Style — camilomartinez-portfolio

## TypeScript

- **Strict mode is on.** `tsconfig.json` has `"strict": true`. No `any` types.
- **Explicit return types** on exported functions.
- **No non-null assertions (`!`)** unless absolutely unavoidable — prefer null checks.
- **Use `type` for object shapes,** `interface` for extensible contracts.
- **No default exports** for utilities and hooks — use named exports.
- **Pages use default exports** (Next.js App Router convention).

## React / Next.js

- **Server Components by default.** Add `'use client'` only when the component uses browser APIs, event handlers, or React state/effects.
- **Use Next.js `<Image>` instead of `<img>`.** Always provide `width`, `height`, and `alt`.
- **Use Next.js `<Link>` instead of `<a>` for internal navigation.**
- **Async server components:** fetch data directly in the component, no `useEffect` for server data.
- **Error boundaries:** every page route should have an `error.tsx` sibling.
- **Loading states:** every async page should have a `loading.tsx` sibling.

## Tailwind CSS

- **Tailwind only.** No inline `style` props, no CSS modules, no styled-components.
- **Use `cn()` (clsx + tailwind-merge) for conditional classes:**
  ```tsx
  import { cn } from '@/lib/utils';
  <div className={cn('base-classes', condition && 'conditional-class')} />
  ```
- **Follow 8px grid.** Use spacing scale: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- **Responsive prefix order:** `sm:` `md:` `lg:` `xl:` — mobile-first always.
- **No magic numbers.** Use Tailwind theme values, not arbitrary `[123px]` unless truly unavoidable.
- **Dark mode:** use `dark:` variant, not separate class names.

## Python / FastAPI

- **Python 3.11+.** Use type hints everywhere.
- **Pydantic v2** for all request/response models.
- **Async endpoints** (`async def`) for all route handlers that call external APIs.
- **No bare `except Exception`.** Catch specific exceptions.
- **Service layer pattern:** business logic lives in `backend/app/services/`, not in routers.
- **Tests in `backend/tests/`.** Use pytest with async support (`pytest-anyio`).

## File Organization

- One component per file.
- Co-locate tests with the component being tested (`ComponentName.test.tsx`).
- Keep files under 200 lines — extract to sub-components if longer.

## Naming

- Components: `PascalCase`
- Hooks: `useCamelCase`
- Utilities: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/interfaces: `PascalCase`
- API routes: kebab-case URLs (`/api/fitness-data`)
- Python: `snake_case` everywhere

## Commits

- Format: `type: description` (e.g., `fix: resolve Strava token refresh race condition`)
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Never commit directly to `main` — use branches and PRs
