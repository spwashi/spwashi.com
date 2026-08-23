# CSS Architecture Readability Series

## Public Goal

Make the site's CSS easier to read, inspect, and refactor while improving the developer experience of changing UX behavior. The next series should turn the first debug-label pass into a literate maintainability program: clearer ownership boundaries, behavior-facing names, smaller files, stronger local tokens, less selector guesswork, and repeatable validation.

This is a CSS architecture plan, not a redesign. The site should look materially the same unless a local cleanup reveals a small behavior bug or a confusing affordance that should be corrected in place.

## Current Baseline

Already landed:

- Debug owner markers with `--spw-debug-layer-owner` and `--spw-debug-layer-color`.
- `html[data-spw-debug-layers="on"]` / `data-spw-debug~="layers"` visualization.
- Initial property clustering in touched high-value blocks.
- README documentation for clustering and diagnostic owner semantics.
- CSS build source-map freshness normalization.

Known constraints:

- `public/css/style.css` owns cascade layer order and must not be reordered.
- `public/css/effects/debug.css` is generated from `src/styles/entries/debug.css`.
- `check-generated` treats unstaged generated outputs as stale, so generated CSS and compiled tool output must be staged with their sources before final checks.
- The debug layer labels are diagnostic nearest-visible ownership markers, not true CSS provenance.

## UX And Literate Code Direction

- Treat CSS readability as part of UX development: the next editor should be able to connect a visible behavior to the selectors, tokens, and route semantics that produce it.
- Name CSS properties, local tokens, and `data-spw-*` hooks around user-facing behavior where possible: reveal, focus, collect, inspect, compare, settle, charge, and navigate.
- Keep debug overlays useful as developer UX, with labels that explain ownership and behavior without becoming the product experience.
- When a selector changes interaction behavior, record the behavior contract near the selector or in the relevant `.spw` surface.
- Prefer literate clusters over clever compression: nearby code should explain what can be changed safely and what is a shared contract.
- Use file splits to improve reading order, not just file size.
- Treat CSS as a documentation layer for authored HTML: selectors should make the page structure easier to understand, not hide the meaning behind clever styling. Child (`>`), next sibling (`+`), and `:has()` are the readable kinship. Banner comments are not a substitute.
- `@layer` is cascade priority, not a load or cache schedule. First-paint spend is a delivery question — see `core-css-spend-cut/PLAN.md` and `.spw/conventions/stylesheet-ecology.spw`.
- Treat Spw sigils in HTML as learnability surfaces, not just decoration. When a chip or handle combines a sigil with plain text, the CSS and markup should keep the action auditable by label, operator, destination, and state.
- Use reference-card attributes when a design surface needs later auditability: `data-spw-attention`, `data-spw-behavior`, `data-spw-reference-seed`, and `data-spw-assignment`.
- Treat `data-spw-operator` (and the growing set of operator projections in `.spw/conventions/operator-site-projection.spw`) as first-class semantic hooks. Operator chips are not merely decorative; their selectors, states, and resonance behavior must remain traceable and consistent across layers. New operators (`!`, `*`, `&`, `.`) introduce additional styling contracts that should be centralized in operators.css rather than duplicated in route surfaces. See operator-site-projection.spw for the current site_role, selector, and claim expectations per operator.

## CSS / JS / HTML Alignment Rhythm

The architecture should support two different kinds of experience:

- **Seamless adjustment:** the page quietly improves fit for reading, layout, accessibility, connection posture, or debug safety. CSS and JS may adjust state, but they must leave inspectable attributes, avoid surprising focus/storage changes, and keep authored HTML as the semantic ground.
- **Resonant pause:** a cluster of features becomes worth noticing because the user has focused an operator, completed a gesture, changed a meaningful setting, or reached a practice-bed insight. CSS may intensify the cluster briefly, JS may emit a named event, and nearby copy or inspector output should explain the cause.

Use this decision rule before refactoring a surface:

1. If the behavior protects baseline usability, keep it quiet and inspectable.
2. If the behavior teaches a relation, make the resonant cluster appreciable and reversible.
3. If the behavior repeats across routes, sediment it into shared CSS, a JS ownership layer, and a `.spw` claim or slice note.
4. If the behavior is only local color, keep it in the route surface and do not promote it.

The preferred trace is:

```text
route HTML -> data-spw-* contract -> CSS layer/file -> JS module/event -> .spw claim or slice
```

