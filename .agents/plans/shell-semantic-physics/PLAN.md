# Plan: shell-semantic-physics

Make the header trace and mobile menu behave like a readable shell system rather than a thin navigation convenience.

## Goal

Turn the breadcrumb and hamburger menu into inspectable, semantically meaningful shell instruments. The breadcrumb should expose route, frame, mode, and shell state as separate readable parts with reversible interactions. The menu should project its own operational physics through stable datasets, explicit custom events, and CSS that documents how pressure, phase, topology, and return paths work.

## Scope

- In scope: shared shell JS, breadcrumb trace structure, nav-toggle semantics, CSS behavior documentation, and `.spw` convention updates for shell reversibility and cognitive navigation.
- Out of scope: route HTML rewrites, account or persistence changes, and a full console/nav redesign outside the shared shell.

## Files

- [NEW] `.agents/plans/shell-semantic-physics/PLAN.md`
- [MOD] `public/js/spw-shell-disclosure.js` - explicit shell-menu state machine, datasets, and external intent events
- [MOD] `public/js/spw-experiential.js` - structured interactive breadcrumb trace with shell affordances
- [MOD] `public/css/spw-chrome.css` - nav-toggle and header state styling keyed to shell physics datasets
- [MOD] `public/css/spw-handles.css` - breadcrumb component styling and behavioral documentation
- [MOD] `.spw/conventions/cognitive-navigation.spw` - shell disclosure, breadcrumb semantics, and reversibility rules

## Risks

- More visible shell state can become noisy if the calm/resting phase is not preserved.
- Breadcrumb interaction must not duplicate browser history without adding cognitive value.
- Ornament-heavy menu behavior must remain reversible by obvious actions and inspectable through state changes.

## Validation

- `git diff --check`
- `node --check public/js/spw-shell-disclosure.js`
- `node --check public/js/spw-experiential.js`
- `npm run build`
