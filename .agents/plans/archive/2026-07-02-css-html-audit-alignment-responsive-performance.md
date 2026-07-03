# Audit: CSS/HTML Alignment, Defaults, Responsiveness, Performance - 2026-07-02

Static audit of the modular CSS tree and route HTML. Companion to `2026-07-02-triage-css-spw-physics.md` and the same-day mode-switch intent-contract session. Findings are ranked P1-P3 with owner-plan routing; nothing here was changed in this pass.

## Performance

**P1 - CSS delivery: the bundle architecture is built but unwired.**
Every audited route (`/`, about, topics, services, play, blog, recipes, contact) links `/public/css/style.css`, which resolves through a three-level `@import` chain: style.css (37 imports) -> style-core.css (82 imports) -> nested font imports. That is ~119 render-blocking CSS requests and ~2.4 MB uncompressed CSS per route, with serial discovery depth of 3-4 round trips before first render. Meanwhile `scripts/css-bundle.mjs` already generates `bundles/core.css` plus per-route and per-behavior bundles, and the homepage even carries `data-spw-stylesheet-mode="scoped"` - but no HTML links a bundle and no JS or build step reads the attribute. Wiring routes to `bundles/core.css` + one route bundle collapses the chain to 2 requests. Owner: `runtime-bootstrap-performance/` (delivery posture) with `site-starter-component-kit/` for the compose boundary.

**P1 - Google Fonts are imported at level 3 of the CSS chain with no preconnect.**
`style-core.css` lines 7 and 11 `@import` two fonts.googleapis.com stylesheets (JetBrains Mono, Newsreader). Font CSS discovery waits for the full style.css -> style-core.css chain, and there is no `<link rel="preconnect">` to fonts.googleapis.com / fonts.gstatic.com in any audited head. Move font loading to `<link>` tags in HTML heads (or the head template) with preconnect hints; `display=swap` is already correct.

**P2 - `bundles/core.css` is 1.44 MB, which says core owns too much.**
A shared kernel that large means route-specific weight is riding in the shared layers. As `css-maintainability-refactor/` continues selector-ownership cleanup, route-only rules found in shared files should migrate to route surfaces so the core bundle shrinks toward a kernel.

**P3 - 138 `:has()` selectors sitewide.**
Acceptable per-page today; worth watching on DOM-heavy routes (blog, plans). The maintainability plan already scopes ":has removal" as explicit opt-in work, not a sweep.

**Healthy:** one `type="module"` script per page; all 16 `infinite` animations live in files with `prefers-reduced-motion` blocks (58 files carry reduced-motion handling); only one raw `100vw` in the tree; container queries in active use.

## Device Responsiveness

**P2 - Breakpoint sprawl with mixed units.**
20+ distinct `max-width` query values, mixing px and rem: 720px (79 uses) dominates, but 640px, 760px, 820px, 560px, 520px, 48rem, 40rem, and 32rem all have double-digit or near use. px and rem queries respond differently to user font-size zoom, so the same layout can break at different effective widths per file. Recommendation: document a canonical breakpoint scale (e.g., in `tokens/core.css` comments or a `.spw` convention) and converge opportunistically per touch - not a sweep. Owner: `component-box-model-responsive-audit/` or `content-responsive-layout/`.

**Healthy:** correct viewport meta on every audited route; `--touch-target-min: 2.75rem` (44px) as the shared floor; `env(safe-area-inset-*)` handled in shell; no fixed element widths >= 24rem; `minmax(min(100%, X), 1fr)` grid pattern in route grids; overflow safety owned once in `reset/base.css`.

## Alignment And Reasonable Defaults

**Healthy baseline:** global `box-sizing: border-box`; focus-ring tokens (`--focus-ring-color`, offset) defined at root; a coherent flow-gap scale (`--flow-gap-2xs` through `--flow-gap-2xl`) plus clamp-based section rhythm; `--site-line-height: 1.68`; single `h1`, `lang="en"`, skip links, and full `alt` coverage on all sampled routes; `check:local` and `check-site.mjs` pass clean.

**P3 - Layer-order legibility hazard (documented, recurring).**
The `routes` < `handles` layer inversion means route-layer state declarations silently lose; the 2026-07-02 state-legibility increment migrated home/topics/rpg-wednesday and established `--mode-switch-*-intent`. Residual known case: `routes/surfaces/play.css` sections 6/9 (already queued as follow-up in `css-state-legibility/PLAN.md`). New route work must treat `-intent` variables as the only sanctioned specialization path.

## Suggested Execution Order

1. Font loading fix (small, self-contained, immediate LCP/FCP win on every route).
2. Wire scoped bundles on one pilot route, measure, then roll out (the largest single performance lever available; all machinery already exists).
3. Breakpoint scale documentation, then per-touch convergence.
4. Core-bundle diet as a standing posture inside `css-maintainability-refactor/`.
