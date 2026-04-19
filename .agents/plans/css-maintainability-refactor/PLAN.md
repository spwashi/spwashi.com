# CSS Maintainability Refactor

## Public Goal

Reduce CSS brittleness in the highest-leverage shared contracts so route work can compose from explicit structure instead of relying on inferred DOM shape or over-broad semantic selectors.

## Scope

- Tighten the shared handle layer so semantic attributes do not implicitly become pill-like UI.
- Replace the inferred `media-prose` grid auto-detection with explicit shared layout hooks.
- Replace the Recipes hero child-order layout with explicit slot wiring.
- Replace one route-local frame-list override with a reusable list variant.
- Adopt the new summary-list variant on route index blocks that read as inline guidance rather than plain bullets.
- Migrate the topic/image hero family onto explicit `data-spw-slot` wiring so shared hero layout can compose without the legacy wrapper grid.

## Likely Files

- `public/css/spw-handles.css`
- `public/css/spw-components.css`
- `public/css/recipes-surface.css`
- `recipes/index.html`
- `services/index.html`
- `services/creator/index.html`
- `services/care/index.html`
- `services/ecosystem/index.html`
- `play/rpg-wednesday/index.html`
- `about/index.html`
- `about/plans/index.html`
- `topics/index.html`
- `topics/software/index.html`
- `topics/software/parsers/index.html`
- `topics/math/index.html`
- `topics/math/category-theory/index.html`
- `topics/math/complexity/index.html`
- `topics/math/field-theory/index.html`
- `topics/math/number-theory/index.html`
- `public/css/spw-surfaces.css`
- `public/css/topics-surface.css`

## Contract Changes

- Shared hero split layout should be expressed through a reusable class plus existing `data-spw-slot` children:
  - header
  - body
  - figure
  - actions
- `media-prose` should remain an explicit opt-in, not a relational `:has(...)` inference.
- Sentence-like frame lists should opt into an inline variant rather than patching one route locally.
- Handle primitives should style named handle classes and explicit inline semantic carriers, not every structural element with `data-spw-operator` or `data-spw-charge-key`.
- Topic/image heroes should expose header/body/figure structure directly in markup, with topic-surface layout using the same slot contract instead of a dedicated wrapper shape.

## Risks

- Shared selector tightening could remove styling from a route that relied on accidental coverage.
- The Recipes hero refactor changes route HTML structure, so selector rewiring must stay balanced.
- Removing inferred `media-prose` support is safe only if all live uses are explicit.
- Topic hero adoption could shift breakpoint behavior if the old wrapper grid and new split-figure contract disagree about when to become two-column.

## Validation

- `git diff --check`
- targeted `rg` checks for:
  - `site-hero--split-figure`
  - `frame-grid--media-prose`
  - `frame-list--inline`
- `npm run build`

## Out Of Scope

- Replacing all `:has(...)` usage sitewide.
- Reorganizing the full route CSS file structure.
