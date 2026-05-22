# Mobile Brace And Path Polish

## Goal
- Make brace interactions easier to learn on mobile.
- Ensure the shell `PATH` control has a meaningful target across more routes.
- Remove dead vertical space above closing braces when a frame footer only carries the brace marker.

## Shared layers
- `public/js/runtime/experiential.js`
- `public/js/runtime/region-menu.js`
- `public/js/runtime/shell-disclosure.js`
- `public/css/components/frames.css`
- `settings/index.html`

## Notes
- Prefer shared behavior over route-local patches.
- Keep brace discovery progressive:
  - tap still grounds
  - deliberate hold still projects
  - coarse-pointer double tap can ask for more context
- Treat `PATH` as a shell affordance, not a feature-flag accident.
