# CSS Architecture Readability Series

**Status 2026-11-06.** No patch moved after 2026-10-10. `src/styles/entries/debug.css` is untouched, `components/cards.css` changed only in 2739db05 (the copy-motif strip), and fd554339 named the layer order at `style-core.css:1` in `css-instruction.spw#import_manifest`. Landed: Patches 2/2A/2B, route owner markers on eight surfaces (about, blog, home, play, services, settings, topics, website), the last two in 7d2968fa. `design.css` has none because it rides the website bundle at its 140 KiB soft budget. Partial: 1A, 4 and 6; 8 is landed except the canonical-contract question. Patch 9 was settled by landed code (09713d0d made `data-spw-composition-flow` an authored-first layout contract). Owned elsewhere: 3 and 5 (`color-motion`), 7 (`css-cascade-stratification`). Not started: 1B. Next is slice 1 below, the compact overlay, gated by a browser pass on `/`, `/settings/` and `/design/`. The `@layer` order statement is `style-core.css:1`, and a few pre-split file names below stay on purpose. Commit series, roadmap and the 2026-07-03 split note are in [HISTORY.md](./HISTORY.md).

**Related:** [css-state-legibility](../archive/css-state-legibility/PLAN.md) (archived).

## Next slices (2026-11-06)

1. **Compact overlay** (Patch 1B). In `src/styles/entries/debug.css`, `html[data-spw-debug-layers="compact"]` draws outlines first and shows labels on `:hover` and `:focus-within`. Today the sheet answers only `on` and `layers` (the `Layer labels show…` block, `:284`), and nothing in the tree writes the attribute: `deferred-styles.js` only reads `dataset.spwDebugLayers`. Gate: a browser pass on `/`, `/settings/` and `/design/` with `on` and `compact`. Rebuild `public/css/effects/debug.css` in the same commit.
2. **Named subsections** (Patch 1A remainder; ungated, no visual change). Semantic labels (`debug.css:1-283`) and layer labels (`:284` on) already sit apart. Write the section banners the first Patch 1 change names (semantic labels, layer-owner labels, runtime footer, reduced motion) without moving a rule. Verify: `npm run build:css` leaves `public/css/effects/debug.css` byte-equal apart from comments.
3. **cards.css, one chapter out** (Patch 4; sensor-gated). `components/cards.css` is 1363 lines, and `components/cards/` already holds `payment-card.css`, `profile-card.css` and `seed-card.css`. Move one contiguous banner section per commit, keeping its import order, and prove flattened-bundle equivalence before deleting the original (Patch 4 validation posture). `grammar/syntax.css` (2528 lines) follows the same way.
4. **Home's structural selectors** (Patch 6; a look). 43 `:nth-child`/`:nth-of-type` selectors remain in `routes/`, `components/` and `grammar/`. On `/`, `routes/surfaces/home.css` seats `.entrance-role-hooks > li:nth-child(5)`, `(-n + 2)` and `(n + 3)` (`:1292-1306`) and the masthead's `:nth-of-type(n + 2)` notes (`:454`). The role hooks sit in `index.html#choose-your-entrance`, whose edges `layout-seat-squeeze` also measures (its section "Absorbed 2026-10-10 — alignment-content-fit"), so take its `npm run qa:alignment` reading before and after. Gate: `/` at phone and desktop.

Creative proposal for slice 1 (a look; it ends at the same browser pass). The overlay could label a layer in Spw. `#:` is the layer operator in `public/js/kernel/operator-detection.js`, so a compact label reading `#:routes` instead of `layer: routes` would teach one sigil each time a reader inspects the cascade. Only the `content` string in `debug.css:377-381` changes.

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

- `public/css/style-core.css:1` declares the cascade layer order (`style.css` imports it first) and must not be reordered here. `css-cascade-stratification` is the standalone migration; note the built bundle strips the order statement (`css-bundle.mts:45`), so shipped order is first-appearance order.
- A portable bundle for other hosts is `.spw/caches/portable-css-2026-09.spw`. It does not reorder those layers or ship this site's chrome.
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
- Treat `data-spw-operator` (and the growing set of operator projections in `.spw/conventions/operator-site-projection.spw`) as first-class semantic hooks. Operator chips are not merely decorative; their selectors, states, and resonance behavior must remain traceable and consistent across layers. New operators (`!`, `*`, `&`, `.`) introduce additional styling contracts that should be centralized in `handles/operators/` rather than duplicated in route surfaces. See operator-site-projection.spw for the current site_role, selector, and claim expectations per operator.

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

- Keep the current cascade layer order unless a separate evidence-gated patch proves a semantic-flow problem cannot be solved otherwise. That patch is `css-cascade-stratification/PLAN.md`; its Phase 0 re-homes misfiled `reset/base.css` rules on this rail without touching the order.
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
- Audit a set of operator chips (including newer ones like `!` action, `*` value, `&` subject, `.` ground, named as `public/js/kernel/operator-detection.js` names them) against the projections in operator-site-projection.spw; ensure their visual states (hover, active, resonance) are driven from centralized operator tokens and data attributes rather than ad-hoc rules.
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
- Validation is deterministic through `npm run check:css`, `npm run check:local`, and `git diff --check`.

