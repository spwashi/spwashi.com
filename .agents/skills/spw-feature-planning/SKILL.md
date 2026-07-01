---
name: spw-feature-planning
description: Plan a feature for the spwashi.com site before large edits. Predict affected routes, shared layers, runtime modules, experience slices, and `.spw` artifacts, then write site-local planning files under `.agents/plans/<slug>/`.
---

# Spw Feature Planning for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## When to Use

- the change spans multiple routes or shared layers
- the work touches both public pages and editor-facing `.spw` surfaces
- the user wants architectural direction before implementation
- the task is broad, cross-discipline, or creative enough to need model-guided rails before code
- the feature adds entertainment utility, scene interaction, or device-aware display behavior

## Default Workflow

1. Define the user-facing outcome and the site layers it affects.
2. Choose the right planning rail:
   - `model-guided-refinement/` — focus dimensions, fixity tiers, elemental effects, cross-language traces
   - `daily-kernel-development/` — one-session engineer/artist/designer/musician explorations
   - `modular-experience-slices/` — durable cross-layer ownership (practice beds, tending notes)
   - `spw-surface-normalization/` — `.spw` navigability and semantic-capacity work
3. Predict the minimal file set across:
   - route HTML (`<body>` metadata, scene beds, semantic attrs)
   - shared CSS (tokens → components → systems; note systems **tail** import if modulating modules)
   - shared JS (`module-catalog.js` registration, snapshot APIs, bus events)
   - `.spw` bridges, conventions, or slice contracts
4. Write `.agents/plans/<slug>/PLAN.md` with scope, constraints, risks, and validation.
5. Add `wip.spw`, insight cache, or daily-kernel note only when editor inspection benefits.
6. Keep the plan site-first; reference `.spw/_workbench` only when tooling canon is genuinely involved.

## Interactive / runtime checklist

When the feature touches behavior:

- [ ] Which `MODULE_LAYERS` and `MOUNT_WHEN` in `module-catalog.js`?
- [ ] Does it read device context from shell-disclosure or duplicate viewport logic?
- [ ] Does module CSS consume `--spw-medium-*` / dimension tokens?
- [ ] Is `interactive-medium.css` the tail modulator (not the base layout owner)?
- [ ] Snapshot wired to `page-anatomy` and/or `topical-payload`?
- [ ] Keyboard + pointer + reduced-motion paths defined?
- [ ] Cleanup/teardown on module unmount?

Use `spw-interactive-medium` skill during implementation of entertainment/scene features.

## Plan Checklist

- public goal (creator-first copy where relevant)
- files likely to change
- semantic or runtime seams
- experience slice owner (if cross-route)
- focus dimension and fixity tier (model-guided)
- daily-kernel fields (cross-discipline)
- validation loop (`check:local`, `check:runtime`, route smoke)
- what stays out of scope

Agent-environment improvements → `.agents/plans/agent-optimization/`. Cite `spw-plan-maintenance`.