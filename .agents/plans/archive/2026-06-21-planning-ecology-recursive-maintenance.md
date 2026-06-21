# Planning Ecology Recursive Maintenance - 2026-06-21

This sweep treats `.agents/plans/` as a living information architecture rather than a flat backlog. The goal is to make future planning work easier to find, easier to archive, and easier to project into `.spw` without disrupting direct references before a feature implementation commit.

## Census

- 170 active top-level plan folders plus `archive/`.
- 50 active folders contain `wip.spw`.
- 11 active folders are `FIX.md`-only tracks.
- 2 folders have both `PLAN.md` and `FIX.md`: `chrome-navigation-wonder/` and `navigation-header-disclosure/`.
- 3 active folders have no `PLAN.md` or `FIX.md`:
  - `style-image-cohesion/` was revived with a `PLAN.md` during this pass.
  - `recent-plan-templates/` is intentionally template-only and should remain indexed as tooling, not backlog.
  - `mobile-density-operator-semantics/` is an empty local folder and a cleanup candidate.
- `spw-css-architecture/` is the largest plan folder by file size and should be split or archived by index note before any broad edit to that artifact.

## Decisions

- Keep the physical folder structure stable for now. The tree has too many live direct citations for casual moves.
- Use virtual buckets in `.agents/plans/README.md` as the main navigation layer until a ref-safe physical archive pass is explicitly scoped.
- Treat WIP-only folders as friction. Each one should receive a small `PLAN.md`, be merged into an owner plan, or be archived by index note when next touched.
- Treat fix-only folders as a queue, not as missing plans. They should stay short, testable, and easy to close.
- Treat template-only folders as tooling. They should be named in the index so automated audits do not misread them as stale backlog.

## Spw Tree Benefits

The plan tree works best when it mirrors Spw operations:

- `cache`: keep small insights and unfinished evidence close to the route or convention they affect.
- `audit`: mark what was inspected, what remains uncertain, and what can falsify a claim.
- `align`: merge vocabulary across route HTML, CSS, JS, plans, and `.spw` surfaces.
- `prime`: leave the next implementation pass with a compact owner surface.
- `contract`: promote stable rules into a convention, README, validation check, or public editor surface.
- `archive`: move broad conversation or completed context out of the active path without losing the trail.

This gives the site a recursive maintenance loop: plans describe work, plan-maintenance describes the health of those plans, and `.spw` exposes the reusable model so future agents do not rediscover the same structure from scratch.

## Next Consolidation Queue

- Build a ref-safe archive pass for completed direct-reference plans after the next feature implementation commit.
- Review `spw-css-architecture/` for generated or oversized WIP content that can be split into a compact PLAN plus cold archive note.
- Decide whether `mobile-density-operator-semantics/` should be removed locally or revived with a real owner plan.
- Add public `/about/plans/` projection of the virtual buckets when the editor surface next changes.
- Consider a zero-dependency plan-census script only if repeated manual audits continue to consume time.

## Validation

- Keep archival records linked from `.agents/plans/archive/README.md`.
- Keep recursive maintenance rules linked from `.spw/conventions/planning-ecology.spw`.
- Use `git diff --check` and targeted `rg` checks after index or reference edits.
