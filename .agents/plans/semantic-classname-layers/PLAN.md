# semantic-classname-layers

## Public Goal
A reader (and the runtime) can tell a frame, a chip, and a note by `data-spw-*` and ARIA; class names stay as one noun each. Load and navigation read as the same story CSS already has tokens for.

Class is the noun. Kinship is the combinator (`>`, `+`, `:has()`). That readable physics lives in `css-instruction` (`combinator_literature`) and the CSS rail, not in a parallel classname plan.

## Non-Goals & Boundaries
- Do not reorder CSS layers.
- Do not invent new `data-spw-*` families.
- No compatibility aliases for `site-frame` / `site-hero` once HTML is rewritten.

## Seams & Minimal Touch Files
- Route HTML: public hubs plus remaining `site-frame` routes via one rewrite
- CSS: `frames.css`, `foundation.css`, `typography/base.css`, `modes/hydration.css`
- JS: `kernel/dom-contracts.js` plus consumers of `FRAME_SELECTOR`

## Validation Steps
1. `node --check` on edited JS
2. `npm run check:local`
