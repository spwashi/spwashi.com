# css-cascade-stratification

**Status 2026-11-06.** Nothing has landed since 2026-10-10: no commit touches `scripts/ts/css-bundle.mts`, the two review scripts, `prepaint-state.js`, `reset/base.css` or `routes/surfaces/play.css`. Landed: Phase 0 (02ce21b5, 332d98bd, 01c34f01) and the Phase 1 review kit (4759a02f). The bundler still strips the order statement (`scripts/ts/css-bundle.mts:45`), so `bundles/core.css` ships none. `npm run audit:layer-flip` on 2026-11-06 lists 348 route rules in 17 of the 21 route bundles: home 70, about 45, rpg-wednesday 42, website 37, play 25. That is down from 366 on 2026-10-25. No route has a same/better/worse row yet. Next: the per-route readings below, home first. Each reading is two loads and one row, and landing Phase 1 is the creator's look in the browser. The ablation's Chrome half still needs a run outside the sandbox.

**Absorbed 2026-10-06:** [css-state-legibility](../archive/css-state-legibility/PLAN.md) · [vertical-rhythm-container-audit](../archive/vertical-rhythm-container-audit/PLAN.md).

Operation: prime. Fixity: experimental. Owner rail: `css-architecture-readability`.

## Public Goal

Make the cascade layer list a care signal. A reader who opens a rule should know from its layer how far the rule reaches, how long its effect lives, and whose hand owns it, and therefore how much reasoning the change deserves. This is the standalone, evidence-gated layer-order migration that `css-architecture-readability` (its File Tree Utility section) and `.spw/reviews/css-architecture-alignment.spw` already leave the door open for. It is the only plan allowed to change the `@layer` order.

Model: `.spw/caches/css-cascade-stratification-2026-09.spw` — six pours, a per-layer promise of reach / cure / hand, and the ledger of `reset/base.css` rules that claim one care level and deserve another.

## The decision this plan waits on

`scripts/ts/css-bundle.mts:45` strips the `@layer …;` statement, so `bundles/core.css` opens layers in first-appearance order, never opens `routes`, and every route bundle lands `routes` above `effects` and `ornament`. Source says `handles > routes`; shipped says `routes > handles`. `.spw/audits/operator-controls-2026-09.spw#findings.layer_order` recorded this and deferred it to a browser review of the routes that lean on the shipped order.

That review is Phase 1 here. No new layer name exists before it lands.

## Phases

**Phase 0 — landed 2026-09-25.** 02ce21b5 moved fourteen reset tokens to `tokens/core.css` and deleted two dead reset values and the roster's duplicate landmark selectors. 332d98bd set play's chip and mode-switch intents to the exact paint its rules apply. Play's direct rules stay until the flip review, because without them its hover rule would paint over a pressed button. 01c34f01 rewrote `npm run perf:layer-ablation` as `scripts/layer-ablation.mjs`, whose splitter `scripts/lib/css-layer-blocks.mjs` round-trips the committed bundle. Not moved, by design: the link block, the software `pre` block and the roster's classes (each would start beating a named rule), and the infix floor stays in reset. Selector-stats stays unwritten until a pass needs it. Record: `.spw/caches/css-cascade-stratification-2026-09.spw#reset_care_ledger`.

**Phase 1 review kit (landed 2026-09-26, 4759a02f).** Nothing to rebuild for an A/B:
1. `npm run audit:layer-flip` lists, per route bundle, the route rules whose subject shares a class with a handles/effects/ornament rule that sets the same property — the rules that win today and would lose. 365 across 19 bundles at landing; 366 on 2026-10-25; 348 across 17 on 2026-11-06, with home 70, about 45, rpg-wednesday 42, website 37 and play 25. `--bundle=<slug> --limit=N` for detail. A shared class is a reason to look, not proof.
2. Open a listed page twice: as is, and with `?spw-layer-order=declared`. `prepaint-state.js` then puts the declared order first in the document and the page cascades as `style-core.css` says. `scripts/tests/css-layer-ablation.test.mjs` pins the string to `EXPECTED_LAYER_ORDER`.
3. On /play/, the intents carry paint but not geometry: sigil `min-height`, `padding`, and flex seating are on the list and will move.
4. `npm run perf:layer-ablation -- <route>` before and after, for the pass.
Record each page as same / better / worse here; worse rows become intent or ownership patches before the bundler emits the statement.

**Phase 1 readings — one route per session, one row each.** Paths: none in `public/`. Each reading appends a row to this plan, and that row is its commit. Gate: none for the reading. A "worse" row becomes an intent or ownership patch before Phase 1.

| route | flagged | paint / geometry / mixed | most-flagged classes |
|---|---|---|---|
| `/` (home) | 70 | 22 / 31 / 17 | `.frame-sigil` 11, `.spw-chip` 7, `[data-spw-textual-role]` 6 |
| `/about/` (10 pages) | 45 | 28 / 12 / 5 | `[data-spw-textual-role]` 5, `.bhm-node-dot` 5 |
| `/play/rpg-wednesday/` (9 pages) | 42 | 11 / 25 / 6 | `.spw-frame` 7, `.frame-sigil` 5, `.spw-chip` 5 |
| `/about/website/` (38 pages) | 37 | 14 / 16 / 7 | `.spw-chip` 10, `.spw-frame` 6 |
| `/play/` | 25 | 7 / 13 / 5 | `.spw-frame` 6, `.frame-sigil` 4; look at focused play-lens buttons too |