## Out Of Scope

- Do not change the cascade layer order declared at `public/css/style-core.css:1` from this plan (`css-cascade-stratification` owns that). Do not move a file to a later layer to “make it load later.”
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

Files: `src/styles/entries/debug.css` (source), `public/css/effects/debug.css` (generated; its `.map` went in 97b8a303), `public/css/README.md`.

Changes:

- Add a compact mode for dense pages: `<html data-spw-debug-layers="compact">`.
- In compact mode, show outlines by default and reveal labels on `:hover` / `:focus-within`.
- On small screens, prefer outline-first behavior and reveal labels only on hover, focus-within, or explicit compact inspection.
- Avoid broad `position: relative` changes; only apply positioning to targets that need label anchoring.
- Add a top-right fixed legend for the active debug mode only if it can be done without JS.
- Split debug selectors into named sections: semantic labels, layer-owner labels, runtime footer, reduced-motion.
- Add label collision guardrails for small components: avoid `::after` labels on inline-only chips unless hovered or focused.
- Keep docs clear that owner labels show diagnostic nearest-visible ownership, not real provenance.
- Verify the overlay does not block `.operator-chip`, `.frame-sigil`, mode switches, or settings controls.

Slices: **1A** writes the section split with current visuals preserved (slice 2 above; the two label groups are already apart). **1B** is compact mode, outline-first on small screens, the collision guardrails and the README note (slice 1 above).

Risks: debug labels can still be noisy on the homepage, and `position: relative` in debug mode can move rare elements that have absolute descendants, so keep selectors narrow and test real routes.

Validation: `npm run build:css`; `npm run check:css`; a browser pass on `/`, `/settings/`, `/design/` and one article route with `data-spw-debug-layers` set to `on` and to `compact`.

## Patch 2 - Route Owner Markers

Landed (2A, 2B): eight route surfaces carry one marker in their `:where(body[data-spw-surface="…"])` token block, the last two (home, blog) in 7d2968fa; `public/css/README.md` states the rule (route surfaces set the marker once, never on inner classes). Not marked: `settings-forms.css`, and `design.css`, which rides the website bundle at its soft budget. Later `handles`, `effects` and `ornament` layers overwrite the visible marker on nested elements, as documented. Check: `rg -n -- "--spw-debug-layer-owner: \"routes\"" public/css/routes`.

## Patch 3 - Component Token Extraction

**Owner 2026-10-10:** `color-motion` Patch 2 (its slice 2B moves consumers onto role aliases). This plan keeps the literate-cluster rules that work follows:

- Local component tokens are named for their owner (`--card-local-surface`, `--card-local-line`, `--card-local-shadow`, `--card-local-accent` and their `-strong` / `-active` states), and the raw `color-mix(...)`, gradient and shadow math sits once, near the owner selector.
- Variants are state projection: `:where(.frame-card[data-spw-role="routing"])` resets a local token, never a whole rule body.
- Keep original fallback chains intact; add a token only when several declarations or variants reuse it.
- Targets: `.frame-card`, `.frame-panel`, `.spw-frame`, `.mode-panel`, `.media-card`, `.operator-card`, `.plan-card`, `.ref-card`, `[data-spw-region-flow]`, `[data-spw-component-kind]`, across `components/foundation.css`, `cards.css`, `surfaces.css`, `frames.css` and `effects/material.css`.

## Patch 4 - Large File Responsibility Split

Goal: make the largest CSS files navigable by separating clear ownership domains while preserving import order.

Landed: `shell/chrome.css` into `shell/chrome/` and `handles/operators.css` into `handles/operators/` on 2026-07-03 (bd0d7951), with literate chapter banners and flattened-bundle equivalence; see HISTORY.md for the method. Left, both in the core bundle through `style-core.css`:

- `components/cards.css`, 1363 lines. Its banners name five chapters: frame and link cards (`:8`), Spw dialect extensions (`:261`), the hyperphysics suite (`:296`), environmental physics and pretext variants (`:523`, about 700 lines, the largest), and inner type hygiene (`:1240`). Chapters go to `components/cards/` beside `payment-card.css`, `profile-card.css` and `seed-card.css`. The hyperphysics suite holds the invalid `calc()` that `color-motion` slice 2 repairs, so it moves in a different commit from that fix.
- `grammar/syntax.css`, 2528 lines in nineteen numbered banners. "6. Frame primitives" (`:256`, about 740 lines) and "15. Topic lens" (`:1851`, about 420) are the large ones.

Guardrails:

- Split by moving contiguous sections only. Do not interleave unrelated refactors.
- Preserve relative order of moved sections in `style-core.css`, register each new core sheet there, and update `public/css/README.md`.
- Do not split and redesign in the same commit.

Validation:

