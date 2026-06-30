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
