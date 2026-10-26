# Runtime Plane Consolidation

**Status 2026-10-10.** Phases 0, 1, 4 and 5 are landed, each with one deferred item; Phase 2 is half done (selector asked last, 2026-09-28) and Phase 3's read side landed as `kernel/measured-frame.js` and `kernel/viewport.js`. Next slice: make the capture-phase scroll listener at `interface/semantic-chrome.js:722` passive, and move the four runtime `window.innerWidth` readers (`diagnostics/layout-qa.js`, `diagnostics/observation-beats.js`, `physics/spatial-gravity.js`, `regions/positioning-orchestration.js`) onto `kernel/viewport.js`. Gate: a pocket scroll trace before and after, per this plan's Phase 3 gate. Now owns the decomposition seam (absorbed below).

**Related:** [module-contract-overhaul](../module-contract-overhaul/PLAN.md) · [interaction-loop-contract](../archive/interaction-loop-contract/PLAN.md) (archived) · [core-css-spend-cut](../core-css-spend-cut/PLAN.md). **Absorbed 2026-10-10:** [runtime-module-decomposition](../archive/runtime-module-decomposition/PLAN.md), the leftovers of [js-surface-ecology](../archive/js-surface-ecology/PLAN.md).

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
- `.agents/state/runtime/route-runtime-manifest.json` (832 KB, with `routes`, `surfaces`, `runtimeDefinitions`) is generated at build time and **read only by `scripts/typed/site-contracts/index.mjs`** — never at runtime.

**Property writes**

| plane | raw `.dataset.x =` | `writeDatasetValue` |
|---|---|---|
| runtime | 529 | 405 |
| interface | 331 | 28 |
| modules | 197 | **0** |
| semantic | 152 | 61 |
| kernel | 80 | 13 |
| media | 84 | 20 |

**1,382 raw vs 547 guarded.** Style: 151 raw `style.setProperty` vs 71 `writeStyleValue`.

**Observation**
- **31 MutationObservers; 12 watch `documentElement` attributes.** `dom-sync-hub` registered tasks: **5**. `observeAddedMatches` call sites: **5**.
- 11 scroll listeners, each with its own rAF/throttle and its own layout reads (69 `getBoundingClientRect`, 64 `getComputedStyle` tree-wide). No shared read phase.
- `interface/semantic-chrome.js:719` registers `scroll` in **capture phase without `passive`**.

**Coupling to CSS**
- `dist/public/css/bundles/core.css`: **1,546 KiB, 5,429 selector blocks, 2,753 containing `[data-spw-*]`, 3,198 using `:where()`, 352 descending from `html[…]`/`:root[…]`, 1,814 unique custom properties.**
- 352 root-attribute-rooted selectors × 1,382 mostly-unguarded dataset writes = **every redundant `html` dataset write invalidates style for the document against a 1.5 MB sheet**. The JS half of this fix is the cheaper half.

**Boilerplate**
- `module-export-contract.js` resolves `SPW_MODULE_EXPORT.mount` → `spwModule.mount` → `default.mount` → any `init*` export, then calls `fn(ctx, root)`.
- **95 of 96 defs hand-write a `mount:` adapter anyway.** `SPW_MODULE_EXPORT` declarations: **0**. `createModuleExport` call sites: **1** (`interface/state-inspector.js:1187`).
- Adapter shapes: `38× fn()`, `31× fn(ctx)`, `11× fn(document)`, `3× fn(main||document)`, `2× fn(root)`, remainder bespoke. **69 of 93 are deletable with zero module changes**; ~19 need signature normalization because they take `document` where the contract passes `ctx`.

**Parsing**
- `semantic/spw-expression-geometry.js` (244 lines, landed 2026-07-26) is the canonical reader. **Adopted by 2 files** (`bare-spw-markup.js`, `attention/section-handle.js`).
- Four legacy parsers still stand: `kernel/shared.js:1380` `splitOperatorExpression`, `semantic/link-copy.js:33` `parseSpwExpression`, `site.js:714` inline projection regex, `runtime/memory/spells.js:151` inline operator-prefix regex.
- `modules/tools/spw-literal-parser.js` (316 lines, the pinned portable artifact) has **zero importers in `public/js`** and is not in the catalog.
- **26 files reference `data-spw-semantic-expression`. 2,107 operator chips exist across the HTML.** The authored graph is large and consistent; no single reader owns it.

**Spatial model**
- `runtime/regions/region-profiler.js` derives its vocabulary by lookup over authored labels, reading **no geometry**:
  - `inferRegionHarmony` — synonym table over `role`
  - `inferRegionTempo` — synonym table over `harmony`
  - `inferRegionDensity` — synonym table over `kind`
  - `inferRegionAttentionalWeight` — magic-number table over `kind`/`role`/`classList`
