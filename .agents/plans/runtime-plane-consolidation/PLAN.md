# Runtime Plane Consolidation

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
- `writeDatasetValue` (`kernel/dom-contracts.js:1103`) already does change-only writes — reads, compares, returns `false` without touching the DOM.
- `dom-sync-hub.js` — one MutationObserver, one rAF, ordered task batch. The correct federation primitive.
- `observeAddedMatches` (`kernel/dom-contracts.js:1205`) — gates on matching added nodes, coalesces through rAF. Its docblock documents the two-modules-reacting-to-each-other hard freeze.
- `mountVisibleFeatures` (`runtime/module-loader.js:1222`) — drains IntersectionObserver waves through a 10 ms frame-budgeted queue.
- `IDLE_CHUNK_ORDER` — staggers idle mounts so residue listeners attach before collectible flourishes.
- `public/ts/bus.ts` — single emit path, frozen enriched payloads, history ring, `onAny`, legacy bridging.

### Measured costs

**Payload**
- Eager static import graph from `site.js`: **38 modules, 631.4 KB raw / 159.3 KB gzip**, blocking before the first mount.
- `dist/public/js`: **210 unbundled, unminified ES modules, 3.4 MB**. `scripts/build.mjs` has no minify or bundle step; files are content-hashed source.
- `kernel/dom-contracts.js:12` imports `detectOperator` from `kernel/shared.js` — **69 KB, the largest file in the graph**, for one function. `shared.js` exports through two grouped `export { }` blocks, so nothing tree-shakes.

**Scheduling**
- 96 module definitions. **13 declare `route:`.** 91 declare `selector:`.
- `ctx.routeFamily` is parsed at `site.js:467` and **consumed by nothing** — absent from `module-loader.js`, `module-catalog-normalize.js`, `runtime-helpers.js`.
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
- Four legacy parsers still stand: `kernel/shared.js:1380` `splitOperatorExpression`, `semantic/link-copy.js:33` `parseSpwExpression`, `site.js:714` inline projection regex, `runtime/spells.js:151` inline operator-prefix regex.
- `modules/tools/spw-literal-parser.js` (316 lines, the pinned portable artifact) has **zero importers in `public/js`** and is not in the catalog.
- **26 files reference `data-spw-semantic-expression`. 2,107 operator chips exist across the HTML.** The authored graph is large and consistent; no single reader owns it.

**Spatial model**
- `runtime/region-profiler.js` derives its vocabulary by lookup over authored labels, reading **no geometry**:
  - `inferRegionHarmony` — synonym table over `role`
  - `inferRegionTempo` — synonym table over `harmony`
  - `inferRegionDensity` — synonym table over `kind`
  - `inferRegionAttentionalWeight` — magic-number table over `kind`/`role`/`classList`
- The chain is `authored attribute → synonym → synonym → CSS token`. It is tautological: it cannot report anything about the layout that the author did not already type.
- `runtime/module-loader.js:506` `inferModuleDimensions` has the same shape — regexes over `def.id + def.selector + def.layer`.
- Meanwhile `runtime/spatial-gravity.js` **does** measure geometry (`spwEdgeGravity`, `spwEdgeX/Y`, `spwExtent`, `spwMeasureBand`, `spwSalienceRank`) and `composition-box-model.js` measures boxes. **Two disconnected spatial systems, no bridge.**

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
- Target: 83 always-considered modules become route-scoped; ~650 boot `querySelector` calls collapse toward ~90.

Gate: measured boot delta on a cold content-rich route before/after, demoed in browser.

### Phase 3 — Write and observe consolidation

- Route unguarded writes through `writeDatasetValue` / `writeStyleValue`, starting with `modules/` (197 raw, 0 guarded), then `interface/` (331 raw, 28 guarded).
- Guard the bus charge path — `#applyCharge` and `setCharge` write `--charge` and `dataset.spwCharge` unguarded on the pointermove path.
- Migrate the 26 non-hub MutationObservers onto `dom-sync-hub` / `observeAddedMatches`.
- Add a shared viewport read phase so the 11 scroll listeners measure once per frame; fix the capture-phase non-passive listener at `semantic-chrome.js:719`.
- Adopt per-mount `AbortController` on `ctx` (`bus.on` already accepts `signal`) to close the 820/331 listener gap.

Gate: this changes interaction latency and settle timing. Demo before landing.

### Phase 4 — One expression reader ✅

