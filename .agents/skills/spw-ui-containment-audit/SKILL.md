---
name: spw-ui-containment-audit
description: Find and fix overflow, measure, and packing issues. Structural CSS first—not new dimensions.
---

# Spw UI Containment Audit for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

Containment bugs are usually hierarchy and measure, not missing metadata.

## Workflow

1. Find the failing **container**, not only the symptom.
2. Trace HTML structure → CSS layout → only then JS datasets / viewport attrs.
3. Prefer structural fixes: grid/flex ownership, measure tokens, gaps, touch mins.
4. If hierarchy is wrong, fix hierarchy before adding packing attrs.
5. Promote repeating rules to shared components/systems—not route one-offs **and**
   not a new packing theory unless the axis is missing.

## Device matrix

| Signal | Check |
|--------|-------|
| compact / narrow | columns collapse, nav pressure |
| coarse pointer | touch targets; no hover-only essentials |
| touch hover mode | suppress lift transforms; keep focus-visible |
| pack-local cards | container queries on the card, not only viewport media |

## Validation

- Reproduce compact + wide
- `rg` conflicting min-size/padding/grid on the same family
- Interactive-medium skill only if the bug is medium-token specific