- The chain is `authored attribute → synonym → synonym → CSS token`. It is tautological: it cannot report anything about the layout that the author did not already type.
- `runtime/module-loader.js:506` `inferModuleDimensions` has the same shape — regexes over `def.id + def.selector + def.layer`.
- Meanwhile `runtime/physics/spatial-gravity.js` **does** measure geometry (`spwEdgeGravity`, `spwEdgeX/Y`, `spwExtent`, `spwMeasureBand`, `spwSalienceRank`) and `composition-box-model.js` measures boxes. **Two disconnected spatial systems, no bridge.**

**Duplication**
- `interface/state-inspector.js` (1,189) and `runtime/state-inspector.js` (929) are two separate inspectors, 2,118 lines, different entry points (`initStateInspector` / `initSpwStateInspector`).
- Duplicated basenames across planes: `bus.js`, `shared.js`, `contract.js`, `feed-utils.js`, `component-fixtures.js`, `runtime-environment.js`, `module-timing-contract.js`.
- 820 `addEventListener` vs 331 `removeEventListener`; 26 `AbortController`/`signal` uses. `bus.on` already accepts `signal`.

### Landed (2026-08-11 hygiene pass)

**Phase 0 — complete** (split into separate commits):

1. **`updates:` role annotation** across all three catalogs (`html:structural:…`, `flourish:…`, `measure:…`, `inspect:…`, `diagnostic:…`, `residue:…`). Parses through `normalizeModuleUpdates`; entry counts unchanged.
2. **`unmountModuleById` / `unmountAllModules`** with `ctx.registry.remove(record.id)` so unmount/remount round-trips; logger normalized to `(message, detail, relation)`; only `scheduleRuntimeTokenUpdate` after unmount (no sync+microtask duplicate). Wired into `compose.controls.modules` and `window.__SPW_SITE__`. Covered by `engagement-features.test.mjs` mount→unmount→remount test. `readRuntimePolicy` hardened for non-window test contexts.

**Phase 6 — partial extract (file seams only, still one catalog mount each):**

| Module | Was | Now | Extracted siblings |
|--------|-----|-----|--------------------|
| `shell-disclosure.js` | ~2315 | ~1461 | `shell/scroll-lock.js`, `shell/attention-posture-panel.js`, `shell/utility-row.js` |
| `experiential.js` | ~2168 | ~1758 | `experiential/{bookmark-registry,contextual-memos,operator-info,operator-learning,qa-beat-gestures}.js` |

Still in parent files: shell nav-fit + menu state machine + disclosure a11y; experiential spell breadcrumbs + sample dock. **Not yet** separate catalog defs with own `when`/`selector`/`features` gates. Private escape utils and `OPERATOR_INFO` fold into Phase 4 still open.

**Adjacent (not plan phases, landable with hygiene):**

- `interactive-medium.js` — cache medium CSS tokens; invalidate on settings/runtime-token events (avoids six `getComputedStyle` hits per host mutation).
- `page-state.js` — one style+rect measure per bottom-floating chrome element on the scroll/mutation path.

**Still not started:** Phase 1 payload/boilerplate, Phase 2 route-scoped scheduling (the original route-level config ask), Phases 3–5 and 7.

## Patch Sequence

Phases 0–1 are mechanical: they change no felt pacing and can land as one reviewable pass. Phases 2–6 change how the site feels and each ends at proposal + browser demo before implementation, per the sensation review gate. **Phase 0 is landed.** Phase 6 may continue as extract-only until Phase 3 (shell) / Phase 4 (experiential vocabulary) gates allow full concern-per-module catalog splits.

### Phase 0 — Land the in-flight work correctly ✅

- [x] Call `ctx.registry.remove(record.id)` in `unmountModuleRecord` so unmount/remount round-trips.
- [x] Drop the duplicate `updateRuntimeStateTokens` call; keep `scheduleRuntimeTokenUpdate`.
- [x] Normalize the unmount logger call to `(message, detail, relation)`.
- [x] Add a round-trip test: mount → unmount → mount → assert `status === 'mounted'`.
- [x] Commit the `updates:` role pass separately from the unmount API.

Validation: `npm run check:runtime`, `npm run test:modules:run`.

### Phase 1 — Payload and boilerplate (no felt change) ✅ (bundle deferred)

