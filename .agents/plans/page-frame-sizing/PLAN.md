# Page Frame Sizing Refinement

## Public outcome

Route layouts and reader-selected layout tuners produce predictable page frames and prose measures across compact and wide viewports, while open navigation remains stable on touch devices.

## Fixity

- Semantic fixity: **contract** — frame (`rem`) and prose measure (`ch`) remain distinct public layout concepts.
- Implementation fixity: **refinable** — selectors, transient datasets, and event wiring may be simplified where the same outcome is preserved.

## Minimal surfaces

- `public/css/tokens/{core,dimensions}.css`: canonical frame and measure tokens.
- `public/css/shell/layout.css` and `public/css/shell/chrome/*.css`: route frame spending, shared edges, and menu scroll containment.
- `public/css/systems/{layout-postures,interaction-progression}.css`: tuner posture and short selection feedback.
- `public/js/kernel/{settings-query-parity,site-settings-profiles}.js`: tuner-to-layout/token parity.
- `public/js/runtime/{interaction-progression,shell-disclosure,variant-selection,site-search}.js`: selection events, cleanup, and site route search.
- `public/data/site-search-index.json` + `scripts/generate-site-search-index.mjs`: client search index from the route census.
- `.spw/conventions/page-frame-sizing.spw` plus linked convention updates: durable frame/measure contract.

## Seams

- Authored `body[data-spw-layout]` is the route frame cap; the settings tuner may tighten it but must not erase it.
- `--spw-shell-frame-max` is spent by page frames; `--spw-layout-measure` is spent by prose.
- Variant and layout selection feedback is transient, reduced-motion aware, and cleaned up on unmount.
- Shell menu scroll locking permits internal menu scrolling and blocks the page behind it.

## Non-goals

- No new layout metaphor family or route-specific width ladder.
- No new dependency, framework, or immediate runtime module.
- No broad route markup rewrite.
- No changes under `.spw/_workbench`.

## Validation

- `git diff --check`
- `node --check` for each edited JavaScript module
- targeted settings/layout contract checks
- `npm run check:runtime`
- `npm run check:local`
- compact and wide browser smoke checks for one reading route, one atlas/wide route, a mode switch, and the toggle menu

## Out of scope

- Redesigning settings controls or navigation content.
- Reworking unrelated spacing, ornament, or route presentation.
