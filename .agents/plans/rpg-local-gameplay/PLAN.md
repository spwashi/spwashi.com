# Plan: rpg-local-gameplay

Make the RPG Wednesday pages useful during gameplay through local-only browser storage.

## Goal

RPG Wednesday should move from a static campaign index toward a lightweight table aid. The first useful layer is a local gameplay kit that lets a player or GM track the current scene, party, initiative, clocks, quick notes, and session log seeds directly on the published pages without requiring a backend or build pipeline.

Taste note: improve usefulness and trust. The feature should feel like a quiet table tool, not an app takeover; local data must be clearly local and easy to export or clear.

## Scope

- **In scope**: a feature-gated JavaScript module for `/play/rpg-wednesday/` pages, localStorage persistence, import/export/reset controls, existing-page discoverability, CSS for the kit, and PWA cache updates for the RPG routes and module.
- **Out of scope**: accounts, cloud sync, multiplayer state, generated public session pages, dice physics, combat automation beyond a simple initiative list, or a build pipeline.

## Files

```text
[NEW] public/js/rpg-wednesday.js
[NEW] .agents/plans/rpg-local-gameplay/PLAN.md
[NEW] .agents/plans/rpg-local-gameplay/wip.spw
[NEW] .agents/plans/rpg-local-gameplay/rpg-local-gameplay.spw
[MOD] public/css/style.css
[MOD] public/js/site.js
[MOD] play/rpg-wednesday/index.html
[MOD] play/rpg-wednesday/sessions/index.html
[MOD] play/rpg-wednesday/world/index.html
[MOD] play/rpg-wednesday/cast/index.html
[MOD] play/rpg-wednesday/arcs/index.html
[MOD] sw.js
[MOD] manifest.webmanifest
[MOD?] .spw/surfaces.spw
```

### Craft guard

The feature lives in one route-specific module to avoid growing `site.js` into a gameplay controller. `public/css/style.css` is already large, so new CSS should be a compact feature block guarded by `[data-spw-features~="rpg-gameplay"]`. No dependency or build step is introduced.

## Commits

1. `^seed[rpg] — add local gameplay kit to RPG Wednesday`

The canonical running version lives in `wip.spw`.

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, before merge
- Hygiene split: existing uncommitted `media-feature-brief` work is present in this worktree; shared PWA files are intentionally hot and should be reviewed together if committed later.

## Dependencies

None for runtime execution. The existing PWA changes in the worktree also touch `sw.js` and `manifest.webmanifest`, so commit boundaries should be checked before staging.

## Failure Modes

- **Hard**: localStorage is unavailable and the kit silently fails.
- **Soft**: the kit feels too heavy for a campaign page or creates confusion about whether local notes are published.
- **Non-negotiable**: no local gameplay data leaves the browser; the page remains readable without JavaScript; export/clear paths are visible.

## Validation

- `node --check public/js/rpg-wednesday.js`
- `node --check public/js/site.js`
- `node --check sw.js`
- `python3 -m json.tool manifest.webmanifest`
- `git diff --check`
- `npm --prefix .spw/_workbench run lint:spw`

## Spw Artifact

`.agents/plans/rpg-local-gameplay/rpg-local-gameplay.spw`
