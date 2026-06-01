---
name: spw-craft-quality
description: Improve craft quality of the spwashi.com site across HTML, CSS, JS, copy, and `.spw` surfaces. Use for clarity passes, design-system cleanup, runtime polish, and structural refactors that should stay reviewable.
---

# Spw Craft Quality for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Choose one quality axis: clarity, semantics, visual hierarchy, interaction learnability, a11y, or maintainability.
2. For cross-discipline or sensory work, choose a daily-kernel shape first: discipline pair, region, brand physics, intensity, semantic operation, output, and validation.
3. Find the smallest public slice that pays off: one route, one shared layer, one runtime module, one daily-kernel note, or one `.spw` bundle.
4. Prefer shared fixes before page-local patches:
   - tokens or grammar before surfaces
   - surfaces before route-specific CSS
   - semantic HTML before JS
5. Keep hand-authored copy and structure legible; remove incidental complexity instead of layering new workaround code.
6. Update `.spw` inspection surfaces when the change introduces a new concept, lifecycle, ontology seam, semantic-capacity operation, daily kernel, or brand-physics rule — especially when the change touches the planning ecology, skills, or agent contracts (see `agent-optimization/PLAN.md`).

## Quality Heuristics

- Favor stronger defaults over more toggles.
- Align visual hierarchy with semantic hierarchy.
- Use data attributes and shared classes intentionally; do not add attribute sprawl for tiny cosmetic differences.
- Keep interaction learnable: visible state beats hidden cleverness.
- If a concept only exists in code, consider whether it should also exist in copy or `.spw`.
- If a creative theme only exists as atmosphere, map it to implementation: region, brand physics, operator, component, CSS token, or product-line proof.
- Default daily-kernel intensity to `quiet` or `studio`; use `performance` and `festival` only when scoped and reversible.

## Validation

- `git diff --check`
- `node --check` on touched JS files
- targeted route or selector checks with `rg`
