# Plan: state-block-projections

**Status 2026-11-06.** The live state block is the lens switch. It carries its own seat expression, written by one owner (`public/js/runtime/page/lens-modes.js`), and Home's lens now outlines which frames answer a seat (`cfd4e2e4`, `d18612e8`). The satchel (`public/js/interface/state-inspector.js`) hands over the page's Spw line first (`902738b4`) but mutates no token. The April inline-block runtime (`runtime/state-inspector.js`, 930 lines that nothing loaded) was deleted in `682cdd1c`. Next: promote the seat (slice 1 below), gated on the creator choosing seat A, B or C live, on a phone and a desktop at `/design/components/#lens-seats`; judge Row 1's faint inactive chips in the same look. That one review also settles the lens reward (slice 2) and the lens offer to the cauldron.

Landed: the lens-seat bench (`dc7c35a7`); the reader's-pick-only lens, `?spw-lens=`, and AA dimming at 0.72/0.88 (`cfd4e2e4`); declared and parsed lens reach (`d18612e8`).

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — design.lens_seats, seams.lens, seams.menu_toggle.

**Absorbed 2026-10-06:** [lens-seat-and-secondary-materials](../archive/lens-seat-and-secondary-materials/PLAN.md). **Absorbed 2026-10-10:** [attention-shell-contrast](../archive/attention-shell-contrast/FIX.md) · [mindful-collection-controls](../archive/mindful-collection-controls/PLAN.md). **Related:** [cauldron-lens-composition](../cauldron-lens-composition/PLAN.md).

Add interactive Spw state blocks to components that already expose real mutable state, so visitors can read and manipulate a small slice of runtime/configuration through operator, brace, and value swaps.

## Goal

The site should expose more of its live state through its own notation instead of explaining interaction only in prose. Small code-like state blocks should summarize what a component can currently do, and on selected surfaces they should let the visitor cycle operator, brace, mode, or value state directly from the block itself. The taste note is **clarity + expressiveness**: the blocks should feel like useful diagnostic surfaces, not novelty stickers, and they should only mutate state that the underlying component already owns.

## Scope

- **In scope**: a generic state-block runtime; interactive operator/brace/value tokens for swappable frames, mode-switch surfaces, image metaphysics surfaces, and selected settings form surfaces; small copy/markup changes to mark eligible components; repair of the partial image-metaphysics edit so this feature can mount safely.
- **Out of scope**: a full state-editor for every route, replacing current settings UX, large copy rewrites, new persistence models, or a broad rewrite of persona/projection semantics.

## Owners

`public/js/interface/state-inspector.js`, `public/js/media/image-metaphysics.js`, and `public/css/components/*.css`. The seat expression has one writer, `lens-modes.js`; anything else that wants a seat asks it through `requestLensMode`. For the lens seat, the bench treatment is in `public/css/routes/surfaces/design.css` and its destination is `public/css/handles/operators/state-semantics.css`. The lens bench below is the live slice.

Craft guard:
- `public/js/interface/state-inspector.js` should stay single-purpose: derive, render, and mutate state-blocks only.
- Component CSS is already large; keep the additions grouped and avoid bleeding inspector concerns into unrelated component rules.
- HTML edits should be limited to data attributes and one or two short helper notes, not structural rewrites.

## Dependencies

- `interaction-grammar` — the state blocks should feel like learnable interaction circuits, not isolated widgets
- [brace-literacy-guides](../archive/brace-literacy-guides/PLAN.md) (archived) — operator/brace swaps should reinforce conceptual vs realized differentiation instead of flattening it

## Failure Modes

- **Hard**: the inspector mutates decorative state instead of real component state, making the feature feel fake
- **Hard**: malformed runtime wiring in `public/js/interface/state-inspector.js` or `public/js/media/image-metaphysics.js` breaks module evaluation
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

## Absorbed 2026-10-10 — attention-shell-contrast

Landed there: the `reading`/`split` layout selectors in `public/css/shell/layout.css`, and the hidden empty `.spw-semantic-seam` in `shell/chrome/header.css`. Still owed:
- **Row 1.** Shared `.mode-switch` buttons keep inactive chips too faint, and the selected state sits too close to the surface on mobile. This is the same switch as the lens seat above, so judge contrast during the A/B/C review. No pocket still covers a mode switch yet.
- **Row 2.** The mobile menu toggle read as ambient chrome. It has been a glyph hamburger since `b893cec3`, so recheck it with one `home-nav-open` still (`scripts/lib/viewport-still-recipes.mjs:84`) before any fix. Row 2 belongs to [chrome-navigation-wonder](../chrome-navigation-wonder/PLAN.md), which owns the header; this plan cites it.

