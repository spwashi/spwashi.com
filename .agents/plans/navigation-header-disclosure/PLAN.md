# Navigation Header Disclosure

## Goal

Reduce header overload while keeping the site's semantic controls discoverable:

- on a coarse pointer or pocket width, the primary navigation disclosure is a **glyph hamburger**, not a labeled Routes chip
- the labeled `Routes` copy is inline-mode chrome on a hover/fine pointer; it must not reflow the header when present
- make Media Cauldron and current attention posture visible in the header
- move secondary reading/display controls behind a `Display` disclosure on constrained layouts
- preserve existing shell-disclosure, settings, cauldron, and route-menu ownership
- keep the overlay contract explicit so `data-spw-menu-overlay`, `data-spw-menu-mode`, `data-spw-menu-topology`, and `aria-expanded` remain separately legible
- expected behavior: `.spw/conventions/interaction-microstates.spw#expected_behavior` (landed `b893cec3`)

## Semantic Fixity

Tier: contract-level shared chrome behavior.

The public contract is stable enough to document because it spans the generated header template, shared shell CSS, runtime settings state, and reusable `.spw` semantics. The concrete styling can continue to evolve, but these affordance roles should remain distinct:

- Glyph hamburger (coarse/pocket) or labeled `Routes` (inline/fine) opens route navigation.
- `Cauldron` jumps to `/play/#media-cauldron`.
- `Attention posture` previews the self/local/global posture, then offers an explicit settings link.
- `Display` contains secondary text size, color, contrast, layout, and inspection controls.
- `Overlay` is the transient drawer/scrim surface that becomes active when the menu is expanded on constrained layouts.

## Implementation

- `scripts/template.mjs` emits `.spw-header-actions` for Cauldron and the attention posture preview button.
- `public/js/runtime/shell-disclosure.js` syncs the posture label from canonical settings/root datasets, creates the posture preview panel, and wraps the utility row in a `details` disclosure.
- `public/css/shell/chrome/navigation.css` gives brand, routes, actions, toggle, and display controls stable grid areas across inline, compressed, and toggle modes. The hamburger is in `scripts/template.mjs`; coarse pointer forces toggle in `shell-disclosure.js`.
- CSS and JS share `DRAWER_MENU_QUERY` (`(pointer: coarse), (max-width: 45rem)`) so the inline strip and the hamburger cannot dual-paint.
- `data-spw-menu="open"` remains the disclosure source; `data-spw-menu-overlay="active"` is the visual drawer state.

## Validation

- `node --check public/js/runtime/shell-disclosure.js`
- `node --check scripts/template.mjs`
- `git diff --check`
- targeted `rg` checks for the new shell action and feature names
