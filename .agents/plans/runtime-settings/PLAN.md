# Plan: runtime-settings

Add a local-only settings surface for Spw runtime chrome.

## Goal

Create a discoverable `/settings/` page where visitors can quiet or hide the surface map, quiet or hide the console, and disable scroll-driven viewport activation. Taste note: this improves containment and calm by making the cognitive-machine chrome optable instead of unavoidable, without removing the deeper runtime features.

## Scope

- In scope: localStorage-backed settings, settings page markup, navigator/console/core hooks, CSS preference states, PWA cache registration.
- Out of scope: account sync, build tooling, redesigning the navigator, replacing existing keybindings.

## Files

[NEW] `public/js/site-settings.js` - owns settings defaults, persistence, document attributes, and settings-form hydration.
[NEW] `settings/index.html` - static configuration page.
[MOD] `public/js/site.js` - applies settings before runtime feature mounting and gates viewport activation.
[MOD] `public/js/frame-navigator.js` - respects hidden mode and links to settings.
[MOD] `public/js/spw-console.js` - respects hidden/collapsed modes and links to settings.
[MOD] `public/css/style.css` - adds settings page layout and quiet/hidden runtime states.
[MOD] `sw.js` - caches settings route and settings module.
[MOD] `manifest.webmanifest` - bumps app version with service worker.

Craft guard:
- `public/css/style.css` is already large; keep additions grouped and minimal.
- `site-settings.js` should remain a small single-responsibility module.
- Avoid adding new runtime dependencies or persistent chrome.

## Commits

1. `#[settings] - add local runtime preferences`

Fuzz strategy:
- Explore: manually inspect current navigator/console/viewport activation boundaries.
- Stabilize: syntax-check changed JS and manifest JSON.
- Ship gate: `git diff --check` plus commit-review poll.

## Agentic Hygiene

- Rebase target: `origin/main@dff3c956f4bc5dcf2aa9fa231f4af04d873464ce`
- Rebase cadence: before commit, before merge.
- Hygiene split: existing uncommitted RPG Wednesday UX changes share `public/css/style.css`, `sw.js`, and `manifest.webmanifest`.

## Dependencies

none

## Failure Modes

- Hard: settings storage is unavailable and runtime crashes.
- Soft: quiet mode hides affordances too much; hidden mode removes discoverability.
- Non-negotiable: pages remain usable without JavaScript and settings stay local-only.

## Validation

- Hypotheses: visitors can reduce intrusive runtime chrome without losing route access.
- Negative controls: RPG Wednesday local gameplay changes and existing optional feature loading still work.
- Demo sequence: visit `/settings/`, choose quiet/hidden preferences, reload home/software pages, confirm runtime chrome follows preferences.

## Spw Artifact

None beyond `wip.spw`; the settings contract is small enough to live in code and this plan.
