# Runtime Bootstrap Performance

## Public Goal

Reduce main-thread blocking time, serial dynamic import penalties, and observer/listener fragmentation in the shared JS runtime bootstrap (`site.js` + kernel/runtime modules) while preserving (and strengthening) the existing staged lifecycle model, policy-driven tuning surface, rich `spw:*` observability, and progressive-enhancement guarantees.

The outcome: pages reach `interactive` and first meaningful paint faster on typical connections and devices, especially on content-rich routes, without regressing the semantic density, editor inspectability, or "runtime as instrument" character of the site.

This work directly follows the 2026-04 script performance review and builds on the foundation laid by `runtime-load-instrumentation`, `runtime-module-fluency`, `js-runtime-composability`, and `mobile-runtime-foundation`.

## Cache And Metamaterial Lens

Performance work on this site is not only speed work. It should preserve the site's unique value as a hypermedia material: HTML, CSS, JS, `.spw`, images, plans, and local browser state should behave like layered media that can be inspected, tuned, returned to, and recombined.

Cache strata to keep distinct:

- **Transport cache:** browser cache, service worker routes, static assets, generated image variants, and sitemap/build artifacts. Goal: faster repeat visits without hiding deploy freshness.
- **Runtime module cache:** ESM import cache, module registry records, mount decisions, timing entries, and selector gate results. Goal: reduce repeated boot work while keeping mount reasons observable.
- **Semantic cache:** body metadata, `data-spw-*` contracts, design catalog outputs, `.spw` conventions, and plan indexes. Goal: let humans and agents recover meaning without rereading the whole codebase.
- **Interaction cache:** settings, pins, checkpoints, dismissed notices, visit-state, and reader posture. Goal: let return visits feel remembered without making volatile diagnostics permanent.
- **Cognitive cache:** repeated anatomy, route tropes, operator gestures, palette species, and copy patterns. Goal: reduce the reader's mental reparse cost while still allowing surprise and local nuance.

Optimization rule: a patch should say which cache stratum it improves, what should remain volatile, and how a visitor or editor can inspect the result. Do not persist a state only because it is convenient. Do persist or precompute when it improves return-visit continuity, route comprehension, or editor auditability.

Metacognitive utility: the runtime should help a reader notice how the page became meaningful. A fast page that explains its hydration, route posture, and local memory is stronger proof than a fast page that hides all structure.

## Current Baseline

**What already works well:**
- Explicit layered contract (`CORE` / `FEATURE` / `REGION` / `ENHANCEMENT`) with `MOUNT_WHEN` (immediate, visible, idle, interaction, region).
- Query-driven + dataset-driven runtime policy (`?spw-runtime-timing=quiet|defer|eager`, per-module overrides, `only`/`skip`, debug gating).
- Comprehensive instrumentation: `spw:*` Performance marks/measures, `spw-runtime` logger (LIFECYCLE), registry records, `snapshotRuntimeModules()`, `timings()`, module "spells", and `data-spw-module-*` / `data-spw-runtime-*` surfaces.
- Smart service worker (v2): core precache, network-first for navigations + shell assets, stale-while-revalidate for media, prefetch messaging.
- Layout-shift and heavy QA modules are debug-only by default.
- Centralized token writers (`updateRuntimeStateTokens`) that drive CSS rhythm/orchestration tokens.

**Identified performance costs (script performance review, 2026-04):**
- `mountImmediateLayer` (and similar loops) use serial `await mountDefinition(...)` → dynamic imports and mount work are serialized even when independent.
- High immediate surface: ~50+ `MOUNT_WHEN.IMMEDIATE` declarations. On rich pages many still qualify after selector/route checks.
- Heavy early modules:
  - `kernel/site-settings.js` (~102 KB / 2.9k LOC) is CORE immediate on every page. It owns palettes, developmental climate, author workflow, pin registry, cauldron storage, discovery dismissals, image visit state, etc.
  - Several ENHANCEMENT immediate modules (canvas-accents, image-metaphysics, svg-*, composition-box-model, semantic-crossrefs, attention-architecture, experiential, haptics, etc.) each perform queryAll + listener + observer setup.
