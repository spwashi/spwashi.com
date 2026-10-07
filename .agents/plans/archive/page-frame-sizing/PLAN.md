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

## 2026-09-09 — newspaper opening slices

Operation: `align`; fixity: `tending`. Each route remains a separate patch.
- Home: h1/lede follow container width; compact rules follow base declarations. Owner: `public/css/routes/surfaces/home.css`; rebuilt home bundle. Stills: `09-25-19--aa4cfc` (pocket/fold/broadsheet).
- About: the spanning illustration inflated four automatic rows. Keep three text rows at min-content and give the controls row the remaining height with `minmax(min-content, 1fr)`. Owner: `public/css/routes/surfaces/about.css`; rebuilt about bundle. Type sizes and column boundaries stay as authored.
- About stills: baseline `09-31-21--819a0a`; pocket/fold controls `09-33-27--fceaaa`; final broadsheet `09-34-38--3ba3e6`. Runs live under `design/components/captures/runs/2026-09-09/checks/`. First auto-row attempt did not tighten the masthead; the final flexible row did. No capture errors.
- Validation: CSS contracts, generated outputs with `--allow-dirty`, and whitespace pass. Local suite: 282 tests pass; overall failure remains `.claude/worktrees/` entering the route census and uncommitted generated home/about bundles. Do not regenerate route manifests from that census.
- Recipes header packing and shared lede sizing remain candidates for measurement. Home and About landed as separate `align` commits.
