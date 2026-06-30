# Plan: css-state-legibility

Make shared CSS communicate application state and design logic through stable ownership boundaries instead of route-local overrides that only work accidentally in the cascade.

## Goal

Stateful controls should read clearly in the stylesheet: shared layers own idle, hover, focus, and pressed behavior; route layers provide palette and intent through variables; shell layout owns page gutters exactly once. The result should be easier to read for both humans and agents because the CSS explains where state comes from and which layer is responsible for it.

## Scope

- In scope: shared handle state tokens, homepage lens/button projection through route variables, shell gutter ownership, and primary-nav overflow ownership.
- Out of scope: new runtime state names, route HTML rewrites, or broader visual redesign work across unrelated surfaces.

## Files

[NEW] `.agents/plans/css-state-legibility/PLAN.md`  
[MOD] `public/css/spw-handles.css` - shared control-state projection for `operator-chip` and `mode-switch`  
[MOD] `public/css/home-surface.css` - homepage intent/palette tokens for mode buttons and chips  
[MOD] `public/css/spw-shell.css` - single owner for page gutter and layout width  
[MOD] `public/css/spw-chrome.css` - explicit ownership of primary-nav overflow and token visibility

## Validation

- `git diff --check`
- targeted `rg` for `--mode-switch-`, `--operator-chip-`, and `data-spw-nav-tokenized`
- sanity-check that `wide` and `split` layouts still read from `main` as the page-edge owner

## Active Refinement - 2026-06-19 Conversation Audit

This plan now owns the "css microinteraction state and html alignment audit" thread from the current conversation.

Redistributed tasks:

- Treat `aria-pressed`, `aria-expanded`, `data-spw-grounded`, `data-spw-pinned`, `data-spw-collected`, `data-spw-floating-chrome`, and `data-spw-chrome-tier` as state contracts that require both HTML/runtime ownership and CSS projection.
- Keep generic interaction styles in shared component or handle layers; route CSS should provide palette/intention variables rather than redefining pressed/hover/focus behavior.
- Verify mode switches use `.frame-sigil[data-set-mode]` and that mode-switch-specific pressed styles outrank generic operator pressed styles.
- Normalize microinteraction timing around deliberate, explainable states: focus-visible, hover, pressed, verified, collected, grounded, docked, toast, modal.
- Where runtime writes a state attribute, confirm there is no route-local CSS that assumes a different state vocabulary.

Validation additions:

- `rg -n "aria-pressed|aria-expanded|data-set-mode|data-spw-grounded|data-spw-pinned|data-spw-collected|data-spw-floating-chrome|data-spw-chrome-tier" **/index.html public/js public/css`
- `rg -n "\\[aria-pressed|\\[aria-expanded|data-spw-grounded|data-spw-pinned|data-spw-collected|data-spw-floating-chrome|data-spw-chrome-tier" public/css`

## Implementation Increment - 2026-06-30

Focus dimension: `css_behavior/state-legibility`
Fixity tier: stable
Primary element: metal
Secondary element: air
Owner surfaces: `public/css/handles/operators.css`, route/component CSS intent variables, `.spw/conventions/site-semantics.spw`

Landed the shared operator-chip pressed-state contract:

- `public/css/handles/operators.css` now owns `.operator-chip[aria-pressed="true"]` and `.operator-chip[data-site-setting-active="true"]` rendering through `--operator-chip-active-*` variables.
- Lower layers provide palette and proof posture through `--operator-chip-active-*-intent` variables instead of duplicating border/background/shadow logic.
- `public/css/components/content.css`, `public/css/routes/surfaces/home-panels.css`, and `public/css/routes/surfaces/design.css` now express active chip intent rather than owning pressed-state behavior.
- `.spw/conventions/site-semantics.spw#pressed_handle_state_contract` records the philosophy: HTML/runtime own semantic state; handles CSS owns state projection; routes provide intent.

Validation additions:

- `rg -n -- "--operator-chip-active-|aria-pressed=\"true\"|data-site-setting-active=\"true\"" public/css public/js **/index.html`
- `npm run check:local`