If that trace cannot be followed in a minute, the change is not yet discoverable enough.

## File Tree Utility

File tree changes are useful only when they improve ownership, search, review boundaries, or seasonal handoff.

- Keep the current cascade layer order unless a separate evidence-gated patch proves a semantic-flow problem cannot be solved otherwise.
- Prefer slice manifests or `.spw/slices/<slice>/` contracts before moving many CSS files.
- Split CSS when it creates a clearer reading path from component role to state projection.
- Split JS when it clarifies kernel/runtime/interface/semantic/modules ownership or removes cross-layer coupling.
- Do not create a directory merely to mirror an ontology if the result hides import order, cascade precedence, or runtime mounting.
- Treat the design catalog, state inspector, and `.spw` slice notes as part of the file tree ecology, not after-the-fact documentation.

## Component Development Sessions

CSS readability should often improve while developing or tuning a real component, not only through abstract cleanup.

Session shape:

1. Choose one component or route cluster, such as `.operator-chip`, `.frame-card`, `.mode-switch`, settings controls, or `/design/` specimen cards.
2. Read the HTML first and name the structural roles already present.
3. Identify the component's usual behavior: default, hover, focus, active, selected, disabled, reduced motion, and compact viewport.
4. Update CSS so those states are grouped, named, and traceable from the HTML attributes or classes.
5. Add a token or selector name only when it helps another agent find the behavior later.
6. Decide whether the result is seamless adjustment, resonant pause, or sedimentation.
7. Leave a short note in the plan or nearby `.spw` surface explaining whether the session produced an improvement, an experiment, a resonant cluster, or a rejected direction.

Intern-sized examples:

- Compare operator chips across three routes and make the shared focus behavior easier to trace.
- Audit one sigil-plus-label operator pattern and confirm the Spw mark, plain-language text, `data-spw-operator`, and link destination teach the same action.
- Compare one reference-card cluster and confirm its heading anchor, attention value, behavior value, assignment code, and next-step link all describe the same small task.
- Use `/design/components/` to tune one card anatomy rule and document the slot contract in CSS selectors.
- Inspect settings controls and name one repeated state as a shared behavior token.
- Audit a set of operator chips (including newer ones like `!` pragma, `*` value, `&` merge, `.` ground) against the projections in operator-site-projection.spw; ensure their visual states (hover, active, resonance) are driven from centralized operator tokens and data attributes rather than ad-hoc rules.
- Use debug labels on a dense route to check whether CSS owner markers document the HTML structure clearly.

## 2026-08 token dialect pass
- Anchor dialects the corpus already speaks (`--ink-muted`, `--card-border`, `--page-bg`, `--font-mono`, `--danger`, `--ease-smooth`) in `tokens/core.css`. Do not add a second ink family.
- Thermodynamic HTML numbers project through typed `attr()` in `dimensions.css`. Enumerating `"0.75"` selectors is not an abstraction.
- Owner of the pass: `data-attribute-css-token-refinement` as a satellite of this plan, not a new ontology.

## Success Criteria

- Large CSS files have clearer local ownership and navigable sections.
- New and touched blocks follow the documented property clustering order.
- Shared component styles use local tokens instead of repeated raw `color-mix(...)`, gradient, and shadow expressions.
- Debug labels are useful on real routes without blocking controls or burying content.
- Route and component ownership boundaries are inspectable through existing semantic hooks, not guessed selectors.
- A visible UX behavior can be traced from route HTML to CSS token to runtime state without guessing.
- Component sessions produce small readability improvements while preserving the authored HTML as the source of meaning.
- CSS comments and `.spw` notes explain non-obvious behavior contracts, not routine declarations.
- Dark and auto color-mode overrides become token-only wherever possible.
- Validation is deterministic through `npm run check:css`, `npm run check`, and `git diff --check`.

## Out Of Scope

- Do not change the cascade layer order in `public/css/style.css`. Do not move a file to a later layer to “make it load later.”
- Do not convert `data-spw-composition-flow` into global layout behavior yet.
- Do not rename or move CSS files without updating `style.css` imports in the same patch.
- Do not introduce a framework, runtime dependency, or client-side CSS-in-JS system.
- Do not mass-format every CSS file.
- Do not use `!important` outside existing justified cases unless the target is an ornament/debug escape hatch.
- Do not change route HTML only to satisfy CSS organization. Add semantic hooks only when a route already has an honest concept boundary.

