# Plan: review-surfaces-babbling

Add a small shared enhancer for the split design review pages so they can expose a useful sidebar rail, a generated SVG constellation, and a compact "babble" summary of the current review focus.

## Goal

The catalog and demo slice pages should be easier to scan, compare, and hand off. Instead of only linking to the parent pages, each split page should generate a compact review rail with a readable summary, a small SVG map of the relevant links, and quick chips for the page's local review verbs.

## Scope

- **In scope**: `design/catalog/assets`, `design/catalog/tokens`, `design/experiments/css/controls`, and `design/experiments/svg/handoff`.
- **Shared work**: one JS enhancer, one route CSS file, and minor layout/feature updates on the split pages.
- **Out of scope**: redesigning the parent catalog or experiment pages, new generated catalog artifacts, or changing route content beyond the split-page affordance.

## Files

- `[NEW] public/js/modules/design-review-surfaces.js`
- `[MOD] public/js/site.js`
- `[NEW] public/css/routes/surfaces/review-surfaces.css`
- `[MOD] public/css/style.css`
- `[MOD] public/css/README.md`
- `[MOD] design/catalog/assets/index.html`
- `[MOD] design/catalog/tokens/index.html`
- `[MOD] design/experiments/css/controls/index.html`
- `[MOD] design/experiments/svg/handoff/index.html`

## Validation

- `git diff --check`
- `node --check public/js/modules/design-review-surfaces.js`
- `npm run check`