- Observer fragmentation: 53+ observer/listener setups across ~24 files (multiple dedicated IntersectionObservers for regions, visible features, attention sections, plus per-module observers in canvas/image/svg surfaces).
- Per-module mount overhead: every module writes 8–12 dataset attributes, pushes lifecycle stages, emits on bus (history + legacy + charge), and participates in token/rhythm sync.
- `site.js` entry itself is 121 KB (orchestrator + contracts + helpers) — acceptable for the richness, but the combination of entry + immediate dynamic imports creates measurable parse/execute cost before `interactive`.

Total runtime JS across the tree is ~1.85 MB (uncompressed); lazy loading helps, but the *width* of the immediate layer and serialization inside it are the dominant first-load costs.

No new framework or heavy client dependencies are involved. The site remains hand-authored static HTML + progressive enhancement.

## Scope (Smallest Honest Surfaces)

**Primary (Phase 1 — highest leverage, lowest risk):**
- `public/js/site.js`: parallelize the immediate mount loop(s); add lightweight batching + timing guards around the immediate layer.
- Minor comment/doc updates to the module contract header to document the new "parallel immediate" expectation.

**Secondary (Phase 2 — reclassification, still contained):**
- `public/js/kernel/site-settings.js`: identify cold subsystems that can safely move behind `VISIBLE` or `IDLE` (or be split into a lighter core + lazy features module) without losing settings persistence or page-level dataset application on first paint.
- A small number of ENHANCEMENT modules currently declared `IMMEDIATE` whose selectors are broad (canvas, image metaphysics, some semantic layers) — evaluate moving to `VISIBLE` where the visual payoff is not needed for initial reading posture.

**Cache / warm-return (Phase 2.5 — semantic performance, still progressive):**
- Classify settings, pins, checkpoints, dismissals, and visit-state as interaction cache with explicit ownership and reset paths.
- Decide whether selector-gate or route-manifest summaries should be precomputed at build time, derived once at boot, or left volatile.
- Ensure any warm-return improvement keeps a visible or inspectable explanation: root attributes, module timings, state inspector rows, console helpers, or `.spw` references.
- Treat cached meaning as a service flow: the page remembers enough to reduce friction, but not so much that a reader cannot understand or undo the remembered state.

**Later / supporting (Phase 3+):**
- Shared attention / region observer primitives (possible new small module under `runtime/` or augmentation of `attention-architecture.js` + `frame-metrics.js`).
- Optional "module budget" or cost hint in the existing runtime policy / discovery surfaces (purely additive, using the already-rich instrumentation).

**Out of scope for the initial plan:**
- Large rewrites of individual heavy modules (those are separate craft-quality or per-route passes).
- New visual chrome or data attributes unless they fall out of existing token writers.
- Changes to CSS layer ordering or the `ornament` contract.
- Anything that would require new npm dependencies.

When a reusable concept emerges (e.g., "load budget", "module cost class", "observer federation"), it will be modeled in `.spw` (likely an extension to `site-semantics.spw`, `narrative-instrumentation.spw`, or a lightweight new convention) and wired via the usual dispatch.

## Patch Sequence (Phased, Reviewable)

**Phase 0 — Orientation (this document)**
- Create `.agents/plans/runtime-bootstrap-performance/PLAN.md`.
- Cross-reference from `agent-optimization/PLAN.md`, `runtime-load-instrumentation/PLAN.md`, `runtime-module-fluency/PLAN.md`, and `js-runtime-composability/PLAN.md`.
- Run initial `spw-plan-maintenance` hygiene after the file lands (if the skill is active).

**Phase 1 — Parallel Immediate Mounts (smallest, highest-ROI patch)**
- Refactor `mountImmediateLayer` (and any identical patterns) to collect qualifying definitions then `await Promise.all(...)` (or small concurrent batches) while preserving any ordering invariants that actually exist.
- Add a single `performance.measure('spw:immediate-layer-parallel')` (or similar) so the existing instrumentation immediately shows the win.
- Keep the per-module `spw:module:*` marks/measures and logger events unchanged.
- Update the module contract comment in `site.js` to note the parallel expectation for independent immediate work.
- Validation: `node --check`, `git diff --check`, `npm run check`, smoke on home + a long content route with `?spw-runtime-timing=normal` and with `quiet`.

Implementation note: the per-layer mount loop is now concurrent, `site.js` keeps core immediate modules ordered first, and feature/enhancement immediate layers mount together with label-safe marks (`spw:immediate-layer:core:parallel`, `spw:immediate-layer:feature:parallel`, `spw:immediate-layer:enhancement:parallel`) plus `spw:immediate-non-core-layers` for the overlapped wave. Independent visible/idle prefetch hinting also runs concurrently after the immediate wave.

