# Plan: reader / builder entrances

## Public Goal

Give readers and computer-literate visitors a first-class path through the site by pairing clear prose entrances with inspectable runtime and query-mode entrances.

The site should reward two kinds of visitors without making either one parse the whole lattice:

- readers who want the method, canon, and narrative surfaces
- builders who want the CSS, settings, query modes, and browser-local runtime to stay legible

## Likely Files

- `index.html`
- `settings/index.html`
- `scripts/template.mjs`
- `public/js/interface/spw-contextual-ui.js`
- `public/js/kernel/site-settings.js`
- `public/js/kernel/spw-instrumentation.js`

## Semantic Seams

- Improve shared header navigation with route notes and hover/tooltips.
- Add explicit reader/builder entrance blocks on the homepage.
- Add query-mode links on the settings page for reader, builder, inspect, and lab postures.
- Keep the new modes aligned with the existing query contract so they stay reusable in docs, QA, and future generator outputs.

## Validation

- `git diff --check`
- `npm run check`

## Out of Scope

- A full route map redesign
- New navigation framework
- Changing the meaning of the underlying runtime settings model
