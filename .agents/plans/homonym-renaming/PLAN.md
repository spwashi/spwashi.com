# Plan: homonym-renaming

Resolve the load-bearing homonyms — `settle` (52 files, six meanings), `prime`, `ground`, `phase` — by semantic geometry: rename only true homonyms (different meaning-shape sharing selector space), keep fractal echoes (same shape at different altitudes), and route disputed assignments through the spw-metaphysical-language drift ledger.

## Public Goal

Every load-bearing word means one shape. A reader who sees `settle` anywhere in the codebase can trust it means "approaching/at rest at the end of an arc" — at page, region, or component altitude — and never "a speed," "a plan operation," or an unrelated animation. Renames are few, arbitrated, and land with compatibility aliases; the metaphor families keep their expressive power because their geometry stays clean.

## Semantic Geometry

Words live in family coordinate frames, and renames must respect three geometric properties:

1. **Axis membership**: a word names a position on its family's axis (electricity: potential→discharge; music: slow→fast; weather: energetic→at-rest). A rename must stay on the *same axis* — the `tempo="settle"` fix needs a speed word, not another rest word borrowed from a different family.
2. **Neighbor preservation**: words that co-occur in selectors, contracts, or ladders are neighbors; a rename must not orphan its neighbors (`snap|fast|deliberate|X` must still read as one ladder).
3. **Fractal echo is not homonymy**: the same word at different altitudes with the same shape (`data-spw-page-settling` / region settling / `data-spw-box-settle-phase`) is the design working as intended per the governance `fractal_rule`. Only *shape conflicts in shared selector space* qualify for renaming.

## The Ledger (initial entries)

| Word | Occurrences | Verdict | Action |
|---|---|---|---|
| `settle` — arc end-state, settling window, `--ease-settle`, `spw-hydration-settle` animation | page/region/component | **Echo** — all mean "reaching rest" | Keep; register as one cluster |
| `settle` — `data-spw-page-tempo="settle"` tempo value | signals.css tempo ladder | **True homonym** — names a speed, shares selector space with arrival vocabulary | Rename to a speed word; candidates `patient`, `gradual`, `lingering` — sensation gate picks (it is reader-tunable vocabulary) |
| `settle` — module lifecycle stage `settled` | module-catalog | **Echo** (arc end at module altitude) | Keep |
| `prime` — charge phase / region `primed` / spell prime | interaction + region + cauldron | **Echo** — all mean "readied, potential loaded" | Keep; ledger the shared shape |
| `prime` — plan operation `prime`; prime beats 1/5/9/13 | .spw layer / pulse-beat | **Distinct altitude, no shared selector space** | Keep; note in ledger (beats are number-theoretic "prime" — a pun, not a shape claim; document as easter-egg register) |
| `ground` — discharge kind / persistent-memory state / `$` substrate | charge-field + governance + operator canon | **Disputed** — three families claim it; electrical grounding and memory grounding may be one shape (durable contact); substrate is operator territory | Arbitrate via sigil-physics in spw-metaphysical-language before any rename; no unilateral move |
| `phase` — hydration pass vs interaction phase vs ecology phase vs transition phase | 47 files | **Echo with weak namespacing** — all mean "position in a progression," always attribute-namespaced | Keep; require the namespace (`*-phase` never bare) and register the shared shape |

Net expected renames: **one** (the tempo value), plus whatever the `ground` arbitration rules. Restraint is the point — the geometry review exists to *prevent* rename churn, not to generate it.

## Mechanics

Renames land as codemods with compatibility windows: CSS keeps the old value as an alias selector for one deploy cycle; JS writers emit the new value; the census's generated audit records the alias so it is retired deliberately. Reader-facing values (tempo names appear in settings surfaces) gate on browser review per sensation-gates doctrine — two candidate words minimum, felt at the bench, not chosen in a diff.

## Timing and Association

- **After** the language-reclustering plan's first patch (clusters give renames their target coordinates) and **before** the next symphonic-loading implementation slice (movement/tempo tokens should land on the corrected ladder).
- `ground` arbitration blocks on **spw-metaphysical-language** sigil-property study; do not sequence it first.
- The census (`scripts/language-census.mjs`) reruns before and after each rename; homonym spread counts are the before/after evidence.

## Validation

- `grep -r 'tempo="settle"'` returns only the alias shim during the compatibility window, then nothing.
- Census homonym_spread shows `settle` file-count stable or falling (echoes remain; the homonym is gone).
- No rename orphans a ladder neighbor: settings surfaces, signals.css tempo blocks, and prepaint rail allowlist move in the same patch.
- Drift ledger in spw-metaphysical-language carries a dated entry for every verdict above, including the keeps.