The FIX's planned files (`spw-handles.css`, `spw-chrome.css`, `spw-shell.css`) no longer exist; the owners are `public/css/handles/operators/` and `public/css/shell/chrome/navigation.css`. Source: [attention-shell-contrast](../archive/attention-shell-contrast/FIX.md).

## Absorbed 2026-10-10 — mindful-collection-controls

Landed there: undo and bulk clear (`clearToday` and `clearAll` in `public/js/interface/guide-badge.js`), the `rewardDisplay` setting, and the collection reset through settings persistence. Still owed, as its 2026-09-19 proposal:
- A lens change emits `spw:variant-selected`, but `public/js/runtime/memory/component-collection.js` has no listener for it, so the lens readers use most is never rewarded. Add one ingest of `{ kinds: ['lens'], reason: 'lens' }` per group per session.
- Add a `seat-changer` achievement for three distinct `group:mode` seats, with no new storage key.
- The reward toast should read the seat expression, and the cauldron should be offered the seat on the second use, not the first.

The toast depends on the A/B/C choice, so both sit behind one browser review. Rule: never silent absorption (`interaction-microstates.spw#awareness`). Source: [mindful-collection-controls](../archive/mindful-collection-controls/PLAN.md).

## Next slices — 2026-11-06

1. **Promote the seat.** Move the chosen treatment from `routes/surfaces/design.css` (the `#lens-seats .mode-switch[data-spw-lens-chrome~="seat"]::after` rule, :1686) into Cluster C of `handles/operators/state-semantics.css` (:229) as a lens-chrome value, lift Row 1's inactive-chip contrast, and opt one route's switch in per commit. Gate: the A/B/C look (`index.spw#wonder_state_block_projections_lens_seat`). Verify: `rg -n 'lens-chrome' public/css/handles/operators/state-semantics.css` shows the value; one pocket still of the opted-in route.
2. **Reward the lens.** `public/js/runtime/memory/component-collection.js` hears only `spw:regions-profiled` and `spw:regions-primed`. Add the `spw:variant-selected` ingest and `seat-changer` described under mindful-collection-controls above; the toast in `public/js/interface/guide-badge.js` reads the seat expression. Gate: the same look. Verify: `rg -n 'variant-selected' public/js/runtime/memory/component-collection.js` hits, and `node --check` passes.
3. **Retire the leftovers.** `requestInspectorDisclosure` in `public/js/runtime/interaction/brace-actions.js` still dispatches `spw:state-block-disclosure` on restore and toggle, and nothing has heard it since `682cdd1c`; `.spw-state-block code` in `public/css/typography/base.css:453` styles nothing. Retire both and cite `682cdd1c`, unless slice 4 is approved first and wants the event. Ungated. Verify: `rg -n 'spw-state-block|state-block-disclosure' public/js public/css -g '!public/css/bundles/**'` returns nothing.
4. **Proposal: the expression is the switch.** On bench row B the seat expression is an `::after` that cannot be pressed. Render it instead as a line whose `[mode]` token is a button: pressing it asks `requestLensMode(bus, { group, mode, source })` for the next seat, and the owner rewrites the expression, so the reader watches the token they pressed change. A bench-scoped script renders the line, so with JS off the seats alone remain. This is the deleted runtime's idea at its smallest honest size: one token, one owner. Touches `design/components/index.html#lens-seats` and that script; `lens-modes.js` is only read. Gate: a bench demo for the creator's look (`index.spw#wonder_state_block_projections_first_token`).

Cut from the 2026-11-06 draft. Routing state-block tokens through `serializeElementToSpw`/`hydrateElementFromSpw` (`public/js/semantic/spw-block-association.js`): no token surface exists to route, `hydrateElementFromSpw` writes `data-spw-definition` and claims rather than the expression, and a second writer would break the lens's one-writer rule. The read half may still feed the satchel's page line once `serializeElementToSpw` stops wrapping the expression in `#>id[…]` (line 113 of that file); [brace-semantics](../brace-semantics/PLAN.md) owns that repair. Image/SVG state-block sync: its `probe | frame | surface` set and `figure[lens]{node}(env)<projection>` appear nowhere in `public/js/media/svg-tunability.js`, whose env tokens are `studio|proof|poster|model`.
