---
name: spw-fix-planning
description: Structure a multi-layer regression before coding. For obvious one-file bugs, just fix them.
---

# Spw Fix Planning for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

FIX notes help when the failure mode is unclear or multi-layer. They are not
required to justify a three-line CSS tweak.

## When to use

- Bug spans layers or routes
- Root cause is unknown
- You need a durable note for later (lifecycle, settings, agent dispatch)
- Agent/planning indexes themselves are broken

## When not to use

- Single file, clear cause → edit and validate
- “Maybe write a plan later” → do not open PLAN.md for a fix

## Workflow

1. Visible failure, routes, how to reproduce.
2. Symptom vs likely root vs ripple.
3. Smallest file set that can contain the fix.
4. If multi-layer or unclear: `.agents/plans/<slug>/FIX.md` (failures, diagnosis, fix, deferred).
5. `.spw` review only if the bug is really ontology/lifecycle/settings seam—not by default.

## Validation

- `node --check` / route spot-check / `git diff --check`
- Agent-layer regressions → `agent-optimization/` + plan-maintenance if indexes broke
