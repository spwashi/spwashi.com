# core-css-spend-cut

**Status 2026-11-13.** `expression-resonance.css` (~13.9 KiB) and `surfaces/learnability-ledger.css` (~4.2 KiB, 100% `IDLE`-mounted) moved from `style-core.css` into `effects/flourish-pack.css` (`layer(systems)`), with `[data-spw-feature="join-specimens"]` / `[data-spw-feature="theme-chips"]` layout rules kept synchronous in `components/semantic-resonance.css`. Committed `public/css/bundles/core.css` dropped **1,728.4 → 1,710.9 KiB** (101 sheets, 1,291 KiB delivered / 195 KiB gzip; `npm run css:payload`). Remaining candidates (`legibility-lens.css`, `spell-breadcrumbs.css`, `tuning.css`, `spw-key-events.css`, `site-search.css`) stay in core until probed.

## Public Goal
First paint ships structure. Wonder, grain, cinematic, and ornament arrive after interactive so core CSS can shrink. Late restyle may only add atmosphere — not hide, move, or resize what the visitor already read.

## Plan refinement
- **Tone:** Mechanic, not showrunner. Name what arrives, when, and which combinators the sheet is allowed to speak.
- **Accuracy:** First cut landed 2026-08-18. The 2026-09-03 lifecycle pass reduced current core **1702 → ~1630 KiB**: atmosphere moved to the idle flourish envelope, route-only enhancement grids moved to their route bundles, dormant swipe rules were removed, and runtime-owned effects now load with their modules. Theme-resonance is not core — the cauldron asks for it when a gathering actually has kin. Tokens stay in `flourish-defaults.css`; inspect overlays remain deferred separately.
- **Direction:** Keep the core boundary at first-paint structure. Split any mixed sheet before moving it; route geometry stays synchronous, while additive paint may follow its runtime or the idle flourish pack.
- **Inspiration:** An observant reader should hear kinship in the selectors (`>`, `+`, `:has()`), and a visitor should never watch the page shove what they already read.
- **Alignment:** Owner rail `css-architecture-readability`. Conventions: `css-instruction` (`cascade_vs_delivery`, `combinator_literature`, `late_restyle`), `stylesheet-ecology`. Sibling payload: `public-entrance-runtime-payload`. Noun grammar: `semantic-classname-layers`.

## Cascade is not delivery
`@layer` is cascade geology: which rule wins. It is not a load optimizer.

- Reordering `@layer` does not shrink `bundles/core.css`.
- Putting a file in a later layer does not delay its download.
- A late `<link>` that forgets to redeclare the layer list dumps unlayered rules on top of the stack.

Delivery is what file is requested, when, and how it is cached (`style-core`, route/behavior bundles, `deferred-styles.js`). A sheet for other origins is `.spw/caches/portable-css-2026-09.spw`. It must not grow `bundles/core.css`. Each deferred sheet stays in the same layer it already occupied. A `data-spw-copy-unit` selects prose collectibles; it is not a delivery key and must not gate `material.css` or a behavior bundle. Pack graphs stay on `body[data-spw-features]`. See `.spw/caches/copy-hypermedia-key-2026-09.spw#hk-005`.

## Readable CSS
The literature is the selectors: `>` a child, `+` the next sibling, `:has()` a parent that knows what it holds. Banner comments are not a substitute.