## Diff Discipline

- Do not combine file moves with selector rewrites.
- Do not combine token extraction with visual changes.
- Do not cluster untouched blocks.
- Prefer one architectural intent per patch.
- Include generated CSS/map output in the same patch as its source change.

## Token Efficiency

- Prefer existing primitives and aliases before adding new tokens.
- Add a new token only when it names a reusable concept, not a one-off value.
- If a value is used in only one selector, keep it local unless it needs dark/auto symmetry or cross-file reuse.
- Derive component-local tokens from role tokens when possible instead of creating parallel primitives.
- Reuse diagnostic owner markers across layers; do not invent near-duplicate labels for the same ownership family.
- Collapse repeated gradients, shadows, and color blends into local tokens before spreading them across variants.

## Navigability Contract

- Use custom property names that are specific enough to be found by `rg` and by a coding model reading nearby files.
- Prefer names that encode role and ownership instead of generic buckets like `--accent-1` or `--state-a`.
- Keep `data-spw-*` names aligned with the concept they expose, not the file that happened to introduce them.
- When a JS or TypeScript helper is added, name it after the semantic action it performs so it can be traced back from the CSS token or data attribute.
- If a concept needs a sidecar, use the same stem across image, `.spw`, and route references.
- Prefer names that describe the behavior a visitor experiences over names that only describe implementation technique.

## Property Clustering Contract

Use this order for all new rules and touched blocks:

1. Debug / inspection
2. Local tokens
3. Layout
4. Box
5. Typography
6. Visual
7. Interaction
8. Motion
9. State projection
10. Layering / containment

Rules:

- Apply clustering to edited blocks only.
- Prefer moving repeated values into local custom properties before rearranging many declarations.
- Keep diagnostic variables at the top of stable owner selectors, not inside hover, focus, animation, or media-query blocks.
- Keep route identity tokens near the route surface selector.
- Keep state projection selectors close to the base selector they mutate.
- Do not introduce a token for a value used once unless it names a meaningful route/component concept or is needed for dark/auto override symmetry.

Example:

```css
:where(.frame-card) {
  /* Debug / inspection */
  --spw-debug-layer-owner: "components";
  --spw-debug-layer-color: #9933cc;

  /* Local tokens */
  --card-local-line: var(--component-line);
  --card-local-surface: var(--component-surface-strong);

  /* Layout */
  display: grid;
  gap: var(--component-gap-tight);

  /* Box */
  min-width: 0;
  padding: var(--component-pad);
  border: 1px solid var(--card-local-line);

  /* Typography */
  color: var(--ink);

  /* Visual */
  background: var(--card-local-surface);
  box-shadow: var(--component-shadow);

  /* Interaction */
  transition: border-color var(--component-transition-base);

  /* Layering / containment */
  position: relative;
  container-type: inline-size;
}
```

## Patch 1 - Debug UX Hardening

Goal: make layer debug mode useful during browser inspection without making the page unreadable.

Files:

- `src/styles/entries/debug.css`
- `public/css/effects/debug.css`
- `public/css/effects/debug.css.map`
- `public/css/README.md`

Changes:

- Add a compact mode for dense pages:

```html
<html data-spw-debug-layers="compact">
```

- In compact mode, show outlines by default and reveal labels on `:hover` / `:focus-within`.
- On small screens, prefer outline-first behavior and reveal labels only on hover, focus-within, or explicit compact inspection.
- Avoid broad `position: relative` changes; only apply positioning to targets that need label anchoring.
- Add a top-right fixed legend for the active debug mode only if it can be done without JS.
- Split debug selectors into named sections: semantic labels, layer-owner labels, runtime footer, reduced-motion.
- Add label collision guardrails for small components: avoid `::after` labels on inline-only chips unless hovered or focused.
- Keep docs clear that owner labels show diagnostic nearest-visible ownership, not real provenance.
- Verify the overlay does not block `.operator-chip`, `.frame-sigil`, mode switches, or settings controls.

Risks:

- Debug labels can still be noisy on the homepage.
- `position: relative` in debug mode can affect rare elements with existing absolute descendants. Keep selectors narrow and test real routes.

Validation:

- `npm run build:css`
- `npm run check:css`
- Manual browser pass on `/`, `/settings/`, `/design/`, and one article route with `data-spw-debug-layers="on"` and `"compact"`.

## Patch 1A - Debug Selector Split

Goal: separate semantic labels from owner labels in the debug stylesheet before changing visuals.