- `npm run check:css`
- `npm run check:local`
- `git diff --check`
- `rg -n "@import url\\('/public/css/(shell|handles|components|grammar)/" public/css/style-core.css`
- Validation posture for future splits: banner-opener line boundaries only (a split at a banner's middle line leaves an unterminated comment seam); assert per-chunk brace balance on comment-stripped text; prove flattened-bundle equivalence before deleting the original.

## Patch 5 - Dark Mode And Auto Mode Symmetry

**Owner 2026-10-10:** `color-motion` Patch 8 (color mode and theme pack QA) takes the `home.css` and `wonder.css` branches. Landed half: d4b0ea94 kept explicit dark and automatic dark as separate blocks in `about.css` and `topics.css`, and added `findSelectorAtRuleJoins` to `scripts/ts/css-contracts.mts`, which fails a selector list that ends in a comma right before `@media`.

The rule this plan keeps: a colour mode overrides tokens, never a whole rule body. `.some-card` declares `--some-card-surface` and reads it, and `html[data-spw-color-mode="dark"] .some-card` resets only that token. The explicit dark branch and `@media (prefers-color-scheme: dark) { html[data-spw-color-mode="auto"] … }` stay structurally parallel. A comment marks only an intentional divergence.

## Patch 6 - Structural Selector Cleanup

Goal: replace fragile child-order selectors with explicit slots or existing semantic hooks where the markup already supports them.

Files:

- `public/css/routes/surfaces/home.css`
- route HTML only when a real slot name is missing and the structure already has a stable concept
- `.spw/conventions/composition-box-model.spw` only if a new reusable slot/box contract is introduced

Landed: a7bfa3de (2026-06-02) removed the home hero's `.frame-note:nth-of-type(...)` grid placement. Remaining on 2026-11-06: 43 structural selectors in `routes/`, `components/` and `grammar/`. Home's role hooks and masthead notes come first (slice 4 above).

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

**Owner 2026-10-10:** `css-cascade-stratification`. Its Phase 2 reader pour is where governors lose `!important`, and that waits on the Phase 1 browser review. The classification it inherits: debug or ornament escape hatch, removable specificity workaround, browser-reset workaround, or bug. `rg -n "!important" public/css` is the count.

## Patch 8 - `.spw` And Documentation Alignment

Mostly landed. `public/css/README.md` documents the property clustering order (`:32`), owner-marker semantics and the route boundary rule (`:58-60`), and "Reading The Tree". `.spw/conventions/css-instruction.spw` names the generated debug sheet's source (`:67`) and, since fd554339, the layer order at `style-core.css:1` (`#import_manifest`). The composition note is `.spw/conventions/composition-box-model.spw:23` (Patch 9). Left: which of `css-instruction.spw` and the README is canonical (`index.spw#wonder_css_architecture_readability_canonical_contract`). Check: `rg -n "css-instruction|debug-layer|property cluster|composition-flow" .spw public/css/README.md`.

## Patch 9 - Optional Composition Layout Contract

Settled by landed code, so retired here. The question was whether `data-spw-composition-flow` stays metadata or becomes an opt-in layout contract. It became an authored-first layout contract: `components/content.css` ("Composition flow", Clusters A–C, from 09713d0d) packs `grid` hosts and keeps stages as columns, and `components/typography-packing.css` (1cbf5724) tiers `grid` by `data-spw-pack`. `.spw/conventions/composition-box-model.spw:23` records that an authored value survives the runtime mirror (2026-09-19). The first draft's root gate, `data-spw-composition-layout="on"`, would have been a new `data-spw-*` family and is dropped. The attribute has 131 authored uses in HTML. Any new reader still waits on a browser check of every route family that carries it.

## Validation Loop For Each Patch

Always run:

```sh
npm run build:css
npm run check:css
git diff --check
```

Run for broader patches:

```sh
npm run check:local
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
- `/about/website/`
- one content-heavy route such as `/blog/` or `/recipes/`

Debug browser checks:

- `html[data-spw-debug-layers="on"]`
- `html[data-spw-debug-layers="compact"]`
- existing `data-spw-debug~="css"`
- existing `data-spw-debug~="layout"`

## Tracking Queries

Use these to keep the work bounded:

```sh
wc -l public/css/shell/chrome/*.css public/css/handles/operators/*.css public/css/grammar/syntax.css public/css/components/cards/*.css
rg -n "!important" public/css
rg -n "nth-of-type|nth-child" public/css/routes public/css/components public/css/grammar
rg -n "html\\[data-spw-color-mode=\"dark\"\\]|data-spw-color-mode=\"auto\"" public/css
rg -n "color-mix\\(|linear-gradient\\(|box-shadow:" public/css/components public/css/routes public/css/effects
rg -n -- "--spw-debug-layer-owner|--spw-debug-layer-color" public/css src/styles/entries/debug.css
rg -n "data-spw-composition-flow|data-spw-box-model" .
```

## Review Questions Before Implementation

Retired 2026-11-06: which split first (both `chrome.css` and `operators.css` split in bd0d7951) and whether every route file gets a marker (eight high-traffic surfaces did; the rest are unmarked). Component token names moved to `color-motion` Patch 2. Open, as wonders in `index.spw`: whether compact is the small-screen default (`#wonder_css_architecture_readability_compact_default`) and whether `css-instruction.spw` is the canonical contract (`#wonder_css_architecture_readability_canonical_contract`). Patch 9 was settled by landed code (see there).
