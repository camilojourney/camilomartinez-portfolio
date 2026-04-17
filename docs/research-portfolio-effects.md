# Portfolio Effects & Interactions Research (2025-2026)

> Research conducted March 2026. Sources from Awwwards, Codrops, Chrome DevRel, MDN, and individual portfolio sites.

---

## 1. The 5 Most Impressive Developer Portfolio Sites RIGHT NOW

### 1.1 Bruno Simon — [bruno-simon.com](https://bruno-simon.com)
- **What:** Full 3D interactive world where visitors drive a virtual jeep through a physics-based environment to explore projects. Built with Three.js + Cannon.js for physics.
- **Why it stands out:** 400k+ visitors. Awwwards Site of the Month. Turns the portfolio into a game — visitors remember the experience, not just the content.
- **Technique:** WebGL scene graph, rigid-body physics simulation, custom camera following system, 3D model loading (GLTF), texture baking for performance.
- **Difficulty:** 5/5

### 1.2 Rauno Freiberg — [rauno.me](https://rauno.me)
- **What:** Staff Design Engineer at Vercel (previously Arc browser). OS-inspired interface with dock navigation, interface sounds, atmospheric abstract backgrounds, and horizontal project feeds.
- **Why it stands out:** Obsessive craft and polish. Dark mode with perfectly chosen tones. "Snappy" cubic-bezier transitions. Design manifesto: "Make it fast. Make it beautiful. Make it consistent. Make it carefully. Make it timeless. Make it soulful. Make it."
- **Technique:** Next.js, CSS custom properties design system, class-based dark mode toggle, JetBrains Mono for code, system font stack, geometric shapes with absolute positioning.
- **Difficulty:** 3/5

### 1.3 Lusion — [lusion.co](https://lusion.co)
- **What:** Award-winning creative studio portfolio. Won CSS Design Awards Website of the Year. Full 3D visual storytelling with interactive WebGL experiences.
- **Why it stands out:** Production-quality 3D that loads fast. Each project showcase is its own immersive experience. Pushes what's possible in the browser.
- **Technique:** Custom WebGL/WebGPU engine, shader-based transitions, 3D scene management, progressive loading.
- **Difficulty:** 5/5

### 1.4 Paco Coursey — [paco.me](https://paco.me)
- **What:** Design engineer at Linear (formerly Vercel). Radically minimal — markdown-style formatting, zero decoration, pure typography and whitespace.
- **Why it stands out:** Proves that restraint IS a statement. Created cmdk (the command palette component used by Vercel, Linear, and downloaded millions of times/week). The portfolio's simplicity signals supreme confidence.
- **Technique:** Next.js static export, perfect dark mode implementation, component-first architecture.
- **Difficulty:** 2/5

### 1.5 Emil Kowalski — [emilkowal.ski](https://emilkowal.ski)
- **What:** Design Engineer. Created Sonner (25M+ weekly npm downloads, default toast in shadcn/ui). Single-column focused layout at 692px max-width.
- **Why it stands out:** Writes "You Don't Need Animations" while being one of the best animators on the web. Every interaction is intentional — hover states with exact color values, theme toggle with localStorage persistence, system preference detection.
- **Technique:** Next.js + React, CSS class manipulation for themes, subtle hover feedback, restrained motion design.
- **Difficulty:** 2/5

