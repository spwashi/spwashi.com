# Plan: rpg-asset-capture-frames

Add RPG Wednesday local asset cards that help players stage manual screenshots for external image and animation tools.

## Goal

RPG Wednesday should let players upload local character, item, place, and artifact images, then stage those assets inside stable screenshot-friendly frames. The site is not responsible for automating capture or sending media to Midjourney, Grok, or any external service; it should prepare a well-designed local surface that players can screenshot manually and pair with a copyable prompt note.

Taste note: improve usefulness, trust, and earned wonder. Customizations should feel like discovering more of the campaign interface, not like a generic gamified skin store.

## Scope

- **In scope**: a local asset register using IndexedDB for image blobs and lightweight localStorage metadata, screenshot-mode card frames, aspect presets, prompt text helpers, motif/color customization, and exploration rewards that unlock local presentation options.
- **Out of scope**: automatic DOM screenshots, external AI integrations, cloud sync, accounts, shared multiplayer assets, monetized unlocks, or build tooling.

## Files

```text
[NEW] .agents/plans/rpg-asset-capture-frames/PLAN.md
[NEW] .agents/plans/rpg-asset-capture-frames/wip.spw
[NEW] .agents/plans/rpg-asset-capture-frames/rpg-asset-capture-frames.spw
[NEW?] public/js/rpg-asset-store.js - IndexedDB image/blob register and metadata helpers
[MOD] public/js/rpg-wednesday.js - attach asset register, capture frame controls, prompt helpers, and motif unlock state to the local gameplay kit
[MOD] public/css/style.css - feature-gated capture-frame, asset-register, screenshot-mode, and motif styles
[MOD] play/rpg-wednesday/index.html - static capture-frame host and no-JS explanation
[MOD] play/rpg-wednesday/cast/index.html - character-oriented capture route entry
[MOD] play/rpg-wednesday/world/index.html - place/faction capture route entry
[MOD] play/rpg-wednesday/sessions/index.html - session-seed capture route entry
[MOD] play/rpg-wednesday/arcs/index.html - arc/threat capture route entry
[MOD] sw.js - cache any new RPG asset/capture module
[MOD] manifest.webmanifest - bump version when PWA cache graph changes
[MOD?] .spw/conventions/style-development.spw - record motif and reward vocabulary if implementation proves a durable style decision
[MOD?] .agents/plans/screenshot-semantics/PLAN.md - cross-reference if that untracked plan is adopted into the same branch
```

### Craft guard

The asset store should be a small data module; the RPG UI should stay in the RPG feature module; CSS must remain feature-gated behind `[data-spw-features~="rpg-gameplay"]` or a future `[data-spw-features~="rpg-capture"]`. Avoid turning `localStorage` into an image database. Avoid unlocks that hide core utility, punish privacy choices, or require analytics.

## Commits

1. `#[rpg] — plan local asset capture frames`
2. `&[rpg] — add indexed local asset register`
3. `&[rpg] — add screenshot-mode card frames and prompt helpers`
4. `&[rpg] — add motif customization and exploration rewards`
5. `![rpg] — verify local assets, capture frames, export/import, and offline behavior`

The canonical running version lives in `wip.spw`.

## Agentic Hygiene

- Rebase target: `main@7643d88ec9f4e30c2784a7dca4f36e825a659c8b`
- Rebase cadence: before commit 1, before merge
- Hygiene split: `.agents/plans/screenshot-semantics/PLAN.md` is already untracked and was not created by this task; this plan references it as adjacent work rather than overwriting it.

## Dependencies

- `rpg-local-gameplay` — provides the current local gameplay kit and trust language.
- `screenshot-semantics` — adjacent untracked plan for still-image state legibility and journey tokens.
- `css-progressive-ornaments` — customization motifs must behave like detachable progressive ornaments, not core layout.
- `svg-surface-integration` — capture frames may eventually use SVG hosts for stable, inspectable card geometry.
- `mobile-runtime-foundation` — capture and customization paths must work on touch, keyboard, and pointer without hover-only semantics.

## Failure Modes

- **Hard**: storing full image data in `localStorage` exhausts quota or blocks the page.
- **Hard**: screenshot mode hides essential controls without a clear exit path.
- **Soft**: unlockable motifs feel manipulative, noisy, or unrelated to the site's Spw grammar.
- **Soft**: color customization creates inaccessible contrast or breaks screenshot legibility.
- **Non-negotiable**: uploaded images remain local; core character/item framing works without rewards; export/clear controls stay visible; no external upload happens.

## Validation

- **Hypotheses**: players can stage a character or item in under a minute; screenshot mode produces a clean frame at mobile and desktop widths; unlockable motifs increase curiosity without blocking utility.
- **Negative controls**: RPG routes remain readable without JavaScript; local gameplay state still loads; PWA offline core routes continue working.
- **Demo sequence**: upload an image, name it as a character, choose a motif, enter screenshot mode, manually screenshot, copy the prompt note, reload the page, confirm the asset and motif persist locally, export, clear, import, and confirm recovery.

## Spw Artifact

`.agents/plans/rpg-asset-capture-frames/rpg-asset-capture-frames.spw`