## Landed
- `public/css/tokens/flourish-defaults.css` — always-on `:root` / `@property` names
- `public/css/effects/flourish-pack.css` — idle envelope; restates the layer list
- `public/css/components/runtime-inspect.css` — opt-in overlays, still `layer(components)`
- `deferred-styles.js` `ensureFlourishStyles` / `ensureInspectStyles`; `html[data-spw-flourish="ready"]` marks arrival
- `css-contracts.mts` derives deferred ownership from literal runtime registrations and follows pack imports recursively; duplicate IDs, missing files, layer drift, and core/deferred overlap fail validation
- direct deferred sheets restate the canonical layer order and wrap declarations in their ownership layer; the CSS contract rejects unlayered late rules
- Holiday / seasonal tropes (`ornament/holiday-tropes.css`) and the papergami plate (`effects/paper-motif-plate.css`, image-set URLs) idle-load with the flourish pack. Core `systems/paper-motif.css` keeps family → tangibility/viscosity/coherence only — no raster URLs in first paint. Theatrical timing stays behind `enhancement-level=rich`.
- `effects/metaphysical-paper.css` and feature-gated `effects/circuit-anatomy.css` now arrive in the idle flourish envelope
- `handles/living-motion-labels.css` keeps flow-bearing labels in core while `effects/living-motions.css` idles
- `effects/enhancements.css` follows the website, topics, and RPG route bundles
- electromagnetic containers, relational state, and layout-assumption corrections load with their runtime owners
- opt-in narrative token and drawer treatment loads with visible-stage narrative instrumentation
- unmounted swipe ecology and its four forceful overrides were removed from `effects/enrichment.css`
- theme-resonance paint loads with the cauldron when clustered kin exist; the QA bench keeps a static specimen
- developmental-climate weather and enrichment inspection paint load with the climate runtime; coarse-pointer press stays in gesture-anatomy (first paint)
- electromagnetic containers mount only on authored `[data-container-type]`; CSS owns the field, JS steps charge
- 2026-09-22 delivery form: the deploy build strips comments and indentation from `dist/public/css` (`scripts/ts/css-delivery.mts`), keeping file provenance lines. Core ships ~1273 KiB / ~191 KiB gzip against 1679 KiB committed; `npm run css:payload` prints both. The soft budget still measures the committed bundle — do not cut prose from sources to meet it.
- 2026-10-25 ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S6): the creator, ecosystem and systems offer pages built three byte-identical route bundles (16,331 B each) from `routes/surfaces/services.css` alone. They are one, `services-surface`, with three entries in `ROUTE_SURFACE_ALIASES`; a reader moving among the three downloads the sheet once. `services-care` adds the intake and keeps its own.

## Remaining

Next slices, one session and one commit each:

1. **Per-sheet share in `css:payload`** (ungated). *Landed 2026-11-12.* The reader is `scripts/lib/css-sheet-shares.mjs`. Folder totals print by default, `--sheets` lists every sheet, and `--json` carries all 103 rows under `coreSheets`. The sum of the rows is true by construction, so the report's own check is a different one: the bundle's sheets against `style-core.css`'s imports, in order, which says STALE BUNDLE when an import was added and not built. The creative proposal below landed with it: a sheet that shares a catalog module's id carries that module's `when`, and eleven print as arriving after first paint. `page-anatomy` and `spw-key-events` are among them and mount `visible`, so a name match is a lead and the probe still decides. As first written: `scripts/css-payload-report.mjs` reads the provenance lines inside `public/css/bundles/core.css` and prints each sheet's bytes and share, folded by layer folder, with `--json` carrying the same rows. Verify: the 103 rows sum to the bundle within the provenance lines' own bytes, and the folder totals match the 2026-11-05 reading below.
2. **One candidate, probed** (sensor-gated; one sheet per session). Serve the page fresh through CDP Fetch with the sheet ablated and with it present (the `perf:layer-ablation` method, run outside the sandbox), then compare first-paint geometry and layout shift. A sheet moves to runtime-coupled or idle delivery only if nothing a reader has already read moves. Each move keeps its layer, and the bundles are rebuilt in the same commit. Candidates, measured 2026-11-05, with what the tree says about each:
   1. `public/css/systems/legibility-lens.css` (25.2 KiB). Diagnostic and inspect lens rules. `prepaint-state.js` writes `html[data-spw-legible]` before first paint, so a reader's saved lens paints on load. Split the lens a reader chose from inspect-only rules; do not defer the whole sheet.
   2. `public/css/handles/operators/spell-breadcrumbs.css` (24.0 KiB). The spell bar, mounted from `public/js/runtime/experiential/experiential.js` through `breadcrumb-spell.js`. It is a candidate only if the shell reserves the bar's box at first paint.
   3. `public/css/systems/surfaces/tuning.css` (17.4 KiB). Tuning discovery and slider chrome; its catalog module `tuning-discovery` mounts at `IDLE`.
   4. `public/css/systems/expression-resonance.css` (13.9 KiB). The catalog's `expression-resonance` mounts at `IDLE` and declares only `flourish:`, `residue:` and `measure:` updates. This is the likeliest to be atmosphere.
   5. `public/css/systems/spw-key-events.css` (13.6 KiB). The keyboard chord HUD; `spw-key-events` mounts `VISIBLE` on `html`.
- The website route bundle is 143,360 B, exactly its 140 KiB soft budget (`CSS_BUNDLE_SOFT_BUDGETS.route`). Whether it gets a hard ceiling is `index.spw#wonder_core_css_spend_cut_website_ceiling`. Split route-local enhancement families further only if it does, and never move their grid geometry into an idle sheet.
- Page-anatomy stays in core until a first-paint probe says it is atmosphere.
- Combinator literature is practice when touching ornament or wonder, not a new plan.

