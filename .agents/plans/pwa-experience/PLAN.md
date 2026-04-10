# Plan: pwa-experience

Improve the site's installability, offline behavior, and update flow without changing the hand-written page structure.

## Goal

The desired end state is a static site that behaves like a credible lightweight web app: it can be installed cleanly, it serves a graceful offline fallback, and it only asks the user to reload when a real update is waiting. This addresses correctness first, because the current worker scope and cache keys do not line up with how the site is actually routed. The taste note is **trust + containment**: the PWA shell should feel deliberate, legible, and non-intrusive instead of optimistic but brittle.

## Scope

- **In scope**: move service worker control to the site root, normalize route/offline caching for the main site shell, improve install/update prompts, align the manifest with real assets, generate missing install icons, and add a dedicated offline page.
- **Out of scope**: redesign page layouts or copy, add build tooling, attempt a full offline mirror of every route, or refactor shared site scripts beyond what the PWA flow needs.

## Files

[NEW] .agents/plans/pwa-experience/PLAN.md
[NEW] .agents/plans/pwa-experience/wip.spw
[NEW] sw.js
[NEW] offline/index.html
[MOD] manifest.webmanifest
[MOD] public/js/pwa-update-handler.js
[MOD] public/sw.js
[NEW] public/images/apple-touch-icon.png
[NEW] public/images/icon-192.png
[NEW] public/images/icon-512.png
[NEW] public/images/icon-maskable-512.png

Craft guard:
- `sw.js` and `public/js/pwa-update-handler.js` should stay single-purpose and well under 600 lines.
- No import growth risk is expected; the client script remains a small PWA shell helper.

## Commits

1. `#[pwa] — capture the feature plan and branch memory for the PWA pass`
2. `&[pwa] — move service worker control to the site root and normalize offline navigation handling`
3. `#[pwa] — align manifest metadata with real install assets and install UX`
4. `![pwa] — verify registration, offline fallback, and update/install behavior`

## Agentic Hygiene

- Rebase target: `main@2bb6d4f1bc39126af15f5c705f591a86e5f33cbe`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: the root service worker does not control navigations, so installability and offline navigation remain broken.
- **Soft**: install UI is unavailable or dismissed on a given browser; the site must continue to behave as a normal website.
- **Non-negotiable**: online navigation and existing page content must remain intact, and offline fallback must stay explicit rather than silently serving mismatched content.

## Validation

- **Hypotheses**: the root worker will control page navigations; the update prompt will only appear when a waiting worker exists; install affordances will appear only when the browser can install or when iOS needs a manual hint.
- **Negative controls**: directory routing, existing HTML content, and shared stylesheet usage remain unchanged.
- **Demo sequence**: load `/`, confirm worker registration, reload into a controlled session, simulate offline navigation to a cached route and to an uncached route, and confirm update/install prompts behave sanely.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
