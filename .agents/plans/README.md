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
- `interaction-loop-contract/PLAN.md` — centralize shared interaction-feedback states, refresh reasons, and cancel/eligibility handling.
- `gesture-state-refinement/PLAN.md` — calm gesture intent on mobile and document the resulting interaction grammar.
- `navigation-header-disclosure/PLAN.md` — keep header disclosure roles, overlay state, and compact action ownership legible.
- `floating-chrome-stack/FIX.md` — normalize floating chrome roles, tiers, console ownership, and viewport participation.
- `semantic-copy-depth/PLAN.md` — formalize entry/normal/dense/technical copy depth alongside the existing semantic layers.
- `relational-attention-media/PLAN.md` — attention as self/local/global relation plus local media-seed production across genres.
- `webpage-trope-vocabulary/PLAN.md` — literal website/reference-document anatomy, route-specific restaurant/garden anchors, shared `data-spw-anatomy` vocabulary, and floating chrome island rules.
- `site-starter-component-kit/PLAN.md` — portable compose.css/compose.js starter boundary, component specimen promotion, and inventory command for spawning new sites.
- `agent-optimization/PLAN.md` — use when the work changes the agent/editor operating environment itself.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Maintenance Snapshot - 2026-06-30

The active tree is large enough that directory names alone are not a usable interface. The latest census found 173 active top-level plan folders plus `archive/`, 160 active `PLAN.md` files, 50 active `wip.spw` files, 13 total `FIX.md` files, and 11 true `FIX.md`-only tactical queues. The nonstandard folders remain intentional template tooling in `recent-plan-templates/`, revived image/style ownership in `style-image-cohesion/`, and empty local overgrowth in `mobile-density-operator-semantics/`.

Use virtual buckets before physical moves:

- Semantic rails and editor operations: `model-guided-refinement/`, `daily-kernel-development/`, `modular-experience-slices/`, `spw-surface-normalization/`, `agent-optimization/`, `agentic-dev-contracts/`. Use `agentic-dev-contracts/` for generated route/runtime facts, future plan/skill indexes, validation posture memos, and other invalidatable agent-development caches.
- CSS, layout, and interaction: `css-maintainability-refactor/`, `css-state-legibility/`, `component-box-model-responsive-audit/`, `card-grid-density-audit/`, `floating-chrome-stack/`, `gesture-aria-hygiene/`, `attention-shell-contrast/`.
- Runtime, JS, and validation: `runtime-bootstrap-performance/`, `runtime-load-instrumentation/`, `runtime-module-fluency/`, `js-surface-ecology/`, `js-taxonomy-cleanup/`, `site-source-layout/`, `typescript-integration/`. Use this bucket for cold/warm load posture, cache strata, module mount cost, and metacognitive inspection utility.
- Media, image, and sensory material: `style-image-cohesion/`, `midjourney-design-concepts/`, `relational-attention-media/`, `site-color-tuning/`, `theme-palette-marketability/`.
- Public route, proof, and genre systems: `design-hub/`, `webpage-trope-vocabulary/`, `professional-skill-development-worldbuilding/`, `rpg-portal-fantasy/`, `expressive-layout-tropes-fidget-manuscript/`.
- Templates and tooling: `recent-plan-templates/` is a template source, not an active backlog item. Use its leaflet precipitation template for small .spw byproducts before promoting them into plans or conventions. `site-starter-component-kit/` owns the portable starter/component inventory boundary, not generated starter output yet.
- Fix queue: `FIX.md`-only folders remain active tactical work unless a dated archive note says the fix has landed or been superseded. Completed/superseded FIX references from this sweep are `overlay-layer-ownership/`, `menu-containment-navigation/`, `mobile-image-effects/`, and `runtime-route-css-regressions/`.

Consolidation posture:

- Prefer index-level archival before moving folders with direct citations.
- Give WIP-only folders a small `PLAN.md`, merge them into a clear owner plan, or archive them by index note when next touched.
- Split or cold-archive oversized plan artifacts before editing them broadly; `midjourney-design-concepts/`, `color-motion/`, `css-architecture-readability/`, and `rpg-portal-fantasy/` are the largest active candidates.
- Record recursive maintenance passes in `agent-optimization/PLAN.md`, `archive/README.md`, and `.spw/conventions/planning-ecology.spw`.
- Keep `/about/plans/` aligned with these buckets so the public editor surface exposes the same routing architecture as this README.

