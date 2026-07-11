---
name: spw-craft-quality
description: Improve clarity, hierarchy, a11y, device parity, and maintainability on a small public slice. Prefer removing weight over adding inspectability.
---

# Spw Craft Quality for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

Craft used to mean “stronger defaults, visible state, and serialization for
everything that mattered.” Serialization is still good for real runtime state.
It is a poor substitute for calmer HTML and CSS.

## Workflow

1. Pick **one** axis: clarity, hierarchy, learnability, a11y, device parity, maintainability.
2. Bound the slice: one route, one shared layer, or one module—not the whole ontology.
3. Prefer shared tokens/components before route CSS; HTML before JS.
4. Remove incidental complexity (extra attrs, dead modes, unused observers).
5. Update `.spw` only if a reusable contract changed—not for every polish pass.

## Heuristics

- Stronger defaults over more toggles.
- Visual hierarchy follows semantic hierarchy.
- Data attributes for real state—not cosmetic one-offs.
- Visible state beats hidden cleverness.
- Device parity: touch targets, hover-only motion, compact + wide.
- CSS: `:where()` for additive rules; no `!important` outside ornament.
- Module craft: cleanup listeners/observers; one bus emitter per event family.
- If state only exists for agents, question whether the public page needs it.

## Runtime

- Debounce resize / DOM sync with rAF.
- Prefer non-`immediate` catalog mounts for polish modules.
- Review source CSS layers; ignore bundle noise unless shipping CSS.

## Validation

- `git diff --check`
- `node --check` on touched JS
- `check:runtime` if catalog touched
- Spot-check compact viewport when layout moved
