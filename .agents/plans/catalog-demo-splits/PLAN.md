# Plan: catalog-demo-splits

Split the longest catalog and demo surfaces into smaller linked pages so each route carries one primary job.

## Goal

The design catalog should remain the canonical inventory, but its long sections need dedicated review pages for faster lookup and less scrolling. The CSS and SVG experiment routes should also become thinner hubs that link to focused subpages for the rule bench, variable lab, diagram posture, tunability, and handoff guidance. The intent is not to multiply pages for its own sake; it is to make the existing structure easier to inspect, navigate, and review.

## Scope

- **In scope**: design/catalog route splits for asset review and at least one other long catalog section, CSS experiment route splits, SVG experiment route splits, and hub links from `design/index.html`.
- **Out of scope**: broad copy rewrites, new media generation, runtime behavior changes, or a full redesign of the existing design hub.

## Files

- `[MOD] design/index.html`
- `[MOD] design/catalog/index.html` or its generator if the split is derived from the catalog scan
- `[NEW] design/catalog/assets/index.html`
- `[NEW] design/catalog/tokens/index.html` or another focused catalog child page if needed
- `[MOD] design/experiments/css/index.html`
- `[NEW] design/experiments/css/rule-bench/index.html`
- `[NEW] design/experiments/css/variables/index.html`
- `[MOD] design/experiments/svg/index.html`
- `[NEW] design/experiments/svg/posture/index.html`
- `[NEW] design/experiments/svg/tunability/index.html`
- `[NEW] design/experiments/svg/handoff/index.html`
- `[MOD] scripts/generate-design-catalog.mjs` if the catalog child pages should be generated from the same scan
- `[MOD] public/css/*` only if a shared split-page chrome needs small adjustments

## Semantic seams

- The catalog already separates attributes, CSS files, assets, tokens, and docs.
- The CSS experiment page already separates rule anatomy, variable behavior, and token registers.
- The SVG experiment page already separates posture, carryover, tunability, and handoff.

## Validation

- `git diff --check`
- `npm run check`
- Manual route sanity for the new pages and their links back to the hub pages

