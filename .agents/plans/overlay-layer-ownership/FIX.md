# Fix: overlay-layer-ownership

## Failure

- `public/css/spw-canvas-accents.css` treated every direct child of `.spw-accent-host` as a flow child by forcing `position: relative; z-index: 2;`.
- Image chrome and overlay-mounted inspectors already rely on direct-child absolute positioning.
- Because `spw-canvas-accents.css` lives in `layer(ornament)`, that blanket rule overrode lower-layer overlay geometry and made the layout contract harder to reason about.

## Diagnosis

- The bug is not just "one selector is too strong"; it is a role-collision.
- `ornament` is allowed to intensify a host, but it should not silently reclassify every child as in-flow content.
- The missing vocabulary was an explicit host-level marker for children that own their own placement.

## Planned Fix

1. Introduce `data-spw-overlay` as the opt-in marker for direct children that are intentionally edge-pinned or otherwise positioned outside normal flow.
2. Narrow the accent-host normalization rule so it only normalizes flow children.
3. Mark current runtime overlays that mount directly into accent/image hosts.
4. Record the rule in `.spw` so future shared-layer work has a clear contract.

## Layering Rules

- Lower layers define geometry, semantic role, and layout ownership.
- Higher layers may decorate, intensify, or sequence those roles.
- A higher layer should only replace geometry when that replacement is itself an explicit shared contract.
- Blanket parent rules should prefer exclusion markers like `[data-spw-overlay]` over one-off escape hatches.

## Broader Review

- The dangerous pattern is not every `> *` selector; it is shared host wrappers in high layers assigning geometry to children they do not own.
- Internal ornamental clusters such as ladders, braids, or sequence rails can still position their own authored children.
- Shared host files should default to one of two postures:
  - define substrate behavior for the host itself
  - normalize only explicitly in-flow children, with an escape valve for overlays or mounted handles

## Deferred

- Audit other shared host rules for similar geometry assertions outside accent hosts.
- Decide whether more overlay roles need subtypes beyond the current presence marker.
