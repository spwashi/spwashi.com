# Component variant alignment

Operation: align. Fixity: stable. Focus: component layout. Element: air.

Readers should see the selected panel and authored card layout consistently.
Keep existing attributes, routes, dependencies, and CSS layers.

- `public/js/runtime/variant-selection.js`: reject unavailable modes before
  mutations; mark the actual activated panel even when semantic names repeat.
- `public/css/components/cards.css`: authored variants outrank inferred text,
  climate, and tone; compact/rich spacing consumes shared component tokens;
  inferred long-text spacing reaches the rendered grid gap.
- `scripts/tests/engagement-features.test.mjs`: preserve panel visibility,
  keyboard selection, and events on an unavailable mode request.

Validation: engagement tests, JS syntax, check:local, module selector audit,
and pocket home-entry-panels visual check.

Verified: 28 engagement tests, 378 module tests, JS syntax, selector audit,
and pocket capture (one still, zero errors). `check:local` passes all gates
except check-generated's uncommitted core bundle requirement; its supported
`--allow-dirty` check passes. Core CSS was regenerated with the source edits.
