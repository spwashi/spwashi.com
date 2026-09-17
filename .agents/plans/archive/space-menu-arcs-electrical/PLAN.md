# Plan Leaflet: space-menu-arcs-electrical

A layered style and interaction refinement pass that addresses space efficiency, mobile menu layout issues, arc/loop lifecycle indicators, and the circuit metaphor for JS module relationships.

## Context & Evidence
- Cramped vertical rhythm on mobile headers was taking up too much content height.
- Mobile navigation disclosure had layout shifting, overlay visibility conflicts, and navigation click closure race conditions.
- Arcs and circuits were net-new vocabulary introduced to represent action transitions and component roles visually.

## Proposed Changes (Now Implemented)
- **Space & Layout**:
  - Tightened `--shell-header-pad-block` on narrow viewports in `tokens/core.css`.
  - Tuned reading layout widths in `layout.css`.
  - Tightened center column scaling for collapsed menu layouts in `chrome.css`.
- **Menu Polish & Fixes**:
  - Rewrote menu close action in `shell-disclosure.js` from `requestAnimationFrame` to `setTimeout(..., 0)` to allow default navigation events to finish.
  - Resolved mobile layout instability by separating toggle menu lists into stable overlays.
  - Implemented measurement hysteresis to prevent inline-toggle mode flapping.
  - Rewrote label copy mapping: "Routes" (closed) → "Map" (open).
- **Arcs & loops**:
  - Created `arc-lifecycle.js` to track `prime` (down), `land` (up/click), and `residue` (post-resolve) interaction events.
  - Added Section 10 to `signals.css` for CSS arc animations.
  - Wired `arc-lifecycle.js` bindings directly into `haptics.js`.
- **Circuit Anatomy**:
  - Created `circuit-anatomy.css` implementing border highlights for `resistor`, `capacitor`, `inductor`, and `transformer`.
  - Registered import under `style-core.css` effects layer.

## Verification Path
- `npm run check:local` to ensure zero compilation or syntax errors.
- Visual viewport check at 375px/768px/1200px.
