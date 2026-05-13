# Plan: spell-cognition-familiarity

Make the spell and breadcrumb surfaces feel more like cognition in motion: familiar, liminal, and replayable without inventing a second state system. The aim is for the existing spellbook, breadcrumb trail, and wonder-memory feedback to describe a page’s current comfort level and transition quality in a way a reader can grasp immediately.

## Goal

The site already has several adjacent ideas that point at the same thing: spells as replayable outcomes, breadcrumbs as cognitive path, wonder memory as recent-path resonance, and liminality as page depth. This pass should align those ideas so they read as one integrated model instead of separate metaphors. The user-facing result should be intuitive: the spell dock should tell you whether a path feels fresh, familiar, or deeply grounded; the breadcrumb trail should explain how a page is being held in memory; and the page state should expose liminal gradients as a readable part of the worldbuilding rather than a hidden implementation detail.

## Scope

- In scope: shared runtime copy/state in `public/js/runtime/spells.js`, `public/js/runtime/experiential.js`, and `public/js/interface/wonder-memory.js`.
- In scope: small state projection updates in shared CSS only if a new readable register needs visual support.
- In scope: public data attributes or helper outputs that let the console, settings, and spell surfaces describe familiarity and liminality clearly.
- Out of scope: route-specific copy rewrites, new spell mechanics, or a broader taxonomy rewrite.

## Working Direction

- Treat `spellbook` as a replayable cognitive tool, not just a serialized trace.
- Surface a simple familiarity ladder using existing recent-path and grounded state.
- Describe liminality in intuitive terms such as fresh, threshold, settled, and immersive rather than adding a new obscure taxonomy.
- Keep the spell dock and breadcrumb trail mutually reinforcing so they read like one model from different angles.
- Reuse existing wonder-memory and breadcrumb signals instead of introducing parallel state.

## Likely Files

- `public/js/runtime/spells.js`
- `public/js/runtime/experiential.js`
- `public/js/interface/wonder-memory.js`
- `public/css/handles/operators.css` only if the new state needs shared visual treatment
- `.spw/philosophy/cognitive-surface.spw` or a related `.spw` surface if the semantic model should stay inspectable beyond one patch

## Validation

- `node --check` for edited JS modules
- `git diff --check`
- `npm run check`

## Risks

- The vocabulary could become more theoretical instead of more intuitive if the new labels are too abstract.
- Overlapping with wonder-memory or breadcrumb semantics could make the feature feel redundant if the boundaries are not kept clear.
- Too much route-specific wording would weaken the shared model and make the spell surface feel bolted on.
