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

## Default Workflow

1. Define the user-facing outcome and the site layers it affects.
2. Predict the minimal file set across:
   - route HTML
   - shared CSS
   - shared JS
   - `.spw` bridges or plans
3. Write `.agents/plans/<slug>/PLAN.md` with scope, constraints, risks, and validation.
4. Add `wip.spw` only when the feature benefits from editor inspection or staged ontology notes.
5. Keep the plan site-first; reference `.spw/_workbench` only if tooling or upstream canon is genuinely involved.

## Plan Checklist

- public goal
- files likely to change
- semantic or runtime seams
- validation loop
- what stays out of scope
