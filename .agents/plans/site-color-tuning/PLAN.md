# Plan: site-color-tuning

Rebalance the site color system so shared themes feel intentional and route palettes read as related dialects instead of isolated overrides.

## Goal

The desired end state is a site whose light and dark themes feel deliberately composed at the token level, with shared cards, materials, and image chrome responding consistently before any route-specific styling takes over. Route surfaces should still keep their own identity, but they should no longer need to fight a paper-heavy base or literal white fallbacks to look coherent. Taste note: improve expressiveness, layering, and clarity by making the color system feel authored rather than accumulated.

## Scope

- **In scope**: tune shared base tokens for background, surface, line, shadow, and operator harmony; reduce literal white/light fallback dominance in shared material and surface layers; and soften the most color-opinionated route surfaces so home, topics, website, and settings inherit the shared palette more honestly.
- **Out of scope**: rewriting page copy, adding new settings or JS behavior, redesigning every route, or touching unrelated local drift in HTML, JS, and out-of-scope CSS files.

## Files

[NEW] .agents/plans/site-color-tuning/PLAN.md
[NEW] .agents/plans/site-color-tuning/wip.spw
[MOD] public/css/spw-tokens.css - rebalance the global paper, surface, line, shadow, and operator tokens so the shared palette feels less warm-biased and more theme-responsive
[MOD] public/css/spw-material.css - replace literal white-heavy material mixes with token-led highlights and glass/paper treatments
[MOD] public/css/spw-surfaces.css - tune shared card, panel, and shell palette helpers so reusable surfaces inherit the rebalanced tokens cleanly
[MOD] public/css/spw-metaphysical-paper.css - align image helper paper/line/glow treatments with the shared token palette instead of fixed warm-white assumptions
[MOD] public/css/home-surface.css - pull the homepage palette slightly closer to the new shared base while preserving editorial warmth
[MOD] public/css/topics-surface.css - reduce route-local white/light mixes and let the topics field-guide palette inherit shared surface relationships more consistently
[MOD] public/css/website-surface.css - rebalance the design field-guide palette around the shared system while preserving its observatory identity
[MOD] public/css/settings-surface.css - tune the settings route so control surfaces feel aligned with the shared palette instead of a separate literal-white layer

### Craft guard

`public/css/spw-tokens.css`, `public/css/spw-surfaces.css`, `public/css/topics-surface.css`, and `public/css/website-surface.css` are already large and concept-dense, so this pass must stay inside palette and surface relationships rather than adding new structural patterns. `public/css/settings-surface.css` and `public/css/home-surface.css` should only absorb color-balance changes, not broaden into new layout or copy work. Shared color shifts should favor existing tokens and `color-mix()` relationships over one-off literal values.

## Commits

1. #[site-color-tuning] — record the plan artifacts and hygiene baseline
2. &[site-color-tuning] — rebalance shared tokens and material-led color relationships
3. &[site-color-tuning] — tune flagship route surfaces around the rebalanced base palette
4. ![site-color-tuning] — verify CSS integrity and inspect remaining literal color leaks

## Agentic Hygiene

- Rebase target: `main@761b833`
- Rebase cadence: before commit 2 and before merge
- Hygiene split: the worktree already carries uncommitted settings/resonance follow-up edits plus unrelated drift in `public/css/services-surface.css`, `public/css/spw-chrome.css`, and `public/js/spw-spells.js`; this pass will avoid those files and only touch the scoped CSS layers listed above.

## Dependencies

none

## Failure Modes

- **Hard**: global token shifts erase route identity or make contrast regress in either light or dark mode.
- **Soft**: the base palette improves, but route surfaces still read as disconnected because local gradients and highlights overpower the shared tokens.
- **Non-negotiable**: theme changes must remain legible, operator families must stay distinguishable, and no unrelated runtime or copy behavior should change.

## Validation

- **Hypotheses**: shared cards, panels, and image helpers should look more coherent across home, topics, website, and settings after the token/material pass; dark mode should feel like a related palette, not a separately patched one.
- **Negative controls**: route-specific accents should remain identifiable, and the current settings/resonance wiring and copy changes should stay untouched.
- **Demo sequence**: inspect `/`, `/topics/`, `/about/website/`, and `/settings/` in light and dark themes, confirm shared surfaces no longer stay paper-white, then verify route accents still feel distinct.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
