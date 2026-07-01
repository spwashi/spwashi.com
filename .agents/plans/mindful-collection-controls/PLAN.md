# Mindful Collection Controls

## Goal

Make guide-badge collections easier to undo and easier to clear in bulk without turning collection into a sticky reward trap.

## Scope

- Keep collected state backward-compatible for ornament CSS.
- Store intention separately from boolean collected state.
- Make re-click release a collected badge quickly.
- Add local bulk controls in Settings for `clear_today` and `clear_all`.
- Keep spell working sets readable and restoreable without inline-style prototype code.
- Keep component-kind collection resettable through the same Settings persistence register rather than a parallel browser-memory path.

## Affected Files

- `public/js/spw-guide-badge.js`
- `public/js/spw-spells.js`
- `public/css/spw-handles.css`
- `public/css/spw-ornament.css`
- `settings/index.html`
- `.spw/conventions/ornament-contract.spw`
- `public/js/runtime/component-collection.js`
- `public/js/runtime/reward-ui.js`
- `public/js/kernel/site-settings-*.js`
- `public/css/components/floating-chrome.css`

## Active Extension - 2026-06-30 Component Collection Rewards

Component collection now persists distinct region component kinds under `spw-component-collection` and treats achievements as a browser-local memory register. The collection owner is `public/js/runtime/component-collection.js`; reward presentation is `public/js/runtime/reward-ui.js`; reset and visibility belong to the shared settings system.

- `rewardDisplay` is a canonical setting with `docked`, `toasts`, and `hidden` modes.
- Settings persistence includes a `component-collection` registry row that clears the collection through the collection API when mounted, or falls back to removing `spw-component-collection` and emitting `collection-updated`.
- The dock/settings collection panel exposes a clear action that calls `window.spwComponentCollection.reset(...)`.
- Page-region diversity remains an input signal only; persistent collection and achievements are owned by this mindful collection/runtime-settings seam.

## Validation

- `git diff --check`
- `node --check public/js/spw-guide-badge.js`
- `node --check public/js/spw-spells.js`
- `node --check public/js/runtime/component-collection.js`
- `node --check public/js/runtime/reward-ui.js`
- `node --check public/js/kernel/site-settings-engine.js`
- `node --check public/js/kernel/site-settings-profiles.js`
- `node --check public/js/kernel/site-settings-ui.js`
