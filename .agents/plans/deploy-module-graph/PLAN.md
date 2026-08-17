# Deploy Module Graph

## Public Goal
A first visit should feel like a local introduction: a small boot graph arrives first, richer catalogs introduce themselves by address, and `timings()` can name those dimensions. Authored `public/js` stays native ESM so the locality remains readable.

A catalog module earns its slot by a readable `describes` contract or by a distinct introduction (`when` / `timingArc`). Anonymous extra immediates are not worth recognizing.

**Recognition pass (2026-08-17):** Immediate is reserved for core boot and first-paint grammar (sigil split, operator annotate, bare-markup wrap, header nav-fit). Route widgets, inspect overlays, and measure narration arrive visible or idle. Keyboard/phase listeners are visible — not interaction — so the first key is not spent waking the module.

**Arrival attributes:** Layout tokens follow authored `data-spw-hydration`, not a late pass write. Phase/rail/measure attrs must look complete when absent and strip on cleanup. Load hosts stay as specific as the module's offer.

**Token cluster:** `--spw-lifecycle-presence` and `--spw-interaction-phase-weight` live in `tokens/dimensions.css` (temporal). Hydration pass surface is an alias. Phase weight is multiplied by `--spw-enhancement-factor`. Rail arrival does not fade content — discharge stays on the wall (`arrival-electrostatics`).

## Non-Goals & Boundaries
- Vite is not the deploy artifact (`dist-vite/` stays a smoke build)
- No SPA, client router, or new npm packages (rolldown already ships with Vite 8)
- Do not rewrite all `/public/js` imports to relative paths
- Do not fold catalog `import()` targets into the boot chunk
- Phase 3 CSS core weight is a later landing

## Seams & Minimal Touch Files
- Build: `scripts/ts/build/index.mts`, `scripts/template.mjs`, `sw.js`
- Runtime: `public/js/site.js`, `public/js/runtime/module-catalog*.js`
- Track here; cross-link `runtime-bootstrap-performance` only

## Validation Steps
1. `node --check public/js/site.js public/js/runtime/module-catalog.js public/js/runtime/module-catalog-normalize.js`
2. `npm run build:tools`
3. `npm run check:runtime` and `npm run check:pwa`
4. `npm run check:local`
5. Browser: home, a long editorial route, and settings — boot is 1–3 JS files; catalog modules still arrive as `import()`s