Files:

- `src/styles/entries/debug.css`
- `public/css/effects/debug.css`
- `public/css/effects/debug.css.map`

Changes:

- Split the existing debug block into named subsections.
- Keep owner labels and semantic labels in separate selector groups.
- Preserve current visuals.

Validation:

- `npm run build:css`
- `npm run check:css`

## Patch 1B - Compact Mode

Goal: make dense-page debugging safer and easier to scan.

Files:

- `src/styles/entries/debug.css`
- `public/css/effects/debug.css`
- `public/css/effects/debug.css.map`
- `public/css/README.md`

Changes:

- Add `compact` mode behavior.
- Prefer outline-first labels on small screens.
- Add label collision guardrails for small components.
- Update docs to explain compact mode.

Validation:

- `npm run build:css`
- `npm run check:css`
- Manual browser pass on `/`, `/settings/`, and `/design/`

## Patch 2 - Route Owner Markers

Goal: extend diagnostic owner labels to route surfaces without adding layout behavior or guessing nonexistent classes.

Files:

- `public/css/routes/surfaces/home.css`
- `public/css/routes/surfaces/settings.css`
- `public/css/routes/surfaces/settings-forms.css`
- `public/css/routes/website-surface.css`
- `public/css/routes/about-surface.css`
- `public/css/routes/topics-surface.css`
- `public/css/routes/design-surface.css`
- `public/css/routes/surfaces/blog.css`
- route files touched only if an existing page-level selector is already present

Selector rule:

```css
:where(body[data-spw-surface="home"]) {
  /* Debug / inspection */
  --spw-debug-layer-owner: "routes";
  --spw-debug-layer-color: #a67c00;
}
```

Changes:

- Add one owner marker at the route surface boundary per route file.
- Do not add route markers to arbitrary inner classes.
- Cluster the top route token block only when already editing it.
- Add a short README note that route files should prefer `body[data-spw-surface="..."]` as the owner boundary.

Risks:

- Later `handles`, `effects`, or `ornament` layers will overwrite the visible owner marker on nested elements. That is expected and should remain documented.

Validation:

- `rg -n -- "--spw-debug-layer-owner: \"routes\"" public/css/routes`
- `npm run check:css`
- Browser spot check with the debug overlay on route-heavy pages.

## Patch 2A - Route Boundary Markers

Goal: add route-level owner labels only at the outer surface boundary.

Files:

- `public/css/routes/surfaces/home.css`
- `public/css/routes/surfaces/settings.css`
- `public/css/routes/surfaces/settings-forms.css`
- `public/css/routes/website-surface.css`

Changes:

- Add one `body[data-spw-surface="..."]` owner marker per route file.
- Avoid inner selector churn.

Validation:

- `rg -n -- "--spw-debug-layer-owner: \"routes\"" public/css/routes`
- `npm run check:css`

## Patch 2B - Route Coverage Pass

Goal: extend route markers to the remaining high-traffic routes.

Files:

- `public/css/routes/about-surface.css`
- `public/css/routes/topics-surface.css`
- `public/css/routes/design-surface.css`
- `public/css/routes/surfaces/blog.css`

Changes:

- Apply the same route-boundary marker pattern.
- Keep values and comments consistent.

Validation:

- `npm run check:css`
- Browser spot check on route-heavy pages.

## Patch 3 - Component Token Extraction

Goal: reduce repeated visual math in component rules by introducing local component tokens that make rule bodies readable.

Primary files:

- `public/css/components/foundation.css`
- `public/css/components/cards.css`
- `public/css/components/surfaces.css`
- `public/css/components/frames.css`
- `public/css/effects/material.css`

High-value targets:

- `.frame-card`
- `.frame-panel`
- `.spw-frame`
- `.mode-panel`
- `.media-card`
- `.operator-card`
- `.plan-card`
- `.ref-card`
- `[data-spw-region-flow]`
- `[data-spw-component-kind]`

Changes:

- Introduce local variables such as:

```css
--card-local-surface
--card-local-surface-strong
--card-local-line
--card-local-line-active
--card-local-shadow
--card-local-shadow-active
--card-local-accent
```

- Replace repeated long `color-mix(...)`, gradient, and shadow expressions inside card rules with named local tokens.
- Keep the raw token math near the owner selector, not repeated in every variant.
- Cluster variants as state projection:

