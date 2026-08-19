# public-entrance-runtime-payload

## Public Goal
A stranger can read “I'm Spwashi. I build software and make art,” pick one door, and get a faster first paint because deferred CSS/JS no longer ride in the kernel.

## Non-Goals & Boundaries
- No new `data-spw-*` families, schedulers, or npm packages.
- Do not reorder CSS layers or rebuild the module catalog.
- Do not rename the 1,049-attribute vocabulary.
- Keep inspect APIs on `__SPW_SITE__`; lazy-bind them.

## Seams & Minimal Touch Files
- CSS: `style-core.css`, `style.css`, `scripts/ts/css-manifest.mts`, `scripts/ts/css-contracts.mts`, `kernel/deferred-styles.js`
- JS: `site.js`, `module-catalog-*.js`, `site-settings-engine.js`, `role-inference.js`, `component-semantics.js`
- Routes: `index.html`, `now/index.html`, `blog/index.html`, hub `nav_items`, privacy font note

## Validation Steps
1. `node --check` on edited JS
2. `npm run build:css` after scope/core moves
3. `npm run check:local`
4. Browser: home, now, blog, settings, a play scene bed

## Landed 2026-08-18
Core CSS 1839→1777 KiB. Immediate catalog 8→6. Shared public nav. `/now/` dated. Home first screen thinned. Fonts local.

## Continuation
The next first-paint cut is `core-css-spend-cut/` (flourish idle-load; core 1779→1623 KiB). Same rule: do not reorder `@layer` to win a demotion. Owner rail: `css-architecture-readability`.
