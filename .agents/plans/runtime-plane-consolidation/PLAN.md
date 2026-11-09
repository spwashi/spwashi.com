# Runtime Plane Consolidation

**Status 2026-11-06.** Phases 0, 1, 4 and 5 are landed; Phase 2 is half done (the loader asks the selector last, 2026-09-28); Phase 3's read side is `kernel/measured-frame.js` and `kernel/viewport.js` (110d85e5). Nothing this plan owns has landed since 2026-10-10. The named next slice, making the capture-phase scroll listener at `public/js/interface/semantic-chrome.js:722` passive, is retired: a `scroll` event cannot be cancelled, so `passive` changes nothing, and its handler returns at once when no popover is open. Next slice: P1, `runPositioningPass` in `public/js/runtime/regions/positioning-orchestration.js` onto `createMeasuredLane`. It reads `window.innerWidth` and every tracked rect inside its own rAF, the shape abd30a20 fixed in spatial gravity. Gate: a pocket scroll trace before and after, per Phase 3. Counts re-probed 2026-11-06 across the six planes: 1,332 raw `.dataset.x =` against 597 `writeDatasetValue` (interface 345 → 349 since 2026-11-05), 31 MutationObservers, 13 scroll listeners, 69 `dispatchEvent(new CustomEvent(`, 13 files reading `getComputedStyle(document.documentElement)`. Owns the decomposition seam (absorbed below).

**Related:** [module-contract-overhaul](../module-contract-overhaul/PLAN.md) · [interaction-loop-contract](../archive/interaction-loop-contract/PLAN.md) (archived) · [core-css-spend-cut](../core-css-spend-cut/PLAN.md). **Absorbed 2026-10-10:** [runtime-module-decomposition](../archive/runtime-module-decomposition/PLAN.md), the leftovers of [js-surface-ecology](../archive/js-surface-ecology/PLAN.md).

**Architecture (the creator, 2026-11-08):** [runtime-library-architecture](../../../.spw/caches/runtime-library-architecture-2026-11.spw) hands this plan two slices. L2 inverts the kernel's lazy reach upward (9 imports, such as `instrumentation.js` reaching `runtime/diagnostics`) to registration hooks, one per patch. L6 gives cauldron (four folders today), labs and generated code one home each, and renames families by the question they answer (`page/` against `shell/`).

## Public Goal

Make the runtime's canonical contracts the *default path* rather than one option among several, so that the JS planes (`kernel/`, `runtime/`, `semantic/`, `interface/`, `modules/`) stop re-growing local copies of decisions that already have an owner.

Four decisions are re-implemented across the tree today: **how to write a property**, **how to observe the DOM**, **how to parse a Spw expression**, and **how to declare a mount**. Each has a canonical implementation in the repo. Each is bypassed by the majority of call sites. The cost surfaces as boot payload, forced style recalculation, ungrounded spatial vocabulary, and ~350 lines of catalog boilerplate.

The outcome: a smaller eager graph, route-scoped scheduling, one expression reader, and a spatial model whose vocabulary is derived from measured geometry instead of from synonym tables over authored labels — without losing the staged lifecycle, the `spw:*` observability, or the "runtime as instrument" character.

## Relationship To Existing Owners

This plan does not replace the existing runtime owners. It is the cross-plane adoption pass that they each assumed would happen:

- `runtime-bootstrap-performance` — owns boot timing and IMMEDIATE width. This plan supplies the route-scoping and build-payload work it deferred.
- `module-export-uniformity` — owns the export shape. This plan retires the 95 catalog adapters that made the shape optional.
- `runtime-module-decomposition` — owns "extract kernel contracts before splitting files." This plan is the adoption half.
- `css-sensitive-attribute-writes` — owns author-attribute protection. This plan supplies the guarded-write adoption that makes it enforceable.
- `semantic-navigation-geometry` — **closed 2026-07-26**, having landed `public/js/semantic/spw-expression-geometry.js` and the pinned browser parser artifact. This plan retires the four legacy parsers it left standing.

## Current Baseline (measured 2026-07-26, working tree)

### What already works