```css
:where(.frame-card[data-spw-role="routing"]) {
  /* State projection */
  --card-local-surface: ...;
}
```

- Avoid changing visual output unless a repeated expression is clearly inconsistent.

Risks:

- Token extraction can accidentally change fallback order. Keep original fallback chains intact.
- Too many new variables can make the system less readable. Add only tokens reused by multiple declarations or variants.

Validation:

- `npm run check:css`
- Visual compare on home card grids, `/plans/`, `/topics/`, `/settings/`.

## Patch 3A - Surface Token Extraction

Goal: lift the highest-value repeated surface values into local tokens without changing behavior.

Files:

- `public/css/components/foundation.css`
- `public/css/components/cards.css`
- `public/css/effects/material.css`

Changes:

- Extract the repeated gradients, shadows, and borders first.
- Keep naming aligned to the owning component or surface.

Validation:

- `npm run check:css`
- `git diff --check`

## Patch 3B - Variant Cleanup

Goal: apply the new tokens to a small set of variants and state projections.

Files:

- `public/css/components/cards.css`
- `public/css/components/surfaces.css`
- `public/css/components/frames.css`

Changes:

- Update the most repeated variants only.
- Preserve existing appearance.

Validation:

- Visual compare on shared card-heavy routes.

## Patch 4 - Large File Responsibility Split

Goal: make the largest CSS files navigable by separating clear ownership domains while preserving import order.

Primary candidates by size:

- `public/css/shell/chrome.css` at roughly 3000 lines.
- `public/css/handles/operators.css` at roughly 2200 lines.
- `public/css/grammar/syntax.css` at roughly 1900 lines.
- `public/css/components/cards.css` at roughly 1250 lines.

Preferred split order:

1. `chrome.css`
2. `operators.css`
3. `cards.css`
4. `syntax.css`

Start with `chrome.css` only if its major sections are already clean and contiguous. If section boundaries are tangled, postpone splitting and first add section comments or ownership markers without moving code.

`chrome.css` split proposal:

- Keep `public/css/shell/chrome.css` as the imported registry for shell chrome.
- Add sibling files only if `style.css` imports them directly or `chrome.css` becomes a documented internal import source.
- Candidate modules:
  - `public/css/shell/chrome-header.css`
  - `public/css/shell/chrome-nav.css`
  - `public/css/shell/chrome-mobile-menu.css`
  - `public/css/shell/chrome-footer.css`
  - `public/css/shell/chrome-section-handle.css`

`operators.css` split proposal:

- Keep generic handle primitive in `operators.css`.
- Candidate modules:
  - `public/css/handles/operator-chips.css`
  - `public/css/handles/frame-sigils.css`
  - `public/css/handles/mode-switch.css`
  - `public/css/handles/semantic-metadata.css`
  - `public/css/handles/spells.css`
  - `public/css/handles/memo-surfaces.css`

`cards.css` split proposal:

- Keep primitive card anatomy in `cards.css`.
- Candidate modules:
  - `public/css/components/card-links.css`
  - `public/css/components/card-media.css`
  - `public/css/components/card-semantic-maps.css`
  - `public/css/components/card-route-bridges.css`

Guardrails:

- Split by moving contiguous sections only. Do not interleave unrelated refactors.
- Preserve relative order of moved sections in `style.css`.
- If a split file is added, update `public/css/README.md`.
- Do not split and redesign in the same commit.

Validation:

- `npm run check:css`
- `npm run check`
- `git diff --check`
- `rg -n "@import url\\('/public/css/(shell|handles|components)/" public/css/style.css`

## Patch 5 - Dark Mode And Auto Mode Symmetry

Goal: make color-mode overrides easier to reason about by keeping dark/auto branches token-oriented and parallel.

Files to inspect:

- `public/css/tokens/core.css`
- `public/css/routes/surfaces/home.css`
- `public/css/routes/surfaces/settings.css`
- `public/css/routes/surfaces/settings-forms.css`
- `public/css/routes/website-surface.css`
- `public/css/effects/material.css`
- `public/css/effects/wonder.css` (idle-loads with flourish-pack; tokens in `flourish-defaults.css`)
- `public/css/ornament/canvas-accents.css`

Changes:

- Prefer one base token block plus dark/auto token overrides.
- Avoid duplicating full selector bodies inside color-mode media queries.
- Keep `html[data-spw-color-mode="dark"]` and `@media (prefers-color-scheme: dark) { html[data-spw-color-mode="auto"] ... }` structurally parallel.
- Move repeated dark-mode colors into local route/component tokens.
- Add comments only where dark/auto behavior intentionally diverges.

