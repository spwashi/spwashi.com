---
name: spw-plan-maintenance
description: Maintain the spwashi.com planning ecology after changes land. Use to refresh `.agents/plans/`, `.spw` bridges (including the agents/planning dispatch), review bundles, skills discoverability, and references when site concepts or files move. Primary tool for the agent-optimization track.
---

# Spw Plan Maintenance for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Sweep `.agents/plans/` for stale `PLAN.md`, `FIX.md`, and `wip.spw` artifacts. Prioritize canonical tracks and any items under `agent-optimization/`.
2. Check the `.spw` agent/planning dispatch (see `@agents`, `@plans`, `@agent_optimization`, `@plan_maintenance` in `site.spw`). Add or update entries when new durable concepts appear.
3. Refresh cross-references, predicted file lists, and status markers across:
   - `.agents/plans/README.md` and `archive/README.md`
   - `.agents/skills/README.md`
   - Individual plans that cite each other or skills
   - Public editor surface at `/about/plans/`
4. Update or create `.spw` notes (conventions, surfaces, or reviews) when the planning layer itself introduces a reusable semantic family (e.g., "agent contracts", "editor seams", "planning ecology").
5. Archive or mark verified items when implementation has clearly landed. Record the sweep in the relevant plan (especially `agent-optimization/PLAN.md`).
6. Keep plan notes and skill definitions aligned with the site, not with inherited workbench assumptions.

## Validation

- `git diff --check`
- targeted `rg` checks for plan slugs, `.spw` dispatch entries (`@agents`, `@plans`, etc.), and moved files
- Confirm `skills/README.md` and the top-level plans index remain coherent

## Current Focus Areas (Agent Optimization)

- The `agent-optimization/PLAN.md` track and its sub-patches (especially .spw modeling of the planning layer and public plans page maintenance).
- Discoverability of `spw-plan-maintenance` itself and sibling skills (`ontology-workbench`, `semantics-rigor`, `craft-quality`, `feature-planning`).
- Keeping the four canonical tracks and high-signal backlog items well-linked from both `.spw/site.spw` and the public `/about/plans/` surface.
- Ensuring new plans created via `spw-feature-planning` or `spw-fix-planning` are immediately wired into the dispatch and indexes.
