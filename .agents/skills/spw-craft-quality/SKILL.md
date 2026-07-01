---
name: spw-craft-quality
description: Improve craft quality of the spwashi.com site across HTML, CSS, JS, copy, and `.spw` surfaces. Use for clarity passes, design-system cleanup, runtime polish, device-aware interaction craft, and structural refactors that stay reviewable.
---

# Spw Craft Quality for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Choose one quality axis: clarity, semantics, visual hierarchy, interaction learnability, a11y, device parity, or maintainability.
2. For cross-discipline work, choose a daily-kernel shape first.
3. Find the smallest public slice: one route, one shared layer, one runtime module, or one `.spw` bundle.
4. Prefer shared fixes before page-local patches:
   - tokens (`dimensions.css`, `core.css`) before surfaces
   - surfaces before route-specific CSS
   - semantic HTML before JS
   - module base CSS before systems-tail modulation
5. Keep hand-authored copy legible; remove incidental complexity instead of layering workarounds.
6. Update `.spw` when introducing concepts, lifecycles, slice contracts, or agent rails.

## Quality Heuristics

- Favor stronger defaults over more toggles.
- Align visual hierarchy with semantic hierarchy.
- Use data attributes intentionally; no sprawl for cosmetic one-offs.
- Interaction learnable: visible state beats hidden cleverness.
- **Device parity**: touch targets, hover-gated transforms, viewport-tier grid columns — test compact + wide.
- **Module craft**: signature-cache root writes; proper listener/observer cleanup; exported resolvers for tests.
- **CSS craft**: `:where()` for additive rules; `@supports` for container queries; no `!important` outside ornament.
- **Serialization craft**: if state matters, it should appear in `__SPW_*__.snapshot()` or Spw serialize.
- Concepts in code should often exist in copy or `.spw` too.

## Runtime maintainability patterns

- Deduplicate selectors shared across modules (`BED_SELECTOR`, `SCENE_HOST_SELECTOR`).
- Debounce resize/DOM sync with `requestAnimationFrame`.
- Avoid double-counting DOM hosts when scoring intensity or salience.
- Bus events + DOM `spw:*` events should have one canonical emitter.

## Validation

- `git diff --check`
- `node --check` on touched JS
- `npm run check:runtime` when module catalog or contracts change
- targeted `rg` for selectors, attrs, import order