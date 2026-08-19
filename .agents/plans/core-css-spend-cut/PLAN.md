# core-css-spend-cut

## Public Goal
First paint ships structure. Wonder, grain, cinematic, and ornament arrive after interactive so core CSS can shrink. Late restyle may only add atmosphere — not hide, move, or resize what the visitor already read.

## Plan refinement
- **Tone:** Mechanic, not showrunner. Name what arrives, when, and which combinators the sheet is allowed to speak.
- **Accuracy:** First cut landed 2026-08-18. Core **1779 → 1623 KiB**. Tokens stay in `flourish-defaults.css`. Grain, cinematic, wonder, and ornament idle-load through `flourish-pack.css`. Inspect overlays left `runtime-states.css`.
- **Direction:** One more additive sheet out of core — `metaphysical-paper.css` — only if first paint still holds without it. Do not invent a load metaphor.
- **Inspiration:** An observant reader should hear kinship in the selectors (`>`, `+`, `:has()`), and a visitor should never watch the page shove what they already read.
- **Alignment:** Owner rail `css-architecture-readability`. Conventions: `css-instruction` (`cascade_vs_delivery`, `combinator_literature`, `late_restyle`), `stylesheet-ecology`. Sibling payload: `public-entrance-runtime-payload`. Noun grammar: `semantic-classname-layers`.

## Cascade is not delivery
`@layer` is cascade geology: which rule wins. It is not a load optimizer.

- Reordering `@layer` does not shrink `bundles/core.css`.
- Putting a file in a later layer does not delay its download.
- A late `<link>` that forgets to redeclare the layer list dumps unlayered rules on top of the stack.

Delivery is what file is requested, when, and how it is cached (`style-core`, route/behavior bundles, `deferred-styles.js`). Each deferred sheet stays in the same layer it already occupied.

## Readable CSS
The literature is the selectors: `>` a child, `+` the next sibling, `:has()` a parent that knows what it holds. Banner comments are not a substitute.

## Landed
- `public/css/tokens/flourish-defaults.css` — always-on `:root` / `@property` names
- `public/css/effects/flourish-pack.css` — idle envelope; restates the layer list
- `public/css/components/runtime-inspect.css` — opt-in overlays, still `layer(components)`
- `deferred-styles.js` `ensureFlourishStyles` / `ensureInspectStyles`; `html[data-spw-flourish="ready"]` marks arrival
- `DEFERRED_RUNTIME_CSS` lists the pack and its members

## Remaining
- `effects/metaphysical-paper.css` is the next eviction candidate if first paint stays complete.
- Developmental-climate and page-anatomy stay in core until a first-paint probe says they are atmosphere.
- Combinator literature is practice when touching ornament or wonder, not a new plan.

## Non-Goals & Boundaries
- Do not reorder `@layer`.
- Do not move tokens/syntax/shell/frames/cards.
- Inspect *suppressors* stay in core so public routes stay quiet.
- Do not hang a show metaphor on the load schedule.

## Research bridges
- `.spw/conventions/css-instruction.spw#cascade_vs_delivery`
- `.spw/conventions/stylesheet-ecology.spw#progressive_enhancement`
- `.spw/audits/progressive-css-module-scopes-2026-07`
- `.spw/caches/arrival-perceptibility-2026-08.spw` (schedule ≠ perceptibility)

## Seams & Minimal Touch Files
- `public/css/tokens/flourish-defaults.css`
- `public/css/effects/flourish-pack.css`
- `public/css/components/runtime-inspect.css`
- `style-core.css`, `deferred-styles.js`, `site.js`

## Validation Steps
1. `npm run build:css` — core at or under the soft budget
2. `node --check` on edited JS
3. Confirm flourish-pack begins with the same `@layer` list as `style-core.css`
4. `npm run css:payload`
