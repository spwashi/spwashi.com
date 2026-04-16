# Plan: palette-resonance

Add an image-aware canvas accent mode that samples palette from the image, lets individual figures override that palette manually, and bends the accent slightly toward the most recently chosen route/operator path so image interactions feel more semantically situated.

## Goal

The desired end state is a site where image interactions feel less generic and more anchored to what the image is doing in the surrounding prose. Instead of a fixed accent palette, important figures should be able to resonate with their own colors, lean toward parser/math/play/software neighborhoods, and accept image-specific override knobs directly in HTML. The taste note is **semantic atmosphere**: the canvas should feel like a visual consequence of the image and its anchors, not an ornamental layer pasted on top.

## Scope

- **In scope**: create plan artifacts, add a new `resonance` accent to the shared canvas runtime, support manual palette/anchor/strength overrides through `data-spw-accent-*` attributes, track a lightweight recent operational path signal from clicked routes/operators, and opt a few existing hero figures into the new accent so the behavior is immediately visible.
- **Out of scope**: editing the user-modified contextual UI module, introducing new dependencies, building a full image management system, or turning every site image into an always-on canvas experiment.

## Files

[NEW] `.agents/plans/palette-resonance/PLAN.md` - human-facing scope and craft guard.  
[NEW] `.agents/plans/palette-resonance/wip.spw` - living branch memory.  
[NEW] `public/js/spw-accent-palette.js` - shared palette inference, image sampling, and recent-path memory helpers for canvas accents.  
[MOD] `public/js/spw-canvas-accents.js` - add image sampling, recent-path memory, override parsing, and the new `resonance` accent archetype.  
[MOD] `public/css/spw-canvas-accents.css` - style resonance opacity/blend behavior and keep mobile/reduced-motion behavior calm.  
[MOD] `topics/software/index.html` - opt the software hero into resonance with parser/software-specific override hints.  
[MOD] `topics/software/parsers/index.html` - opt the parser hero into resonance with probe/parser/math-biased override hints.  
[MOD] `topics/math/index.html` - opt the math hero into resonance with structural/math-biased override hints.

Craft guard:
- Keep the runtime self-contained in the canvas accent layer and its small palette helper; do not pull in the user-edited contextual UI module.
- Prefer small, declarative HTML overrides (`data-spw-accent-colors`, `data-spw-accent-anchor`, `data-spw-accent-operator`, `data-spw-accent-strength`) over route-specific JS branches.
- Keep the effect visually legible on mobile and reduced-motion friendly.
- Make fallback behavior graceful for non-image accent hosts.

## Commits

1. `#[images] — plan palette resonance accent`
2. `&[canvas] — add image-aware resonance accent runtime`
3. `.[topics] — tune hero figures with semantic palette overrides`
4. `![images] — verify static and runtime hygiene`

## Agentic Hygiene

- Rebase target: `main@346e9446d284eaa78f6eed9aaa4a9a1da1ef0aa1`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none; preserve unrelated existing edits in `public/css/spw-chrome.css`, `public/js/spw-contextual-ui.js`, and `public/js/spw-shell-disclosure.js`

## Dependencies

none

## Failure Modes

- **Hard**: the new accent looks attractive but disconnected from the image and nearby route semantics.
- **Hard**: palette sampling only works for a subset of images and causes broken or empty accents elsewhere.
- **Soft**: the recent-path influence feels random because the bias is too strong or poorly inferred.
- **Soft**: the override surface becomes too bespoke and stops feeling portable across routes.
- **Non-negotiable**: non-image accent hosts and reduced-motion users retain a calm fallback.

## Validation

- **Hypotheses**: palette-driven accents will make image interactions feel more image-specific; small semantic/path biases will make route heroes feel better tied to their surrounding copy.
- **Negative controls**: existing non-resonance accents, current image helper controls, and unrelated contextual UI work remain intact.
- **Demo sequence**: visit `/topics/software/`, `/topics/software/parsers/`, and `/topics/math/`; interact with the hero figures before and after clicking a few route/operator links; confirm that the accent palette remains image-led but shifts slightly with the recent path memory and respects per-image overrides.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
