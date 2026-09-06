# Region Attenuation Coverage

## Public Goal

Give every `.spw-frame` region on the public site an honest, read-and-judged seat (`data-spw-region="hook|hub|cluster|path|read|wide"`, or an authored decision that it deliberately carries none) so `--spw-wonder-hold` attenuation in `projection-attenuation.css` reflects real spatial and reading relationships everywhere, not only on the handful of routes that happen to have been touched by hand. Six seats stay six; this plan populates the existing ladder, it does not retune or extend it.

## Primary Contract

- `.spw/conventions/region-component-ecology.spw` — the seat vocabulary (`hook|hub|cluster|path|read|wide`), the `region_vs_region_role` distinction, and the `authored_vs_runtime` caution against inventing a seventh seat.
- `.spw/conventions/projection-attenuation.spw` + `public/css/systems/projection-attenuation.css` — where an authored seat actually spends: `--spw-wonder-hold` (hook 1.15, hub/wide 1, cluster 0.85, path 0.72, read 0.55) composes into `--spw-projected-field`.

## Current State (measured 2026-09-06)

- 816 `.spw-frame` elements across 159 route HTML files (`dist/`, `dist-vite/`, `.spw/_workbench` excluded). 329 (40%) declare a region signal — either `data-spw-region="…"` directly, or one of the two established region-role aliases (`entry-spine` → hook, `reading` → read). 487 (60%) declare none.
- **This is a measurement, not automatically 487 bugs.** `region-component-ecology.spw#authored_vs_runtime` is explicit: the region profiler may annotate any `.spw-frame` as a "receipt," and an untagged frame is not by default wrong. The same file's `region_vs_region_role` facet records a `2026-09-03` fix that went the *other* direction — 12 misapplied `data-spw-region` instances authored with no `.spw-frame` class, most of them redundant once their `data-spw-region-role` companion was checked, later trimmed. This plan's job is per-section judgment, the same discipline as folios below, not a bulk fill.
- Proof of method this session: `design/folios/index.html` — 7 of 8 top-level sections read and tagged (`cluster` for the seed-studies grid, `read` ×5 for reference/prose sections, `path` for the adjacent-routes bridge); `#folios-hero` already carried the correct `entry-spine` region-role alias and was left untouched.
- Worst-coverage routes by missing-frame count (one-off audit, see Wave 0):

  | Route | Missing |
  |---|---|
  | `topics/software/spw/` | 15 |
  | `play/rpg-wednesday/` | 14 |
  | `about/website/` | 13 |
  | `design/` | 12 |
  | `town/` | 10 |
  | `design/palettes/` | 9 |
  | `design/experiments/load-symphony/a/`, `.../b/` | 8 each |
  | `design/experiments/svg/` | 8 |
  | `play/rpg-wednesday/library/` | 8 |
  | `tools/midjourney/` | 8 |
  | `topics/knowledge-bases/` | 8 |
  | `topics/math/calculus/` | 8 |

## Scope

- Add a durable, reporting-only audit for the missing direction. `scripts/spw-region-seat-audit.mjs` already checks one direction (`data-spw-region` authored without `.spw-frame`); it does not check the other (`.spw-frame` authored without `data-spw-region` or an established region-role alias). Add a sibling script, not a rewrite of that file's single-purpose check.
- Work route-family by route-family, in the order of the table above. For every untagged `.spw-frame` in the wave's route(s): read its actual content and role, then either
  1. assign one of the six seats, matching the same reasoning as folios (a coupled kin-set of siblings is `cluster`; prose/reference sections are `read`; a nav bridge to other routes is `path`; an entry/hero is `hook`; a landing/conducting point is `hub`; a two-level flex desk is `wide`), or
  2. record that the frame is deliberately regionless (a leftover/pack-body/component-container seat per `region-component-ecology.spw#seats.leftover`), or
  3. give it a `data-spw-region-role` freeform companion instead of a seat, when the frame wants the salience/channel treatment without seat layout.
- One route (or small, clearly related route family) per wave, validated and committed on its own, exactly like the folios patch.

## Out of Scope (for now)

- A seventh seat value or a new attribute family.
- Bulk or scripted assignment without per-section reading — the 2026-09-03 note in `region-component-ecology.spw` shows this already went wrong once, in the opposite direction.
- Retuning `--spw-wonder-hold` coefficients or any other value in `projection-attenuation.css` — this plan spends the existing ladder, it does not redesign it.
- `data-spw-region-personality`, `-voice`, `-gravity-axis`, or any copy-voice/referentiality work on regions — that is `component-region-personality/PLAN.md`'s territory, which explicitly disclaims this attribute family.
- The region rail, route-discovery UI, or hook-region behavior — `page-region-discoverability/PLAN.md` and `hook-region-anatomy/PLAN.md` own those layers.
- Non-seat spatial attributes (`data-spw-edge-x/y`, `data-spw-gravity`, pack-fill) — `spatial-gravity.spw` and `component-packing.spw` territory.

## Waves

- **Wave 0 — tooling.** Build the coverage-direction audit script and wire an npm script for it (`audit:region-coverage`, alongside the existing `audit:region-seats`). Run it once to produce the canonical per-route missing count; correct the table above if the generated numbers differ from this session's hand-run script.
- **Wave 1 — landed.** `design/folios/index.html`, this session. Reference implementation for the reasoning pattern.
- **Wave 2.** `topics/software/spw/` (15 missing) and `play/rpg-wednesday/` (14 missing) — the two worst offenders.
- **Wave 3.** `about/website/` and `design/` hub pages.
- **Wave 4+.** Remaining routes from the worst-coverage table, then the long tail, lowest-count routes last.

## Risks

| Risk | Mitigation |
|---|---|
| Pattern-matching a seat from the route name instead of reading the section | One route per session; read content before tagging, same discipline as folios |
| "Still untagged" read as inherently wrong, pressuring a bulk fill | Wave 0's audit is reporting-only, not a `check:local` gate; "deliberately regionless" is a valid, recorded outcome per section |
| A concurrent session mid-editing the same route | Check `git status` and recent commits before starting a wave — this tree runs concurrent agent sessions; never `git stash` here |

## Validation Loop

```bash
node scripts/spw-region-seat-audit.mjs        # existing inverse check stays clean
node scripts/spw-region-coverage-audit.mjs    # new (Wave 0): reports missing-region frame counts
npm run component:check
git diff --check
npm run check:local
npm run manifest                              # only if semantic-expression or copy changed alongside
```

## First Concrete Steps

1. Write `scripts/spw-region-coverage-audit.mjs` (sibling to `spw-region-seat-audit.mjs`, same file-listing approach, opposite direction) and an npm script for it.
2. Run it, diff its counts against the table above, and correct this document rather than trust the one-off numbers going forward.
3. Take Wave 2's first route, read every untagged `.spw-frame` in it, assign or explicitly defer each one, validate, stop — one named patch, per `AGENTS.md`.

## Related Plans

- `component-region-personality/PLAN.md` — owns copy voice and referentiality on regions; explicitly disclaims the seat-physics attribute family this plan owns.
- `page-region-discoverability/PLAN.md` — owns the region rail and route-discovery UI, not seat assignment.
- `hook-region-anatomy/PLAN.md` — owns the hook region's own anatomy and behavior, one layer above seat tagging.
- `component-rhythm-variety/PLAN.md` — the mode-switch/lens native-activation work landed alongside this session's folio patch.
