# Portfolio — Design System

## Identity
- **Product**: Camilo Martinez Portfolio — AI Engineer & Full-Stack Developer
- **Audience**: Recruiters, hiring managers, potential clients, tech community
- **Tone**: Professional, modern, tech-forward, personal brand

## Color System (HSL)

Dark-only design. No light mode toggle.

| Token | HSL Value | Hex | Use |
|-------|-----------|-----|-----|
| `--background` | 240 10% 3.9% | #0A0E27 | Page background (dark slate) |
| `--foreground` | 0 0% 98% | #FAFAFA | Primary text (near white) |
| `--primary` | 0 0% 98% | #FAFAFA | Primary actions |
| `--secondary` | 240 3.7% 15.9% | #292E3E | Secondary surfaces |
| `--muted-foreground` | 240 3.8% 46.1% | #758DA3 | Subtle text |
| `--accent` | 210 40% 96.1% | — | Accent highlights (light cyan) |

### Liquid Glass Colors
| Token | Value | Use |
|-------|-------|-----|
| `--glass-bg` | rgba(100, 116, 139, 0.1) | Glass surface |
| `--glass-border` | rgba(255, 255, 255, 0.1) | Glass edge |
| `--glass-shadow` | rgba(0, 0, 0, 0.37) | Glass depth |

### Syntax Highlighting
- Class: #4c97f8 (blue), String: #0fa295 (teal), Keyword: #f47067 (red)
- Property: #e25a1c (orange), Comment: #a19595 (brown), JSX: #6266d1 (purple)

## Typography

| Element | Font | Weight | Tracking |
|---------|------|--------|----------|
| Body | Geist Sans | 400 | -0.02em |
| Headings | Geist Sans | 600-700 | -0.03em |
| Code | Geist Mono / SF Mono | 400 | normal |

Line-height: 1.6 (body), 1.2 (headings)
Font features: cv03, cv04, cv11

## Spacing & Radius

| Token | Value |
|-------|-------|
| `--radius` | 0.75rem (12px) |
| Cards | 12px |
| Buttons | 8px |
| Pills | 20px |

## Components

**Library**: Minimal — custom-built with CVA + Radix Slot
**Icons**: Not specified (likely inline SVG)
**No chart library** — custom CSS/SVG where needed

**Liquid Glass System** (signature design pattern):
- `.liquid-glass` — base glassmorphism (blur 16px)
- `.liquid-glass-card` — enhanced blur + shadow (blur 32px)
- `.liquid-glass-nav` — navigation (blur 24px)
- `.liquid-glass-primary` — primary CTA with cyan glow
- `.liquid-glass-project` — project showcase
- `.liquid-glass-blog` — blog post cards

## Animations

| Name | Duration | Use |
|------|----------|-----|
| `fade-in` | — | Fade + upward slide |
| `slide-in` | — | Slide left + fade |
| `blob` | 7s | Organic blob motion |
| `liquid-float` | 12s | Floating + rotation |
| `concentric-pulse` | 8s | Pulsing scale |
| `gradient-xy` | 15s | 2D gradient animation |
| `pulse-slow` | 4s | Slow opacity pulse |

Delay classes: 2000ms, 3000ms, 4000ms, 6000ms

## Layout
- Dark-only, no theme toggle
- Full-page sections with liquid glass overlays
- Focus ring: cyan glow rgba(6, 182, 212, 0.5)
- Custom scrollbar styling
