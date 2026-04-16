# Plan: vibe-setting-widgets

Make site settings feel intuitive, experiential, and portable through reusable variant widgets.

## Goal

The desired end state is a settings route that begins with obvious, high-impact choices and immediate feedback instead of reading like a registry dump. Small reusable widgets should also appear on flagship routes so visitors can tune their own experience in context rather than only on `/settings/`. Taste note: improve clarity, expressiveness, and layering while keeping the controls honest, accessible, and visibly connected to the runtime.

## Scope

- **In scope**: make declarative setting triggers work cleanly outside form scopes, add a reusable variant-widget pattern with active-state/readout feedback, reorder `/settings/` around experiential controls before technical inspection, and seed mini vibe widgets on the home, software, and math routes.
- **Out of scope**: redesign every route, add new settings beyond what already exists, rewrite unrelated runtime modules, or touch unrelated worktree drift in shared CSS and play surfaces.

## Files

[NEW] .agents/plans/vibe-setting-widgets/PLAN.md
[NEW] .agents/plans/vibe-setting-widgets/wip.spw
[MOD] public/js/site-settings.js - make declarative setting triggers portable sitewide, expose reusable widget-state syncing, and preserve existing scope/form behavior
[MOD] public/css/spw-surfaces.css - add reusable mini widget / variant-card styling for portable route-local controls
[MOD] public/css/settings-surface.css - improve settings-page layout, order, and experiential feedback surfaces
[MOD] settings/index.html - reorganize the route around start-here controls, current vibe feedback, and deeper inspection later in the page
[MOD] index.html - add a compact site-native vibe widget on the homepage
[MOD] topics/software/index.html - upgrade local control strip into a more legible mini widget
[MOD] topics/math/index.html - upgrade local control strip into a more legible mini widget

### Craft guard

`public/js/site-settings.js` is already large, so the changes must stay focused on binding/wiring instead of accumulating unrelated policy. `settings/index.html` is long and concept-dense; the reordering should reduce cognitive load rather than add another parallel control vocabulary. Shared widget styling should live in `public/css/spw-surfaces.css`, with route-specific emphasis in `public/css/settings-surface.css` only where the settings page truly differs.

## Commits

1. #[vibe-setting-widgets] — record the plan artifacts and hygiene baseline
2. &[vibe-setting-widgets] — make declarative setting widgets portable and stateful across route surfaces
3. &[vibe-setting-widgets] — reorder `/settings/` around start-here feedback and reusable variant cards
4. .[vibe-setting-widgets] — seed mini vibe widgets on flagship routes and align the copy
5. ![vibe-setting-widgets] — verify runtime wiring, markup integrity, and active-state behavior

## Agentic Hygiene

- Rebase target: `main@81d5e5205d70`
- Rebase cadence: before commit 2 and before merge
- Hygiene split: unrelated uncommitted edits already exist in `play/rpg-wednesday/index.html`, `public/css/spw-components.css`, and `public/css/spw-metaphysical-paper.css`; this pass will avoid them and commit only the new plan artifacts plus the settings/widget files above.

## Dependencies

none

## Failure Modes

- **Hard**: route-local widgets fail to persist settings or drift out of sync with the normalized store.
- **Soft**: `/settings/` becomes more decorative but still feels hard to navigate because order and feedback do not clarify what matters.
- **Non-negotiable**: controls remain accessible, state changes stay reversible, and existing settings fields/presets continue to work.

## Validation

- **Hypotheses**: a reader should be able to change a high-level vibe choice near the top of `/settings/` or from a route-local widget and immediately see active-state and readout changes without reloading.
- **Negative controls**: existing presets, field validation, and pages without the new widgets should keep current behavior.
- **Demo sequence**: open `/settings/`, change color/palette/wonder-memory variants from the new top-level widget surfaces, confirm applied-state updates, then visit `/`, `/topics/software/`, and `/topics/math/` to adjust those same settings from local mini widgets.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
