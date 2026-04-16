---
name: spw-fix-planning
description: Plan a fix for regressions or runtime issues in the spwashi.com site before editing. Use for UI regressions, broken interactions, layout bugs, or lifecycle/state problems that need a structured fix note.
---

# Spw Fix Planning for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## When to Use

- the bug spans multiple layers
- the failure mode is unclear
- you need a durable fix note before implementation

## Default Workflow

1. Record the visible failure, affected routes, and reproduction hints.
2. Separate symptom, root cause, and likely ripple.
3. Predict the smallest file set that can contain the fix.
4. Write `.agents/plans/<slug>/FIX.md` with:
   - failures
   - diagnosis
   - planned fix
   - deferred follow-ups
5. Add `.spw` review notes when the bug is really an ontology, settings, or lifecycle seam.

## Validation

- syntax checks for touched JS
- asset/anchor checks for touched routes
- `git diff --check`