- [x] Split operator registry/detection into `kernel/operator-detection.js`; `dom-contracts` imports it instead of `shared.js`. Eager graph no longer includes `shared.js`.
- [x] Per-file minify of `dist/public/js` via rolldown in `scripts/build.mjs` (`--skip-minify` to opt out). Preserves module URLs and `import()` strings for resource hints + fingerprint of `site.js`. Measured ~3.17 MiB → ~1.68 MiB (55.7%).
- [ ] Full eager-graph **bundle** deferred: rolldown bundling of `site.js` hits missing-export / resolve issues; path-preserving minify lands first without changing request topology.
- [x] Delete no-op `mount:` adapters; 88 of 96 defs now rely on `resolveModuleMount` (`init*` / export contract). 8 bespoke adapters remain (site-settings, blog-interpreter, payment-settings, cauldron, pretext-physics, logo-runtime, topic-discovery, query-link-composer).
- [x] Normalize document/root inits to `(ctx, root)` and drop those adapters.
- [x] Runtime contracts accept mount-less catalog defs when the load target has a resolvable `init*` / `SPW_MODULE_EXPORT`.
- [x] Re-measure eager graph: **33 modules / 502.6 KB raw** (was 38 / 631.4 KB on 2026-07-26).

Validation: `npm run check:runtime`, `npm run test:engagement:run`, local `node scripts/build.mjs --local`.

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

- Route unguarded writes through `writeDatasetValue` / `writeStyleValue`, starting with `modules/` (197 raw, 0 guarded), then `interface/` (331 raw, 28 guarded).
- [x] Guard the bus charge path — `#applyCharge` and `setCharge` wrote `--charge` and `dataset.spwCharge` unguarded on the pointermove path. Landed 2026-09-28: `writeCharge` in `public/ts/bus.ts` writes each only when it moves; `scripts/tests/change-only-writes.test.mjs` holds it.
- Migrate the 26 non-hub MutationObservers onto `dom-sync-hub` / `observeAddedMatches`.
- Add a shared viewport read phase so the scroll listeners (13 `addEventListener('scroll'` sites, 2026-10-10) measure once per frame; fix the capture-phase non-passive listener at `interface/semantic-chrome.js:722`.
- Adopt per-mount `AbortController` on `ctx` (`bus.on` already accepts `signal`) to close the 820/331 listener gap.

Gate: this changes interaction latency and settle timing. Demo before landing.

### Phase 4 — One expression reader ✅

