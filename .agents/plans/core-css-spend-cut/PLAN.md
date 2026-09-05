# core-css-spend-cut

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

Delivery is what file is requested, when, and how it is cached (`style-core`, route/behavior bundles, `deferred-styles.js`). Each deferred sheet stays in the same layer it already occupied. A `data-spw-copy-unit` selects prose collectibles; it is not a delivery key and must not gate `material.css` or a behavior bundle. Pack graphs stay on `body[data-spw-features]`. See `.spw/caches/copy-hypermedia-key-2026-09.spw#hk-005`.

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

## Remaining
- Split route-local enhancement families further if the website route budget needs a hard ceiling; do not move their grid geometry into an idle sheet.
- Page-anatomy stays in core until a first-paint probe says it is atmosphere.
- Combinator literature is practice when touching ornament or wonder, not a new plan.

## Load-literate tolerance
The 1638 KiB core line is a **soft** budget (`--strict-budget` to fail); current core is under that line after climate/enrichment left. Named first-paint PE — `@property` interpolation, reading-groove tokens, no-JS section-handle focus / scroll-timeline, CSS `:has()` operator kinship — may sit over that line. An audience that already understands how assets load can live with the warning. Do not strip those names to go green. Still fail a late restyle that hides, moves, or resizes what they already read.

## Non-Goals & Boundaries
- Do not reorder `@layer`.
- Do not move tokens/syntax/shell/frames/cards.
- Inspect *suppressors* stay in core so public routes stay quiet.
- Do not hang a show metaphor on the load schedule.
- Do not treat a soft core overage as a blocker when the extra is PE substrate.

## Research bridges
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
