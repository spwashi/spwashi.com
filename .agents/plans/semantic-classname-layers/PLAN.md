# semantic-classname-layers

## Public Goal
A reader (and the runtime) can tell a frame, a chip, and a note by `data-spw-*` and ARIA; class names stay as one noun each.

## Status
Landed 2026-08-18. Public routes write `spw-frame` and `spw-chip`. Leftover `site-frame` is experiment-bed residue (`design/experiments/`), not a rewrite queue.

Class is the noun. Kinship is the combinator (`>`, `+`, `:has()`). That physics lives in `css-instruction` (`combinator_literature`) and the CSS rail.

## Non-Goals & Boundaries
- Do not reorder CSS layers.
- Do not invent new `data-spw-*` families.
- Do not restore `site-frame` / `site-hero` aliases.

## Remaining
Do not sweep experiment HTML unless that bed is being revived. New frames use `spw-frame`.

## Alignment
`css-architecture-readability`, `css-instruction#projection_layers`

## Validation Steps
1. `rg 'class="site-frame"' --glob '*.html'` — expect experiment beds only
2. `node --check public/js/kernel/dom-contracts.js`