- [x] Make `semantic/spw-expression-geometry.js` the single canonical reader for the authored expression graph (`scanSpwExpression`, `describeSpwExpression`, `parseSpwExpression`).
- [x] Retire legacy ad-hoc parsing in `semantic/link-copy.js` (re-exports and delegates to `parseSpwExpression`), `site.js` `snapshotProjectionEquations`, and `runtime/memory/spells.js` (`inferPrefix`, `inferNucleus`, `inferDestination`).
- [x] Adopt guarded dataset writes in `semantic/link-copy.js` (`writeDatasetValue`, `writeDatasetValueIfMissing`, `writeDatasetValues`).
- [x] Add unit tests in `scripts/tests/spw-expression-geometry.test.mjs` verifying backward-compatible parser shape across chips and handles.
- [ ] Align pinned `modules/tools/spw-literal-parser.js` artifact generation with the single reader.
- Seam (2026-10-25, named by [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S0): [spw-language-v04](../spw-language-v04/PLAN.md) extends `semantic/expression-query.js`, which imports nothing and is read by search, the cauldron, the build scripts and `spw:routes`. Proposed split: expression-query reads slots, and geometry reads layout from those slots. Neither file changes until one plan takes the split.

### Phase 5 — Ground the spatial model ✅

- [x] Feed `spatial-gravity` measured outputs (`spwEdgeGravity`, `spwExtent`, `spwMeasureBand`, `spwSalienceRank`) and box measurements into `region-profiler.js`.
- [x] Ground `inferRegionHarmony`, `inferRegionTempo`, `inferRegionDensity`, and `inferRegionAttentionalWeight` in measured geometry and salience ranks when present, keeping authored attributes as first-class overrides.
- [x] Pass `(el, profile)` across region inference pipeline in `buildRegionProfile`.
- [ ] Derive module dimensions directly from the role-annotated `updates:` contract in `runtime/orchestration/loader.js`.

### Phase 6 — Decompose the overloaded modules

File extracts are done; what is left is catalog gating. Anatomy in `modules.spw` (dated 2026-08).

**`runtime/shell/shell-disclosure.js`** — 2,315 → 1,249 lines (2026-10-10), one export, `IMMEDIATE`. Landed: `scroll-lock.js`, `attention-posture-panel.js`, `utility-row.js`, and `measurement.js` with device context (638b2629); the scroll model reads in the measured lane (`createMeasuredLane`).

- [ ] Extract `disclosure-a11y` (focus management, toggle aria, open/close) — generic, reusable by `region-menu` and the posture panel.
- [ ] Own catalog defs / idle gates for panels that are not first-paint shell.

**`runtime/experiential/experiential.js`** — 2,168 → 223 lines; breadcrumb-spell and sample-dock left in 0cb1dbfd. `experiential` is still the one catalog def (`runtime/catalog/enhancement.js:1705`).

- [ ] Give each extracted feature its own catalog def and gate; sample dock and QA beats are idle or debug-gated work, not `IMMEDIATE`.
- [ ] Fold `OPERATOR_INFO` (`runtime/experiential/operator-info.js`) into the single expression reader (Phase 4).

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

## Phase 3 receipt — 2026-09-17

The read side of write/observe consolidation landed as two kernel contracts, and the evidence for them is the trace this plan asked for in Validation.

- `kernel/measured-frame.js`: one pass per frame, after the frame's style pass, read phase then write phase; fixed-viewport correction, shell menu offset, and interactive medium are split lanes, floating chrome and the shell's measured sync run whole. `kernel/viewport.js`: the viewport box read once and invalidated on resize, orientation, and visual-viewport moves.
- Trace (devtools.timeline with stacks, about route, pocket, four interleaved runs per side): script-forced style/layout passes median 18.5 → 10.5, cost 7141 → 3657ms. Each forced pass costs ~300ms against the current core bundle, which is Phase 7's number.
- Making the contract the default, per this plan's falsification rule: 20 readers of `window.innerWidth` remain outside `viewport.js` — popup placement in `interface/` (guide-badge, pronunciation, haptics, semantic-chrome, topic-discovery, state-inspector), `runtime/diagnostics/layout-qa.js`, `observation-beats.js`, `spatial-gravity.js`, `positioning-orchestration.js`, `interactive-expression-lab.js`. Popup placement runs at interaction time and may stay direct; the four runtime readers should take the cached box. Direct `syncFloatingChromeState` callers (site-search, region-menu, section-handle, navigation-locomotion, frame-navigator, attention-posture-panel, state-inspector, discovery-notices, layout-assumptions) still read synchronously; each is a candidate for `requestFloatingChromeSync` unless it consumes the returned snapshot.

## Phase 3 receipt, second slice — 2026-09-19

The direct callers the first receipt listed have adopted the lane: thirteen fire-and-forget `syncFloatingChromeState` calls (state-inspector, discovery-notices, section-handle ×2, attention-posture-panel, navigation-locomotion ×2, site-search ×2, region-menu ×2, frame-navigator ×2) now `requestFloatingChromeSync`; `layout-assumptions` keeps its two synchronous calls because it reads the snapshot. Four interleaved phone traces on `/about/`: the stranding read (`measureFloatingChromeStranding`, six forced passes in one baseline) is gone from the script-forced table; script-forced style time 6.3–8.7s → 4.3–7.1s; total style time unchanged within the machine's noise. Where a phone pass actually goes — selector matching 5%, per-element resolution against the live root registers the rest — is measured in `.spw/audits/runtime-recalc-cost-2026-09.spw`, which also lists the six single-read mount sites still forcing a pass each and the two attempts that did not land (loader selector cache, boot-phase hold on the viewport-correction lane).

## Absorbed 2026-10-10 — runtime-module-decomposition

[runtime-module-decomposition](../archive/runtime-module-decomposition/PLAN.md) held the "extract kernel contracts before splitting files" seam. Landed through it: `kernel/storage-utils.js` (a6cdf035), `writeProjectionTier` (`kernel/dom-contracts.js:1614`), the lens writer (`runtime/page/lens-modes.js`, 2026-09-19), the shell and experiential extracts in Phase 6. Rule kept: build a primitive before carving a feature file. It needs a second unrelated importer, a frozen `SPW_*_CONTRACT`, DOM writes through `writeDatasetValue(s)` or `writeProjectionTier`, outward events through `bus.emit`, and honest catalog `updates`/`effectScope`/`describes`. Never split by line count alone. Still owed, each one patch with two adopters:

- Bus audit: 69 `dispatchEvent(new CustomEvent(` sites (2026-10-10); move to `bus.emit` where `bus.js` `LEGACY` maps the event.
- `media/image-metaphysics.js` (1,056 lines): visit memory and effect controls as two organs; the host keeps its loop registration.
- `kernel/shared.js` (1,521 lines): climate tokens and feature helpers out; operators already left for `kernel/operator-detection.js`.
- `interface/state-inspector.js` (1,281 lines) → state satchel naming, after the `shell-model-vocabulary-consolidation` gate.

## Absorbed 2026-10-10 — js-surface-ecology leftovers

[js-surface-ecology](../archive/js-surface-ecology/PLAN.md) landed the tree (families 80c7b305; zero orphans and `audit:js-tree --check` in `check:local`). Owed here: the four runtime `innerWidth` readers (Status next slice); then the 13 files that call `getComputedStyle(document.documentElement)` on their own schedule; then the two halves `interface/haptics.js` (1,452 lines) could stand alone, the concept inspector and the sigil collection (`.spw/audits/js-tree-value-2026-09.spw` `next.6`).
