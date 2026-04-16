---
name: spw-ui-containment-audit
description: Audit containment, sizing, scroll, and alignment issues in the spwashi.com site. Use for card measure problems, menu structure, mobile overflow, hero sizing, and component alignment across shared surfaces.
---

# Spw UI Containment Audit for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the failing container, not just the visible symptom.
2. Trace containment through HTML structure, CSS layout mode, and any JS-applied classes or datasets.
3. Prefer structural fixes:
   - correct grid/flex ownership
   - width and measure constraints
   - consistent gaps and padding
   - stable mobile behavior
4. Check whether the real issue is hierarchy, not overflow.
5. If a layout rule repeats, move it into shared surfaces or components.

## Common Targets

- nav and menu clusters
- card bodies and captions
- hero figures and image grids
- settings widgets and chips
- long-copy measure and inline element wrapping
