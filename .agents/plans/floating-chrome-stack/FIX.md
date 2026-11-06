# Fix: Floating Chrome Stack

**Status 2026-11-05.** Landed: the tier fix, the lane lifecycle (`848a0b46`), and Step 1's single control-size token (`a5f56bec`). Every floating control now reads `--spw-floating-control-size` from one block in `components/floating-chrome.css`. On 2026-11-05 the theory was read against what runs (`.spw/caches/chrome-ecology-2026-11.spw`), and a six-line revision is proposed below, its first line sharpened the same evening into Spw-native chrome; it waits on the creator's words, and each line's change ends at a live demo. Next slice: the Step 2 browser demo, with a compact base and a coarse-pointer step keyed to pointer rather than width. It includes whether `ornament/whimsy.css`'s 48rem `:where(button, .spw-chip, label)` min-height should keep reaching floating chrome. It is gated first on the console sizing question in `index.spw`, then on the creator's sensation review, live and never from a still: on `/` at pocket (390px) and on `/about/` at 320px, where the corner was measured. Stills cannot judge it: `public/css/modes/capture.css` hides floating chrome (lines 7-35) and pauses animated SVG flows (line 40). Corner sharing in the pocket lane moved here from cauldron-lens-composition (below).

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — home.console_size, seams.pocket_corner.

**Related:** [shell-model-vocabulary-consolidation](../shell-model-vocabulary-consolidation/PLAN.md) · [navigation-header-disclosure](../archive/navigation-header-disclosure/PLAN.md) · [cauldron-lens-composition](../cauldron-lens-composition/PLAN.md). **Absorbed 2026-10-06:** [chrome-copy-collision](../archive/chrome-copy-collision/FIX.md) · [mobile-chrome-alignment](../archive/mobile-chrome-alignment/PLAN.md) · [narrative-grammar-infrastructure](../archive/narrative-grammar-infrastructure/PLAN.md).

## Theory revision — proposed 2026-11-05

The creator asked whether the layout theory needs revising. Read against the tree and a live probe with capture mode off ([chrome-ecology-2026-11](../../../.spw/caches/chrome-ecology-2026-11.spw), `#theory_as_run`): what runs is one pocket ladder whose members are a selector list (`kernel/dom-contracts.js:853-921`); no stylesheet reads a slot name; the persistent pieces sit on four tiers, the satchel launch (drawer, 2020) above toasts (2018); `ornament/whimsy.css:402-406` sets every pocket button to 44px below 48rem, over the size token; four conditions mean pocket (720px or coarse in JS, 45rem in most CSS, 45rem or coarse for the collection, 48rem in whimsy); and the rail's arrival lifts the corner 61.5px. On 2026-11-05 pocket screenshots, the satchel launch sat over body text on `/topics/software/spw/` and `/about/domains/spw.quest/`, and the rail named `/about/`'s section only as "#> section".

| Proposed line | Retires |
| :--- | :--- |
| Each piece is one Spw expression whose slots carry the page's words and work as its controls (revised the same day at the creator's word: more Spw native; see "Useful, Spw-native chrome"). | "#> section", a "rail" toggle and Spw moves hidden as advanced, as the answer to where am I |
| z follows how long a thing stays: what stays sits low and together, what passes above it, what blocks highest. | the satchel launch above toasts; four tiers for four persistent pieces |
| Width places, the pointer sizes; the ornament layer does not size chrome. | four pocket conditions; whimsy's width-keyed reach (this plan's Step 2) |
| The pocket ladder has rungs named for what a reader does: travel, carry, speak. | ten slot names no stylesheet reads (`#>wonder_chrome_ecology_rungs`) |
| The carry corner is one composition: one ground, one radius, one right edge, and the rail's arrival does not lift it. | three utilities stacked by arithmetic (Corner sharing, below) |
| Chrome over reading text takes a ground the text cannot read through. | a translucent rail and satchel over paragraphs |

Gate: the creator's words for the theory. Each line's change ends at a live demo, never a still, since `modes/capture.css` hides floating chrome.

## Useful, Spw-native chrome — 2026-11-05

The creator, the same evening: the floating chrome should be more useful; the UI elements should be more Spw native; the UI should be more intentional in developing the theory of Spw as a language; and it is pretty uncommon to arrive at the site already holding Spw.

What the chrome offers today:

- **The rail** (`runtime/attention/section-handle.js:494-541`): a toggle lettered "rail", then ↑ ‹, a `#>` layer key, the current cell (`#>`, a label, the ⌁ ingredient count, n / m), › and a `$` satchel key, ↓, and three moves that are already Spw, `~similar`, `&contrast` and `#resonate`, kept behind `data-spw-handle-advanced`. The label reads a section's id before its heading (`section-handle.js:300-345`), so a reader sees `home_frame`, or "section" when nothing names it.
- **The satchel**: its rail key is `$`, its own launch reads "state satchel", and inside sit the settings toggles, the deviation register and `copy page Spw`, which the settings plan already calls its best feature.
- **The cauldron chip** shows only while something is held, and its dialog already writes `.cauldron{} 0 held`.

Proposed, revising the theory's first line: **each floating piece is one Spw expression whose slots carry the page's words and work as its controls, and whose state rewrites one slot in place.** The words below are illustrations; the operator each piece takes is the creator's (`index.spw#wonder_floating_chrome_stack_piece_operators`), from the one table in `public/js/kernel/operator-detection.js`.

- **Rail:** the current cell reads as the section, `#>where_that_sentence_goes_next{4 of 9}`: the heading becomes the handle and the place becomes the body. ‹ › and the kin moves are the moves, shown with their operators rather than hidden as advanced.
- **Satchel:** the `$` substrate a page rests on. Its first offer is this page's Spw: copy it, pivot it on spw.quest, take it apart. A visitor who arrived holding no Spw leaves holding the page's.
- **Cauldron chip:** `.cauldron{3}`, the same expression its dialog writes.

A piece is useful when it says what it is, one tap does one named thing, it says what it did, and it never covers reading text. Each piece is also a specimen of one construct, so using the chrome teaches the language: [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md)'s Pass 2 (Spw laid out as nested layout) takes the rail, the satchel and the cauldron chip as its first specimens. Every change ends at a live demo.

## Failures

- Floating UI roles used the shared `data-spw-floating-chrome` marker inconsistently.
- The console set floating chrome attributes by hand, so it missed the shared `data-spw-layout-owner="floating-chrome"` contract.
- Discovery credits and toast stacks were annotated as low floating tier even though their CSS and behavior expect toast-level priority.
- The cauldron chip was visually persistent but sat on the ambient floating tier.
- Viewport correction is still easier to read as a participant registry than a selector list.

## Diagnosis

The site already has the right ownership model: floating chrome belongs to a shared contract instead of page-local z-index rules. The drift was in tier naming, runtime annotation, and how viewport participants are measured. Once an element is annotated, the component-layer floating-chrome rule wins over earlier shell-layer z-index declarations, so the tier must be correct at the source.

## Planned Fix

- Add `docked` as the persistent-but-below-header tier.
- Add the missing runtime roles to the floating chrome contract.
- Route console creation through `annotateFloatingChromeElement(...)`.
- Promote discovery notices to `toast` and cauldron chip to `docked`.
- Keep interaction copy aligned with the public ethos: interactions should reveal change, return path, and persistence.
- Prefer a small floating-chrome participant registry over repeated selector scans where practical.

## Deferred Follow-Ups

- Audit remaining hard-coded z-index values in debug-only overlays separately.
- Consider a generated lint that flags `data-spw-floating-chrome` without `data-spw-layout-owner`.

## 2026-06-30 Interaction Pass

- Desktop pointer/focus menus should anchor to the selected target, clamp within the visual viewport, flip above when bottom chrome or viewport height makes the lower edge unsafe, and write placement data for inspection.
- Compact/coarse menus should become bottom sheets owned by the shared floating-chrome sheet slot, with menu-specific CSS limited to visual framing and action density.
- Long semantic labels, contracts, and action labels should wrap inside the menu instead of widening the popover or increasing tap target ambiguity.
- Bottom chrome participants should continue to reserve clearance through shared root variables so section travel, satchel launch, console, and region menus do not compete for the same tap lane.
- Lore and metamaterial terms should clarify utility: put material/role/chrome identity in secondary metadata, and keep primary buttons outcome-first (`inspect`, `carry`, `mark`, `settle`).
- Lens copy should serialize the active interpretive lens when an authored expression does not already include one, and visible lens controls should name the impact of the selected lens.
- Mode and posture changes should produce skim-value feedback: the control should name which topographical distinction changed, such as reader orientation, schema/lens role, section field cues, or workshop anatomy.

## 2026-09-13 Lane Lifecycle Pass