Split measured 2026-11-06 from `audit:layer-flip --json`. A finding is *paint* when every flagged property is colour, background, border colour, shadow, outline, opacity, filter or cursor, and *geometry* when none is. Across all 348: 145 paint, 142 geometry, 61 mixed.

Creative proposal for the sensor (no look needed): `audit:layer-flip` could print that split itself, as one plain line per route ("home: 70 would yield — 22 paint, 31 geometry, 17 both"). Paint rows can move to `--*-intent` before the flip, as play's did in 332d98bd, which would leave only geometry rows for the creator's eye. The reading becomes a short list of places where a box might move.

**Phase 1 — one cascade, browser-reviewed.** Emit the order statement from the bundler. Serve the routes the operator-controls audit names (and every route with a route bundle) fresh through CDP, phone and desktop, and approve in the browser before landing. Rollback is the one-line strip. This phase changes zero layer names and is a complete patch on its own.

**Phase 2 — the pours.** Only after Phase 1. New names mean new directories (`expectedLayerForCssPath` in `scripts/ts/css-contracts.mts` binds `public/css/<dir>/` to `layer(<dir>)`), `EXPECTED_LAYER_ORDER` in `scripts/ts/css-contracts.mts:33` and `scripts/ts/css-manifest.mts:12`, the fifteen restating deferred sheets, the four load-symphony experiment sheets, and the prose sites listed in the cache — all in one patch, with the ablation re-run on the page each move leaves behind. Land one pour at a time: `reader` first (governors lose their `!important`), then `substrate`, then `time`.

## Coordination — plans whose material a pour splits

Most owners below were archived between 2026-09-27 and 2026-10-10. For those, the landed contract is what a pour keeps coherent; the live owners are `floating-chrome-stack`, `chrome-navigation-wonder`, `color-motion`, `data-attribute-css-token-refinement` and `css-architecture-readability`.

| pour | file | owners to keep coherent |
|---|---|---|
| substrate / flow / governors | `reset/base.css`, `modes/capture.css` | `vertical-rhythm-container-audit` (archived), `floating-chrome-stack`, `css-instruction#containing_block`, `stylesheet-ecology#capture_rule`, `color-motion` |
| registry / scales / aliases | `tokens/core.css` | `data-attribute-css-token-refinement` (bedrock rule), `palette-semantics-improvements` (archived) and `palette-theme-composability-instrumentability` (archived 2026-09-27; their contract is `site-semantics.spw#palette_theme_composability_contract`), `chrome-navigation-wonder` Phase 3 (dormant), `design-surfaces-discoverability` (archived), `deep-link-feature-discovery` (archived), `settings-theme-packs` (theme families; absorbed by `color-motion` 2026-10-06) |
| states / arcs / pulses / residue | `components/runtime-states.css`, `systems/interaction-progression.css` | `microinteraction-motion-lifecycle` (archived), `interaction-loop-contract` (archived), `compositional-css-electrostatics` (archived), `hook-region-anatomy` (archived); canon `data-spw-attribute-governance#rhythm` |
| handles / routes | `handles/operators/*`, `routes/surfaces/*` | the intent contract is `.spw/conventions/site-semantics.spw#pressed_handle_state_contract` (`css-state-legibility` landed and archived 2026-10-06); hottest files in the tree |
| instruments | `src/styles/entries/debug.css` | `runtime-module-fluency` (archived), `css-architecture-readability` (owner-marker overwrite is documented as expected) |

## Not this

- Not a load or delivery change. `@layer` is cascade geology; `core-css-spend-cut` owns what arrives when.
- Not a rename of public nouns or `data-spw-*` families. Layer names are not attribute values (`semantic-hierarchy#crosswalk.anti_patterns`).
- Not a demotion for recalc speed. `runtime-recalc-cost-2026-09` shows layers are non-additive.
- Not an edit to `AGENTS.md` beyond the one line that spells the order, and only in Phase 2.

## Validation

- Phase 0: `npm run check:css`, `npm run build:css`, `git diff --check`; bundle diff shows moved hunks only.
- Phase 1: `grep -c "^@layer [a-z, ]*;" public/css/bundles/core.css` returns 1; `npm run visual:checks -- --ids=<route stills>` at phone; browser approval recorded here with the route list.
- Phase 2: `npm run check:local`, `npm run plans:index:check`, `npm run spw:integrity`; layer-ablation and selector-stats from `scripts/`, fresh-served, before and after each pour.

## Status

Landed lines for Phase 0 and the review kit are under Phases. The dated notes those lines replace (2026-09-25: the primer, three Phase 0 patches and why play's direct rules stay until the review) are in this file's history and in `.spw/caches/css-cascade-stratification-2026-09.spw#reset_care_ledger.phase_0_2026_09_25`.
