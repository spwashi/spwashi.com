---
name: spw-plan-maintenance
description: Maintain the spwashi.com planning ecology after changes land. Use to refresh `.agents/plans/`, `.spw` bridges, review bundles, and references when site concepts or files move.
---

# Spw Plan Maintenance for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Sweep `.agents/plans/` for stale `PLAN.md`, `FIX.md`, and `wip.spw` artifacts.
2. Check whether new concepts should also be linked from `.spw/index.spw` or `.spw/site.spw`.
3. Refresh cross-references, predicted file lists, and status markers.
4. Archive or mark verified items when implementation has clearly landed.
5. Keep plan notes aligned with the site, not with inherited workbench assumptions.

## Validation

- `git diff --check`
- targeted `rg` checks for plan slugs, `.spw` dispatch entries, and moved files
