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
- `public/js/spw-dom-contracts.js`
- `public/js/spw-component-semantics.js`
- `public/js/spw-contextual-ui.js`
- `public/js/spw-page-metadata.js`
- `public/js/spw-semantic-chrome.js`
- `docs/developer-topography.md`
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
- Repeated DOM selector families should live in `public/js/spw-dom-contracts.js` and be named by topography: route, shell, main, region, component, module, slot.
- Runtime-written profile attributes such as `data-spw-component-genome` and `data-spw-region-genome` should be treated as composable axis bundles, not as another source of route-local naming.

## Implementation Note - 2026-06-29 Media Prose Grid

- Promoted `frame-grid[data-spw-layout="media-prose"]` and `.frame-grid--media-prose` into the shared surface grid contract in `public/css/systems/surfaces/base.css`.
- Kept the existing `data-spw-layout="media-prose"` route markup as the explicit opt-in; no wrapper or route HTML churn was needed.
- Narrowed the About and RPG Wednesday route grid overrides so they no longer mask or locally own the media/prose exception.
- Added a shared narrow-screen collapse for the media/prose variant so future routes do not need one-off mobile grid rescues.

## Implementation Note - 2026-06-29 Inline Frame Lists

- Promoted `.frame-list--inline` into the shared content component contract for compact route-index guidance.
- Removed route-local index list styling from About, Plans, and Recipes so the explicit inline variant owns this repeated pattern.
- Kept the variant unboxed: it uses a light accent rail and responsive grid rhythm rather than nested card styling inside existing frames.

## Implementation Note - 2026-06-29 Recipes Hero Slot Rail

- Reworked the Recipes hero so `site-hero--split-figure` has one direct `data-spw-slot="figure"` rail instead of several direct figure-slot siblings.
- Moved supporting recipe studies inside that rail and removed route CSS that manually assigned all supporting figures to the same desktop grid row.
- Kept the visual treatment route-owned while letting the shared split-figure contract own header/body/figure/actions placement.

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

## Active Refinement - 2026-06-19 Conversation Audit

This plan now owns the architectural CSS cleanup portion of the "deeper audit on all fronts" and "broader architectural refinement audit" prompts.

Redistributed tasks:

- Consolidate repeated selector families into shared component, route-surface, or DOM-contract owners before adding new route-local selectors.
- Use `css-state-legibility/PLAN.md` for microinteraction state vocabulary and this plan for selector ownership or layer-boundary cleanup.
- Use `component-box-model-responsive-audit/PLAN.md` for containment and card-grid behavior; use this plan when a containment fix exposes a brittle selector architecture.
- Keep generated bundle changes downstream of source CSS edits; never patch generated bundles as the architectural source of truth.
- Record any durable new CSS/HTML contract in `.spw` only after it appears in more than one route or shared layer.

Validation additions:

- `rg -n ":has\\(|data-spw-slot|data-spw-layout|frame-grid|media-prose|frame-list--inline" public/css **/index.html`
- `npm run check:local` after source CSS edits; inspect generated-output freshness separately from source validation.

## Active Refinement - 2026-06-20 Timing And Layout Contracts

This pass owns a targeted architecture cleanup from the CSS/JS refinement brief:

- Move shell z-index ownership for header indicators and floating chrome out of the handle layer.
- Keep route-specific lens labels and selected-state animation overrides in route CSS, with shared mode-switch CSS exposing `--mode-switch-*` variables.
- Prefer shared interaction timing tokens (`--spw-interaction-acknowledge`, `--spw-interaction-commit`, `--spw-interaction-settle`) for reusable handles.
- Add declarative newspaper page width and compact mid-size 3-up grid behavior without replacing the existing layout tuner.
- Keep split-layout rails narrow and content-owned at mid desktop widths by using a `max-content` rail track.
- Treat semantic handles as performance hooks: hydrated features, modules, and handles can spend readiness variables so components feel like local systems coming online.
- Let page/section transitions spend semantic hierarchy and inertia: active sections, adjacent sections, and floating navigation surfaces receive different resonance/timing variables.
