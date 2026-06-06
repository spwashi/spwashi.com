# Navigation Header Disclosure

## Goal

Reduce header overload while keeping the site's semantic controls discoverable:

- keep `Routes` as the primary navigation disclosure
- make Media Cauldron and current attention posture visible in the header
- move secondary reading/display controls behind a `Display` disclosure on constrained layouts
- preserve existing shell-disclosure, settings, cauldron, and route-menu ownership

## Semantic Fixity

Tier: contract-level shared chrome behavior.

The public contract is stable enough to document because it spans the generated header template, shared shell CSS, runtime settings state, and reusable `.spw` semantics. The concrete styling can continue to evolve, but these affordance roles should remain distinct:

- `Routes` opens route navigation.
- `Cauldron` jumps to `/play/#media-cauldron`.
- `Attention posture` reflects and links to the self/local/global posture settings.
- `Display` contains secondary text size, color, contrast, layout, and inspection controls.

## Implementation

- `scripts/template.mjs` emits `.spw-header-actions` for Cauldron and the attention posture pill.
- `public/js/runtime/shell-disclosure.js` syncs the posture label from canonical settings/root datasets, keeps the posture link accessible, and wraps the utility row in a `details` disclosure.
- `public/css/shell/chrome.css` gives brand, routes, actions, toggle, and display controls stable grid areas across inline, compressed, and toggle modes.

## Validation

- `node --check public/js/runtime/shell-disclosure.js`
- `node --check scripts/template.mjs`
- `git diff --check`
- targeted `rg` checks for the new shell action and feature names