- The lane measured on every window scroll frame and rewrote unchanged root properties, while chrome that mounted late stayed unregistered until something scrolled. Measurement followed incidental events, not chrome.
- `requestFloatingChromeSync` coalesces passes to one frame. Annotation starts a shared `ResizeObserver`, so mount, expand, reduce, hide, and leave each request a pass. Root property writes are change-only, and one root computed style serves a pass.
- `spw:floating-chrome-settled` is the lane's pulse: it fires only when occupants, competition, packing, or clearance change. Page-state's fixed-viewport correction listens to it instead of polling, and re-measures on scroll only while the visual viewport is displaced or a correction is applied.
- Overlap crowding holds until occupants or viewport width change, so reduced chrome does not expand back into the overlap it just resolved.
- Probe (`/topics/software/`, headless, 40 wheel ticks): lane syncs 43 → 0-1 phone and ~40 → 1 laptop; menu open/close lane syncs 14 → 1; page-state scroll reads 214 → 6 laptop and 246 → 102 phone. Total scroll style recalcs stayed near 950, so their owner is outside these modules.
- Open: `.spw-console-toggle` in the bottom-lane 44px rule matches nothing; the console renders `.spw-console-expand-btn` at 1.25-1.9rem. Whether console buttons take the 44px lane floor or `--touch-target-compact` is a human sizing call.
  - Resolved 2026-10-25 for the selector: `.spw-console-toggle` no longer exists anywhere in the tree, since Step 1 removed the lane rule's console entry. The sizing call stays open in `index.spw`.

## 2026-09-13 Control Size Token (Step 1)

- The bottom-lane 44px rule was not an abstraction: it resolved only on the dock trigger (the inspector launch's own rule outranked it and `.spw-console-toggle` matched nothing), while dismiss, section-handle, inspector, and console controls each set their own literal in four sheets across grammar, shell, components, and handles layers.
- Every tappable chrome control now reads `--spw-floating-control-size`, assigned only in the "Control size" block of `floating-chrome.css`. The role values there are the inherited spread, kept exactly: a computed-size matrix (4 pointer/width cells × 7 lane modes × 9 controls, 2772 values) matched before and after.
- Removed as dead: the lane rule's launch and console entries, the pocket `--spw-floating-slot-control` launch rule (outranked by `runtime-states.css`), and duplicated console pocket literals.
- Step 2 (sensation gate, browser demo before commit): collapse the role spread into one decision — compact base, a coarse-pointer step keyed to pointer rather than width — and decide whether the ornament layer's 48rem `:where(button, .spw-chip, label)` min-height should keep reaching floating chrome, since it currently overrides every control below that width. `--spw-floating-slot-control` still carries the pocket clamp for slot positioning and should read the control token once step 2 settles the size.

## 2026-09-13 Mount/Observation Repair

- The console's abortable listener adapter called itself instead of `document.addEventListener`, overflowing before the idle module could finish mounting. The same abort signal now owns each document subscription and teardown still removes the console, timer, and lane participant.
- Floating chrome observation is lifecycle wiring, so annotation observes the element even when its descriptor was already complete. Remounted or authored chrome can therefore announce later size and departure changes without requiring a dataset mutation.
- Regression gates cover the listener/abort pairing and idempotent observation. A settled Home navigation completed with zero console errors; the full module suite passed 330 tests.

## Corner sharing — from cauldron-lens-composition, 2026-10-10

The pocket lane packs by arithmetic, not by design. `kernel/dom-contracts.js` allocates the collection and cauldron slots, the pocket collection reduces to a 44px trigger, and `components/cauldron.css` takes its slot (`604d4a1d`). At 320px on `/about/` that measured promo 440–622, cauldron 651–695 and satchel 697–741. The promo, satchel, cauldron and travel rail still stack as separate utilities.

Open, as a design pass after Step 2 settles control size: how these four share a corner, meaning what yields, what stays, spacing and hierarchy. No new attribute families. Feel is sensation-gated, so the pass ends at a browser demo. Measurements and history: [cauldron-lens-composition](../cauldron-lens-composition/PLAN.md).

This plan owns control sizes and the pocket corner. The cauldron ([cauldron-lens-composition](../cauldron-lens-composition/PLAN.md)) and the travel rail ([chrome-navigation-wonder](../chrome-navigation-wonder/PLAN.md)) cite it, per the sitting's `seams.pocket_corner`.
