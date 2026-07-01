---
name: spw-ui-containment-audit
description: Audit containment, sizing, scroll, and alignment issues in the spwashi.com site. Use for card measure problems, menu structure, mobile overflow, hero sizing, scene-bed layout, container-query breakpoints, and touch-target sizing across viewport tiers.
---

# Spw UI Containment Audit for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the failing container, not just the visible symptom.
2. Trace containment through HTML structure, CSS layout mode, JS datasets, and root viewport state:
   - `data-spw-viewport-tier`, `data-spw-layout`, `data-spw-pack-tier`
   - `container-type` / `@container` on interactive hosts (`.spw-scene-bed`)
3. Prefer structural fixes:
   - correct grid/flex ownership
   - width and measure constraints (`--spw-real-estate-inline`, `--page-width-*`)
   - consistent gaps via `--spw-medium-layout-gap-scale` / `--component-gap`
   - stable mobile behavior and touch min heights (`--spw-medium-touch-min`)
4. Check whether the issue is hierarchy, not overflow.
5. If a layout rule repeats, move it to shared components or systems — not route-local hacks.

## Device-specific audit matrix

| Signal | Check |
|--------|-------|
| `compact` / `narrow` tier | grid column collapse, lane stack, nav pressure |
| `coarse` pointer | touch targets ≥ `--spw-medium-touch-min`; no hover-only affordances |
| `touch` hover mode | suppress `translateY` hover lifts; keep `:focus-visible` |
| `split` / `wide` layout | gutter rail, scene figure side-by-side |
| packing `compact` | lane pad + gap scale on scene beds |

## Common Targets

- nav and menu clusters (shell-disclosure pressure)
- scene beds: stage grid, figure coupling, memory strip
- card bodies, hero figures, image grids
- settings widgets and operator chips
- long-copy measure and inline wrapping

## Validation

- reproduce at `compact` and `wide` widths
- `rg` for conflicting `min-block-size`, `padding`, `grid-template-columns` on same selector family
- prefer `spw-interactive-medium` skill when fixes need register-aware tokens