---
name: spw-plan-maintenance
description: Maintain the spwashi.com planning ecology after changes land. Use to refresh `.agents/plans/`, `.spw` bridges (including the agents/planning dispatch), review bundles, skills discoverability, and references when site concepts or files move. Primary tool for the agent-optimization track.
---

# Spw Plan Maintenance for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Sweep `.agents/plans/` for stale `PLAN.md`, `FIX.md`, and `wip.spw` artifacts. Start with a census: active folder count, `PLAN.md` folders, `FIX.md`-only folders, WIP-only folders, template-only folders, empty folders, and unusually large artifacts. Prioritize canonical tracks, `agent-optimization/`, and the current semantic rails: `model-guided-refinement/`, `daily-kernel-development/`, `modular-experience-slices/`, and `spw-surface-normalization/`.
2. Check the `.spw` agent/planning dispatch (see `@agents`, `@plans`, `@agent_optimization`, `@plan_maintenance`, `@model_guided_refinement`, `@semantic_capacity`, and `@daily_kernel` in `site.spw`). Add or update entries when new durable concepts appear.
3. Refresh cross-references, predicted file lists, and status markers across:
   - `.agents/plans/README.md` and `archive/README.md`
   - `.agents/skills/README.md`
   - Individual plans that cite each other or skills
   - Public editor surface at `/about/plans/`
4. Update or create `.spw` notes (conventions, surfaces, or reviews) when the planning layer itself introduces a reusable semantic family (e.g., "agent contracts", "editor seams", "planning ecology", "semantic capacity", "daily kernel", "brand physics", or "creative marketing engine").
5. Archive or mark verified items when implementation has clearly landed. Record the sweep in the relevant plan (especially `agent-optimization/PLAN.md`).
6. Keep plan notes and skill definitions aligned with the site, not with inherited workbench assumptions.

## Recursive Optimization / Overgrowth

- Prefer virtual information architecture first: update indexes, archive notes, dispatch entries, and owner buckets before physically moving directories with live citations.
- Treat WIP-only folders as friction. When touched, either add a small `PLAN.md`, merge the WIP into an owner plan, or archive it by index note.
- Treat `FIX.md`-only folders as tactical queues, not missing plans. They should stay narrow, falsifiable, and easy to close.
- Treat template-only folders as tooling. Name them in the index so automated or manual audits do not misread them as stale backlog.
- Treat empty folders and generated-looking large artifacts as overgrowth candidates. Do not delete or split them silently; document the candidate, then make a focused ref-safe cleanup pass.
- When repeated sweeps keep recomputing the same plan census, skill routing, or validation posture, consider whether `agentic-dev-contracts/PLAN.md` should receive a small generated cache proposal under `.agents/state/`.
- Promote durable maintenance rules into `.spw/conventions/planning-ecology.spw` when they should be visible to future agents.
- Recursive success means the maintenance pass reduces the next maintenance pass: fewer hidden WIPs, clearer buckets, fewer stale links, and a better next owner surface.

## Validation

- `git diff --check`
- targeted `rg` checks for plan slugs, `.spw` dispatch entries (`@agents`, `@plans`, `@model_guided_refinement`, `@semantic_capacity`, `@daily_kernel`, etc.), and moved files
- Confirm `skills/README.md` and the top-level plans index remain coherent
- For tree-health sweeps, rerun a local folder census or equivalent targeted `find` / `rg` checks after edits and compare the nonstandard folder list against the archive note.

## Current Focus Areas (Agent Optimization)

- The `agent-optimization/PLAN.md` track and its sub-patches (especially .spw modeling of the planning layer and public plans page maintenance).
- The semantic-capacity/model-guided/daily-kernel rails that prepare future agents to make focused changes without broad CSS/JS drift.
- Discoverability of `spw-plan-maintenance` itself and sibling skills (`ontology-workbench`, `semantics-rigor`, `craft-quality`, `feature-planning`).
- Keeping the four canonical tracks and high-signal backlog items well-linked from both `.spw/site.spw` and the public `/about/plans/` surface.
- Ensuring new plans created via `spw-feature-planning` or `spw-fix-planning` are immediately wired into the dispatch and indexes.
