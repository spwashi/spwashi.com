# Plan: runtime-module-decomposition

Decompose overloaded runtime modules by extracting **generalizable kernel contracts first**, then thinning feature modules into orchestrators. Splits that precede shared primitives just move complexity sideways.

## Public goal

A contributor (human or agent) should recognize the same four primitives everywhere: **persist**, **project**, **toggle**, **emit**. Feature modules (`shell-disclosure`, `experiential`, `haptics`, …) become thin composers over those primitives plus existing contracts (`interaction-loop`, `module-updates`, `floating-chrome`).

## Generalizability rule

Before splitting a file, answer:

1. **Reuse** — Can a second unrelated module import this without pulling domain logic?
2. **Contract** — Does it export a frozen `SPW_*_CONTRACT` (kinds, events, dataset fields, portable use)?
3. **Projection** — Does state land on DOM through `writeDatasetValue(s)` / `writeRuntimeDatasetValues`, not raw `.dataset` assignment?
4. **Event path** — Does outward signal go `bus.emit` first, with DOM alias only when `bus.js` `LEGACY` requires it?
5. **Catalog honesty** — Does `module-catalog.js` declare `updates`, `effectScope`, and `describes` for the surviving module ids?

If any answer is no, build or extend the primitive before carving the feature file.

## Phase 0 — Kernel primitives (highest generalizability, lowest blast radius)

These pay off across every module in the user's list **and** future routes.

### 0a. `kernel/storage.js`

**Owns:** namespaced JSON read/write, `safeParse`, quota guards, optional `session` vs `local`, versioned envelope `{ v, at, data }`.

**Does not own:** spell keys, haptics schema, RPG state shapes.

**First adopters (mechanical migration):** `pin-registry.js`, `discovery-notices.js`, `image-discovery-rewards.js`, `haptics.js` (checkpoint slice only), `design/experiments.js` token bundle.

**Compose export:** `readStorage`, `writeStorage`, `mergeStorage`, `SPW_STORAGE_CONTRACT`.

### 0b. Projection tiers (extend `kernel/dom-contracts.js`)

Already started in `css-sensitive-attribute-writes/`. Formalize three write postures as helpers:

| Tier | Examples | Writer |
|------|----------|--------|
| author-owned | `data-spw-context`, `data-spw-wonder`, `data-spw-operator` | explicit user action or opt-in only |
| transient | `data-spw-charge`, `data-spw-pinned`, gesture rails | `writeDatasetValue` |
| inspection | `data-spw-resolved-*`, module trigger attrs | `writeDatasetValueIfMissing` or audit-only |

Add `writeProjectionTier(el, tier, entries)` wrapper so modules stop ad-hoc `.dataset` writes (72 in `shell-disclosure.js` alone).

### 0c. `runtime/mode-switch.js` (generalize `lens-modes.js`)

**Owns:** group + option buttons + panels, `aria-pressed`, `hidden`, host marks, deep-link builder, settle timing.

**API shape:** `writeModeSwitchState({ group, mode, buttons, panels, describeImpact, describeFeedback })` — `lens-modes.js` becomes a thin profile over this.

**First adopters:** `variant-selection.js`, `brace-actions.js`, route-local mode panels in `design/experiments.js`.

### 0d. Event emission discipline (document + lint, no new bus)

`kernel/bus.js` already centralizes emit + legacy DOM aliases. Standardize module pattern:

```js
bus.emit('shell:menu-state', detail); // canonical
// bus dispatches spw:shell-menu-state when LEGACY entry exists
```

Audit pass: modules that `dispatchEvent(new CustomEvent(...))` without `bus.emit` — migrate when a LEGACY mapping exists; add mapping when the event is public.

**Shell/experiential** `spw:shell-menu-*` and `spw:header-trace-change` should register in `LEGACY` if not already.

### 0e. Floating chrome (already general — enforce usage)

`syncFloatingChromeState`, `FLOATING_CHROME_CONTRACT`, bottom-lane vars from `dom-contracts.js`. Any overlay that competes for bottom space (satchel, console, section handle, region menu, discovery notices) must call sync on open/close/anchor — not local `inset` math.

## Phase 1 — Thin orchestrators (after Phase 0 lands)

Order by cleanup payoff **once primitives exist**:

### 1. `shell-disclosure.js` (2283 lines)

Split into orchestrator + three composable modules:

| Module | Owns | Imports |
|--------|------|---------|
| `shell-measurement.js` | viewport/pointer bands, nav fit, scroll bands | dom-contracts projection |
| `shell-disclosure.js` (slim) | phase machine RESTING→SETTLING, menu topology | mode-switch contract, bus |
| `shell-utilities.js` | theme/tuning cycles, utility buttons, focus traps | site-settings, tuning-discovery |

`shell-disclosure.js` re-exports `initShellDisclosure` only; catalog entry stays one id until stabilization.

### 2. `experiential.js` (2184 lines)

Extract spell/surface modules; each declares `updates` via `module-updates-contract`:

- `breadcrumb-spell.js` — path crumbs, section travel, hash sync
- `sample-dock.js` — specimen hold/swipe dock
- `context-memos.js` — local memo surfaces
- `operator-learning.js` — progressive operator hints

`experiential.js` becomes bus wiring + roomy/compact posture only.

### 3. `haptics.js` (1168 lines)

**First slice:** storage/checkpoints → `kernel/storage.js`; gesture/charge state stays until `interaction-loop` + `charge-field` boundaries are clear.

### 4. State inspector rename (boundary clarity, low risk)

| Current | Proposed | Role |
|---------|----------|------|
| `interface/state-inspector.js` | `interface/state-satchel.js` | floating satchel, drag/snap, snapshots, copy |
| `runtime/state-inspector.js` | `runtime/state-block.js` | per-component state block render/mutate |

Alias old ids in `module-catalog.js` for one release; update `interaction-loop-contract` plan paths.

### 5. `image-metaphysics.js` (986 lines)

After `interaction-loop` adoption: extract `image-visit-memory.js` (persistence) and `image-effect-controls.js` (UI controls). Host keeps `interaction-loop` registration only.

### 6. `design/experiments.js` (1228 lines, route-local)

Split labs only after `mode-switch` + `storage` — lowest site-wide risk, good pattern bed.

## Phase 2 — `kernel/shared.js` (1991 lines, high risk)

Defer until Phases 0–1 prove the boundary model. Obvious extraction order:

1. `kernel/operators.js` — `OPERATOR_DEFINITIONS`, `splitOperatorExpression`
2. `kernel/climate-tokens.js` — hormone/token state reads
3. `kernel/feature-helpers.js` — env, author workflow, feature loading

`shared.js` becomes re-export barrel for one release, then shrinks.

## Intentionally not first

- `site.js`, `module-loader.js`, `module-catalog.js` — orchestration/registry surfaces; already modular via catalog defs.
- Renames across CSS/HTML until `shell-model-vocabulary-consolidation` gate clears.

## Relationship to existing plans

| Plan | Relationship |
|------|----------------|
| `interaction-loop-contract/` | Phase 0 primitive; image + state-block consumers |
| `css-sensitive-attribute-writes/` | Phase 0b projection tiers |
| `shell-model-vocabulary-consolidation/` | Naming gate for satchel/chrome words after behavior splits |
| `chrome-navigation-wonder/` | Bottom-lane + locomotion; enforce 0e floating chrome sync |
| `module-updates-contract` (landed) | Every split module must declare `updates` |

## Validation

- `npm run check:local` + `npm run check:runtime` after each primitive lands
- `node --check` on every new kernel module
- **Generalizability smoke:** two adopters per primitive (e.g. `pin-registry` + `haptics` for storage; `variant-selection` + `lens-modes` for mode-switch)
- **No file > 600 lines** after orchestrator split (craft guard from `interaction-loop-contract`)
- Debug: `?debug=layout` module update chips still accurate on mounted triggers

## Suggested commit sequence

1. `kernel/storage` + two adopters
2. `mode-switch` contract + `variant-selection` migration
3. projection-tier helpers + `shell-disclosure` dataset write pass
4. bus audit for shell/experiential events
5. `shell-measurement` extract
6. `breadcrumb-spell` + slim `experiential`
7. state-satchel / state-block rename
8. `shared.js` operator extract (optional, gated)

## Out of scope

- Framework introduction, npm dependencies
- Attribute vocabulary migration (Phase 1b of shell-model plan)
- Full `shared.js` deletion in one pass