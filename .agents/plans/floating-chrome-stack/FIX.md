# Fix: Floating Chrome Stack

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

## 2026-09-13 Control Size Token (Step 1)

- The bottom-lane 44px rule was not an abstraction: it resolved only on the dock trigger (the inspector launch's own rule outranked it and `.spw-console-toggle` matched nothing), while dismiss, section-handle, inspector, and console controls each set their own literal in four sheets across grammar, shell, components, and handles layers.
- Every tappable chrome control now reads `--spw-floating-control-size`, assigned only in the "Control size" block of `floating-chrome.css`. The role values there are the inherited spread, kept exactly: a computed-size matrix (4 pointer/width cells × 7 lane modes × 9 controls, 2772 values) matched before and after.
- Removed as dead: the lane rule's launch and console entries, the pocket `--spw-floating-slot-control` launch rule (outranked by `runtime-states.css`), and duplicated console pocket literals.
- Step 2 (sensation gate, browser demo before commit): collapse the role spread into one decision — compact base, a coarse-pointer step keyed to pointer rather than width — and decide whether the ornament layer's 48rem `:where(button, .spw-chip, label)` min-height should keep reaching floating chrome, since it currently overrides every control below that width. `--spw-floating-slot-control` still carries the pocket clamp for slot positioning and should read the control token once step 2 settles the size.

## 2026-09-13 Mount/Observation Repair

- The console's abortable listener adapter called itself instead of `document.addEventListener`, overflowing before the idle module could finish mounting. The same abort signal now owns each document subscription and teardown still removes the console, timer, and lane participant.
- Floating chrome observation is lifecycle wiring, so annotation observes the element even when its descriptor was already complete. Remounted or authored chrome can therefore announce later size and departure changes without requiring a dataset mutation.
- Regression gates cover the listener/abort pairing and idempotent observation. A settled Home navigation completed with zero console errors; the full module suite passed 330 tests.
