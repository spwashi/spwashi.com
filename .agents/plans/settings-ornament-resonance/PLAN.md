# Settings Ornament Resonance

## Public Goal

Let a reader make immediate lighting, theme, type-scale, flourish, and memory choices from the Settings quick start, with visible comparisons and accessible pressed states.

## Non-Goals & Boundaries

- Reuse existing `data-site-setting-set` controls and ornament state attributes.
- Do not add a storage key, a new wonder type, or a new `data-spw-*` family.
- Do not alter field-memory decay, collection, or remove the detailed Settings form.

## Seams & Minimal Touch Files

- Route HTML: `settings/index.html` adds direct native-button controls with full labels.
- Route CSS: `public/css/routes/surfaces/settings-forms.css` makes compact scales compare safely in horizontal and vertical space.
- Runtime JS: `public/js/kernel/site-settings-ui.js` projects saved wonder-memory state into the existing ornament vocabulary; all other controls use the canonical trigger binding.

## Validation Steps

1. `node --check public/js/kernel/site-settings-ui.js`
2. `npm run audit:module-selectors`
3. `git diff --check`
4. `npm run check:local -- --allow-dirty`
