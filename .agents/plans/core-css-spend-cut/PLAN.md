# core-css-spend-cut

## Public Goal
First paint ships structure. Wonder, grain, cinematic, and ornament arrive after interactive so core CSS can shrink. Late restyle may only add atmosphere — not hide, move, or resize what the visitor already read.

## Cascade is not delivery
`@layer` is cascade geology: which rule wins. It is not a load optimizer.

- Reordering `@layer` does not shrink `bundles/core.css`.
- Putting a file in a later layer does not delay its download.
- A late `<link>` that forgets to redeclare the layer list dumps unlayered rules on top of the stack.

Delivery is what file is requested, when, and how it is cached (`style-core`, route/behavior bundles, `deferred-styles.js`). This spend-cut moves spend by delivery. Each sheet stays in the same layer it already occupied.

## Readable CSS
The literature is the selectors: `>` a child, `+` the next sibling, `:has()` a parent that knows what it holds. Do not hang a show metaphor on the load schedule.

## Non-Goals & Boundaries
- Do not reorder `@layer`.
- Do not move tokens/syntax/shell/frames/cards.
- Inspect *suppressors* stay in core so public routes stay quiet.
- Deferred flourish sheets re-enter through `flourish-pack.css`, which restates the layer list and assigns each import to its owner layer.

## Seams & Minimal Touch Files
- `public/css/tokens/flourish-defaults.css` — always-on names (`:root`, `@property`)
- `public/css/effects/flourish-pack.css` — idle delivery envelope
- `public/css/components/runtime-inspect.css` — opt-in overlays, still `layer(components)`
- `style-core.css`, `deferred-styles.js`, `site.js`

## Validation Steps
1. `npm run build:css` — core smaller
2. `node --check` on edited JS
3. Confirm flourish-pack begins with the same `@layer` list as `style-core.css`