- Staged lifecycle with explicit `MODULE_LAYERS` / `MOUNT_WHEN`, policy overrides, `only`/`skip`, debug gating.
- `writeDatasetValue` (`kernel/dom-contracts.js:1474`) already does change-only writes — reads, compares, returns `false` without touching the DOM.
- `runtime/orchestration/dom-sync-hub.js` — one MutationObserver, one rAF, ordered task batch. The correct federation primitive.
- `observeAddedMatches` (`kernel/dom-contracts.js:1641`) — gates on matching added nodes, coalesces through rAF. Its docblock documents the two-modules-reacting-to-each-other hard freeze.
- `mountVisibleFeatures` (`runtime/orchestration/scheduler.js:86`) — drains IntersectionObserver waves through a 10 ms frame-budgeted queue.
- `IDLE_CHUNK_ORDER` — staggers idle mounts so residue listeners attach before collectible flourishes.
- `public/ts/bus.ts` — single emit path, frozen enriched payloads, history ring, `onAny`, legacy bridging.

### Measured costs

**Payload**
- Eager static import graph from `site.js`: **38 modules, 631.4 KB raw / 159.3 KB gzip**, blocking before the first mount.
- `dist/public/js`: **210 unbundled, unminified ES modules, 3.4 MB**. `scripts/build.mjs` has no minify or bundle step; files are content-hashed source. (2026-10-25: no longer so; [deploy-module-graph](../deploy-module-graph/PLAN.md) cut the deploy into semantic packs in f05b02d2.)
- `kernel/dom-contracts.js:12` imports `detectOperator` from `kernel/shared.js` — **69 KB, the largest file in the graph**, for one function. `shared.js` exports through two grouped `export { }` blocks, so nothing tree-shakes.

**Scheduling**
- 96 module definitions. **13 declare `route:`.** 91 declare `selector:`. (2026-10-25: 146 defs, core 4, feature 49, region 1, enhancement 92; 26 declare `route:`, 136 `selector:`.)
- `ctx.routeFamily` is parsed at `site.js:498` and **consumed by nothing** — absent from `runtime/orchestration/` and `runtime/catalog/normalize.js` (rechecked 2026-10-10).
- `hasSelector` → `safeQuery` → uncached `document.querySelector` per def, per filter pass. The filter runs ~8 times per boot (immediate ×3, prefetch ×2, visible, interaction, region, idle, settled): **~650+ uncached `querySelector` calls during boot**, several against 4-way selector lists.
- `.agents/state/runtime/route-runtime-manifest.json` (832 KB on 2026-07-26; 2,708,737 B / ~2.65 MiB across 208 routes and 146 defs on 2026-11-05, with `routes`, `surfaces`, `runtimeDefinitions`) is generated at build time and **read only by `scripts/typed/site-contracts/index.mjs`** — never at runtime.

**Property writes (2026-07-26 baseline → 2026-11-05 re-probe)**

| plane | raw `.dataset.x =` (07-26 → 11-05) | `writeDatasetValue` (07-26 → 11-05) |
|---|---|---|
| runtime | 529 → 477 | 405 → 441 |
| interface | 331 → 345 | 28 → 32 |
| modules | 197 → 243 | **0 → 0** |
| semantic | 152 → 123 | 61 → 91 |
| kernel | 80 → 48 | 13 → 12 |
| media | 84 → 92 | 20 → 21 |

**1,382 raw vs 547 guarded (2026-07-26) → 1,328 raw vs 597 guarded (2026-11-05).** The raw column counts `.dataset.x =` matches the way the July census did, which also catches `===` comparisons; a stricter count on 2026-11-05 (`dataset.x =` not followed by `=`) finds 1,119 raw writes against 467 `writeDatasetValue(` calls, so read the arrows as a trend, not a tally. Style: 151 raw `style.setProperty` vs 71 `writeStyleValue`.

**Observation**
- **31 MutationObservers; 12 watch `documentElement` attributes.** `dom-sync-hub` registered tasks: **5**. `observeAddedMatches` call sites: **5**. `IntersectionObserver` sites: **13** (`2026-11-05`). `ResizeObserver` sites: **10** (`2026-11-05`).
- 11 scroll listeners (13 on 2026-11-05), each with its own rAF/throttle and its own layout reads (69 `getBoundingClientRect`, 64 `getComputedStyle` tree-wide). No shared read phase.
- `interface/semantic-chrome.js:722` registers `scroll` in **capture phase without `passive`** (`window.addEventListener('scroll', handleViewportChange, true)`). Not a cost: the handler returns when nothing is open, and `passive` does nothing for `scroll` (retired 2026-11-06, Phase 3).

