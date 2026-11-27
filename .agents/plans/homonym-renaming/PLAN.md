# Plan: homonym-renaming

**Status 2026-11-26.** No CSS/JS rename has landed yet. On 2026-11-26 the cross-host audit ([ecosystem-planes-pivots-ontologies](../../../.spw/audits/ecosystem-planes-pivots-ontologies-2026-11.spw)) and workbench `charge-valence-brace-bridge.spw` added two major ledger entries beside `settle`, `prime`, `ground`, `phase`, and `hydrate`: **`charge` / `discharge`** (five-way collision across grain aperture, d3 `forces.charge`, valence pentad, `ChargePacket`, and `charge-field.js`) and **`frame`** (four senses across `.spw-frame`, `#>` frame sigil, `[ ]` `FrameNode`, and camera framing). `settle` as a speed remains one ladder (`snap|fast|deliberate|settle`, `base` the default) at three altitudes: the page (`data-spw-page-tempo`, `components/signals.css:248`), the frame (`.spw-frame[data-spw-tempo]`, `grammar/syntax.css:1114`), and the sigil region (`data-spw-sigil-region-tempo`, `handles/operators/geometry-projection.css:214`), with `?tempo=settle` on `prepaint-state.js`. Slices 1 and 2 (`word-sets.spw` entries for `tempo`, `arc_rest`, `charge_disambiguation`, and `interaction_ladder`) wait on nothing and land in the accompanying Spw semantics batch; the CSS/JS rename (Slice 3) waits on `#>wonder_homonym_renaming_unseen_word`, and `ground` on `spw-metaphysical-language`.

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
| `settle` — the slow end of the tempo ladder | page (`signals.css:248`, written by `prepaint-state.js` from `?tempo=` and by `region-profiler.js`), frame (`syntax.css:1114`, `region-profiler.js:437`), sigil region (`geometry-projection.css:214`, `operator-interactions.js:246`) | **True homonym**, echoed at three altitudes — names a speed, shares selector space with arrival vocabulary | Rename at all three altitudes in one patch, with `?tempo=settle` kept as an alias; candidates `patient`, `gradual`, `lingering` — sensation gate picks (it is reader-tunable vocabulary) |
| `settle` — module lifecycle stage `settled` | module-catalog | **Echo** (arc end at module altitude) | Keep |
| `prime` — charge phase / region `primed` / spell prime | interaction + region + cauldron | **Echo** — all mean "readied, potential loaded" | Keep; ledger the shared shape |
| `prime` — plan operation `prime`; prime beats 1/5/9/13 | .spw layer / pulse-beat | **Distinct altitude, no shared selector space** | Keep; note in ledger (beats are number-theoretic "prime" — a pun, not a shape claim; document as easter-egg register) |
| `ground` — discharge kind / persistent-memory state / `$` substrate | charge-field + governance + operator canon | **Disputed** — three families claim it; electrical grounding and memory grounding may be one shape (durable contact); substrate is operator territory | Arbitrate via sigil-physics in spw-metaphysical-language before any rename; no unilateral move |
| `phase` — hydration pass vs interaction phase vs ecology phase vs transition phase | 47 files | **Echo with weak namespacing** — all mean "position in a progression," always attribute-namespaced | Keep; require the namespace (`*-phase` never bare) and register the shared shape |
| `hydrate` — `__SPW_SITE__.parser.hydrate(el)` returns `readSpwHydration(el)`, a read | `site.js`, `semantic/expression-query.js` | **Homonym prevented 2026-11-06** — a draft in brace-semantics proposed `parser.hydrate(el, spw)` as a write | Keep `hydrate` for the read; the write takes its own verb ([brace-semantics](../brace-semantics/PLAN.md) section C, Slice 3.5) |
| `charge` / `discharge` — grain aperture vs d3 `forces.charge` vs valence pentad vs `ChargePacket` vs `charge-field.js` phase | `factshift.center`, `spwashi.com` (`charge-field.js`, `brace-gestures.js`, `haptics.js`, `brace-pivots.js`), workbench `charge-valence-brace-bridge.spw` | **Five-way collision (2026-11-26)** — distinct mechanical shapes sharing one word across hosts | Name grain open/close disclosure **aperture** (`open <-> quiet <-> close`); keep `forces.charge` on repulsion; keep `boon`/`bane`/`bone`/`bonk`/`honk` as valence; consolidate `spwashi.com`'s three `data-spw-charge` writers; register `^"charge_disambiguation"` in `word-sets.spw` |
| `frame` — `.spw-frame` DOM section vs `#>` frame sigil vs `[ ]` `FrameNode` vs camera framing | HTML, parser AST, `factshift.center` | **Four-sense altitude split (2026-11-26)** — mostly distinct altitudes, collides when docs mix parser `FrameNode` (`[ ]`) with `#>` frame | Keep `.spw-frame` (DOM) and `#>` (addressable frame); call `[ ]` **mode** in public surfaces and note `FrameNode` as parser AST only ([brace-semantics](../brace-semantics/PLAN.md) §A) |