**Phase 2 — Immediate Layer Width Reduction (site-settings + selected enhancements)**
- Audit `kernel/site-settings.js` cold paths (storage for pins/cauldron/discovery/images that are not required for the first dataset application on `<html>`/`<body>`).
- Propose (and land) the smallest honest split or deferred mount for non-critical subsystems.
- Reclassify 3–6 broad ENHANCEMENT immediate modules to `VISIBLE` where the first meaningful paint does not depend on them.
- All changes remain behind the existing policy and selector gates; no behavior change for `eager` or debug postures.
- Use the already-landed `timings()` + Performance surfaces to quantify before/after on representative routes.

Implementation note: Phase 2a moved six selector-gated enhancement helpers from `IMMEDIATE` to `VISIBLE`: `gesture-anatomy`, `page-anatomy`, `ingredient-lab`, `image-discovery-rewards`, `local-memory-controls`, and `prompt-utils`. This keeps first-page readability, settings, shell disclosure, console/state surfaces, and core interaction state in the immediate wave while shifting helper, reward, prompt, and route-local lab work into near-viewport scheduling. `eager` and per-module timing overrides still provide the existing QA escape hatch.

**Phase 3 — Observer & Listener Consolidation (if measurement justifies it)**
- Evaluate a thin shared "region/attention observer coordinator" (or lightweight extension to existing attention-architecture primitives).
- Goal: fewer observer instances and callback thunks while keeping the same `data-spw-*` and bus outputs.
- Only if Phase 1+2 data shows observer setup or scroll/resize handler cost as a measurable secondary contributor.

**Phase 4 — Measurement, Documentation, and .spw Bridge (if new contracts emerge)**
- Add any new load-posture or cost-class vocabulary to the existing runtime discovery surfaces (no new public API unless it is clearly reusable).
- If "module cost class" or "bootstrap budget" becomes a stable, inspectable concept used by editors/agents beyond one patch, add a thin `.spw` note (e.g., extension of `query-disposition.spw` or `narrative-instrumentation.spw`) and run `spw-plan-maintenance`.
- Update AGENTS.md "Key files" table if the canonical edit surface for runtime timing policy or module classification changes.
- Public editor note (optional): a short addition to `/design/runtime/` or the settings diagnostics surface showing the new parallel/immediate timing data.

## Validation (Strict — per AGENTS.md)

For every landed patch:
- `git diff --check`
- `node --check public/js/site.js` (and any edited kernel/runtime modules)
- `npm run check` (full, or at minimum the typecheck + runtime build + check-site + generated checks portions)
- Targeted `rg` for the changed mount loops, policy paths, and any new timing marks
- Browser smoke (multiple routes, multiple timing policies):
  - DevTools Performance recording shows reduced "immediate layer" duration and better parallel network/parse lanes.
  - Existing `?log=spw-runtime&log-level=debug`, `window.__SPW_SITE__.timings()`, `snapshotModules()`, and module audit surfaces continue to work and report accurate numbers.
  - No regression in layout shift counts (use the debug-gated layout-shift-audit when needed).
  - Settings, gestures, operators, cauldron, and collection behavior remain fully functional.
- No new console errors or unhandled promise rejections in the load path.
- Mobile + desktop viewports; reduced-motion and save-data postures.

If a patch introduces a new reusable semantic family or runtime state contract, the corresponding `.spw` surface must be updated in the same or immediately following increment.

## Success Criteria

- Measurable reduction in time to `spw:page-interactive` / first `spw:module-mounted` wave on representative routes (home, topics index, long editorial page, services) under `normal` and `quiet` policies.
- The number of truly synchronous/await-serialized immediate dynamic imports drops significantly.
- Heavy subsystems in site-settings are no longer unconditionally parsed/executed on every page load for reading visitors.
- Observer count and total listener attachments trend down (or at least do not grow) while behavior is preserved.
- All existing editor/inspect/debug surfaces (`timings()`, module spells, bus history, data attributes, query recipes) remain as powerful or more so.
- The change set stays small, reviewable, and fully documented in this plan + code comments.

## Relation to Existing Plans & Surfaces

