# Plan: module-export-uniformity

Unify JavaScript module export patterns, document the standalone-script audit in `.spw`, and begin categorizing runtime modules under a **runtime medium ecology** metaphor — an agricultural organism that minds nutrients fractally, supports in-place growth, and stays legible as a holistic codebase.

## Public goal

Every runtime module should expose a predictable export surface for catalog mounting, compose portability, and inspection — without forcing browser modules to pretend they are Node scripts. The codebase should read like one living medium: nutrients (state contracts) flow through guilds (behavior clusters), roots (kernel) and canopy (chrome) stay distinct, and growth can happen in-place (incremental refactors) or holistically (compose/catalog alignment).

## Semantic operation

`audit` → `contract` → `align` (per `semantic-capacity.spw`)

## Phase 0 — Document and categorize (this worktree)

- [x] Create worktree `../wt-module-export-uniformity` on `feature/module-export-uniformity`
- [ ] Land `.spw/audits/module-export-standalone-2026-07.spw` (syntax + standalone grades)
- [ ] Land `.spw/conventions/runtime-medium-ecology.spw` (metaphor + guild taxonomy)
- [ ] Land `.spw/surfaces/runtime-module-medium.spw` (initial 92-module guild assignment)
- [ ] Land `.spw/conventions/module-export-contract.spw` (target export shape)
- [ ] Wire conventions into `index.spw`, `site.spw`, `planning-ecology.spw`

## Phase 1 — Export contract (code, small)

- [ ] Add `public/js/runtime/module-export-contract.js` with `SPW_MODULE_EXPORT_SHAPE`, `normalizeModuleExport()`, `describeModuleExport()`
- [ ] Adapter in `module-loader.js` mount path: accept `initX`, `spwModule`, or `SPW_MODULE_EXPORT`
- [ ] Export contract helpers from `compose.js`
- [ ] Extend `runtime-contracts.mts` to warn on catalog modules whose import target lacks any export mount

## Phase 2 — Guild alignment (incremental)

- [ ] Migrate 6 `spwModule` files to `SPW_MODULE_EXPORT` + re-export `spwModule` alias (one release tolerance)
- [ ] Promote Grade B contract modules to compose (batch by guild)
- [ ] Add `kernel/storage.js` as rhizosphere nutrient envelope (feeds memory guild)

## Phase 3 — Holistic growth checks

- [ ] `scripts/check-standalone.mjs` — per-file grade + compose gap (optional `check:local` hook)
- [ ] Module medium map in design catalog from `runtime-module-medium.spw` stems

## Metaphor map (runtime medium ecology)

| Medium term | Code term |
|-------------|-----------|
| rhizosphere | `kernel/` contracts, storage, bus |
| canopy | shell, navigation, floating chrome |
| guild | behavior cluster (navigation, memory, inspection, …) |
| nutrient | `updates` token (attr, css-var, event, …) |
| taproot | `site.js` orchestrator |
| pollinator | `compose.js` portable re-exports |
| field bed | `MODULE_LAYERS.FEATURE` route modules |
| compost pass | `MOUNT_WHEN.SETTLED` / side-effect inits |

## Out of scope

- Renaming `state-inspector` files (tracked in `runtime-module-decomposition`)
- Splitting `shell-disclosure` / `experiential` (after export contract lands)
- npm dependencies

## Validation

- `node --check` on new JS
- `npm run check:runtime`
- Spw parser on new `.spw` surfaces
- `git diff --check`

## Relationship

- `runtime-module-decomposition/PLAN.md` — split orchestrators after primitives
- `javascript-standalone-utility/PLAN.md` — compose/console/portable trilogy
- `module-updates-contract.js` — nutrient declaration layer