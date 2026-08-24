# JS Runtime Composability

## Public Goal
Reduce the size and cognitive load of `public/js/site.js` by extracting the page-state / attention lifecycle contract into a dedicated runtime module, while keeping the runtime behavior and datasets stable.

## Scope
- Extract page lifecycle helpers from `public/js/site.js` into a focused runtime module.
- Keep the shared page-state vocabulary, timing behavior, and dataset writes centralized.
- Update documentation that currently says the page-state contract lives only in `site.js`.
- Add runtime architecture checks that make module definitions, generated typed outputs, and root-level entrypoint boundaries fail visibly when they drift.

## Likely File Set
- `public/js/runtime/page-state.js`
- `public/js/site.js`
- `public/js/README.md`
- `scripts/ts/runtime-contracts.mts`
- `scripts/ts/check-site.mts`
- `.spw/reviews/runtime-audit/lifecycles.spw`

## Constraints
- Do not add alias wrappers.
- Do not change the public page-state tokens or timing semantics.
- Keep page attention and visibility handling reversible and readable.

## Validation
- `node --check public/js/site.js`
- `node --check public/js/runtime/page-state.js`
- `npm run check:runtime`
- `git diff --check`
- `npm run check`

## 2026-06 Contract Check Pass
- Added `scripts/ts/runtime-contracts.mts` as a hard guard for runtime module shape and folder boundaries.
- Wired the checker into `scripts/ts/check-site.mts` and exposed it through `npm run check:runtime`.
- Kept semantic metadata gaps as warnings so current modules remain inspectable without forcing a broad rewrite.

## 2026-06 Learnability/Typed Runtime Architecture Fix
- Split learnability ledger root state from writable footer text targets: `data-spw-learnability-cue` remains root/runtime state, while footer copy uses `data-spw-learnability-cue-target`.
- Scoped learnability text writes under `document.body` so document-level state attributes cannot be selected as content targets.
- Added a small typed runtime bridge for DOM contract helpers so generated TypeScript modules can import a stable local file instead of depending on watch-mode post-emit import rewrites.
- Follow-up guard worth adding: runtime contracts should fail when a module writes `textContent` to a selector that can match `html`, `head`, or `body`.

## 2026-06 Module Loader And Compose Surface Pass
- Extracted `runtime/module-catalog.js`, `runtime/module-loader.js`, `runtime/gesture-contract.js`, `runtime/region-profiler.js`, and `semantic/role-inference.js` from the `site.js` shell.
- Split `kernel/site-settings` into profiles, engine, and lazy UI bindings while keeping `kernel/site-settings.js` as the stable import path.
- Wired portable exports through `compose.js` for catalog layers, loader contract, gesture/region profiler, and role inference.
- Consolidated annotation-layer region collection onto `collectAnnotationRegions()` with `ANNOTATION_LAYER_REGION_SELECTOR` in `dom-contracts.js`.
- Updated `public/js/README.md` reading order and `.spw/reviews/runtime-audit/lifecycles.spw` paths to match the current folder taxonomy.

## 2026-06 Catalog Metadata Alignment Pass
- Audited `public/js/runtime/module-catalog.js` for default/core, feature, region, and enhancement entries that mounted without a semantic `describes` contract.
- Added short `describes`, `updates`, and/or `evaluates` metadata to the remaining catalog entries so runtime audits can explain what each module changes without opening every module source first.
- Kept this as catalog metadata only: no selector, mount timing, route gate, feature gate, settings default, or runtime behavior changed.
- Validation result: `node scripts/runtime-contracts.mjs` now reports zero errors, warnings, or recommendations for module catalog metadata.

## 2026-06 Timing And Effect Scope Pass
- Added optional `timingArc` and `effectScope` catalog metadata for modules with broad root, observer, storage, media, gesture, or floating-chrome impact.
- Threaded the new fields through module loader snapshots, DOM annotations, audit records, runtime summaries, spell serialization, resource discovery, and module bus events.
- Updated the runtime contract checker to parse the new fields and fail malformed non-kebab contract tokens without requiring a broad rewrite of every route-specific feature module.
- Kept this pass behavior-neutral: no selectors, route gates, feature gates, settings defaults, mount timing constants, or visual effects changed.

## 2026-08 Physical snapshot pass
- Landed `public/js/runtime/physical-model.js` as a **read-only** inspect surface: `snapshotPhysicalModel()` / `describePhysicalModelSummary()`.
- Organs already named (spatial-gravity, charge-field, pulse-beat, wonder-memory, developmental-climate) keep writing. The snapshot does not.
- Portable through `compose.js`; console through `window.spwCompose.controls.physics`.
- Do not add `data-spw-region-personality`, `data-spw-region-voice`, or `data-spw-region-gravity-axis`. Copy personality stays in `component-region-personality`.

## 2026-08 Attention compose pass
- Catalog remains the demand schedule. `initSpwAttentionArchitecture({ children })` is the all-at-once facade.
- `describeAttentionArchitecture()` is read-only, exported from `compose.js` and `window.spwCompose.controls.attention`.
- `--spw-flourish-presence` interpolates atmosphere after pack load. It must not change packing or measure.

## Out of Scope
- Renaming unrelated runtime modules.
- Changing route-specific behavior beyond the page-state contract.
- A fourth physics engine or a write-capable physical-model VM.