**Coupling to CSS**
- `dist/public/css/bundles/core.css`: **1,546 KiB, 5,429 selector blocks, 2,753 containing `[data-spw-*]`, 3,198 using `:where()`, 352 descending from `html[…]`/`:root[…]`, 1,814 unique custom properties.**
- 352 root-attribute-rooted selectors × 1,382 mostly-unguarded dataset writes = **every redundant `html` dataset write invalidates style for the document against a 1.5 MB sheet**. The JS half of this fix is the cheaper half.

**Closed by landings** (the 2026-07-26 diagnosis, one line each)

- Boilerplate: 95 of 96 defs hand-wrote a `mount:` adapter. 2ddb633e (2026-08-11) deleted the no-op ones; `resolveModuleMount` reads `init*` or `SPW_MODULE_EXPORT`.
- Parsing: four legacy parsers stood beside `semantic/spw-expression-geometry.js`. 991f7247 (2026-08-15) made `link-copy.js` and `spells.js` delegate to it.
- Spatial model: `runtime/regions/region-profiler.js` read harmony, tempo, density and weight from synonym tables over authored labels. 991f7247 grounded them in `spatial-gravity`'s measured `spwEdgeGravity`, `spwExtent`, `spwMeasureBand` and `spwSalienceRank`, with authored attributes still overriding. `inferModuleDimensions` (`runtime/orchestration/loader.js`) no longer regexes module ids: since 41f3311e it reads `def.layer` and the closed `evaluates` vocabulary.
- Duplication: `runtime/state-inspector.js` was unreachable and was deleted 2026-09-18; `interface/state-inspector.js` is the one owner.
- Still open: 956 `addEventListener` against 411 `removeEventListener` (820/331 on 2026-07-26). `bus.on` accepts `signal`, so Phase 3's per-mount `AbortController` is still owed.

### Landed

- Phase 0 (2026-08-11): f719e586 unmount and remount with `ctx.registry.remove`, plus the `updates:` role pass; `engagement-features.test.mjs` holds the round trip.
- Phase 1 (2026-08-11): 5a471087 moved operator detection to `kernel/operator-detection.js`, out of the eager graph. 8018d2d7 added per-file minify with rolldown (~3.17 → ~1.68 MiB), and 2ddb633e dropped the no-op adapters. Eager graph 38 modules / 631.4 KB → 33 / 502.6 KB.
- Phase 4 and 5 (2026-08-15): 991f7247, above.
- Phase 6 extracts (file seams only): `shell-disclosure.js` lost `scroll-lock.js`, `attention-posture-panel.js`, `utility-row.js` and `measurement.js` (638b2629); `experiential.js` lost breadcrumb-spell and sample-dock (0cb1dbfd) and five feature modules.
- Adjacent: `interactive-medium.js` caches its medium tokens, and `page-state.js` measures each bottom-floating chrome element once.

## Patch Sequence

Phases 0–1 were mechanical. From Phase 2 on, a slice that changes how the site feels (when chrome appears, how interaction settles) ends at proposal + browser demo, per the sensation review gate. A slice that changes nothing felt lands with a sensor. **Phase 0 is landed.** Phase 6 may continue as extract-only until Phase 3 (shell) / Phase 4 (experiential vocabulary) gates allow full concern-per-module catalog splits.

### Phases 0 and 1 — landed

See **Landed** above. The one deferred Phase 1 item, a full eager-graph bundle, is retired here: [deploy-module-graph](../deploy-module-graph/PLAN.md) took bundling as semantic packs (2026-08-17) and the acyclic cut (f05b02d2).

### Phase 2 — Route-scoped scheduling

**HTML prep (2026-08-11):** region hygiene landed first so rail/handle/profiler and future route-family gates have stable authored anchors.

- Every `site-frame` carries `id` + `data-spw-kind` + `data-spw-role` (777 frames / 0 issues via `node scripts/check-region-hygiene.mjs`).
- Entry spines (`site-hero` or `liminality=entry` + `composition-stability=anchored`) declare `data-spw-region-purpose="public-spine"` and usually `data-spw-region-role="entry-spine"`.
- Public routes remain on `<spw-page>` / `<spw-site-head>` templating; `design/components/captures/` is an offline generated pack (not a public template candidate).

