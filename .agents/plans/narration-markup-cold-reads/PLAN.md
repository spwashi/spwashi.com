# Plan: narration markup and cold-read prose

## Public Goal

Make prose-heavy surfaces easier to read aloud, easier for crawlers and models to parse, and easier for humans to reuse on other pages or in generator outputs.

The site already has portable literary text utilities and strong story surfaces. This pass adds a small narration contract so copy can be marked up as cue + text + aside without inventing route-specific wrappers.

## Likely Files

- `public/css/components/spw-components.css`
- `index.html`
- `town/index.html`
- `play/rpg-wednesday/library/index.html`
- `design/experiments/css/index.html`

## Semantic Seams

- Add a reusable narration / cold-read contract in the shared component layer.
- Prefer portable class names and `data-spw-textual-role` markers over page-local prose wrappers.
- Keep the markup expressive enough for narration, but lightweight enough to paste into a rogue page or generator output.
- Update a small set of copy-heavy surfaces first so the contract is demonstrated in real content.

## Validation

- `git diff --check`
- `npm run check`

## Out of Scope

- A full site-wide prose rewrite
- New JavaScript behavior
- Route architecture changes
