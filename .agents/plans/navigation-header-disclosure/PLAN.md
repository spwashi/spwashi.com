# Navigation Header Disclosure

## Goal

Reduce header overload while keeping the site's semantic controls discoverable:

- keep `Routes` as the primary navigation disclosure
- make Media Cauldron and current attention posture visible in the header
- move secondary reading/display controls behind a `Display` disclosure on constrained layouts
- preserve existing shell-disclosure, settings, cauldron, and route-menu ownership
- keep the overlay contract explicit so `data-spw-menu-overlay`, `data-spw-menu-mode`, `data-spw-menu-topology`, and `aria-expanded` remain separately legible

## Semantic Fixity

Tier: contract-level shared chrome behavior.

The public contract is stable enough to document because it spans the generated header template, shared shell CSS, runtime settings state, and reusable `.spw` semantics. The concrete styling can continue to evolve, but these affordance roles should remain distinct:

- `Routes` opens route navigation.
- `Cauldron` jumps to `/play/#media-cauldron`.
- `Attention posture` previews the self/local/global posture, then offers an explicit settings link.
- `Display` contains secondary text size, color, contrast, layout, and inspection controls.
- `Overlay` is the transient drawer/scrim surface that becomes active when the menu is expanded on constrained layouts.

## Implementation

- `scripts/template.mjs` emits `.spw-header-actions` for Cauldron and the attention posture preview button.
- `public/js/runtime/shell-disclosure.js` syncs the posture label from canonical settings/root datasets, creates the posture preview panel, and wraps the utility row in a `details` disclosure.
- `public/css/shell/chrome.css` gives brand, routes, actions, toggle, and display controls stable grid areas across inline, compressed, and toggle modes.
- `data-spw-menu="open"` remains the disclosure source; `data-spw-menu-overlay="active"` is the visual drawer state.

## Validation

- `node --check public/js/runtime/shell-disclosure.js`
- `node --check scripts/template.mjs`
- `git diff --check`
- targeted `rg` checks for the new shell action and feature names
