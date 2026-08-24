# Plan: production-season-rhythm

## Public Goal

Make the annual October 1–January 4 production season legible as one reusable rhythm: October illustration practice and a Halloween release hook, November writing with named episode dates, December’s existing 13th/26th release closes, and a January 4 coda. Prove the model on `/recipes/` with one source-honest Halloween recipe episode and an accessible, responsive SVG score.

## Semantic Posture

- Operation: `prime`
- Fixity: `tending`
- Daily kernel: engineer + writer; garden/theater; cadence; studio intensity; public route + slice contract; validate in source, runtime tests, and browser; do not touch feeds, service worker, or global date scheduling.

## Smallest Honest Surfaces

- `recipes/index.html`: authored season, recipe episode, local/hybrid/remote participation, 96-day score.
- `public/css/routes/surfaces/recipes.css`: route-local packing and season materials.
- `public/js/runtime/attention/section-handle.js` + `attention/shared.js`: mirror authored cadence while the section is current.
- `public/js/interface/cauldron/storage.js` + `composition.js`: preserve cadence and motion with a gathered ingredient.
- `.spw/philosophy/timing-data-localization.spw`: annual production-season boundary.
- `.spw/slices/production-season-rhythm/index.spw`: durable ownership and negative boundaries.

## Negative Scope

- No generic calendar, timezone scheduler, notification system, or automatic publishing.
- No hidden essential copy, date-gated route, new storage key, package, or ornament class.
- No claim that the Halloween recipe is inherited tradition; provenance stays explicit.
- No runtime-owned regional history; attention only mirrors the active authored section.

## Patch Clusters

1. Public score: plan + `.spw` contract + route HTML/CSS + accessible SVG.
2. Portable rhythm: attention cadence annotation + cauldron payload preservation + tests.
3. QA: narrow/wide screenshots, keyboard SVG rail, reduced motion, cauldron capture.

## Validation

- `node --check public/js/runtime/attention/shared.js`
- `node --check public/js/runtime/attention/section-handle.js`
- `node --check public/js/interface/cauldron/storage.js`
- `node --check public/js/interface/composition.js`
- `npm run spw:doctor`
- `npm run spw:roots`
- `npm run spw:integrity`
- `npm run ecology`
- `npm run check:local`
- Browser smoke at phone and desktop widths; verify no-JS reading and SVG anchor targets.

## Completion Signal

A visitor can read the full season without JavaScript, navigate its four movements through the SVG score, gather a cadence-bearing Halloween ingredient, and see the active cadence reflected by the section handle without any date scheduler or new persistence layer.

## Status

- [x] Authored score, route pilot, responsive SVG, and slice contract.
- [x] Cadence mirror and portable cauldron payload.
- [ ] Browser QA and final tending note.
