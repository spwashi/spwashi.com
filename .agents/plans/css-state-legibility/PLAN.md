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
