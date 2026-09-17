# public-entrance-runtime-payload

## Public Goal
A stranger can read “I'm Spwashi. I build software and make art,” pick one door, and get a faster first paint because deferred CSS/JS no longer ride in the kernel.

## Status
Landed 2026-08-18. Shared public nav. `/now/` dated. Home first screen thinned. Fonts local. Immediate catalog 8→6. Core CSS 1839→1777 KiB on this pass; flourish eviction later took core to 1623 KiB (`core-css-spend-cut`).

## Non-Goals & Boundaries
- No new `data-spw-*` families, schedulers, or npm packages.
- Do not reorder CSS layers or rebuild the module catalog.
- Keep inspect APIs on `__SPW_SITE__`; lazy-bind them.

## Continuation
Further first-paint CSS spend is `core-css-spend-cut/`. JS mount width is `runtime-bootstrap-performance/`. Same rule: do not reorder `@layer` to win a demotion.

## Alignment
`css-architecture-readability`, `runtime-bootstrap-performance`, `core-css-spend-cut`

## Validation Steps
1. `node --check` on edited JS
2. `npm run build:css` after scope/core moves
3. `npm run check:local`