**Still to implement:**

- Consume `.agents/state/runtime/route-runtime-manifest.json` at build time to emit a per-surface module set into the page (or into a small generated module), instead of leaving it a check-only artifact.
- Make `shouldScheduleDefinition` honor `ctx.routeFamily`, which is already parsed and currently dead.
- Cache selector probe results per boot so the ~8 filter passes share one `querySelector` per definition.
  - Half landed 2026-09-28: `shouldScheduleDefinition` asks the selector last, only of a def whose cheap gates (when, route, features, category, only/skip, debug) passed; `?spw-module-audit` still asks every def so skip reasons stay whole. A wave no longer queries hosts for modules that belong to another wave. Pocket boot, HEAD vs working tree through CDP Fetch, two interleaved runs a side: loader selector probes 950/1076 → 190/192 on `/about/` and 1076/1076 → 189/189 on `/topics/software/`; all `document.querySelector` calls at boot 1189/1412 → 409/485 and 1430/1422 → 545/539. A per-boot cache is still open and must not cache a miss blind: a host can arrive after the wave that first asked.
- Target: 83 always-considered modules become route-scoped; ~650 boot `querySelector` calls collapse toward ~90.

Gate: measured boot delta on a cold content-rich route before/after, demoed in browser.

### Phase 3 — Write and observe consolidation

Landed: the read side (110d85e5, receipts below) and the bus charge guard (`writeCharge` in `public/ts/bus.ts`, 5537acdb, held by `scripts/tests/change-only-writes.test.mjs`). Retired 2026-11-06: making `semantic-chrome.js:722` passive. A `scroll` event cannot be cancelled, so the flag changes nothing, and `handleViewportChange` only calls `dismissPopover`, which returns when nothing is open.

- **P1 — positioning onto the lane.** `runPositioningPass` in `public/js/runtime/regions/positioning-orchestration.js` runs in its own `requestAnimationFrame`, reads `window.innerWidth`, then every tracked rect, then writes. A write from any other module before that callback makes the first read force a full pass. Move it onto `createMeasuredLane` (`kernel/measured-frame.js`), with `measure()` for the read pass and `apply()` for the writes, as `runtime/physics/spatial-gravity.js` does. Gate: a pocket scroll trace on a route with a `[data-spw-gravity]` or `[data-spw-box-model]` host. Positioning's row in the forced-pass table must disappear; if it does not, the slice did not land (`.spw/audits/runtime-recalc-cost-2026-09.spw` `^"validation"`).
- **P2 — one width.** `readViewport` in `spatial-gravity.js` and `storageKey` in `runtime/arrival/frame-size-memory.js` read `window.innerWidth` directly. `readViewportInlineSize()` (`kernel/viewport.js`) answers the same value from a cache. Both reads already sit in a read phase or at arrival, so this is consistency, not speed. Ungated: `node --check` and `npm run test:modules:run`. The diagnostics (`layout-qa.js`, `observation-beats.js`, debug-gated) keep the raw read they report on.
- **P3 — modules/ guarded writes.** `modules/` has 243 raw `.dataset.x =` and 0 `writeDatasetValue`. Convert one module family per commit, starting with a family whose writes run on an observer or sync path, and prove each with a `change-only-writes.test.mjs` case. Ungated where nothing is felt.
- Then, gated by a demo because they change interaction latency and settle timing: migrate the 26 non-hub MutationObservers onto `dom-sync-hub` or `observeAddedMatches`, and adopt a per-mount `AbortController` on `ctx`.

### Phase 4 — One expression reader (landed)

