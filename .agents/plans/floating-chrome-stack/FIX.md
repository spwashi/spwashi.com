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
