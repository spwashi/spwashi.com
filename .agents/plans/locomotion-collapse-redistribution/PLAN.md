# Plan: locomotion-collapse-redistribution

Braid five threads into one motion-and-scheduling contract: element locomotion rendered as electricity arcs, extra-space collapsing as a container decision, component variants split by axis, work riding named lifecycle windows instead of private timers, and JavaScript redistributed across those windows by measured cost.

## Public Goal

Elements should *travel*, not teleport: when layout changes move something, the movement reads as a conducted arc in the site's charge vocabulary. Space left behind should collapse deliberately during settle windows, never mid-interaction. Variants should announce whether they change form or style, and arrive through the same windows. The runtime should do its work inside a small set of named windows (arrival steps, settle quiet-window, post-settle idle, background) so timing is inspectable, tunable, and cheap.

## Grounding (what already exists)

- **Charge vocabulary**: `charge-field.js` phases (armed → preview → charged → discharging → settled → grounded → transferring); `arc-lifecycle.js` tracks prime/land/residue on interactions; `circuit-anatomy.css` names resistor/capacitor/inductor/transformer roles. Movement itself is the missing arc: interactions arc, but *locomotion* doesn't.
- **Box memory**: `composition-box-model.js` snapshots composition boxes — the before/after measurements a FLIP-style locomotion pass needs are already collected.
- **Occupancy reporting**: the region profiler writes `data-spw-pack-occupancy` as state; per the governance `geometry_rule` (2026-07-07), reporting attributes tune tokens but never set carrier geometry. Space collapsing is the *legitimate* spend of that report: a container rule deciding to tighten gaps/padding/grid-flow for sparse occupancy.
- **Windows**: `MOUNT_WHEN` (immediate | visible | idle | interaction | region | settled) in `module-catalog.js`; the evidence-declared settle (`page-state.js`, `data-spw-page-settle-confirmation`) gives a truthful page-level quiescence signal; `spw:page-settle-confirm` and the settled attention event are subscribable.
- **Variant machinery**: `variant-selection.js` + `kernel/query-composer.js` + `settings-query-parity.js` already translate query params into settings partials. The copy-editor rails (`?tempo=`, `?contour=`) landed beside this and should merge into it.

## The Contract

### 1. Locomotion arcs
When a tracked element's box moves past a threshold between two settle-adjacent snapshots, emit `spw:element-locomotion` with the vector and charge framing: departure is a discharge, travel is the arc, arrival is a ground. CSS renders the arc through existing charge/arc tokens; `prefers-reduced-motion` collapses to instant placement. Locomotion passes run only inside settle windows — never per-frame, never on scroll.

### 2. Extra-space collapsing
Sparse occupancy reports license their *parent container* (a content-role rule, per `geometry_rule`) to collapse: tighter `--component-gap`/`--component-pad` spend, `grid-auto-flow: dense` where declared safe, and gap redistribution. Collapse executes in the settle window and registers as a layout trope (`spacing-tune` / `gestalt-rebalance`) so the trace points at the responsible rule. Collapsing is itself locomotion: displaced neighbors get arcs.

### 3. Component variants by axis
Every variant declares its axis: `style` variants are token-only (variance-eligible per the symphonic impact gradient — hue, grain, ornament timing) and may apply at any time; `form` variants are structural and must arrive through an arrival/settle window so the swap is conducted. Query-driven variant selection, tempo/contour rails, and settings parity converge on one grammar in `query-composer.js` — one place a copy editor learns.

### 4. Named windows, not private timers
A module needing "after things calm down" listens for the settled confirmation instead of owning a `setTimeout`. Window ladder: `arrival-step-N` (choreography) → `settle-quiet` (measurement, collapse, locomotion) → `post-settle-idle` (narration, decoration, prefetch) → `background` (nothing). Existing private timers (viewport-correction polling, pulse/momentum timers) migrate incrementally; pulse-shaped attributes stay timer-bound by definition but should derive their timing from tokens.

### 5. JavaScript redistribution
Three moves, ordered by safety:
1. **Demote narration**: pure attribute-writers that decorate (ecology genre/trope, momentum surfaces) move to `post-settle-idle`; the pulse/state doctrine guarantees nothing load-bears on them.
2. **Freeze and replay**: a settled page's root attribute bundle is property-representable state — serialize it (sessionStorage beside the page handoff) and let prepaint seed it on return visits, with evidence re-confirming after boot. Return visits paint in their remembered state; the runtime's job shrinks to verification.
3. **Budget by window**: the `timings()` surface already records per-module cost; rank modules by cost × window and move the expensive ones later. The catalog gains a per-window budget so regressions are visible in review.

## Implementation Prime

Operation: `prime`. Fixity tier: `experimental` until one pilot (home route) demonstrates locomotion arcs + sparse collapse in a browser review.

Safe first patch: (1) emit `spw:element-locomotion` from a settle-window FLIP pass over composition-box snapshots on one route, attributes only, no visuals; (2) let one sparse grid collapse via existing pack tokens; (3) render the arc for exactly one element kind. No variant work, no timer migration in the first patch.

## Human Review Gates

Per sensation gates: arc rendering, collapse feel, and window pacing end at proposal + demo in a throttled browser session (load-symphony bench). Two candidate arc treatments minimum. Timer migration and JS redistribution are mechanical and gate on `npm run check:local` + timings comparison instead.

## Risks

- Locomotion arcs on the wrong altitude (root/region projections) would repeat the packing bug — locomotion tracking is opt-in by content-role selector, never by bare state attribute.
- Collapse fighting arrival choreography: both run in settle windows; collapse waits for the quiet-window confirmation, arrival owns the steps before it.
- Freeze/replay staleness: seeded attributes must be re-confirmed by evidence; a mismatch resolves toward live evidence, and the confirmation attribute records `guard` if verification never completes.

## Validation

- Locomotion pass adds zero long tasks during arrival steps (Performance panel, `spw:` marks).
- Reduced motion: no arcs, instant placement, collapse without transition.
- Return visit with frozen state: first paint matches remembered state; settle re-confirms `auto`.
- Timings comparison shows narration modules leaving the boot-critical path.
