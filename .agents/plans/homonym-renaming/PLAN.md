# Plan: homonym-renaming

**Status 2026-10-10.** No rename has landed. `data-spw-page-tempo="settle"` still names a speed: `public/css/components/signals.css:248` reads it, and `prepaint-state.js` and `region-profiler.js` write it. The one next slice is a `collision` entry for the tempo ladder (`snap|fast|base|deliberate|settle`) in `.spw/conventions/word-sets.spw`, with two candidate speed words. The rename waits on the creator's call on whether a word no reader sees needs a browser review (wonder block in `index.spw`); `ground` waits on spw-metaphysical-language.

**Related:** [shell-model-vocabulary-consolidation](../shell-model-vocabulary-consolidation/PLAN.md). **Absorbed 2026-10-10:** [language-reclustering](../archive/language-reclustering/PLAN.md).

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

Renames land as codemods with compatibility windows: CSS keeps the old value as an alias selector for one deploy cycle; JS writers emit the new value; the census's generated audit records the alias so it is retired deliberately. Reader-facing values gate on browser review per sensation-gates doctrine — two candidate words minimum, felt at the bench, not chosen in a diff. As of 2026-10-10 settings shows tempo only as a multiplier (`settings/index.html:1667`, "1.00×"), not as a tempo word; whether that exempts the tempo rename from the bench is the creator's call.

## Timing and Association

- The target coordinate for a rename is its entry in `.spw/conventions/word-sets.spw` (freeze the coordinate, reproject the lexicon); no cluster patch has to land first. Land the tempo rename **before** the next movement/tempo token work, so those tokens land on the corrected ladder.
- `ground` arbitration blocks on **spw-metaphysical-language** sigil-property study; do not sequence it first.
- The census (`scripts/language-census.mjs`) reruns before and after each rename; homonym spread counts are the before/after evidence.

## Validation

- `grep -r 'tempo="settle"'` returns only the alias shim during the compatibility window, then nothing.
- Census homonym_spread shows `settle` file-count stable or falling (echoes remain; the homonym is gone).
- No rename orphans a ladder neighbor: settings surfaces, signals.css tempo blocks, and prepaint rail allowlist move in the same patch.
- Drift ledger in spw-metaphysical-language carries a dated entry for every verdict above, including the keeps.

## Absorbed 2026-10-10 — language-reclustering

[language-reclustering](../archive/language-reclustering/PLAN.md) declared the attribute and event lexicon in clusters. Its first slice, the timing cluster, never started; what stays owed lives here, anchored on `.spw/conventions/word-sets.spw` rather than a new `clusters` facet.

- **Rule kept.** New vocabulary lands inside a declared coordinate or deliberately founds one, never beside the system. A ladder that wants another value is a signal to split the dimension. Retiring a word is a first-class outcome.
- **Rule kept.** Reclustering never renames, and renaming never reclusters: a word-set entry records a coordinate, and this plan moves the word.
- **Health numbers.** `scripts/language-census.mjs` writes `.spw/audits/language-census.spw` (generated 2026-09-03: 357 attributes full-trace, 823 unregistered). It takes minutes and writes a tracked file, so it runs before and after a rename, not every pass.
- **Event grammar.** `domain:verb` is bus-local and `spw:domain-verb` is broadcast. Settings-changed still has three spellings in `public/js` (`settings:changed` 28, `spw:settings-change` 33, `spw:settings:changed` 24 occurrences); [module-contract-overhaul](../module-contract-overhaul/PLAN.md) Phase 3 owns that consolidation.
