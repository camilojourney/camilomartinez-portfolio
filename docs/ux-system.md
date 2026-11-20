# Portfolio - Design System

## Identity
- **Product**: Camilo Martinez Portfolio - AI Engineer & Full-Stack Developer
- **Audience**: Recruiters, hiring managers, potential clients, tech community
- **Tone**: Professional, modern, tech-forward, personal brand

## Visual Direction

An editorial paper-and-ink design with one cobalt accent. Light is the primary
visual direction, with a complete dark palette. Hairline-separated rows and
measured reading columns replace decorative glass surfaces and floating blobs.
See [Appearance and Navigation](../README.md#appearance-and-navigation) for the
visitor-facing theme and mobile navigation behavior.

## Color and Surface Tokens

[src/styles/globals.css](../src/styles/globals.css) owns the palette, syntax
highlighting, radii, focus treatment, and component styles. Tokens are RGB
triplets in `:root`, overridden by `html[data-theme='dark']`.
[tailwind.config.js](../tailwind.config.js) maps them to opacity-compatible
semantic utilities; use these instead of hard-coded light/dark colors.

- Use `page`, `surface`, and `surface-2` for the page and layered surfaces.
- Use `ink` and `muted` for readable text, `line` for separators, and
  `line-strong` for control boundaries.
- Use `accent` with `accent-ink` for highlighted actions; `live`, `warn`, and
  `danger` communicate status rather than adding decorative accents.
- Chart text and tooltip items must retain readable semantic foregrounds instead
  of inheriting series colors. Contrast coverage lives in the
  [chart acceptance suite](../e2e/acceptance/chart-contrast.spec.ts) and
  [semantic text regressions](../e2e/acceptance/redesign-regressions.spec.ts).

## Typography

Instrument Serif gives display headings an editorial character; Inter handles
body copy and interface text; Geist Mono is used for code. Font loading is owned
by [the root layout](../src/app/layout.tsx), with font-family mappings in
[the Tailwind config](../tailwind.config.js). Type scales, tracking, and prose
measure are defined alongside the component styles in `globals.css`, not in a
second table here.

## Layout and Components

The [architecture component map](../ARCHITECTURE.md#components-srccomponents)
owns shared layout and case-study component locations. The root layout owns the
skip link, main landmark, footer, and floating chat widget. Pages use measured
content columns and hairline sections; data-heavy views retain bordered panels.
The project index uses featured rows followed by compact supporting rows.

Use shared button, panel, status, tag, thumbnail, and prose styles rather than
introducing page-specific glass shells. Icons use Lucide and inline SVG; charts
use Recharts and custom SVG.

## Motion and Accessibility

Subtle entrances and data-loading motion are defined in
[globals.css](../src/styles/globals.css) and
[animations.css](../src/styles/animations.css). React scroll entrances use
[ScrollReveal](../src/components/shared/scroll-reveal.tsx). Reduced-motion
visibility and hydration regressions are covered by the
[skip-link and motion suite](../e2e/acceptance/a11y-skip-and-motion.spec.ts).

Keep visible keyboard focus and readable text in both themes. Touch-target and
chat-dismissal contracts are maintained in
[the acceptance criteria](acceptance-criteria.md#8-responsiveness) and
[chatbot criteria](acceptance-criteria.md#ac-026c-chatbot-cancels-abandoned-or-duplicate-requests).
