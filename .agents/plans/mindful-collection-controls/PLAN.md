# Mindful Collection Controls

## Goal

Make guide-badge collections easier to undo and easier to clear in bulk without turning collection into a sticky reward trap.

## Scope

- Keep collected state backward-compatible for ornament CSS.
- Store intention separately from boolean collected state.
- Make re-click release a collected badge quickly.
- Add local bulk controls in Settings for `clear_today` and `clear_all`.
- Keep spell working sets readable and restoreable without inline-style prototype code.

## Affected Files

- `public/js/spw-guide-badge.js`
- `public/js/spw-spells.js`
- `public/css/spw-handles.css`
- `public/css/spw-ornament.css`
- `settings/index.html`
- `.spw/conventions/ornament-contract.spw`

## Validation

- `git diff --check`
- `node --check public/js/spw-guide-badge.js`
- `node --check public/js/spw-spells.js`
