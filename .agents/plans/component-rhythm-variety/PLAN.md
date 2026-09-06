# Component Rhythm Variety

## Goal

Make shared components feel more specific and scannable by tightening vertical rhythm, differentiating frame/card roles more clearly, and sharpening copy toward concrete outputs.

## 2026-09-05 — Native lens activation

Operation `align`; fixity `tending`; shared UX slice: every `.mode-switch > .frame-sigil` keeps native Enter/Space and a 44px tap height.
The live pocket folio route reproduced Enter leaving the Design lens inactive after brace gestures mounted. The same `button.frame-sigil` contract is authored on home, about, software, recipes, play, craft, topics, membership, town, research, composition, and the footer cauldron.

- Keep native links, buttons, disclosures and inputs out of brace keyboard press/release handling, even when the control itself is a frame sigil. Use the shared `isNativeControl` selector. Custom gesture surfaces retain their keyboard machine.
- Shared handles CSS floors mode-switch height at `--touch-target-min` so pocket rules cannot shrink lenses below 44px. Home's unlayered `.frame-sigil` pill rule no longer applies inside `.mode-switch`.
- Folio-local only: place reading lenses after their images, quiet nested probe framing, keep the fold's selected edge and inset response within its own panel.
- Validate actual listener boundaries, live Enter/Space lens changes on more than one route, radio result/return, narrow/wide containment, reduced-motion rules, local checks and generated CSS freshness.

No new modules, dependencies, semantic families, or expression rewrites. Audit context: `.spw/audits/component-philosophy-harmony-2026-07.spw#stills_local_resonance_review_2026_09_05` and `.spw/audits/touch-gesture-contracts-2026-09.spw#recent_change_review`.

## Shared layers

- `public/css/components/frames.css`
- `public/css/components/cards.css`

## Public routes touched

- `/`
- `/topics/`
- `/play/rpg-wednesday/`
- `/services/`
- `/services/systems/`

## Intent

- Reduce the “everything has the same cadence” feeling in shared card and frame surfaces.
- Let routing, reference, and schema roles feel distinct without adding one-off wrappers.
- Shift copy toward practical outcomes:
  - screenshot-ready references
  - UX-flow testing
  - production packets
  - scaleup grounding and observability
