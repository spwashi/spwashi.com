# Plan: rpg-live-session-atlas

Extend the RPG Wednesday local gameplay kit into a live-session asset atlas that can hold scenes, images, textures, items, and prompt fragments in predictable local cards.

## Public Goal

RPG Wednesday should be easier to run live across phone, tablet, and desktop widths while a session is happening on TikTok and Discord. The local kit should support a fast rhythm of:

- adding a scene, item, texture, or image reference
- putting it in a timeline and namespace
- collapsing or collecting it without losing it
- moving it around as context changes
- screenshotting the resulting cards for later interpretation in external art tools

## Scope

- **In scope**: route copy for the live-session use case, local asset-card metadata in the RPG gameplay kit, IndexedDB-backed local image storage, export/import that preserves local images, responsive layout tuning for more device sizes, and collectible/collapsible card behavior.
- **Out of scope**: cloud sync, multiplayer editing, automatic screenshotting, Discord or Midjourney integrations, and a separate route just for asset management.

## Files Likely To Change

```text
[NEW] .agents/plans/rpg-live-session-atlas/PLAN.md
[MOD] play/rpg-wednesday/index.html
[MOD] public/js/rpg-wednesday.js
[MOD] public/css/spw-surfaces.css
```

## Runtime Seams

- `public/js/rpg-wednesday.js` remains the single route-specific controller for RPG local behavior.
- `public/js/spw-image-store.js` is reused for local blobs so image payloads do not move into `localStorage`.
- `localStorage` keeps only lightweight asset metadata such as ids, namespace, timeline, preset, and collectible/collapsed state.

## Risks

- Export/import becomes misleading if local images are omitted from exported state.
- The asset board could turn into a generic media manager instead of a fast table aid.
- Extra controls could crowd smaller devices if card anatomy and breakpoints are not explicit.

## Validation

- `node --check public/js/rpg-wednesday.js`
- `git diff --check`
- `npm run check`
- targeted `rg` checks for new RPG asset selectors and route copy

## Stays Out Of Scope

- automated art prompting
- server-backed asset libraries
- shared party state across devices
- long-term ontology work in `.spw` unless the asset model proves durable beyond this implementation pass
