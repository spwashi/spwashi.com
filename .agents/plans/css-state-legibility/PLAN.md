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

## Implementation Increment - 2026-07-02

Focus dimension: `css_behavior/state-legibility`
Fixity tier: stable
Owner surfaces: `public/css/handles/operators.css`, route surface intent variables, `public/css/shell/layout.css`

Landed the shared mode-switch state contract and repaired dead route intent:

- Key discovery: because `handles` outranks `routes` in the layer order and the shared defaults are declared on the sigil element itself, route-layer pressed/hover re-descriptions AND route-set `--mode-switch-*` variables were silently dead code. Home, Topics, and RPG Wednesday pressed styling was rendering shared teal defaults, not the authored route palettes.
- `public/css/handles/operators.css` now threads `--mode-switch-*-intent` indirection through every mode-switch state variable (light and dark defaults), mirroring the 2026-06-30 `--operator-chip-active-*-intent` pattern. Routes can set intent from any layer or ancestor.
- Migrated dead blocks to live intent variables: `routes/surfaces/home.css` (pressed palette, light+dark), `routes/surfaces/topics.css` (lane pressed shadow, pressed-animation suppression), `routes/surfaces/rpg-wednesday.css` (idle/pressed palette via `--active-op-color` plus intent variables; raw `border-color`/`background`/`min-height` overrides removed). Visual effect: the authored route palettes now actually render; RPG switches gain in-palette hover response.
- Shell gutter single ownership confirmed (`shell/layout.css` "main owns the page gutter"); converted three raw route `padding-inline` overrides on `main` to the `--spw-main-padding-inline` contract variable (`services.css`, `rpg-wednesday.css`, `play.css` at their <=820px breakpoints).
- Primary-nav tokenized/overflow ownership confirmed coherent: `shell/chrome.css` owns the contract; `modes/display-layers.css` overrides are same-layer (`shell`) intentional mode projections.
- File-reference refresh: the original `[MOD]` list (spw-handles.css, home-surface.css, spw-shell.css, spw-chrome.css) predates the modular split; current owners are `handles/operators.css`, `routes/surfaces/home.css`, `shell/layout.css`, `shell/chrome.css`.

Follow-up:

- `routes/surfaces/play.css` sections 6/9 re-describe hover/focus/pressed for sigils, chips, and generic buttons route-locally; most of it is dead under the layer order. It needs its own migration pass (bigger surface, includes non-mode-switch controls).
- `.mode-switch .frame-sigil[data-set-mode="surface"|"syntax"|"artifacts"|"website"]` self-declare `--active-op-color` in the handles layer, which blocks ancestor palette override for those four modes; consider intent indirection if a route ever needs to re-tint them.

Validation additions:

- `rg -n -- "--mode-switch-.*-intent" public/css`
- `rg -n "padding-inline: 0.8rem" public/css/routes` (should return nothing)
