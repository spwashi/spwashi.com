# Plan: image-metaphysics-aesthetic-pass

Refine the shared image metaphysics surface so the `pixel`, `wash`, and `settle` states feel authored, legible, and responsive rather than like a hidden debug toggle.

## Goal

Keep the existing semantic image-treatment contract, but make the control chrome explain state more clearly and make each treatment read as a distinct image grammar across mobile, tablet, and wide hero surfaces. Taste note: **interactive wonder with composure**.

## Scope

- **In scope**: shared helper layout, helper state wording, responsive helper behavior, and the raster/vector presentation of `pixelize`, `watercolor`, and `clarify`.
- **Out of scope**: new dependencies, route-specific rewrites, new stored settings, and renaming the canonical effect values in JS.

## Files

[NEW] `.agents/plans/image-metaphysics-aesthetic-pass/PLAN.md`  
[MOD] `public/js/spw-image-metaphysics.js` - expose richer helper state without changing the underlying effect contract  
[MOD] `public/css/spw-metaphysical-paper.css` - redesign helper chrome, responsive layout, and effect styling

## Decisions

- Keep `semantic -> pixelize -> watercolor -> clarify` as the runtime cycle, but present the user-facing labels as `semantic`, `pixel`, `wash`, and `settle`.
- Make `auto` vs `manual` visible in the helper so the state model is learnable without opening the inspector.
- Treat the helper as image chrome, not a floating toolbar.
- Tune intensity by shared responsiveness rather than route-local overrides first.

## Validation

- `node --check public/js/spw-image-metaphysics.js`
- `git diff --check`
