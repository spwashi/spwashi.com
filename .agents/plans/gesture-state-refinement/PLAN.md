# Plan: gesture-state-refinement

Refine gesture handling and page / region / component state logic so semantic inspection feels intentional, reversible, and easier to discover.

## Goal

Make shared gesture behavior calmer on mobile, remove accidental menu / brace activations during ordinary scrolling, and document the resulting interaction grammar through both visible settings-page copy and stable console helpers.

## Scope

- In scope: brace / region gesture cleanup, viewport-safe semantic menu behavior, console-accessible gesture inspection helpers, and one settings-page documentation pass for gesture semantics, console discovery, and spell-oriented seeds.
- Out of scope: a full redesign of shell chrome, new collector / explorer modes, verbosity summarization workflows, or a sitewide copy rewrite.

## Files

- [NEW] `.agents/plans/gesture-state-refinement/PLAN.md`
- [MOD] `public/js/runtime/brace-gestures.js` - reduce eager coarse-pointer gesture commitment.
- [MOD] `public/js/runtime/region-menu.js` - make region-menu opening more intentional and improve preview / close state cleanup.
- [MOD] `public/js/site.js` - expose stable gesture discovery helpers in the public runtime console surface.
- [MOD] `settings/index.html` - document gesture semantics, console helpers, and spell-oriented seeds in a route users can revisit.

## Runtime seams

- `brace-gestures` should distinguish preview from commitment more clearly on coarse pointers.
- `region-menu` should behave like a deliberate projection surface, not a side effect of normal tapping or scrolling.
- `window.__SPW_SITE__` should expose gesture discovery in the same spirit as composition and feature-cluster inspection.

## Risks

- Gesture cleanup can unintentionally make inspection feel hidden if the copy does not compensate.
- Adding console helpers without a clear public name can increase internal vocabulary drift.
- Settings copy can become too theoretical if it does not stay grounded in concrete “do this / expect this” guidance.

## Validation

- `node --check public/js/runtime/brace-gestures.js`
- `node --check public/js/runtime/region-menu.js`
- `node --check public/js/site.js`
- `git diff --check`
- `npm run check`
