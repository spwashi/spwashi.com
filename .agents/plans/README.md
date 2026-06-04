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

## Current Semantic Rails

Use these when a task is broad, cross-disciplinary, or likely to create reusable meaning:

- `model-guided-refinement/PLAN.md` — choose focus dimensions, fixity tiers, elemental effects, and cross-language traces before implementation.
- `daily-kernel-development/PLAN.md` — run one-session kernels for engineers, animators, illustrators, designers, musicians, artists, and collaborators without broad rewrites.
- `spw-surface-normalization/PLAN.md` — keep `.spw` surfaces navigable, dimensional, and reviewable as semantic capacity grows.
- `modular-experience-slices/PLAN.md` — use slice contracts when ownership spans HTML, CSS, JS, `.spw`, validation, and practice beds.
- `agent-optimization/PLAN.md` — use when the work changes the agent/editor operating environment itself.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

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
- `runtime-bootstrap-performance/PLAN.md` — reduce serial loading, immediate layer width, and observer cost in the shared JS runtime bootstrap while preserving staged policy-driven loading and full observability.
- `modular-experience-slices/PLAN.md` — bolder file tree evolution supporting explicit "experience slice" ownership, practice beds, and tending-note handoffs. The first concrete pilot is `math-practice-labs`, with `attention-resonance-field` as the next slice contract candidate.
- `spw-surface-normalization/PLAN.md` — lightweight normalization of .spw writing style (headers, ^"sections", references, ~#metadata) to align with workbench self-modeling while preserving local voice, plus mechanisms for greater navigability and explicit dimensionality (temporal rhythms, practice depth, semantic layer, collaboration phase).
- `model-guided-refinement/PLAN.md` — rails for less creative models: focus dimensions, semantic fixity tiers, elemental implementation effects, cross-language CSS/HTML/JS/.spw tracing, and the creative marketing engine contract for musicians/artists/collaborators.
- `daily-kernel-development/PLAN.md` — one-session development exercise for semantic capacity, brand physics, regional sensory design, and cross-discipline ergonomics across engineers, animators, illustrators, designers, musicians, and collaborators.
- `professional-skill-development-worldbuilding/PLAN.md` — architecture for treating character sheets, budgeting, RPG Wednesday, Town Library quests, and proof cards as an immersive skill-development operating system with an evidence loop.

Meta / ecology work:
- `agent-optimization/PLAN.md` — maturing the `.agents/`, skills, `.spw` bridges, and public editor surfaces for lower friction agent and editor operation (follows from the prior active plans review).

## Archived Notes

Archived historical notes live in `archive/`. Use them as reference only:

- `archive/design-hub-expansion.md`
- `archive/overlay-alignment.md`

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