- [x] Make `semantic/spw-expression-geometry.js` the single canonical reader for the authored expression graph (`scanSpwExpression`, `describeSpwExpression`, `parseSpwExpression`).
- [x] Retire legacy ad-hoc parsing in `semantic/link-copy.js` (re-exports and delegates to `parseSpwExpression`), `site.js` `snapshotProjectionEquations`, and `runtime/spells.js` (`inferPrefix`, `inferNucleus`, `inferDestination`).
- [x] Adopt guarded dataset writes in `semantic/link-copy.js` (`writeDatasetValue`, `writeDatasetValueIfMissing`, `writeDatasetValues`).
- [x] Add unit tests in `scripts/tests/spw-expression-geometry.test.mjs` verifying backward-compatible parser shape across chips and handles.
- [ ] Align pinned `modules/tools/spw-literal-parser.js` artifact generation with the single reader.

### Phase 5 — Ground the spatial model ✅

- [x] Feed `spatial-gravity` measured outputs (`spwEdgeGravity`, `spwExtent`, `spwMeasureBand`, `spwSalienceRank`) and box measurements into `region-profiler.js`.
- [x] Ground `inferRegionHarmony`, `inferRegionTempo`, `inferRegionDensity`, and `inferRegionAttentionalWeight` in measured geometry and salience ranks when present, keeping authored attributes as first-class overrides.
- [x] Pass `(el, profile)` across region inference pipeline in `buildRegionProfile`.
- [ ] Derive module dimensions directly from the role-annotated `updates:` contract in `module-loader.js`.

### Phase 6 — Decompose the overloaded modules

Two modules hold fifteen concerns between them. Full anatomy in `modules.spw`.

**Progress (2026-08-11):** internal file extracts landed without catalog splits. Parents still own the single mount; extracted siblings are import-time modules, not independent defs.

**`runtime/shell-disclosure.js`** — was 2,315 / now ~1,461 lines, **one export**, mounted `IMMEDIATE` on every page.

- [x] Extract `scroll-lock` → `runtime/shell/scroll-lock.js`.
- [x] Extract `attention-posture-panel` → `runtime/shell/attention-posture-panel.js`.
- [x] Extract utility/settings row → `runtime/shell/utility-row.js` (was "shell-tuning-panel" in the original split list).
- [ ] Extract `disclosure-a11y` (focus management, toggle aria, open/close) — generic, reusable by `region-menu` and the posture panel.
- [ ] Delegate device context to `interactive-medium.js`; delete the local copy.
- [ ] Join the shared viewport read phase for the scroll model (depends on Phase 3).
- [ ] Own catalog defs / idle gates for panels that are not first-paint shell.
- Target remainder: nav-fit + menu state machine, plausibly under 600 lines, still `IMMEDIATE`.

**`runtime/experiential.js`** — was 2,168 / now ~1,758 lines, **one export**.

- [x] Extract bookmark registry, contextual memos, operator-info, operator learning, QA beat gestures under `runtime/experiential/`.
- [ ] Extract spell breadcrumbs and sample dock (still the bulk of the parent).
- [ ] Each feature becomes its own catalog def with its own `when`/`selector`/`features` gate.
- [ ] Most should not be `IMMEDIATE` — sample dock and QA beats are idle or debug-gated work.
- [ ] Delete private escape/text utilities in favor of `dom-render` and `kernel/text-normalization`.
- [ ] Fold `OPERATOR_INFO` into the single expression reader (Phase 4).

**Sequencing.** Further shell extract after Phase 3 (write/observe consolidation). Experiential catalog splits pair with Phase 4. File-only extracts already landed are safe checkpoints.

Gate: both are visible chrome. Demo before catalog/gating changes that alter when panels appear.

### Phase 7 — CSS core decomposition

- Attack the 1.5 MiB core from the JS side first (Phase 3 removes the redundant invalidation), then decompose the 352 root-attribute-rooted selector families.
- Coordinate with `css-architecture-readability` — that plan owns literate CSS ownership; this phase owns only the JS↔CSS write coupling.

## Out Of Scope

- Merging `interface/state-inspector.js` and `runtime/state-inspector.js` — noted as duplication evidence; belongs to `runtime-module-decomposition`.
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

A patch cannot satisfy this plan's goal while leaving `public/js/runtime/module-loader.js` and `public/js/kernel/dom-contracts.js` unchanged. If the canonical contracts remain optional after a phase lands, that phase did not do its job.
