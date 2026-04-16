# Plan: wonder-memory

Make recent interaction paths persist as an intentional sitewide "wonder memory" that can tint palette squares, structural ornaments, and local copy cues.

## Goal

The end state is a coherent loop where recent route and operator selections leave a readable trace across image accents, nearby cards, and selected guidance surfaces instead of vanishing as isolated hover effects. This should feel legible and intentional: a reader can change the memory behavior from the settings model or from small route-local controls, then immediately see the impact on hero images and surrounding grammar. Taste note: improve expressiveness and layering without smuggling in opaque controls or breaking the hand-written route surfaces.

## Scope

- **In scope**: add a normalized `wonderMemory` setting, expose it on `/settings/`, support small declarative setting triggers on route pages, connect recent-path memory to palette resonance and wonder-state ornament, and update flagship software/math route copy so the interaction is explained where it happens.
- **Out of scope**: redesign the entire settings page, rewrite contextual UI, touch unrelated worktree edits, or add new generated images/assets for this slice.

## Files

[NEW] .agents/plans/wonder-memory/PLAN.md
[NEW] .agents/plans/wonder-memory/wip.spw
[MOD] public/js/site-settings.js - add `wonderMemory` to the normalized settings model, presets, derived modifiers, dataset/css variable writes, and declarative setting triggers
[MOD] public/js/spw-accent-palette.js - expose wonder-memory profiles, active recent-path resolution, and shared token helpers for recent-path ornament
[MOD] public/js/spw-canvas-accents.js - let recent-path wonder memory drive resonance palette bias, root accent colors, and matched ornament states
[NEW] public/js/spw-wonder-memory.js - apply recent-path wonder memory to structural ornaments and matched route surfaces
[MOD] public/css/spw-wonder.css - extend wonder-state treatment to structural cards used by flagship route copy
[MOD] public/css/spw-surfaces.css - style wonder-memory control strips in topic heroes
[MOD] settings/index.html - surface wonder-memory controls and readouts in the settings page
[MOD] topics/software/index.html - add route-local wonder-memory copy and controls
[MOD] topics/software/parsers/index.html - add route-local wonder-memory copy and controls
[MOD] topics/math/index.html - add route-local wonder-memory copy and controls

### Craft guard

`public/js/site-settings.js` and `public/js/spw-canvas-accents.js` are already large and need surgical changes only; avoid widening responsibilities beyond settings normalization and accent/runtime response. The new structural ornament work should live in a separate helper rather than bloating the canvas renderer. No file should exceed 600 lines, and route HTML edits should stay localized to hero/copy surfaces.

## Commits

1. #[wonder-memory] — add normalized wonder-memory settings state, presets, and declarative trigger wiring
2. &[wonder-memory] — connect recent-path wonder memory to resonance palettes and structural ornament state
3. .[wonder-memory] — add flagship route copy and local controls that explain and exercise the feature
4. ![wonder-memory] — validate wiring, links, and runtime syntax

## Agentic Hygiene

- Rebase target: `main@346e944`
- Rebase cadence: before commit 1 and before merge
- Hygiene split: no branch drift relative to `main`, but the live worktree contains unrelated uncommitted edits in other CSS/JS files; this pass will avoid modifying them unless the feature cannot ship without a surgical touch.

## Dependencies

none

## Failure Modes

- **Hard**: wonder-memory controls save invalid state or fail to update the shared settings model.
- **Soft**: recent-path resonance updates image accents but not nearby structural cues, producing a split visual language.
- **Non-negotiable**: settings remain locally persisted, controls stay accessible, and pages without recent interaction do not get stuck in a false resonant state.

## Validation

- **Hypotheses**: `wonderMemory` changes should alter recent-path persistence, root datasets/CSS variables, and visible accent behavior without page reload.
- **Negative controls**: existing presets, non-wonder settings, and pages without the new local control strips should continue to function.
- **Demo sequence**: change wonder-memory on `/settings/`, visit `/topics/software/`, click parser/math routes, then confirm image resonance and matched cards/links update on `/topics/software/parsers/` and `/topics/math/`.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
