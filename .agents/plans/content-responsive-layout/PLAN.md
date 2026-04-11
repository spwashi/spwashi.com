# Plan: content-responsive-layout

Audit responsive behavior across shared shell and component surfaces, then shift the site toward content-owned layout tokens and narrower component fallbacks.

## Goal

The site should stop depending on a small number of viewport breakpoints and instead let components adapt from their own content measure, card density, and overlay ownership. This pass focuses on the shell, shared grids, settings surfaces, console chrome, and the pretext lab so mobile and narrow containers remain legible without truncation or awkward stacking. Taste note: improve containment and clarity by making layout decisions derive from ergonomic measure and component content rather than fixed repeat counts.

## Scope

- **In scope**: shared CSS tokens for layout measure, shell/header density tuning, responsive grid/card rules in shared CSS, settings surface ergonomics, console/persona mobile containment, and wiring pretext lab width presets to shared tokens.
- **Out of scope**: unrelated interaction-loop JS currently dirty in the worktree, route-specific copy rewrites outside responsive touch points, major visual redesigns, and non-layout semantic/runtime changes.

## Files

[NEW] .agents/plans/content-responsive-layout/PLAN.md  
[NEW] .agents/plans/content-responsive-layout/wip.spw  
[MOD] public/css/spw-tokens.css — add content/measure/layout variables for shell, cards, controls, and pretext widths  
[MOD] public/css/spw-shell.css — retune header/nav density and mobile shell containment  
[MOD] public/css/spw-components.css — convert fixed shared grids/cards into content-responsive patterns and add narrow-container fallbacks  
[MOD] public/css/spw-surfaces.css — fix settings, console, pretext lab, and surface grids with content-aware sizing  
[MOD] public/css/spw-grammar.css — tighten topline/hero containment for narrow frames  
[MOD] public/css/spw-wonder.css — keep persona selector readable and non-dominant on mobile  
[MOD] public/js/pretext-lab.js — derive lab surface widths from CSS tokens instead of hardcoded ratios  

Craft guard:
- `public/css/spw-components.css` and `public/css/spw-surfaces.css` are already large and multi-concept; edits must stay localized and token-driven.
- `public/js/pretext-lab.js` should remain a narrow integration shim, not become a second layout system.

## Commits

1. &[responsive-layout] — add shared content/measure tokens and retune shell density
2. &[responsive-layout] — convert shared grids and key surfaces to content-responsive layout rules
3. &[pretext-layout] — read shared layout tokens inside the pretext lab width model

## Agentic Hygiene

- Rebase target: `main@9783be0`
- Rebase cadence: before commit 1, before merge
- Hygiene split: unrelated dirty worktree files already exist in `public/js/spw-image-metaphysics.js`, `public/js/spw-state-inspector.js`, `public/js/spw-interaction-loop.js`, and `.agents/plans/interaction-loop-contract/`; this pass will not touch them

## Dependencies

none

## Failure Modes

- **Hard**: shared grid changes collapse card content or make overlays inaccessible on narrow widths.
- **Soft**: chip rows, settings controls, or console lines remain cramped but functional.
- **Non-negotiable**: no horizontal page overflow on common narrow/mobile widths; tap targets stay usable; pretext lab remains functional with CDN-loaded layout logic.

## Validation

- **Hypotheses**: content-driven min/max rules reduce truncation and make the settings shell calmer on narrow screens; CSS tokenized widths produce more coherent pretext demo projections than hardcoded ratios.
- **Negative controls**: desktop reading width, card tone, and existing interaction semantics should remain intact.
- **Demo sequence**: inspect `/settings/`, `/topics/software/pretext/`, and one console-enabled route on narrow and mid-width layouts by reading the CSS contracts and verifying no syntax/diff regressions.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