Anti-pattern to reduce:

```css
html[data-spw-color-mode="dark"] .some-card {
  display: grid;
  gap: ...;
  padding: ...;
  background: ...;
}
```

Preferred:

```css
.some-card {
  --some-card-surface: ...;
  display: grid;
  gap: ...;
  padding: ...;
  background: var(--some-card-surface);
}

html[data-spw-color-mode="dark"] .some-card {
  --some-card-surface: ...;
}
```

Validation:

- `npm run check:css`
- Manual check in light, dark, and auto on `/`, `/settings/`, `/website/`.

## Patch 6 - Structural Selector Cleanup

Goal: replace fragile child-order selectors with explicit slots or existing semantic hooks where the markup already supports them.

Files:

- `public/css/routes/surfaces/home.css`
- route HTML only when a real slot name is missing and the structure already has a stable concept
- `.spw/conventions/composition-box-model.spw` only if a new reusable slot/box contract is introduced

Known target:

- Home route selectors that place `.frame-note:nth-of-type(...)` in grids.

Preferred direction:

```html
<p class="frame-note" data-spw-slot="hero-note">
```

or:

```html
<p class="frame-note" data-spw-region="hero-note">
```

Rules:

- Use existing `data-spw-slot`, `data-spw-region`, or `data-spw-feature` families before inventing a new attribute.
- Do not add empty wrappers just to carry a hook.
- Keep copy and heading structure unchanged.
- If the hook becomes a reusable contract, update `.spw` documentation.

Validation:

- `rg -n "nth-of-type|nth-child" public/css/routes public/css/components public/css/grammar`
- Browser check on `/` at mobile and desktop widths.

## Patch 7 - `!important` Containment Audit

Goal: document or remove high-priority overrides so cascade behavior is explainable.

Files:

- `public/css/grammar/syntax.css`
- `public/css/ornament/canvas-accents.css`
- any additional hits from `rg -n "!important" public/css`

Changes:

- Classify each `!important` as:
  - required debug/ornament escape hatch
  - specificity workaround that can be removed
  - third-party/browser reset workaround
  - bug
- Replace removable cases with correct layer placement, selector structure, or local tokens.
- Add a short comment for any remaining required case.

Validation:

- `rg -n "!important" public/css`
- `npm run check:css`

## Patch 8 - `.spw` And Documentation Alignment

Goal: make the CSS architecture convention inspectable for future agents and editors.

Files:

- `public/css/README.md`
- `.spw/conventions/css-instruction.spw` if present or worth introducing
- `.spw/site.spw` if the convention needs to be discoverable from the site model
- optional `.agents/plans/css-architecture-readability/PLAN.md` if this plan becomes the main multi-patch track

Changes:

- Document:
  - cascade layer order
  - diagnostic owner marker semantics
  - property clustering order
  - route owner boundary rule
  - generated debug stylesheet source-of-truth rule
  - when composition attributes are metadata versus layout contracts
- Avoid duplicating long README prose in `.spw`; make `.spw` concise and inspectable.

Validation:

- `rg -n "css-instruction|debug-layer|property cluster|composition-flow" .spw public/css/README.md`
- `npm run check`

## Patch 9 - Optional Composition Layout Contract

Goal: decide whether `data-spw-composition-flow` should remain metadata or become an opt-in layout contract.

This is deliberately later. The existing attributes are already present across routes and runtime surfaces, so global styling could regress layout.

Decision options:

- Keep as metadata only and use it only in debug labels.
- Add opt-in styling under a stricter root gate such as:

```html
<html data-spw-composition-layout="on">
```

- Add layout behavior only for new scoped containers:

```css
:where([data-spw-layout-contract="composition"]) [data-spw-composition-flow="grid"] {
  display: grid;
}
```

Required before implementation:

- Inventory current usage:

```sh
rg -n "data-spw-composition-flow|data-spw-box-model" .
```

- Identify which attributes are written by JS and when.
- Decide whether the contract belongs in CSS, `.spw`, or both.

Validation:

- Browser check on every route family that already carries composition metadata.
- Update `.spw/conventions/composition-box-model.spw` before shipping any new contract.

## Suggested Commit Series