Net expected CSS/JS renames: **one** (the tempo value, at its three altitudes), plus preventing the fifth `charge` sense on `factshift.center` and whatever `ground` arbitration rules. Restraint is the point — the geometry review exists to *prevent* rename churn, not to generate it.

## Mechanics

Renames land as codemods with compatibility windows: CSS keeps the old value as an alias selector for one deploy cycle; JS writers emit the new value; the census's generated audit records the alias so it is retired deliberately. Reader-facing values gate on browser review per sensation-gates doctrine — two candidate words minimum, felt at the bench, not chosen in a diff. Settings shows tempo only as a multiplier (`data-spw-site-rhythm-readout="tempo"` in `settings/index.html`, "1.00×"), not as a tempo word; the word does reach a copy editor through `?tempo=`. Whether that exempts the tempo rename from the bench is the creator's call.

## Slices

1. **Collision entry.** `.spw/conventions/word-sets.spw` gains `^"tempo"`: coordinate "how fast a surface arrives", words `snap, fast, base, deliberate, settle`, owners at the three altitudes, `status = "collision"`, and two candidate speed words as `proposal`. Waits on nothing. Verified by the file parsing and `rg -n '\^"tempo"' .spw/conventions/word-sets.spw`.
2. **Echo entries.** The keeps in the ledger (`settle` as arc end, `prime`, `phase`) each get a word-set entry with `status = "in use"`, so the census can tell an echo from a collision. Waits on nothing. Verified the same way.
3. **The rename.** All three ladders, their writers, the `?tempo=` rail (old word kept as an alias for one deploy) and the settings readout move in one patch, before the next movement or tempo token work. Waits on `#>wonder_homonym_renaming_unseen_word`, and on the bench if the answer is a browser review. Verified below.
4. **`ground`.** Arbitrated in [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md)'s drift ledger (Workstream B), with the creator's sign-off; not sequenced first.

A proposal for the candidates: one speed word from the axis the ladder already lives on. Music names its slow end (`largo`, `lento`), which keeps `settle` free for rest and reads as a tempo to anyone who has read a score. It sits beside `patient`, `gradual` and `lingering` as a fourth candidate for the bench, not a choice.

The census (`scripts/language-census.mjs`, `npm run census`) reruns before and after the rename; homonym spread counts are the before/after evidence.

## Validation

- `rg -n 'tempo[a-z-]*~?="settle"' public --glob '!**/bundles/**'` (four selectors today) and the `?tempo=` allowlist in `prepaint-state.js` show only the alias shim during the compatibility window, then nothing.
- Census homonym_spread shows `settle` file-count stable or falling (echoes remain; the homonym is gone).
- No rename orphans a ladder neighbor: the three ladders (`signals.css`, `syntax.css`, `geometry-projection.css`), the prepaint rail allowlist and the settings readout move in the same patch.
- Drift ledger in spw-metaphysical-language carries a dated entry for every verdict above, including the keeps.

## Absorbed 2026-10-10 — language-reclustering

[language-reclustering](../archive/language-reclustering/PLAN.md) declared the attribute and event lexicon in clusters. Its first slice, the timing cluster, never started; what stays owed lives here, anchored on `.spw/conventions/word-sets.spw` rather than a new `clusters` facet.

- **Rule kept.** New vocabulary lands inside a declared coordinate or deliberately founds one, never beside the system. A ladder that wants another value is a signal to split the dimension. Retiring a word is a first-class outcome.
- **Rule kept.** Reclustering never renames, and renaming never reclusters: a word-set entry records a coordinate, and this plan moves the word.
- **Health numbers.** `scripts/language-census.mjs` writes `.spw/audits/language-census.spw` (generated 2026-09-03: 357 attributes full-trace, 823 unregistered). It takes minutes and writes a tracked file, so it runs before and after a rename, not every pass.
- **Event grammar.** `domain:verb` is bus-local and `spw:domain-verb` is broadcast. Settings-changed still has three spellings in `public/js` (`settings:changed` 32, `spw:settings-change` 33, `spw:settings:changed` 24 occurrences, 2026-11-06); [module-contract-overhaul](../module-contract-overhaul/PLAN.md) Phase 3 owns that consolidation.
