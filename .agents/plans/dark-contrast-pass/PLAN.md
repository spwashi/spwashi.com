# Dark Contrast Pass

## Public Goal
Improve dark-mode legibility across shared cards and the settings route without flattening the material system or introducing new visual noise.

## Scope
- Adjust shared card/panel text defaults so soft text stays readable in dark mode.
- Tighten settings route shortcuts, query cards, and notes against the dark surface.
- Keep the fix local to contrast and text emphasis; do not redesign layout or color identity.

## Likely File Set
- `public/css/components/surfaces.css`
- `public/css/routes/surfaces/settings.css`
- `public/css/routes/surfaces/settings-notes.css`

## Validation
- `git diff --check`
- `npm run check`

## Out of Scope
- Global theme palette changes.
- Layout restructuring.
- New runtime state or JS behavior.
