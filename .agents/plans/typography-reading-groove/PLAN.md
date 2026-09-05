# Typography Reading Groove

## Public Goal

Make long-form reading surfaces feel more musical and skimmable while scrolling, especially for audiences who are mostly listening and only partially watching the screen.

## Hypothesis

If the currently leading block of text and its immediate neighbors receive a subtle shared activation state, the page will feel more alive in motion and concepts will remain easier to track in screen recordings.

## Scope

- `public/js/runtime/attention/reading-groove.js` (behavior; mounted via `public/js/runtime/attention-architecture.js`, which is a compose-all facade — the catalog entry `attention-reading-groove` in `module-catalog-enhancement.js` mounts it directly)
- `public/js/runtime/attention/shared.js` (shared attrs/selectors: `READING_GROOVE_SELECTOR`, `READING_GROOVE_ATTR`, `getRootPreference`)
- `public/css/typography/typesetting.css`, `public/css/systems/legibility-lens.css`, `public/css/systems/surfaces/reading-layout.css`
- `public/js/runtime/attention/pinch-scale.js` — retained touch-safety requirement absorbed from `attention-cue-gestures` (see Relationship below)

## Constraints

- progressive enhancement only
- no scroll hijacking
- no layout-shifting typography tricks
- readable on both desktop and touch
- reversible through one selector/attribute family

## Status — landed

Shipped as `initReadingGroove()` in `attention/reading-groove.js`. The leading beat and its neighbors get shared activation via `data-spw-reading-beat` / `data-spw-reading-current` / `data-spw-reading-focus`, driven by an `IntersectionObserver` (see catalog `effectScope: 'root-state element-state intersection-observer preference-observer'`), not scroll hijacking. Reversible through `spwReadingGrooveMode` (settings/index.html, `name="readingGrooveMode"` radio group → `isReadingGrooveEnabled()`). Mount selector is global (`main article p/li`, `main > section p/li`), so it reaches touch and desktop alike per the "readable on both" constraint.

## Relationship

- `attention-cue-gestures/PLAN.md` — merged into this plan by the 2026-07-12 review (see its `index.spw` `^"review_disposition"`), retaining "canonical-settings and touch-safety requirements." That review predates `pinch-scale.js` (landed 2026-08-31), so the touch-safety requirement — pinch-to-scale text, gated on capability and on a reversible `spwPinchTextScale` setting — is folded in here now: `public/js/runtime/attention/pinch-scale.js`, mounted alongside `reading-groove.js` from the same `attention-architecture.js` facade and the same `attention-reading-groove`/`attention-pinch-scale` catalog family. Both settings (`readingGrooveMode`, `pinchTextScale`) share the same reversibility contract in `settings/index.html`.

## Validation

- `git diff --check`
- `node --check public/js/runtime/attention/reading-groove.js public/js/runtime/attention/pinch-scale.js`
- targeted `rg` checks for the reading-groove attributes
- `npm run audit:module-selectors` — attention-reading-groove and attention-pinch-scale should stay at 124/124 route hosts