`semantic/spw-expression-geometry.js` is the canonical reader (`scanSpwExpression`, `describeSpwExpression`, `parseSpwExpression`; 991f7247, tested in `scripts/tests/spw-expression-geometry.test.mjs`). The pinned `modules/tools/spw-literal-parser.js` artifact now aligns with `public/js/semantic/spw-workbench-reader.js` ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S3).
- Seam (2026-10-25, named by [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S0): [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) extends `semantic/expression-query.js`, which imports nothing and is read by search, the cauldron, the build scripts and `spw:routes`. Proposed split: expression-query reads slots, and geometry reads layout from those slots. Neither file changes until one plan takes the split.

### Phase 5 — Ground the spatial model (landed)

991f7247 (see **Closed by landings**). Its last open item, deriving module dimensions from the `updates:` roles, is retired: since 41f3311e the dimensions come from the closed `evaluates` vocabulary, which is what the rail CSS keys on.

### Phase 6 — Decompose the overloaded modules

File extracts are done; what is left is catalog gating. Anatomy in `modules.spw` (dated 2026-08).

**`runtime/shell/shell-disclosure.js`** — 2,315 → 1,249 lines (2026-10-10), one export, `IMMEDIATE`. Landed: `scroll-lock.js`, `attention-posture-panel.js`, `utility-row.js`, and `measurement.js` with device context (638b2629); the scroll model reads in the measured lane (`createMeasuredLane`).

- [ ] Extract `disclosure-a11y` (focus management, toggle aria, open/close) — generic, reusable by `region-menu` and the posture panel.
- [ ] Own catalog defs / idle gates for panels that are not first-paint shell.

**`runtime/experiential/experiential.js`** — 2,168 → 223 lines; breadcrumb-spell and sample-dock left in 0cb1dbfd. `experiential` is still one catalog def (`id: 'experiential'` in `runtime/catalog/enhancement.js`).

- [ ] Give each extracted feature its own catalog def and gate; sample dock and QA beats are idle or debug-gated work, not `IMMEDIATE`.
- [ ] Fold `OPERATOR_INFO` (`runtime/experiential/operator-info.js`) into the single expression reader (Phase 4). 2026-10-25: it is no longer a third vocabulary; [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S2 made it a view of `kernel/operator-detection.js` that keeps only its memo phrases and wonders (df32c50f). What is left is where those phrases live.

Gate: both are visible chrome. Demo before catalog/gating changes that alter when panels appear.

### Phase 7 — CSS core decomposition

- Attack the 1.5 MiB core from the JS side first (Phase 3 removes the redundant invalidation), then decompose the 352 root-attribute-rooted selector families.
- Coordinate with `css-architecture-readability` — that plan owns literate CSS ownership; this phase owns only the JS↔CSS write coupling.
- Seam (2026-10-25): per-pass recalc cost belongs to `runtime-bootstrap-performance`, which `core-css-spend-cut` hands it to; core bytes stay with `core-css-spend-cut`. This phase does not decompose core for pass speed.

## Out Of Scope

- Merging the two state inspectors — resolved 2026-09-18: `runtime/state-inspector.js` was an unreachable duplicate (no importer, not a catalog target) and was deleted; `interface/state-inspector.js` is the one owner. Previously noted as duplication evidence; belongs to `runtime-module-decomposition`.
- New npm dependencies beyond a build-time minifier/bundler.
- Any new visual chrome or data attribute that does not fall out of existing token writers.
- CSS layer ordering and the `ornament` contract.

## Validation

- `npm run check:local` — full compile, css build, site check, PWA, generated, component, module tests.
- `npm run check:runtime` — runtime contracts.
- `npm run smoke:nav:ci` — console errors, overflow-x, settled state.
- `npm run bench:nav:quick --warm` — boot timing matrix, before/after per phase.
- `npm run css:payload` — core vs scoped delivery after Phase 6.
- Browser demo for every phase from 2 onward, before implementation.

## Falsification

A patch cannot satisfy this plan's goal while leaving `public/js/runtime/orchestration/loader.js` and `public/js/kernel/dom-contracts.js` unchanged. If the canonical contracts remain optional after a phase lands, that phase did not do its job.

Proposal (2026-11-06): let this rule run as a sensor rather than a re-count. `audit:js-tree` could print one line per plane, raw writes against guarded writes (`modules 243 · 0`). It would stay quiet while no plane's raw count grows, and print the new raw writes by file when one does. Each plane's line is a small ratchet a reader can learn in one glance.

## Phase 3 receipt — 2026-09-17

The read side of write/observe consolidation landed as two kernel contracts, and the evidence for them is the trace this plan asked for in Validation.

- `kernel/measured-frame.js`: one pass per frame, after the frame's style pass, read phase then write phase; fixed-viewport correction, shell menu offset, and interactive medium are split lanes, floating chrome and the shell's measured sync run whole. `kernel/viewport.js`: the viewport box read once and invalidated on resize, orientation, and visual-viewport moves.
- Trace (devtools.timeline with stacks, about route, pocket, four interleaved runs per side): script-forced style/layout passes median 18.5 → 10.5, cost 7141 → 3657ms. Each forced pass costs ~300ms against the current core bundle, which is Phase 7's number.
- Making the contract the default, per this plan's falsification rule: 20 readers of `window.innerWidth` remain outside `viewport.js` — popup placement in `interface/` (guide-badge, pronunciation, haptics, semantic-chrome, topic-discovery, state-inspector), `runtime/diagnostics/layout-qa.js`, `observation-beats.js`, `spatial-gravity.js`, `positioning-orchestration.js`, `interactive-expression-lab.js`. Popup placement runs at interaction time and may stay direct; the four runtime readers should take the cached box. Direct `syncFloatingChromeState` callers (site-search, region-menu, section-handle, navigation-locomotion, frame-navigator, attention-posture-panel, state-inspector, discovery-notices, layout-assumptions) still read synchronously; each is a candidate for `requestFloatingChromeSync` unless it consumes the returned snapshot.

## Phase 3 receipt, second slice — 2026-09-19

The direct callers the first receipt listed have adopted the lane: thirteen fire-and-forget `syncFloatingChromeState` calls (state-inspector, discovery-notices, section-handle ×2, attention-posture-panel, navigation-locomotion ×2, site-search ×2, region-menu ×2, frame-navigator ×2) now `requestFloatingChromeSync`; `layout-assumptions` keeps its two synchronous calls because it reads the snapshot. Four interleaved phone traces on `/about/`: the stranding read (`measureFloatingChromeStranding`, six forced passes in one baseline) is gone from the script-forced table; script-forced style time 6.3–8.7s → 4.3–7.1s; total style time unchanged within the machine's noise. Where a phone pass actually goes — selector matching 5%, per-element resolution against the live root registers the rest — is measured in `.spw/audits/runtime-recalc-cost-2026-09.spw`, which also lists the six single-read mount sites still forcing a pass each and the two attempts that did not land (loader selector cache, boot-phase hold on the viewport-correction lane).

## Absorbed 2026-10-10 — runtime-module-decomposition

[runtime-module-decomposition](../archive/runtime-module-decomposition/PLAN.md) held the "extract kernel contracts before splitting files" seam. Landed through it: `kernel/storage-utils.js` (a6cdf035), `writeProjectionTier` (`kernel/dom-contracts.js:1614`), the lens writer (`runtime/page/lens-modes.js`, 2026-09-19), the shell and experiential extracts in Phase 6. Rule kept: build a primitive before carving a feature file. It needs a second unrelated importer, a frozen `SPW_*_CONTRACT`, DOM writes through `writeDatasetValue(s)` or `writeProjectionTier`, outward events through `bus.emit`, and honest catalog `updates`/`effectScope`/`describes`. Never split by line count alone. Still owed, each one patch with two adopters:

- Bus audit: 69 `dispatchEvent(new CustomEvent(` sites (2026-10-10, still 69 on 2026-11-06); move to `bus.emit` where `bus.js` `LEGACY` maps the event.
- `media/image-metaphysics.js` (1,056 lines): visit memory and effect controls as two organs; the host keeps its loop registration.
- `kernel/shared.js` (1,528 lines on 2026-11-06): climate tokens and feature helpers out; operators already left for `kernel/operator-detection.js`.
- `interface/state-inspector.js` (1,332 lines on 2026-11-06) → state satchel naming, after the `shell-model-vocabulary-consolidation` gate.

## Absorbed 2026-10-10 — js-surface-ecology leftovers

[js-surface-ecology](../archive/js-surface-ecology/PLAN.md) landed the tree (families 80c7b305; zero orphans and `audit:js-tree --check` in `check:local`). Owed here (re-probed 2026-11-06):
1. The runtime viewport-width readers: now Phase 3 slices P1 (positioning) and P2 (spatial gravity, frame-size memory). `shell-disclosure.js` reads `data-spw-viewport-tier` first and `interactive-expression-lab.js` reads a passed viewport first, so their `innerWidth` fallbacks stay.
2. The 13 files that call `getComputedStyle(document.documentElement)` on their own schedule instead of reading cached token snapshots.
3. The two halves `public/js/interface/haptics.js` (1,452 lines / 48.2 KiB) could stand alone: the concept inspector and the sigil collection (`.spw/audits/js-tree-value-2026-09.spw` `next.6`).
