# Shell Logo Branding

**Status 2026-10-06.** Landed 2026-04-22 (30ed4eec), with the mark scope inherited from theming-icon-packs-public-versioning. No next slice is named; without one, it folds into pwa-experience.

**Related:** [pwa-experience](../pwa-experience/PLAN.md) · [chrome-navigation-wonder](../chrome-navigation-wonder/PLAN.md).

## Goal
- Tighten mobile shell motion and clarify the section/path controls.
- Increase Spwashi branding with shared header/footer mark treatment and a home hero brand plate.
- Keep the SVG mark geometry consistent across runtime, shared assets, and public presentation.

## Surfaces
- `public/js/runtime/attention/attention-architecture.js`
- `public/js/runtime/shell/shell-disclosure.js`
- `public/js/runtime/experiential/experiential.js`
- `public/js/interface/logo-runtime.js`
- `public/css/spw-chrome.css`
- `public/css/spw-handles.css`
- `public/css/handles/logo.css`
- `public/css/home-surface.css`
- `index.html`
- `public/images/logo/spw-brand-plate.svg`

## Notes
- Prefer shorter settle timings over adding new state.
- Keep header/footer branding additive so route HTML does not need a broad manual sweep.
- Use the canonical Spwashi mark geometry everywhere the runtime emits or styles the logo.
