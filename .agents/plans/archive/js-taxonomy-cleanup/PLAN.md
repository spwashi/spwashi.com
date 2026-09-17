# JS Taxonomy Cleanup

## Public Goal
Remove the `spw-` prefix from the JavaScript source tree, keep the runtime naming semantically legible by folder, and consolidate obvious shared primitives into their owning layer.

## Scope
- Rename prefixed source files in `public/js/` and the TypeScript sources in `public/ts/`.
- Update imports and file references in the site runtime, helper modules, and JS docs.
- Keep behavior stable; this pass is about naming, ownership, and path clarity.

## Likely File Groups
- `public/js/kernel/` for durable primitives, shared contracts, and runtime bridges.
- `public/js/interface/` for user-facing chrome and controls.
- `public/js/runtime/` for active processes and page-state loops.
- `public/js/semantic/` for projection, inference, and semantic helpers.
- `public/js/media/` for media and SVG helpers.
- `public/js/modules/` for route or feature bundles.
- `public/js/typed/` and `public/ts/` for generated or source typed helpers.

## Constraints
- Avoid introducing alias wrappers just to keep old paths alive.
- Prefer one canonical file per concept rather than parallel names.
- Preserve current event contracts and module behavior.

## Validation
- `node --check` on touched JS files
- `git diff --check`
- `npm run check`

## 2026-06 Taxonomy Alignment Pass
- Confirmed `public/js/` no longer uses `spw-*.js` source filenames; taxonomy work is now semantic ownership and shared vocabulary, not prefix removal.
- Canonical region selectors now live in `kernel/dom-contracts.js`, including `ANNOTATION_LAYER_REGION_SELECTOR` for main-scoped annotation targets.
- `semantic/role-inference.js` is the shared authority for `collectRegions()`, optional selector overrides, and `collectAnnotationRegions()`.
- Settings taxonomy split: `site-settings-profiles.js` (data), `site-settings-engine.js` (apply/store), `site-settings-ui.js` (bindings), `site-settings.js` (public entry).
- `public/js/README.md` documents the updated reading order and folder roles.

## Out of Scope
- Runtime behavior changes unrelated to path and taxonomy cleanup.
- New features or semantic state additions.

## 2026-09 Catalog Tree Alignment
- Operation: align. Fixity: stable. One slice: group six catalog implementation files under `public/js/runtime/catalog/` with folder-local names.
- Keep `runtime/module-catalog.js` as the existing full-catalog entrypoint; bootstrap still imports families separately.
- Resolve relative catalog load paths from `runtime/catalog/` in browser imports, source-based tools, and the deploy builder. Update source readers, test imports, and live references.
- Preserve module IDs, selectors, scheduling, exports, and behavior. Leave concurrent kernel/semantic work alone.
- Validate syntax, runtime contracts, selector census, ecology, generated manifests, and `check:local`.
- Result: all four family definitions and resolved import targets match the original sources; moved-file syntax, selector audit, ecology, and deploy build passed.
- `check:local -- --allow-dirty` re-run after resume: 299 tests passed, 0 failed. Concurrent `annotation-refresh.test.mjs` is now in `MODULE_TEST_FILES`.

## 2026-09 Interaction Tree Alignment
- Operation: align. Fixity: stable. One slice: group five `interaction-*` peers under `public/js/runtime/interaction/` with folder-local names (`loop`, `hops`, `vocabulary`, `progression`, `story`).
- Keep catalog module id `interaction-progression` and `systems/interaction-progression.css`. Only the JS load path and imports move.
- Preserve exports, phase writes, and hop/story contracts. Do not pull `interactive-medium.js` or `interactive-expression-lab.js` into this folder — those are different jobs.
- Validate syntax, runtime contracts, interaction-story tests, and `check:local`.
