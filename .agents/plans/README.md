# Plan Index

This directory holds the stable, reviewable plan tracks for the site.

## Canonical Tracks

- `css-architecture-readability/PLAN.md` - literate CSS ownership, debug labels, and UX behavior traceability.
- `color-motion/PLAN.md` - behavior/personality audit, palette tuning, operator distinction, and microinteraction timing.
- `midjourney-design-concepts/PLAN.md` - UX concept studies, animation references, inspiration workflow, and asset promotion rules.
- `reference-assignment-template/PLAN.md` - intern-sized reference briefs for component improvements and experiments.

Use these plans as the canonical starting point instead of the `tmp-plan*.md` scratch files at the repo root.

Current emphasis: make behavior inspectable, keep the site's voice recognizable, and keep the codebase navigable by concept name.

Reference assignments should give an intern a small set of site references, one UX question, one component behavior, and a validation path.

## Active Backlog

The rest of `.agents/plans/` is an active backlog of route, CSS, runtime, image, and interaction workstreams. These are not canonical planning tracks, but they are still current unless explicitly moved to `archive/`.

High-signal active examples:

- `design-hub/PLAN.md`
- `css-maintainability-refactor/PLAN.md`
- `site-color-tuning/PLAN.md`
- `overlay-layer-ownership/FIX.md`
- `menu-containment-navigation/FIX.md`
- `mobile-image-effects/FIX.md`
- `runtime-route-css-regressions/FIX.md`

## Archived Notes

Archived historical notes live in `archive/`. Use them as reference only:

- `archive/design-hub-expansion.md`
- `archive/overlay-alignment.md`

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