- Extends `runtime-load-instrumentation` (the marks/measures we will use to prove the wins already exist).
- Complements `runtime-module-fluency` and `js-runtime-composability` (the same files and mental model).
- Contributes to the broader agent-optimization track (lighter, faster runtime = better editor + visitor experience + easier future instrumentation).
- May produce a small new concept ("load class", "immediate cost") that belongs in `.spw/conventions/site-semantics.spw` or `query-disposition.spw`.

**Deeper ontology connection (added during consideration of selector timing, chunking, musical whitelabeling, and Spw workbench metaphysics):**
- Performance work on staged selectors and module chunks is itself a semantic precipitate. See the new `.spw/reviews/runtime-audit/selector-timing-chunking-musical-ontology.spw` (referenced from runtime-audit index) for the full mapping:
  - JS selector evaluation is already chunked by MOUNT_WHEN/layer (immediate boot checks, IntersectionObserver visible/region, interaction once-gates, rIC idle). CSS `:has()` + data-spw-* field selectors run as the continuous "live resonant field."
  - The existing MODULE_DEFS + OPERATOR_DEFINITIONS + region harmony/tempo/density + cauldron lifecycle + attention-field math are already a "musical" data structure set (operators as voices/forces, cauldron as mixer, attention-field as hall acoustics, spells as motifs). These are highly portable for whitelabel creative/musical website runtimes.
  - The spw-workbench (runtime-foundation.spw, theory models of algebra/physics/calculus, precipitates/projections, resonance registers) provides the extensible metaphysics: new technologies (WebAudio, spatial, agentic loops, etc.) can be modeled as new operators, pragmatic phases, or register banks without breaking discoverability or the wonder doctrine (structural revelation over spectacle).
- Future phases should model "selector/chunk cost" inside the existing evaluates/updates/describes vocabulary and treat musical projection affordances as first-class rather than afterthoughts.

**HTML structure + attribute timing connection (added 2026-04):**
- See the new `.spw/reviews/html-css-structure-audit.spw`. The timing of data-spw-* attribute writes (immediate vs visible/observer vs idle) has direct consequences for layout, cascade, and CLS. Early JS writes in the immediate layer can affect positioning and visual state before route CSS fully settles. This audit provides concrete input for any HTML-first strengthening or CSS guard work that would improve the effectiveness of the parallel immediate mounts and reduced serial cost targeted by this plan.

## Status

- [x] Plan written and placed under `.agents/plans/runtime-bootstrap-performance/`
- [x] Phase 0 cross-references added (listed in `.agents/plans/README.md` under high-signal runtime items; pointer added to `agent-optimization/PLAN.md`; discoverable via existing `@plans` / `@agent_optimization` dispatch in `.spw`)
- [x] Light `spw-plan-maintenance` sweep recorded (indexes + agent-optimization cross-link landed; no new durable semantic family yet so no immediate `.spw` dispatch change required)
- [x] Phase 1 patch (parallel immediate mounts) implemented; source/runtime validation passed, with `check:local` still reporting the refreshed generated core CSS bundle until that output is staged
- [x] Phase 2a patch (selected module reclassification) implemented; `site-settings` cold-path split remains future Phase 2b work
- [ ] Measurement baseline captured (before) and re-captured (after) using existing tooling
- [ ] .spw bridge added only if a stable new reusable contract emerges
- [ ] `spw-plan-maintenance` run after significant landings (per its skill contract)

## Follow-Up & Future Increments

- If the wins are large, consider a lightweight "runtime posture" preset in the settings surface (reader vs. resonant vs. lab) that bakes in good default timing policies.
- Long-term: a tiny build-time or catalog-time report of per-route "immediate module cost" (derived from the manifest + static analysis of defs) could live in the design catalog or a private editor surface — only if it proves low-maintenance.
- Long-term: a cache posture report could distinguish cold boot, warm return, restored posture, restored checkpoint, and debug/audit posture without requiring analytics or network services.
- Any canvas/SVG/image work that remains immediate for visual reasons can be further optimized inside those modules (e.g., rAF batching, off-main-thread where safe) as separate craft passes.

This plan stays faithful to the site's values: hand-authored, inspectable, progressive, semantically rich, and measured with the tools the runtime already provides.

---

**Created:** 2026-04 (following direct "review script performance" → "plan improvements" request)
**Tracking:** `.agents/plans/runtime-bootstrap-performance/PLAN.md`
**Primary edit surfaces:** `public/js/site.js`, `public/js/kernel/site-settings.js`, selected `public/js/runtime/*` and `public/js/interface/*` modules under existing gates.
