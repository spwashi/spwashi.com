# Reference Assignment Template

## Purpose

Turn site references into small UX improvements or reversible experiments.

A reference can be a route, component, CSS selector, token, `.spw` note, screenshot, image study, animation clip, or external design reference. The format is intentionally intern-sized: one reference set, one behavior, one change, and one validation path.

Copy posture: make the assignment feel like a small chart. A component can play it, a route can answer it, and a result note can say whether the take should stay.

Prompt posture: keep the work topically dense without becoming vague. A good prompt hook names a material, behavior, light cue, grounding point, and result note. Metaphor is useful when it gives the next editor or learner a handle they can test on a component.

## Assignment Brief

Use this shape for small component, route, palette, or behavior assignments:

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

## Result Note Meanings

- `keep`: the change worked and can remain.
- `revise`: the direction is useful but needs another pass.
- `discard`: the experiment should be reverted or left as reference only.
- `promote`: the pattern should become a shared token, component rule, asset, or documented convention.

## Component Session Defaults

- Read the HTML before editing CSS.
- Treat CSS as a documentation layer over the authored HTML.
- Tune the component's usual behavior first: default, hover, focus, active, selected, disabled, reduced motion, and compact viewport.
- Prefer a shared token only after the behavior appears in more than one place or names a durable concept.
- Keep experiments reversible and scoped to one route or component family.
- When an operator chip combines a Spw sigil with plain text, audit both parts: the sigil should carry rhythm, and the label should keep the behavior learnable.

## Sensory Prompt Hooks

Use these as reusable axes for compact assignments:

- Material: paper, vellum, glass, copper, broth, fiber, enamel, graphite, ash, ink.
- Motion: fold, bloom, settle, reveal, warn, simmer, pulse, collect, ground, return.
- Light: side light, table light, footlight, backlight, blackout, ember, diagnostic glow.
- Spell: a small replayable behavior a visitor can repeat or restore.
- Cauldron: a gathered set of ingredients before they become a prompt, card, token, or route note.
- Grounding point: the route, component, state, or HTML owner where the wonder becomes usable.

## Good Assignment Examples

- `operator-chip-invite`: compare operator chips across three routes and tune one hover/focus behavior.
- `debug-layer-readable`: inspect one dense route with debug labels and improve label clarity without changing production UI.
- `design-material-settle`: translate one material reference into a CSS-only `/design/` component experiment.
- `settings-control-acknowledge`: compare settings controls and normalize one fast acknowledgement timing.
- `theme-pack-depth-map`: compare the six existing theme packs through field, surface, signal, marker, depth, and behavior roles.
- `design-palette-woven-signal`: use the Woven Signal Stack color seed to test route-local palette roles before promoting shared tokens.
- `component-register-folded-amber`: use the Folded Amber Register seed to test selected/pinned markers on one component family.
- `rpg-veil-table-resonance`: use the RPG Wednesday Veil Table seed to test route-local atmosphere without weakening map or note readability.
- `component-vellum-fold-surface`: use the Rice Paper Vellum Fold seed to test one tactile foreground card material.
- `fiber-paper-surface-study`: use fiber, vellum, seam, pin, and folded-edge references to clarify one component's HTML slots.
- `culinary-component-engineering`: use cooking methods as component methods for one small route or specimen.
- `theatre-lighting-behavior`: use side light, footlight, backlight, blackout, or table light to tune one visible behavior.
- `spell-chip-learnability`: compare chips that combine sigils and plain text, then tune one label pattern so the action remains teachable.
- `prompt-cauldron-ingredients`: gather route, object, material, light, state, and constraint into one promptable component note.

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
