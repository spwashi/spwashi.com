# Fix: Floating Chrome Stack

## Failures

- Floating UI roles used the shared `data-spw-floating-chrome` marker inconsistently.
- The console set floating chrome attributes by hand, so it missed the shared `data-spw-layout-owner="floating-chrome"` contract.
- Discovery credits and toast stacks were annotated as low floating tier even though their CSS and behavior expect toast-level priority.
- The cauldron chip was visually persistent but sat on the ambient floating tier.

## Diagnosis

The site already has the right ownership model: floating chrome belongs to a shared contract instead of page-local z-index rules. The drift was in tier naming and runtime annotation. Once an element is annotated, the component-layer floating-chrome rule wins over earlier shell-layer z-index declarations, so the tier must be correct at the source.

## Planned Fix

- Add `docked` as the persistent-but-below-header tier.
- Add the missing runtime roles to the floating chrome contract.
- Route console creation through `annotateFloatingChromeElement(...)`.
- Promote discovery notices to `toast` and cauldron chip to `docked`.
- Keep interaction copy aligned with the public ethos: interactions should reveal change, return path, and persistence.

## Deferred Follow-Ups

- Audit remaining hard-coded z-index values in debug-only overlays separately.
- Consider a generated lint that flags `data-spw-floating-chrome` without `data-spw-layout-owner`.