### Honorable Mentions
- **Lee Robinson** — [leerob.com](https://leerob.com): VP at Vercel. Schema.org structured data, Spotify integration, system-preference dark mode. The "content-first portfolio" archetype.
- **Dennis Snellenberg** — [dennissnellenberg.com](https://dennissnellenberg.com): Freelance designer/developer from Netherlands. Tailor-made interactive sites from scratch.
- **Louis Paquet** — Awwwards Independent of the Year 2025.
- **Stefan Vitasovic** — Featured Codrops case study 2025.
- **Martin Laxenaire** — Portfolio is a WebGPU game built on his own custom engine (gpu-curtains).

---

## 2. WebGL / Three.js / R3F Effects

### 2.1 GPGPU Particle Morphing
- **What:** Hundreds of thousands of particles morph between 3D shapes using GPU compute. Particles read position data from Float textures (FBO/GPGPU technique) and interpolate between source and target positions.
- **Example:** [Codrops GPGPU Dreamy Particles](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)
- **Key uniforms:** `uProgress` (morph amount), custom velocity attributes, wave motion via `sin(x * freq + time) * amplitude`
- **Difficulty:** 4/5

### 2.2 Dissolve Effect with Shader Particles
- **What:** Objects dissolve using Perlin noise in the fragment shader. Fragments below a threshold are discarded, edge fragments glow, and particles emit from dissolving edges with additive blending.
- **Example:** [Codrops Dissolve Effect](https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/)
- **Shader logic:** `if(noise < uProgress) discard; if(noise < edgeWidth) emit edge glow`
- **Enhancement:** Selective Unreal Bloom via Effect Composer — render bloom to off-screen buffer, composite with base scene.
- **Difficulty:** 4/5

### 2.3 Particles Transition with Bloom
- **What:** Real-time WebGL experiment that morphs an image into a particle field and back, driven by GPU simulation. January 2026.
- **Example:** [Three.js Forum — Particles Transition Bloom](https://discourse.threejs.org/t/particles-transition-bloom/89382)
- **Technique:** FBO simulation, progress-controlled morph, radial point-sprite masking for transparency.
- **Difficulty:** 4/5

### 2.4 wawa-vfx (R3F Particle System)
- **What:** Lightweight, composable VFX engine for React Three Fiber. GPU-accelerated particles, bursts, and trails.
- **Link:** [wawasensei.dev/blog/wawa-vfx](https://wawasensei.dev/blog/wawa-vfx-open-source-particle-system-for-react-three-fiber-projects)
- **Why use it:** Drop-in R3F components, declarative API, handles GPU compute internally.
- **Difficulty:** 2/5

### 2.5 WebGPU + Compute Shaders (The New Frontier)
- **What:** Since Three.js r171 (Sept 2025), WebGPU is production-ready: `import from 'three/webgpu'` with automatic WebGL 2 fallback. Compute shaders deliver 10-100x performance gains for particle systems.
- **Browser support:** Chrome 111+, Edge 111+, Firefox 133+, Safari 26+ (shipped Sept 2025). ~70% global coverage in 2026.
- **Portfolio example:** Martin Laxenaire's portfolio is a full WebGPU game with lights, shadows, compute shaders, glTF support, deferred rendering.
- **Key advantage:** GPU-driven simulations (ink/smoke cursor effects, physics, ML inference) that were impossible with WebGL alone.
- **Difficulty:** 5/5

### 2.6 Fluid Simulation Scene Blending
- **What:** Using Three.js to blend two scenes with a fluid simulation, creating smooth dynamic reveal effects. Featured in Codrops 2025 year-in-review.
- **Difficulty:** 4/5

---

## 3. Scroll-Driven Animations

### 3.1 CSS Scroll-Driven Animations API (Native)
- **What:** Pure CSS scroll-linked animations using `animation-timeline: scroll()` and `animation-timeline: view()`. No JavaScript required.
- **Browser support:** Chrome 115+, Edge 115+, Firefox 110+ (behind flag), Safari 18+ (partial).
- **Best practice:** Progressive enhancement — check for native support, fall back to GSAP ScrollTrigger.
- **Use case:** Parallax effects, progress bars, element reveal-on-scroll without JS overhead.
- **Difficulty:** 2/5

### 3.2 GSAP ScrollTrigger + ScrollSmoother
- **What:** Industry standard for scroll-driven animations. Now completely free (Webflow acquired GSAP in 2024). Pin elements, scrub animations, parallax galleries.
- **Example:** [Codrops Layered Zoom Scroll Effect](https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/)
- **Technique:** ScrollSmoother provides inertia-based smooth scrolling, ScrollTrigger calculates trigger points upfront for performance.
- **Difficulty:** 3/5

### 3.3 3D Scroll-Driven Text Animations
- **What:** Combining CSS 3D transforms with GSAP ScrollTrigger to link 3D text rotation/perspective to scroll position.
- **Example:** [Codrops 3D Scroll Text](https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/)
- **Difficulty:** 3/5

### 3.4 Scroll-Driven Timeline (Career/Project History)
- **What:** A vertical or horizontal timeline where each milestone animates into view as the user scrolls. Combines pinning, staggered reveals, and progress indicators.
- **Example:** [Build with Matija — ScrollTrigger React Timeline](https://www.buildwithmatija.com/blog/gsap-scrolltrigger-react-timeline)
- **Difficulty:** 3/5

### 3.5 Cinematic Scroll Experiences
- **What:** "The Spark" by Codrops — a scroll-driven web experience combining story, motion, sound, and performance. Scroll becomes the playback controller for a narrative.
- **Difficulty:** 5/5

---

## 4. Interactive Data Visualizations

### 4.1 Real-Time GitHub/Coding Activity Dashboard
- **What:** Live-updating charts showing commit frequency, language breakdown, contribution streaks pulled from GitHub API.
- **Libraries:** D3.js, Recharts, or Nivo for React. GitHub REST/GraphQL API.
- **Why impressive:** Shows you actually build things. Real data > mock data.
- **Difficulty:** 3/5

### 4.2 Live System Metrics Dashboard
- **What:** Real-time infrastructure metrics (API latency, uptime, request counts) displayed with WebSocket-driven updates.
- **Tech:** InfluxDB/Prometheus for storage, Grafana-style visualizations, WebSocket or SSE for live updates.
- **Difficulty:** 4/5

### 4.3 AI/ML Experiment Visualizer
- **What:** Interactive visualization of training runs, loss curves, attention heatmaps, or model architecture diagrams.
- **Libraries:** Plotly.js for interactive charts, custom WebGL for attention visualization.
- **Why it works:** Demonstrates ML engineering skill visually — hiring managers can SEE the competence.
- **Difficulty:** 4/5

### 4.4 Spotify/Music Integration
- **What:** Display currently playing track (like Lee Robinson's site), listening history visualizations, audio feature analysis.
- **API:** Spotify Web API for real-time "now playing" data.
- **Difficulty:** 2/5

### 4.5 Interactive Architecture Diagrams
- **What:** Clickable system architecture diagrams where each component reveals implementation details, tech stack, and performance metrics.
- **Libraries:** React Flow, D3.js force-directed graphs.
- **Difficulty:** 3/5

---

## 5. Premium Micro-Interactions

### 5.1 Adaptive Morphing Cursor
- **What:** Custom cursor that morphs shape/size based on what it hovers over — expands on links, becomes a crosshair on images, shows preview text on projects.
- **Library:** Motion+ Cursor (motion.dev) — auto-adapts to links, text, buttons.
- **Implementation:** Track mouse position with `requestAnimationFrame`, apply spring physics for smooth following, use `mix-blend-mode: difference` for contrast.
- **Difficulty:** 3/5

### 5.2 Magnetic Buttons
- **What:** Buttons that subtly pull toward the cursor when nearby, then snap back on mouse leave. Creates a tactile, "sticky" feel.
- **Implementation:** Calculate distance from cursor to button center, apply proportional transform translation within a threshold radius. Use spring easing for natural snap-back.
- **Difficulty:** 2/5

### 5.3 Stacking Toast Notifications (Sonner Pattern)
- **What:** Toasts that stack with smooth animation — older ones compress behind newer ones. Created by Emil Kowalski, now used by Cursor, X, Vercel.
- **Why novel:** The stacking animation was done by some companies but never open-sourced. Uses Observer Pattern instead of React Context for state management.
- **Library:** [Sonner](https://sonner.emilkowal.ski)
- **Difficulty:** 1/5 (using the library) / 4/5 (building from scratch)

### 5.4 Text Reveal Animations
- **What:** Characters or words animate in one-by-one with staggered delays. Options: clip-path reveal, y-translate + opacity, blur-to-sharp, character-by-character typewriter with cursor.
- **Best practice:** 200ms transition duration for optimal feel. Use `will-change: transform` for GPU acceleration.
- **Libraries:** Motion (Framer Motion), GSAP SplitText.
- **Difficulty:** 2/5

### 5.5 Cursor Trail Effects
- **What:** Images, particles, or geometric shapes that follow the cursor with trailing delay, creating a ribbon or constellation effect.
- **Example:** Motion for React has built-in cursor trail with images documentation.
- **Difficulty:** 3/5

### 5.6 Hover Typography Shifts
- **What:** On hover, text subtly shifts weight, letter-spacing, or color. Buttons morph shape (rounded to sharp, or vice versa). Uses variable fonts for smooth weight transitions.
- **Optimal timing:** 200ms transition duration.
- **Difficulty:** 1/5

---

## 6. Novel Navigation Patterns

### 6.1 Command Palette (Cmd+K)
- **What:** Keyboard-triggered search/navigation overlay. Type to fuzzy-search pages, projects, blog posts. Used by Linear, Vercel, Raycast.
- **Library:** [cmdk](https://github.com/pacocoursey/cmdk) — unstyled, accessible, React 18. Created by Paco Coursey, used by Rauno Freiberg at Vercel.
- **Why for a portfolio:** Signals engineering sophistication. Power users love it. Can search projects, skills, blog posts, even trigger Easter eggs.
- **Difficulty:** 2/5

### 6.2 Liquid Glass Navigation (Apple WWDC 2025)
- **What:** Translucent frosted-glass nav elements that dynamically refract and distort the background. Specular highlights respond to movement.
- **CSS core:** `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.1)`, gradient borders, layered z-index.
- **Tools:** [Liquid Glass CSS Generator](https://liquidglassgen.com/) for quick prototyping.
- **Caution:** Beta testers report legibility issues. Use sparingly — nav text must remain readable.
- **Difficulty:** 2/5

### 6.3 OS-Style Dock Navigation
- **What:** macOS-style dock at the bottom of the page with magnification effect on hover. Used by Rauno Freiberg.
- **Implementation:** Horizontal icon bar with scale transform based on distance from cursor. Spring physics for bounce. Interface sounds on click.
- **Difficulty:** 3/5

### 6.4 Gesture-Based Navigation
- **What:** Swipe between projects on mobile, drag-to-dismiss modals, pinch-to-zoom on project images.
- **Library:** `use-gesture` (React) combined with Motion spring animations.
- **Difficulty:** 3/5

### 6.5 Windows 98 / Retro OS Navigation
- **What:** Jordan Cruz-Correa's portfolio recreates Windows 98 — working Notepad, recycle bin, draggable windows. Nostalgic and memorable.
- **Difficulty:** 4/5

---

## 7. What Top Company Engineers' Sites Look Like

### Vercel Engineers
| Engineer | Site | Style |
|----------|------|-------|
| **Rauno Freiberg** (Staff Design Eng) | [rauno.me](https://rauno.me) | OS-inspired, dock nav, dark atmospheric, interface sounds, geometric shapes |
| **Paco Coursey** (now at Linear) | [paco.me](https://paco.me) | Radical minimalism, markdown-style, zero decoration, typography-only |
| **Lee Robinson** (VP) | [leerob.com](https://leerob.com) | Clean minimal, Schema.org structured data, Spotify integration, system-preference dark mode |
| **Emil Kowalski** (Design Eng) | [emilkowal.ski](https://emilkowal.ski) | Single-column 692px, restrained animations, theme toggle, project showcases |

### Common Patterns Among Top Engineers
1. **Next.js** — Every single one uses it
2. **System font stacks** — No custom font loading delays (Rauno uses system fonts + JetBrains Mono)
3. **Content over flash** — Writing, open-source projects, and shipped work matter more than effects
4. **Dark mode done right** — System preference detection + manual toggle + localStorage persistence
5. **Performance obsession** — Static export, minimal JS, no loading spinners
6. **Personal brand signals** — Rauno's design manifesto, Paco's "altar of hard work", Emil's restrained animation philosophy

### The Paradox
The best engineers' portfolios are often the simplest visually — their open-source work (cmdk, Sonner, Next.js contributions) IS the portfolio. The site just needs to be the best version of simple.

---

## 8. Dark Mode Implementations That Feel Luxurious

### 8.1 Surface Hierarchy System
- **What:** Instead of "light vs dark," design a layered surface system: base (#0A0A0A), raised (#141414), overlay (#1E1E1E). Each layer separated by subtle lightness shifts, not borders.
- **Accent colors:** Saturated colors pop on dark backgrounds — use sparingly for primary actions only.
- **Example:** Linear's interface uses this pattern extensively.
- **Difficulty:** 2/5

### 8.2 System Preference Detection + Manual Toggle + Persistence
- **What:** Default to `prefers-color-scheme`, allow manual override, persist choice in localStorage. Lee Robinson disables transitions during theme switch to prevent jarring color flashes.
- **Implementation:**
  ```js
  const theme = localStorage.getItem('theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.add(theme);
  ```
- **Difficulty:** 1/5

### 8.3 Color Palette Best Practices (2025)
- **Never use pure black (#000000)** — use dark grays: #0A0A0A, #141414, #1B1B1B, #242424
- **Background recommendations:** #181A1B (warm dark), #23272F (React docs blue-dark), #14213D (deep navy)
- **Text:** #E5E5E5 for primary, #A3A3A3 for secondary (avoid pure white #FFFFFF)
- **Accent restraint:** Limit saturated accent colors to key actions and states
- **Difficulty:** 1/5

### 8.4 Adaptive Media
- **What:** Images balanced for light mode feel too bright in dark mode. Use adaptive containers with subtle scrims, toned borders, or `filter: brightness(0.8)` in dark mode.
- **Difficulty:** 1/5

### 8.5 Animated Theme Transitions
- **What:** Instead of instant swap, animate the theme change — circular reveal from the toggle button, or cross-fade. Use View Transitions API for smooth morphing.
- **Caution:** Rauno and Lee both keep transitions instant/disabled during switch — speed > animation for frequent toggles.
- **Difficulty:** 3/5

---

## 9. Performance Tricks for Heavy Animations

### 9.1 View Transitions API
- **What:** Native browser API for animated transitions between DOM states. Captures before/after snapshots and cross-fades. Works for SPAs and MPAs.
- **Support:** Chrome 111+, Edge 111+, Firefox 133+, Safari 18+. (~70-75% global coverage, 2025).
- **Key benefit:** Makes sites feel faster even if they're slow — animations mask loading time.
- **Implementation:** `document.startViewTransition(() => updateDOM())` with CSS `::view-transition-old` and `::view-transition-new` pseudo-elements.
- **Constraint:** Chrome bails on transitions taking >4 seconds. Pair with prerendering.
- **Difficulty:** 2/5

### 9.2 Speculation Rules API (Prerendering)
- **What:** Tell the browser to prerender pages the user is likely to visit next. Combined with View Transitions, navigation feels instant.
- **Implementation:** `<script type="speculationrules">{"prerender": [{"urls": ["/projects", "/about"]}]}</script>`
- **Difficulty:** 1/5

### 9.3 Progressive 3D Loading
- **What:** Show a low-poly placeholder or 2D fallback while the full 3D scene loads. Use `Suspense` in R3F with loading indicators.
- **Technique:** Texture compression (KTX2/Basis), mesh optimization (Draco/Meshopt), level-of-detail (LOD) switching.
- **Difficulty:** 3/5

### 9.4 GPU Compositing Hints
- **What:** Use `will-change: transform` and `contain: layout style paint` to hint the browser to promote elements to their own compositor layer.
- **Caution:** Over-using `will-change` causes memory bloat. Apply only during active animations, remove after.
- **Difficulty:** 1/5

### 9.5 Offscreen Canvas for Heavy Computation
- **What:** Move Three.js/WebGL rendering to a Web Worker via OffscreenCanvas. Main thread stays responsive for UI interactions.
- **Support:** Chrome, Edge, Firefox. Not Safari (as of early 2026).
- **Difficulty:** 3/5

### 9.6 Content Visibility
- **What:** `content-visibility: auto` on below-fold sections. Browser skips rendering until elements are near the viewport, reducing initial paint time.
- **Savings:** Can reduce rendering work by 50%+ on long pages.
- **Difficulty:** 1/5

---

## 10. AI-Powered Portfolio Features

### 10.1 Resume Chatbot (RAG-based)
- **What:** An AI chatbot embedded in the portfolio that answers questions about your experience, projects, and skills. Trained on your resume/CV via RAG (Retrieval-Augmented Generation).
- **Tools:** [Chatfolio](https://creati.ai/ai-tools/chatfolio/) (no-code), or custom with Vercel AI SDK + OpenAI/Anthropic API + vector store (Pinecone/Supabase pgvector).
- **Example:** [smart-portfolio](https://github.com/medevs/smart-portfolio) — Next.js portfolio with AI chatbot that answers questions about you.
- **Why it works:** Hiring managers can ask "What's your experience with distributed systems?" and get an instant, contextualized answer. Available 24/7.
- **Difficulty:** 3/5 (with Vercel AI SDK) / 1/5 (with Chatfolio)

### 10.2 Live AI Project Demos
- **What:** Embed interactive demos of your AI/ML projects directly in the portfolio. Example: a text classifier, image generator, or code completion tool running in the browser.
- **Tech:** ONNX Runtime Web for client-side inference, Transformers.js for Hugging Face models in the browser, or server-side API with streaming responses.
- **Difficulty:** 4/5

### 10.3 AI-Generated Project Summaries
- **What:** When a visitor clicks a project, an AI generates a contextual summary based on who's visiting (recruiter vs engineer vs designer) using URL parameters or a role selector.
- **Difficulty:** 3/5

### 10.4 Voice-Interactive Portfolio
- **What:** "Talk to my portfolio" — voice input triggers AI responses about your work. Uses Web Speech API for recognition + AI for response + speech synthesis for output.
- **Difficulty:** 4/5

### 10.5 AI Code Review Demo
- **What:** Paste code into an embedded editor, your portfolio's AI reviews it and suggests improvements. Demonstrates engineering judgment, not just coding ability.
- **Difficulty:** 4/5

---

## Implementation Priority Matrix

For a software engineer portfolio targeting top AI companies (Anthropic, Vercel, Linear):

### Tier 1 — Must Have (High Impact, Reasonable Effort)
| Feature | Difficulty | Impact |
|---------|-----------|--------|
| Dark mode with surface hierarchy | 2/5 | High — signals design sensibility |
| Command palette (cmdk) | 2/5 | High — signals engineering culture fit |
| View Transitions API | 2/5 | High — site feels instant |
| Text reveal animations | 2/5 | Medium — premium feel |
| System preference dark mode + persistence | 1/5 | High — expected baseline |

### Tier 2 — Differentiators (Medium Effort, High Wow Factor)
| Feature | Difficulty | Impact |
|---------|-----------|--------|
| GSAP ScrollTrigger project timeline | 3/5 | High — tells your story |
| Resume chatbot (Vercel AI SDK) | 3/5 | Very High — memorable + useful |
| Magnetic buttons + morphing cursor | 2-3/5 | Medium — premium feel |
| GitHub activity visualization | 3/5 | Medium — shows you ship |
| Speculation Rules prerendering | 1/5 | Medium — instant navigation |

### Tier 3 — Wow Factor (High Effort, Maximum Impression)
| Feature | Difficulty | Impact |
|---------|-----------|--------|
| GPGPU particle morphing hero | 4/5 | Very High — unforgettable first impression |
| Live AI project demo | 4/5 | Very High — proves competence |
| WebGPU compute shader effects | 5/5 | High — bleeding edge signal |
| Dissolve shader transitions | 4/5 | High — cinematic quality |
| Scroll-driven 3D narrative | 5/5 | Very High — storytelling power |

### The Rauno/Paco Paradox
The most respected engineers in the industry have the simplest portfolios. Their open-source work, writing, and shipped products ARE the portfolio. The site just needs to be the best possible version of simple. If you build impressive effects, they should serve the content — not replace it.

**Recommended approach:** Start with Tier 1 (perfect the fundamentals), add 2-3 items from Tier 2 (differentiate), and pick ONE item from Tier 3 (create a signature moment).

---

## Key Libraries & Tools Reference

| Library | Purpose | Link |
|---------|---------|------|
| cmdk | Command palette | [github.com/pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) |
| Sonner | Toast notifications | [sonner.emilkowal.ski](https://sonner.emilkowal.ski) |
| Motion (Framer Motion) | React animations | [motion.dev](https://motion.dev) |
| GSAP + ScrollTrigger | Scroll animations | [gsap.com/scroll](https://gsap.com/scroll) |
| Three.js (WebGPU) | 3D graphics | `import from 'three/webgpu'` |
| wawa-vfx | R3F particles | [wawasensei.dev](https://wawasensei.dev/blog/wawa-vfx-open-source-particle-system-for-react-three-fiber-projects) |
| three.quarks | Particle system | [github.com/Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks) |
| Vercel AI SDK | AI chatbot | [sdk.vercel.ai](https://sdk.vercel.ai) |
| Transformers.js | Browser ML | [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js) |
| Liquid Glass Gen | Glass effects | [liquidglassgen.com](https://liquidglassgen.com) |

---

## Sources

- [Awwwards Best Portfolios](https://www.awwwards.com/websites/portfolio/)
- [Awwwards Annual Awards 2025](https://www.awwwards.com/annual-awards-2025/)
- [Codrops 2025 Year in Review](https://tympanus.net/codrops/2025/12/29/2025-a-very-special-year-in-review/)
- [Codrops GPGPU Particles Tutorial](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)
- [Codrops Dissolve Effect Tutorial](https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/)
- [Codrops 3D Scroll Text](https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/)
- [Codrops Layered Zoom Scroll](https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/)
- [Chrome View Transitions 2025 Update](https://developer.chrome.com/blog/view-transitions-in-2025)
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Motion (Framer Motion)](https://motion.dev)
- [WebGPU Three.js Migration Guide](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [WebGPU 2026 Browser Support](https://byteiota.com/webgpu-2026-70-browser-support-15x-performance-gains/)
- [Apple Liquid Glass CSS](https://dev.to/gruszdev/apples-liquid-glass-revolution-how-glassmorphism-is-shaping-ui-design-in-2025-with-css-code-1221)
- [CSS Tricks Liquid Glass](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Dark Mode Best Practices 2025](https://muksalcreative.com/2025/07/26/dark-mode-design-best-practices-2025/)
- [Dark Mode Color Palettes Guide](https://mypalettetool.com/blog/dark-mode-color-palettes)
- [Chatfolio AI Portfolio Chatbot](https://creati.ai/ai-tools/chatfolio/)
- [smart-portfolio GitHub](https://github.com/medevs/smart-portfolio)
- [Rauno Freiberg on Killer Portfolio](https://www.killerportfolio.com/by/rauno-freiberg)
- [Paco Coursey on ui.land](https://ui.land/interviews/paco-coursey)
- [Emil Kowalski Portfolio](https://emilkowal.ski)
- [wawa-vfx](https://wawasensei.dev/blog/wawa-vfx-open-source-particle-system-for-react-three-fiber-projects)
- [Martin Laxenaire WebGPU Portfolio](https://www.webgpu.com/showcase/martin-laxenaire-portfolio-webgpu-game-gpu-curtains/)
- [Colorlib Developer Portfolios 2026](https://colorlib.com/wp/developer-portfolios/)
