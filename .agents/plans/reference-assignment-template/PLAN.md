# Reference Assignment Template

## Purpose

Turn references from across the site into intern-sized UX improvements or reversible experiments.

A reference can be a route, component, CSS selector, token, `.spw` note, screenshot, image study, animation clip, or external design reference. The assignment should make one behavior easier to understand, tune, or test.

## Assignment Brief

Use this shape when preparing work:

1. Title: name the component and behavior, such as `operator-chip-invite` or `frame-card-settle`.
2. Work type: choose `improvement` for a low-risk polish pass or `experiment` for a reversible prototype.
3. Reference set: list 2-5 concrete references with paths, route URLs, screenshots, prompt studies, or sidecars.
4. UX question: ask one question about behavior, personality, clarity, or comprehension.
5. HTML owner: name the route element, class, or `data-spw-*` attribute that carries the semantic structure.
6. CSS owner: name the stylesheet, selector, and token family likely to express the behavior.
7. Proposed direction: state the smallest change worth trying.
8. Guardrails: name what should not change.
9. Validation: list commands and manual checks.
10. Result note: record keep, revise, discard, or promote.

## Component Session Defaults

- Read the HTML before editing CSS.
- Treat CSS as a documentation layer over the authored HTML.
- Tune the component's usual behavior first: default, hover, focus, active, selected, disabled, reduced motion, and compact viewport.
- Prefer a shared token only after the behavior appears in more than one place or names a durable concept.
- Keep experiments reversible and scoped to one route or component family.

## Good Assignment Examples

- `operator-chip-invite`: compare operator chips across three routes and tune one hover/focus behavior.
- `debug-layer-readable`: inspect one dense route with debug labels and improve label clarity without changing production UI.
- `design-material-settle`: translate one material reference into a CSS-only `/design/` component experiment.
- `settings-control-acknowledge`: compare settings controls and normalize one fast acknowledgement timing.
- `design-palette-woven-signal`: use the Woven Signal Stack color seed to test route-local palette roles before promoting shared tokens.
- `component-register-folded-amber`: use the Folded Amber Register seed to test selected/pinned markers on one component family.
- `rpg-veil-table-resonance`: use the RPG Wednesday Veil Table seed to test route-local atmosphere without weakening map or note readability.

## Validation Defaults

Documentation-only assignment:

```sh
git diff --check
```

CSS assignment:

```sh
npm run build:css
npm run check:css
git diff --check
```

Runtime assignment:

```sh
node --check public/js/<changed-file>.js
npm run check
git diff --check
```

Manual checks should name the route, viewport, color mode, reduced-motion state, and keyboard interaction checked.
