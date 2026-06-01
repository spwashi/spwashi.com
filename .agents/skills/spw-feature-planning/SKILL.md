---
name: spw-feature-planning
description: Plan a feature for the spwashi.com site before large edits. Predict affected routes, shared layers, runtime modules, and `.spw` artifacts, then write site-local planning files under `.agents/plans/<slug>/`.
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

## Default Workflow

1. Define the user-facing outcome and the site layers it affects.
2. Choose the right planning rail before inventing a new one:
   - `model-guided-refinement/` for focus dimensions, fixity tiers, elemental effects, and cross-language traces
   - `daily-kernel-development/` for one-session engineer/artist/designer/musician explorations
   - `modular-experience-slices/` for durable cross-layer ownership
   - `spw-surface-normalization/` for `.spw` navigability and semantic-capacity work
3. Predict the minimal file set across:
   - route HTML
   - shared CSS
   - shared JS
   - `.spw` bridges or plans
4. Write `.agents/plans/<slug>/PLAN.md` with scope, constraints, risks, and validation.
5. Add `wip.spw`, a semantic insight cache, or a daily-kernel note only when the feature benefits from editor inspection or staged ontology notes.
6. Keep the plan site-first; reference `.spw/_workbench` only if tooling or upstream canon is genuinely involved.

## Plan Checklist

- public goal
- files likely to change
- semantic or runtime seams
- focus dimension and semantic fixity tier when model-guided refinement applies
- daily-kernel region, brand physics, intensity, and discipline pair when cross-discipline ergonomics apply
- validation loop
- what stays out of scope

When the feature is an improvement *to the agent operating environment itself* (planning ecology, skills, `.spw` dispatch for editors, public plans surface, validation contracts), create or extend the plan under `.agents/plans/agent-optimization/`. Cite this skill and `spw-plan-maintenance`.
