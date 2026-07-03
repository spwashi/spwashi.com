# Plan: shell-model-vocabulary-consolidation

Reconsider the shell/chrome/edge/overlay model across CSS and JavaScript as the pilot for a broader goal: consolidate design vocabularies so growth in other dimensions (routes, physics, editions, collaborators) stays workable for human teams.

## Public Goal

A human team member should be able to hold the site's structural vocabulary in their head: a small set of names for where things sit (shell strata), how they float (chrome tiers), how they cover (overlays), and how they cling to boundaries (edges/rails) - with the same names appearing in CSS selectors, JS modules, `data-spw-*` attributes, and `.spw` conventions. Today the vocabulary has accreted: `floating-chrome` (~20 files), `chrome-tier`, `data-spw-overlay`, `vessel`, gutter/region rails, islands, and the section-context "pocket" handle all describe adjacent ideas with separate words. The taste note is **fewer, truer words**: consolidation should feel like a glossary tightening, not a rename storm.

## Why Now

- The 2026-07-03 chapter split turned `shell/chrome/` into five readable chapters (header, navigation, footer, adaptive, section-context) - the reading groundwork for a remodel is done.
- `floating-chrome-stack/FIX.md` (roles, tiers, console ownership) and `navigation-header-disclosure/PLAN.md` keep accumulating tier/role decisions without a shared model to hang them on.
- Spwashi has explicitly opened shell behavior and the shell/chrome/edge/overlay model for reconsideration, including the JavaScript side (2026-07-03).
- Vocabulary consolidation is the growth constraint: every new route, physics surface, or edition variant multiplies whatever vocabulary exists.

## Phase 1 - Census (agent work, no gates)

Produce `vocabulary-census.md` in this folder: every structural-vocabulary term with file counts, definition sites, JS writers, CSS readers, and `.spw` mentions. Candidate term list to seed the census: shell, chrome, floating-chrome, chrome-tier, overlay, edge, rail (gutter-rail, region-rail, page-region-rail), island, panel, vessel, dock/docked, pocket, section-context, disclosure, trace, mast. Census commands follow the moseying-probe style in `public/css/README.md`. Include the interaction-contract topology (island / panel / vessel / rail) so the consolidation respects the reading->interaction->serialization architecture.

## Phase 1b - Data Attribute Vocabulary (census + refinement proposal)

Measured 2026-07-03: **1,049 distinct `data-spw-*` attribute names** across CSS, JS, and route HTML. The first thirty alphabetically already show the shape of the problem: seven `data-spw-accent-*` variants, five `data-spw-active-*`/`-beat-*` variants, three `data-spw-anatomy-*` variants. This is past human-team workability; the attribute vocabulary is the central contract surface between HTML, CSS, and JS, so it gets its own census dimension:

- Cluster the 1,049 names by family prefix; rank families by member count and by how many are written by JS vs authored in HTML vs only read by CSS.
- Classify each large family: **axis bundle candidate** (fold members into one attribute with a richer value grammar, e.g. `data-spw-accent="palette:craft strength:2 anchor:hero"` or the existing genome pattern), **state ladder** (members are really one attribute's states), or **true distinct axes** (keep).
- The `data-spw-component-genome` / `data-spw-region-genome` precedent in `css-maintainability-refactor/` ("composable axis bundles, not another source of route-local naming") is the sanctioned consolidation shape - prefer richer values in fewer names over more names.
- Refinement proposal ships with before/after counts per family and a migration cost estimate (writers, readers, authored instances).

Gate: the attribute grammar (what a value may encode, how axes compose) is a language-design decision - Spwashi reviews the family table and the proposed grammar before any migration. `webpage-trope-vocabulary/` (`data-spw-anatomy`) and `.spw` operator conventions are consulted references, not casualties.

## Phase 2 - Model Proposal (ends at a gate)

Draft 2-3 candidate consolidated models, each a one-page glossary with: the kept words, the retired words and their migration targets, the `data-spw-*` projection per word, and the JS module ownership per word. A strawman to react against, not adopt:

- **shell** - the fixed strata of the page (header, nav, footer, main frame). CSS `shell` layer; JS shell modules.
- **chrome tier** - anything floating above content, with numbered tiers replacing the role-by-role z-index negotiations; `floating-chrome` folds in here.
- **overlay** - full-coverage modes (menu overlay, modal, capture); `data-spw-overlay` stays the single marker.
- **rail/edge** - boundary-clinging affordances (gutter rails, region rails, the section-context pocket); one word wins between rail and edge.

Gate: model choice is a naming/taste decision reviewed by Spwashi against the census and at least two candidates, per [Human Review Gates] in `symphonic-loading-layered-editions/PLAN.md` - vocabulary is codebase feeling.

## Phase 3 - Migration (after the gate)

- Ref-safe rename passes, one word at a time, CSS + JS + HTML + `.spw` in the same patch, with the flattened-bundle equivalence check from the 2026-07-03 split as the safety pattern for CSS moves.
- `shell/chrome/` chapters and `handles/` are the first surfaces; route CSS follows per-touch.
- JS: `kernel/dom-contracts.js` registries adopt the consolidated names first (they are the topography contract); modules follow.
- Retired words get one release of aliased tolerance where runtime-read (attribute writers keep emitting both), then removal.

## Owners And Boundaries

- This plan owns the model and the glossary; `floating-chrome-stack/` and `navigation-header-disclosure/` continue owning their behavioral fixes and adopt the chosen words.
- `webpage-trope-vocabulary/` owns `data-spw-anatomy`; consolidation must not fork a second anatomy vocabulary - if trope words and structural words collide, this plan defers.
- Do not touch: cascade layer order, `-intent` contracts, physics vocabulary (boon/bane belongs to `interaction-grammar/`).

## Validation

- Census numbers before/after each migration word (scatter must go down, never up).
- `npm run check:local` plus flattened-bundle equivalence per CSS pass.
- A new-collaborator test: someone from the network reads the glossary and correctly predicts which file styles a floating handle, an overlay, and a rail.

## Failure Modes

- Hard: renames land but JS attribute writers and CSS readers disagree for a release, breaking state projection.
- Soft: the glossary is adopted in docs but new code keeps coining words; census trend is the tripwire.
- Soft: consolidation flattens meaningful distinctions (an overlay is not a tier); the census phase exists to find real distinctions before merging words.
