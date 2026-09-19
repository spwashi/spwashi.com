# Plan: state-block-projections

Add interactive Spw state blocks to components that already expose real mutable state, so visitors can read and manipulate a small slice of runtime/configuration through operator, brace, and value swaps.

## Goal

The site should expose more of its live state through its own notation instead of explaining interaction only in prose. Small code-like state blocks should summarize what a component can currently do, and on selected surfaces they should let the visitor cycle operator, brace, mode, or value state directly from the block itself. The taste note is **clarity + expressiveness**: the blocks should feel like useful diagnostic surfaces, not novelty stickers, and they should only mutate state that the underlying component already owns.

## Scope

- **In scope**: a generic state-block runtime; interactive operator/brace/value tokens for swappable frames, mode-switch surfaces, image metaphysics surfaces, and selected settings form surfaces; small copy/markup changes to mark eligible components; repair of the partial image-metaphysics edit so this feature can mount safely.
- **Out of scope**: a full state-editor for every route, replacing current settings UX, large copy rewrites, new persistence models, or a broad rewrite of persona/projection semantics.

## Files

[NEW] .agents/plans/state-block-projections/PLAN.md  
[NEW] .agents/plans/state-block-projections/wip.spw  
[NEW] .agents/plans/state-block-projections/state-block-projections.spw  
[MOD] public/js/spw-state-inspector.js — replace the shallow inspector draft with a generic state-block runtime tied to real component state  
[MOD] public/js/site.js — keep the new runtime in init order and avoid duplicate/invalid mounts  
[MOD] public/js/spw-image-metaphysics.js — remove the malformed partial edit and expose image state cleanly to the inspector  
[MOD] public/css/spw-components.css — make the state blocks read as compact code surfaces with clickable tokens  
[MOD] index.html — mark eligible home surfaces for inspection  
[MOD] topics/software/pretext/index.html — mark the hero lens as inspectable and swappable  
[MOD] settings/index.html — mark runtime preferences (and possibly curriculum control) as inspectable state surfaces

Craft guard:
- `public/js/spw-state-inspector.js` should stay single-purpose: derive, render, and mutate state-blocks only.
- `public/css/spw-components.css` is already large; keep the additions grouped and avoid bleeding inspector concerns into unrelated component rules.
- HTML edits should be limited to data attributes and one or two short helper notes, not structural rewrites.

## Commits

1. `#[state-blocks] — capture the projection/state-block plan and semantics`
2. `&[state-blocks] — implement interactive Spw state blocks for mode, operator, brace, and image state`
3. `&[state-blocks] — wire inspectable surfaces on home, pretext, and settings`
4. `![state-blocks] — verify runtime mounts, state mutation, and CSS containment`

## Agentic Hygiene

- Rebase target: `main@e04c8c0`
- Rebase cadence: before commit 1, before merge
- Hygiene split: current working tree already contains in-scope concurrent edits in `public/js/site.js`, `public/css/spw-components.css`, `public/css/spw-grammar.css`, and `public/js/media/image-metaphysics.js`; preserve and extend those local changes rather than reverting them

## Dependencies

- `interaction-grammar` — the state blocks should feel like learnable interaction circuits, not isolated widgets
- `brace-literacy-guides` — operator/brace swaps should reinforce conceptual vs realized differentiation instead of flattening it

## Failure Modes

- **Hard**: the inspector mutates decorative state instead of real component state, making the feature feel fake
- **Hard**: malformed runtime wiring in `site.js` or `spw-image-metaphysics.js` breaks module evaluation
- **Soft**: blocks become visually noisy or overlap content on smaller viewports
- **Soft**: settings blocks mutate form state without dispatching the real change events, causing UI and persisted settings to diverge
- **Non-negotiable**: operator/brace swaps must stay scoped to components that explicitly opt in; no silent global state mutation

## Validation

- **Hypotheses**: small code-like state blocks will make component state easier to read and will deepen the interaction grammar when tokens mutate real underlying state
- **Negative controls**: existing mode-switch buttons, image helper chips, and settings form interactions must continue working normally
- **Demo sequence**: open home hero and swap mode/operator/brace from the state block; open Pretext and cycle lens state from the block; open settings and cycle a small set of appearance/runtime values from the block; mark an image visited and confirm the image state block updates

## Spw Artifact

`.agents/plans/state-block-projections/state-block-projections.spw`

## The lens is a state block — proposal and bench, 2026-09-19

A lens switch already is the smallest state block on the site: it holds one mutable seat, and since the one-writer change the switch itself carries the live expression (`about[kernel]{open.sit}`) and the runtime reads it back as the page's Spw. What it does not do is *show* that. The authored chassis spends a 2×2 grid, a label capsule, a feedback line, and a state dot on four short seats — about 170px on a phone for a choice that is one line of chips.

Bench: `/design/components/#lens-seats`, three live copies of the same four seats.

- **A · chassis** — as authored today (grid, capsule, feedback, dot).
- **B · seat row** — one row, `data-spw-lens-track="row" data-spw-lens-chrome="silent seat"`: the pressed seat carries its operator color through the existing `--mode-switch-active-*-intent` seam, the dot goes, and the switch's own `data-spw-semantic-expression` is shown as its consequence (`::after` reading the attribute the writer keeps current). Measured 121px on a phone including the expression line and the design page's kind tag.
- **C · silent row** — the row and nothing else. 100px.

Choosing which panel a frame shows is the same act as reading the block: the seat you press is the token that changes in the expression. That is the "tuning/priming" value the lens was missing — it names its own consequence in the site's notation rather than in a humanized feedback string.

Gate: sensation. Approve A, B, or C in a browser before any route changes. If B or C, the treatment moves from `routes/surfaces/design.css` (scoped to `page_design_components`) into `handles/operators/state-semantics.css` as a lens-chrome value, and routes opt in per switch. Nothing on `/about/`, `/`, or the topics lanes changes until then.