1. `Harden CSS layer debug overlay`
2. `Add route CSS owner markers`
3. `Map UX behavior contracts in CSS`
4. `Extract reusable component surface tokens`
5. `Split shell chrome CSS responsibilities`
6. `Split operator handle CSS responsibilities`
7. `Normalize dark mode token overrides`
8. `Replace fragile route structural selectors`
9. `Document CSS architecture conventions in Spw`
10. `Evaluate composition layout contract`

Each commit should be independently reviewable and should avoid mixing file splits with behavior changes.

Preferred first implementation sequence:

```text
Harden CSS layer debug overlay
Add route CSS owner markers
Map UX behavior contracts in CSS
```

## Combined Roadmap

This plan is part of the broader design-system track:

1. Harden CSS layer debug overlay.
2. Add route CSS owner markers.
3. Map visible UX behaviors to named CSS and runtime contracts.
4. Audit color, motion, and site personality signals.
5. Add interaction timing bands.
6. Normalize operator chip microinteractions.
7. Document concept-inspiration workflow for UX prototypes.
8. Add focused design prompt bank.
9. Run SuperGrok animation study sprint.
10. Prototype `/design/` grammar atlas concept.
11. Extract reusable component surface tokens.
12. Begin large CSS file responsibility split.

Strategic rule:

```text
Use external inspiration and visual tuning to strengthen the repo-native system: UX behavior, site personality, tokens, semantics, CSS contracts, .spw conventions, and inspectable route/component boundaries.
```

## Validation Loop For Each Patch

Always run:

```sh
npm run build:css
npm run check:css
git diff --check
```

Run for broader patches:

```sh
npm run check
```

For documentation-only changes:

```sh
git diff --check
```

Run when TypeScript build tooling changes:

```sh
npm run build:tools
npm run typecheck
```

Manual browser checks:

- `/`
- `/settings/`
- `/design/`
- `/website/`
- one content-heavy route such as `/blog/` or `/recipes/`

Debug browser checks:

- `html[data-spw-debug-layers="on"]`
- `html[data-spw-debug-layers="compact"]`
- existing `data-spw-debug~="css"`
- existing `data-spw-debug~="layout"`

## Tracking Queries

Use these to keep the work bounded:

```sh
wc -l public/css/shell/chrome.css public/css/handles/operators.css public/css/grammar/syntax.css public/css/components/cards.css
rg -n "!important" public/css
rg -n "nth-of-type|nth-child" public/css/routes public/css/components public/css/grammar
rg -n "html\\[data-spw-color-mode=\"dark\"\\]|data-spw-color-mode=\"auto\"" public/css
rg -n "color-mix\\(|linear-gradient\\(|box-shadow:" public/css/components public/css/routes public/css/effects
rg -n -- "--spw-debug-layer-owner|--spw-debug-layer-color" public/css src/styles/entries/debug.css
rg -n "data-spw-composition-flow|data-spw-box-model" .
```

## Review Questions Before Implementation

- Which file split pays down the most review pain first: `chrome.css` or `operators.css`?
- Should route owner markers be added to every route file or only active/high-traffic route families?
- Should compact debug mode be the default for layer labels on small screens?
- Which component tokens are genuinely reused enough to deserve names?
- Should `.spw/conventions/css-instruction.spw` become the canonical inspectable contract, or is `public/css/README.md` enough for now?

## Implementation Note - 2026-07-03 Chapter Split And Genome Banners

- Split the two largest surfaces into chapter files with rule order preserved verbatim and cascade equivalence proven against the flattened core bundle (comment-stripped, same-layer wrapper seams normalized): `handles/operators.css` (4578 lines) -> `handles/operators/` (ten chapters), `shell/chrome.css` (5623 lines) -> `shell/chrome/` (five chapters).
- Each chapter opens with a literate banner: "Reads as" voice line, "Was" provenance, a genome block (states sensed, custom properties defined, intent hooks consumed), and a live probe hint.
- `public/css/README.md` gained "Reading The Tree": naming anatomy (place / body part / disposition), moseying tree/rg probes, browser-toggling guidance, and the rule that a chapter whose genome and prose disagree is a bug.
- Validation posture for future splits: banner-opener line boundaries only (a split at a banner's middle line leaves an unterminated comment seam); assert per-chunk brace balance on comment-stripped text; prove flattened-bundle equivalence before deleting the original.
- `design/experiments/load-symphony/` added to `VALIDATION_IGNORED_PREFIXES` (review-demo copies, not production routes).
