# Plan Maintenance Sweep - 2026-06-30

This sweep refreshes the planning ecology after the starter component kit work and before the next shared runtime/component pass.

## Census

- Active top-level plan folders, excluding `archive/`: 173.
- Active `PLAN.md` files: 160.
- Active `wip.spw` files: 50.
- Total `FIX.md` files: 13.
- True `FIX.md`-only tactical queues: 11.
- Empty local overgrowth still present: `../mobile-density-operator-semantics/`.

## Completed Or Superseded References

These folders stay in place because they are direct reference targets, but they should not appear as high-signal active work:

- `../overlay-layer-ownership/FIX.md` - `data-spw-overlay` has landed in CSS and `.spw` conventions.
- `../menu-containment-navigation/FIX.md` - the primary menu containment work has a landed status from 2026-06-28; deferred work belongs to shell and floating chrome owners.
- `../mobile-image-effects/FIX.md` - the old file paths are historical, with current ownership under `public/css/effects/metaphysical-paper.css` and `public/js/media/image-metaphysics.js`.
- `../runtime-route-css-regressions/FIX.md` - the missing bootstrap import and route-structure failures are no longer the current active failure surface.

Each retained FIX file now has a 2026-06-30 maintenance-status block so direct readers see the same archive decision as the indexes.

## Architecture Updates

- Refreshed `../README.md` with the 2026-06-30 census, virtual buckets, active examples, and completed-reference separation.
- Refreshed `README.md` in this archive with the same completed-reference decisions.
- Updated `.spw/conventions/planning-ecology.spw` so the planning dispatch points to this sweep and records the current tree posture.
- Projected the bucket taxonomy into `/about/plans/` so public editor navigation mirrors the `.agents` owner map.

## Validation

Run these after the patch:

- `git diff --check`
- targeted `rg` for this archive note, `plan-buckets`, and the completed-reference names

No dependency or runtime JS surface was intentionally changed in this sweep.
