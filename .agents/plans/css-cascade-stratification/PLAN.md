# css-cascade-stratification

Operation: prime. Fixity: experimental. Owner rail: `css-architecture-readability`.

## Public Goal

Make the cascade layer list a care signal. A reader who opens a rule should know from its layer how far the rule reaches, how long its effect lives, and whose hand owns it, and therefore how much reasoning the change deserves. This is the standalone, evidence-gated layer-order migration that `css-architecture-readability` (line 67) and `.spw/reviews/css-architecture-alignment.spw` already leave the door open for. It is the only plan allowed to change the `@layer` order.

Model: `.spw/caches/css-cascade-stratification-2026-09.spw` — six pours, a per-layer promise of reach / cure / hand, and the ledger of `reset/base.css` rules that claim one care level and deserve another.

## The decision this plan waits on

`scripts/ts/css-bundle.mts:45` strips the `@layer …;` statement, so `bundles/core.css` opens layers in first-appearance order, never opens `routes`, and every route bundle lands `routes` above `effects` and `ornament`. Source says `handles > routes`; shipped says `routes > handles`. `.spw/audits/operator-controls-2026-09.spw#findings.layer_order` recorded this and deferred it to a browser review of the routes that lean on the shipped order.

That review is Phase 1 here. No new layer name exists before it lands.

## Phases

**Phase 0 — pre-patches that need no order change.** Each is one patch on the readability rail, permitted today by `css-instruction.spw#import_manifest.layer_rule`.

- Re-home the misfiled `base.css` clusters into their existing owners: `:root` flow / focus / selection tokens → `tokens/`; `.spw-panel a`, the class roster `min-width: 0`, and `body[data-spw-surface="software"] pre` → `components/` and `routes/`; the infix `border-width: 0` patch → `handles/`. Hunk-level staging; `base.css` had three commits in the last fourteen days.
- Promote the scratch `layer-ablation` and `selector-stats` probes named in `.spw/audits/runtime-recalc-cost-2026-09.spw` to `scripts/`, beside `build-performance.mjs`, so Phase 1 and 2 have a fresh-served before/after.
- Finish the `css-state-legibility` follow-up: `routes/surfaces/play.css` §6/§9 re-describe hover/focus/pressed route-locally and are dead under the declared order. The more route paint moves to `--*-intent`, the less Phase 1 can break.

**Phase 1 — one cascade, browser-reviewed.** Emit the order statement from the bundler. Serve the routes the operator-controls audit names (and every route with a route bundle) fresh through CDP, phone and desktop, and approve in the browser before landing. Rollback is the one-line strip. This phase changes zero layer names and is a complete patch on its own.

**Phase 2 — the pours.** Only after Phase 1. New names mean new directories (`css-contracts.mts:456` binds `public/css/<dir>/` to `layer(<dir>)`), `EXPECTED_LAYER_ORDER` in `css-contracts.mts:33` and `css-manifest.mjs:9`, the fifteen restating deferred sheets, the four load-symphony experiment sheets, and the prose sites listed in the cache — all in one patch, with the ablation re-run on the page each move leaves behind. Land one pour at a time: `reader` first (governors lose their `!important`), then `substrate`, then `time`.

## Coordination — plans whose material a pour splits

| pour | file | owners to keep coherent |
|---|---|---|
| substrate / flow / governors | `reset/base.css`, `modes/capture.css` | `vertical-rhythm-container-audit`, `floating-chrome-stack`, `css-instruction#containing_block`, `stylesheet-ecology#capture_rule`, `color-motion` |
| registry / scales / aliases | `tokens/core.css` | `data-attribute-css-token-refinement` (bedrock rule), `palette-semantics-improvements`, `palette-theme-composability-instrumentability`, `chrome-navigation-wonder` Phase 3, `design-surfaces-discoverability`, `deep-link-feature-discovery`, `theming-icon-packs-public-versioning` |
| states / arcs / pulses / residue | `components/runtime-states.css`, `systems/interaction-progression.css` | `microinteraction-motion-lifecycle`, `interaction-loop-contract`, `compositional-css-electrostatics`, `hook-region-anatomy`; canon `data-spw-attribute-governance#rhythm` |
| handles / routes | `handles/operators/*`, `routes/surfaces/*` | `css-state-legibility` owns the intent contract; hottest files in the tree |
| instruments | `src/styles/entries/debug.css` | `runtime-module-fluency`, `css-architecture-readability` (owner-marker overwrite is documented as expected) |

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

- 2026-09-25: primed. Cache written. Six boundary plans and four conventions now cite this plan as the door instead of a wall. Nothing in `public/css` changed.