Creative proposal for slice 1 (tooling; no look). The candidates could name themselves. The catalog in `public/js/runtime/catalog/enhancement.js` already says when each module mounts. If `css:payload` joined a sheet to the module whose id it shares (`expression-resonance`, `spw-key-events`), each row could carry that `when`. A core sheet whose only owner mounts at `IDLE` would then print as "arrives idle, ships at first paint", and the next cut becomes a line the report writes rather than a hunt.

The 2026-11-12 layer totals (`npm run css:payload`): `components` 480.2 KiB, `systems` 378.5, `shell` 279.5, `handles` 249.8, `tokens` 135.7, `grammar` 89.4, `typography` 39.5, `effects` 27.1, `ornament` 18.9, `modes` 12.8, `reset` 12.3. The growth since the earlier reading is in `components`, `systems` and `grammar`.

The 2026-11-05 layer totals across the 103 sheets: `components` 475.6 KiB, `systems` 377.4, `shell` 279.5, `handles` 249.5, `tokens` 135.7, `grammar` 88.5, `typography` 39.5, `effects` 26.6, `ornament` 18.9, `modes` 12.8, `reset` 12.3.

## Load-literate tolerance
The core line is a **soft** budget of 1.7 MiB, about 1741 KiB (`CSS_BUNDLE_SOFT_BUDGETS.core`, `scripts/ts/css-manifest.mts:574`; `--strict-budget` to fail). Committed core was 1720 KiB on 2026-10-10, under that line but over the 1638 KiB line this plan used before 7148e43c. Named first-paint PE — `@property` interpolation, reading-groove tokens, no-JS section-handle focus / scroll-timeline, CSS `:has()` operator kinship — may sit over that line. An audience that already understands how assets load can live with the warning. Do not strip those names to go green. Still fail a late restyle that hides, moves, or resizes what they already read.

## Non-Goals & Boundaries
- Do not reorder `@layer` here. The one plan that may is `css-cascade-stratification`; its Phase 1 (bundle emits the order statement) changes cascade, not delivery.
- Do not move tokens/syntax/shell/frames/cards.
- Inspect *suppressors* stay in core so public routes stay quiet.
- Do not hang a show metaphor on the load schedule.
- Do not treat a soft core overage as a blocker when the extra is PE substrate.

## Research bridges
- Evidence 2026-09-17: on the about route at pocket, every full style recalculation forced from script costs ~300ms against the current core bundle (devtools.timeline trace; `runtime-bootstrap-performance/PLAN.md` Phase 3 data). The runtime now halves how often it forces one. The per-pass cost belongs to `runtime-bootstrap-performance`, not to this plan: the 2026-09-19 section below shows that layers are non-additive and that selector matching is about 5% of a pass, so cutting bytes from core buys download and parse time, not a cheaper recalc.
- `.spw/conventions/css-instruction.spw#cascade_vs_delivery`
- `.spw/conventions/stylesheet-ecology.spw#progressive_enhancement`
- `.spw/audits/progressive-css-module-scopes-2026-07`
- `.spw/caches/arrival-perceptibility-2026-08.spw` (schedule ≠ perceptibility)

## Seams & Minimal Touch Files
- `public/css/tokens/flourish-defaults.css`
- `public/css/effects/flourish-pack.css`
- `public/css/components/runtime-inspect.css`
- `style-core.css`, `deferred-styles.js`, `css-contracts.mts`, `site.js`

## Validation Steps
1. `npm run build:css` — note the soft warning; fail only with `--strict-budget` or if late restyle shoves first paint
2. `node --check` on edited JS
3. Confirm flourish-pack begins with the same `@layer` list as `style-core.css`
4. `npm run css:payload`

## Selector cost measured — 2026-09-19

Chrome's SelectorStats on `/about/` at phone: 2,563 selectors, 6.7M match attempts over 17 boot passes, 1.27s of matching inside 24.1s of style time — five percent. Multi-argument `:is()`/`:where()` in a rightmost compound do land in the universal bucket (4,783 attempts each, every element every pass) and it still does not matter. A per-layer ablation served fresh through CDP Fetch found the layers non-additive: `only:<layer>` pages cost 12–55ms per full pass, all layers 137ms, and removing `components` raised the pass to 279–333ms because it carries the containment that makes the rest cheap. Do not demote a layer for pass speed without measuring the page it leaves behind, fresh. Full record: `.spw/audits/runtime-recalc-cost-2026-09.spw`.
