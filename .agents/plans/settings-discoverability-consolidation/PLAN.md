# Plan: settings-discoverability-consolidation

Improve `/settings/` onboarding while making the settings surface easier to find from major site routes.

## Goal

Make the settings page easier to enter and scan by adding deep-linkable shortcut paths into the large runtime register, then improve cross-site discoverability with a shared footer surface that reflects the current browser-local atmosphere and links back into the most useful settings slices.

## Scope

- In scope: settings-route shortcut copy and anchors, light settings-page JS for opening deep-linked categories, shared footer partial consolidation, and shared footer styling for browser-local settings readouts.
- Out of scope: full header templating, account sync, new persistence models, or a broader redesign of the settings ontology.

## Files

- [NEW] `.agents/plans/settings-discoverability-consolidation/PLAN.md`
- [MOD] `settings/index.html` - add shortcut clusters and stable anchors for key settings groups.
- [MOD] `public/css/settings-surface.css` - style shortcut cards and tighter entry affordances.
- [MOD] `public/js/site-settings.js` - open targeted settings categories when a settings hash points into the large register.
- [MOD] `_partials/site-footer.html` - promote a shared settings-aware footer partial with live local-state readouts.
- [MOD] `public/css/spw-chrome.css` - support the richer footer settings strip.
- [MOD] key route `index.html` files - replace repeated rich footer markup with the shared partial where the footer contract already matches.

## Risks

- Deep links into `<details>` sections can feel broken if the target category stays collapsed.
- Footer discoverability can become noisy if the new settings summary competes with route-level identity.
- Template adoption should stay limited to the truly repeated footer contract so route-local footer variants do not get flattened accidentally.

## Validation

- `git diff --check`
- `node --check public/js/site-settings.js`
- targeted `rg` for new settings anchors and `spw-include src="site-footer"`
- sanity-check that footer readouts still bind on non-settings routes via the shared settings runtime
