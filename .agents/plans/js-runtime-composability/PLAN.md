# JS Runtime Composability

## Public Goal
Reduce the size and cognitive load of `public/js/site.js` by extracting the page-state / attention lifecycle contract into a dedicated runtime module, while keeping the runtime behavior and datasets stable.

## Scope
- Extract page lifecycle helpers from `public/js/site.js` into a focused runtime module.
- Keep the shared page-state vocabulary, timing behavior, and dataset writes centralized.
- Update documentation that currently says the page-state contract lives only in `site.js`.

## Likely File Set
- `public/js/runtime/page-state.js`
- `public/js/site.js`
- `public/js/README.md`
- `.spw/reviews/runtime-audit/lifecycles.spw`

## Constraints
- Do not add alias wrappers.
- Do not change the public page-state tokens or timing semantics.
- Keep page attention and visibility handling reversible and readable.

## Validation
- `node --check public/js/site.js`
- `node --check public/js/runtime/page-state.js`
- `git diff --check`
- `npm run check`

## Out of Scope
- Renaming unrelated runtime modules.
- Changing route-specific behavior beyond the page-state contract.
