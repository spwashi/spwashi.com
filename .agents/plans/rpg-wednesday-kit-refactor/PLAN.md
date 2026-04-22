# Plan: rpg-wednesday-kit-refactor

Refactor the RPG Wednesday local gameplay kit into a more modular, keyboard-capable workspace that reads clearly across desktop, tablet, and phone layouts.

## Public Goal

The local gameplay kit should feel like a stable live-session work surface instead of a long form with a few extra controls bolted on. During play, it should be easy to:

- move between scene, initiative, clocks, asset atlas, notes, and brief lanes
- add or revise cards without hunting for the right field
- keep the notes lane visible while the asset atlas grows
- operate key session actions from the keyboard when hands are already on the laptop
- extend the JavaScript later without treating one large route module as the only seam

## Scope

- **In scope**: route-local JavaScript modularization, keyboard navigation and action shortcuts, clearer asset-atlas empty and edit states, gameplay-grid layout changes, and concise UI copy that teaches the live workflow.
- **Out of scope**: backend sync, multiplayer state, automatic screenshots, Discord or TikTok integrations, or a full sitewide component-system rewrite.

## Likely Files

```text
[NEW] .agents/plans/rpg-wednesday-kit-refactor/PLAN.md
[NEW] public/js/rpg-wednesday-asset-atlas.js
[NEW] public/js/rpg-wednesday-state.js
[NEW] public/js/rpg-wednesday-dom.js
[NEW] public/js/rpg-wednesday-shortcuts.js
[MOD] public/js/rpg-wednesday.js
[MOD] public/css/spw-surfaces.css
[MOD] public/css/rpg-wednesday-surface.css
[MOD?] play/rpg-wednesday/index.html
```

## Runtime Seams

- `public/js/rpg-wednesday.js` stays the single route entrypoint loaded by `public/js/site.js`.
- State normalization, storage, and export/import helpers move into route-local support modules so later features can compose from explicit seams.
- Keyboard handling should stay opt-in and respectful of editable fields; focus movement and action shortcuts should not steal normal typing.

## UX Targets

- Wide screens should place the asset atlas beside a notes rail instead of leaving dead columns.
- The notes rail should behave like a stable session companion, not a stranded narrow panel.
- The asset atlas should present clear draft, board, and empty states with visible keyboard hints.
- Asset cards should remain keyboard-reachable and reorderable without forcing pointer use.

## Risks

- Breaking the local-state contract during module extraction would strand saved browser data.
- Shortcut handling could become annoying if it intercepts normal text entry or browser-level commands.
- Overfitting the layout to one desktop width could regress the smaller breakpoints added in the earlier atlas pass.

## Validation

- `git diff --check`
- `node --check public/js/rpg-wednesday.js`
- `node --check public/js/rpg-wednesday-state.js`
- `node --check public/js/rpg-wednesday-dom.js`
- `node --check public/js/rpg-wednesday-shortcuts.js`
- `npm run check`

## Out Of Scope

- Server-backed RPG memory
- Shared state across viewers
- New `.spw` contracts unless the new shortcut or workspace semantics prove durable beyond this implementation pass
