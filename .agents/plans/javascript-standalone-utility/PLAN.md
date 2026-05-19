# JavaScript Standalone Utility Pass

## Goal

Improve marginal utility of site JavaScript by making a useful behavior available in three contexts:

- As a standalone import from `public/js/compose.js`.
- As a console/debug helper through `window.spwCompose`.
- As a progressive enhancement on pages that opt into the relevant markup.

## Selected Slice

Composition and box-model inspection.

This is a good fit because Settings already asks readers to tune density, layout, runtime posture, and enhancement behavior. A lightweight inspector can name those mechanics without introducing a new framework or turning visual debug into decoration.

## Implementation Shape

- Add `public/js/runtime/composition-box-model.js`.
- Export its portable helpers from `public/js/compose.js`.
- Mount it from `site.js` only when Settings or `data-spw-box-model` markup is present.
- Write stable attributes such as `data-spw-box-model`, `data-spw-composition-flow`, `data-spw-box-overflow`, and `data-spw-box-measure`.
- Add CSS that uses those attributes for quiet module-visuals affordances.

## Follow-Up

- Extend specific pages with explicit `data-spw-box-model` only where the distinction teaches something.
- If a future visual debug pass needs a lightning metaphor, keep it behind `spw-module-visuals=on` and derive it from these same box-model attributes.
