# Plan: card-grid-density-audit

Audit the shared card/grid contract so route HTML can declare spacing and track intent more honestly across compact, narrow, mid, and wider device sizes.

## Goal

Make card spacing and grid measure more granular without scattering route-local inline grid styles or over-collapsing layouts on tablet and narrow-landscape widths.

## Scope

- In scope: shared card/grid CSS, shared reference-card anatomy, route HTML that still hard-codes grid tracks or misses density hints, and component glossary wording where the new contract should stay visible.
- Out of scope: major route rewrites, new JS runtime behavior, and unrelated copy passes.

## Files

- [NEW] `.agents/plans/card-grid-density-audit/PLAN.md`
- [MOD] `public/css/spw-components.css` - grid density, viewport-tier sizing, shared reference-card helpers, and refined 2up/3up collapse rules
- [MOD] `recipes/index.html` - declare dense card grids instead of relying only on defaults
- [MOD] `topics/software/renderers/index.html` - replace route-local grid sizing with shared grid/card anatomy
- [MOD] `topics/software/geometry/index.html` - replace inline reference grid/card layout with shared classes
- [MOD] `topics/software/lattices/index.html` - replace inline reference grid/card layout with shared classes
- [MOD] `design/components/index.html` - document grid density as an HTML-level hint

## Risks

- Dense grids can become too terse if long-copy panels opt in accidentally.
- Tablet layouts should gain usable columns without turning long panels into narrow slivers.
- Shared reference-card styling must stay close enough to existing renderers/geometry/lattices tone to avoid a visual regression.

## Validation

- `git diff --check`
- `rg` for removed inline grid styles and new density hints
- `npm run build`

## Redistribution Note - 2026-06-19

The current conversation's page/card layout audit does not require a new plan. This file owns grid-density-specific follow-up; broader containment, slot anatomy, and state-driven reflow remain with `component-box-model-responsive-audit/PLAN.md`.

Active follow-up:

- Find route-local inline grid styles that can become shared density hints.
- Prefer existing frame/card classes and `data-spw-layout` over new one-off grid wrappers.
- Keep long-copy cards out of dense grids unless the route declares a clear browsing/scanning mode.