The dated record for this sweep lives in `archive/2026-06-30-plan-maintenance.md`.

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
- `site-starter-component-kit/PLAN.md` - make compose.css, compose.js, design specimens, and component promotion rules usable for spawning new sites without copying the full Spwashi shell.
- `css-maintainability-refactor/PLAN.md`
- `site-color-tuning/PLAN.md`
- `space-menu-arcs-electrical/PLAN.md` - floating UI hierarchy, route menu field projection, arc lifecycle microfeedback, and opt-in circuit anatomy vocabulary.
- `runtime-bootstrap-performance/PLAN.md` - reduce serial loading, immediate layer width, observer cost, and warm-return friction while preserving staged policy-driven loading, cache-stratum ownership, and full observability.
- `floating-chrome-stack/FIX.md` - normalize floating chrome roles, tiers, console ownership, and discovery-credit alignment.
- `component-semantics-document-host/FIX.md` - keep document-host semantics from collapsing into generic component styling.
- `gesture-aria-hygiene/FIX.md` - keep gesture controls and ARIA state truthful while mobile interaction grammar settles.
- `attention-shell-contrast/FIX.md` - preserve readable attention shell contrast across route and ornament states.
- `modular-experience-slices/PLAN.md` - bolder file tree evolution supporting explicit "experience slice" ownership, practice beds, and tending-note handoffs. The first concrete pilot is `math-practice-labs`, with `attention-resonance-field` as the next slice contract candidate.
- `interaction-loop-contract/PLAN.md` - shared interaction-feedback contract for state inspector and image metaphysics, now broadening toward other guarded runtime surfaces.
- `gesture-state-refinement/PLAN.md` - mobile gesture cleanup, intentional menu / brace behavior, and console-facing inspection helpers.
- `navigation-header-disclosure/PLAN.md` - generated header disclosure, menu overlay state, and compact action ownership.
- `semantic-copy-depth/PLAN.md` - copy-depth tiers for entry, normal, rich, dense, technical, and genre surfaces.
- `spw-surface-normalization/PLAN.md` - lightweight normalization of .spw writing style (headers, ^"sections", references, ~#metadata) to align with workbench self-modeling while preserving local voice, plus mechanisms for greater navigability and explicit dimensionality (temporal rhythms, practice depth, semantic layer, collaboration phase).
- `model-guided-refinement/PLAN.md` - rails for less creative models: focus dimensions, semantic fixity tiers, elemental implementation effects, cross-language CSS/HTML/JS/.spw tracing, and the creative marketing engine contract for musicians/artists/collaborators.
- `daily-kernel-development/PLAN.md` - one-session development exercise for semantic capacity, brand physics, regional sensory design, and cross-discipline ergonomics across engineers, animators, illustrators, designers, musicians, and collaborators.
- `pretext-whimsy-lab/PLAN.md` - bounded Pretext measurement and projection work, now using a live/static host contract so typography physics stays opt-in and inspectable.
- `designer-conversation-canvas/PLAN.md` - touchable specimens, named tokens, and Pretext measurement bus for designer handoff on the public site.
- `professional-skill-development-worldbuilding/PLAN.md` - architecture for treating character sheets, budgeting, RPG Wednesday, Town Library quests, and proof cards as an immersive skill-development operating system with an evidence loop.

Meta / ecology work:
- `agent-optimization/PLAN.md` - maturing the `.agents/`, skills, `.spw` bridges, and public editor surfaces for lower friction agent and editor operation (follows from the prior active plans review).

Completed/superseded references retained in place:

- `overlay-layer-ownership/FIX.md` - `data-spw-overlay` is now a documented site contract and remains as rationale.
- `menu-containment-navigation/FIX.md` - the primary route/menu containment work landed on 2026-06-28; deferred items now route through shell and floating-chrome tracks.
- `mobile-image-effects/FIX.md` - the mobile raster effect work is superseded by the current `metaphysical-paper.css` and `image-metaphysics.js` locations.
- `runtime-route-css-regressions/FIX.md` - the missing visitation/bootstrap and route-structure failures have been repaired or superseded by current runtime and route sources.

## Archived Notes

Archived historical notes live in `archive/`. Use them as reference only:

- `archive/design-hub-expansion.md`
- `archive/overlay-alignment.md`
- `archive/2026-06-19-plan-maintenance.md`
- `archive/2026-06-19-conversation-audit-redistribution.md`
- `archive/2026-06-21-planning-ecology-recursive-maintenance.md`
- `archive/2026-06-30-plan-maintenance.md`

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
