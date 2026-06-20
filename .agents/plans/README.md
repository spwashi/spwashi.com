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
- `relational-attention-media/PLAN.md` — attention as self/local/global relation plus local media-seed production across genres.
- `webpage-trope-vocabulary/PLAN.md` — literal website/reference-document anatomy, route-specific restaurant/garden anchors, shared `data-spw-anatomy` vocabulary, and floating chrome island rules.
- `agent-optimization/PLAN.md` — use when the work changes the agent/editor operating environment itself.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Maintenance Snapshot - 2026-06-19

The plans directory is an active ecology, not a flat list of equally current work. Treat the four canonical tracks as stable starting points, then route new work into the relevant bucket:

- Semantic rails: `model-guided-refinement/`, `daily-kernel-development/`, `spw-surface-normalization/`, `modular-experience-slices/`, `relational-attention-media/`, `agent-optimization/`.
- Runtime and architecture: `runtime-bootstrap-performance/`, `runtime-load-instrumentation/`, `runtime-module-fluency/`, `js-surface-ecology/`, `js-taxonomy-cleanup/`, `site-source-layout/`, `typescript-integration/`, `floating-chrome-stack/`.
- CSS, layout, and interaction: `css-maintainability-refactor/`, `component-box-model-responsive-audit/`, `vertical-rhythm-container-audit/`, `card-grid-density-audit/`, `card-anatomy-interactions/`, `state-satchel-card-gesture-fixes/`.
- Content, route, image, and RPG systems: keep route-specific work local unless it introduces a reusable semantic family or public editor contract.

Completed-reference decisions from this sweep live in `archive/2026-06-19-plan-maintenance.md`. Completed plans may remain in their original directories when other plans still cite them directly; physical archive moves should update references in the same patch.

Conversation audit redistribution from this sweep lives in `archive/2026-06-19-conversation-audit-redistribution.md`. Treat the broad audit prompts as archived source context and continue work in the assigned owner plans instead of creating parallel "all fronts" plans.

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
- `floating-chrome-stack/FIX.md` — normalize floating chrome roles, tiers, console ownership, and discovery-credit alignment.
- `modular-experience-slices/PLAN.md` — bolder file tree evolution supporting explicit "experience slice" ownership, practice beds, and tending-note handoffs. The first concrete pilot is `math-practice-labs`, with `attention-resonance-field` as the next slice contract candidate.
- `spw-surface-normalization/PLAN.md` — lightweight normalization of .spw writing style (headers, ^"sections", references, ~#metadata) to align with workbench self-modeling while preserving local voice, plus mechanisms for greater navigability and explicit dimensionality (temporal rhythms, practice depth, semantic layer, collaboration phase).
- `model-guided-refinement/PLAN.md` — rails for less creative models: focus dimensions, semantic fixity tiers, elemental implementation effects, cross-language CSS/HTML/JS/.spw tracing, and the creative marketing engine contract for musicians/artists/collaborators.
- `daily-kernel-development/PLAN.md` — one-session development exercise for semantic capacity, brand physics, regional sensory design, and cross-discipline ergonomics across engineers, animators, illustrators, designers, musicians, and collaborators.
- `pretext-whimsy-lab/PLAN.md` — bounded Pretext measurement and projection work, now using a live/static host contract so typography physics stays opt-in and inspectable.
- `designer-conversation-canvas/PLAN.md` — touchable specimens, named tokens, and Pretext measurement bus for designer handoff on the public site.
- `professional-skill-development-worldbuilding/PLAN.md` — architecture for treating character sheets, budgeting, RPG Wednesday, Town Library quests, and proof cards as an immersive skill-development operating system with an evidence loop.

Meta / ecology work:
- `agent-optimization/PLAN.md` — maturing the `.agents/`, skills, `.spw` bridges, and public editor surfaces for lower friction agent and editor operation (follows from the prior active plans review).

## Archived Notes

Archived historical notes live in `archive/`. Use them as reference only:

- `archive/design-hub-expansion.md`
- `archive/overlay-alignment.md`
- `archive/2026-06-19-plan-maintenance.md`
- `archive/2026-06-19-conversation-audit-redistribution.md`

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
