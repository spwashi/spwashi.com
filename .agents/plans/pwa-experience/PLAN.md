# Plan: pwa-experience

Improve the site's installability, offline behavior, update flow, and production QA without changing the hand-written page structure.

## Goal

The desired end state is a static site that behaves like a credible lightweight web app: it can be installed cleanly, it serves a graceful offline fallback, and it only asks the user to reload when a real update is waiting. This addresses correctness first, because the current worker scope and cache keys do not line up with how the site is actually routed. The taste note is **trust + containment**: the PWA shell should feel deliberate, legible, and non-intrusive instead of optimistic but brittle.

## Scope

- **In scope**: keep service worker control at the site root, normalize route/offline caching for the main site shell, improve install/update prompts, align the manifest with real assets, validate the fingerprinted production graph, and keep install/offline state inspectable.
- **Out of scope**: redesign page layouts, attempt a full offline mirror of every route, add a runtime framework, or refactor shared site scripts beyond what the PWA and QA contracts need.

## Files

[NEW] .agents/plans/pwa-experience/PLAN.md
[NEW] .agents/plans/pwa-experience/wip.spw
[NEW] sw.js
[NEW] offline/index.html
[MOD] manifest.webmanifest
[MOD] public/js/runtime/pwa-update-handler.js
[MOD] public/js/site.js
[MOD] public/js/runtime/module-catalog-normalize.js
[MOD] public/ts/runtime-environment.ts
[MOD] public/sw.js
[MOD] scripts/template.mjs
[MOD] scripts/ts/build/index.mts
[NEW] scripts/ts/pwa-contracts.mts
[MOD] scripts/ts/site-contracts/index.mts
[MOD] package.json
[MOD] .github/workflows/deploy.yml
[MOD] privacy/index.html
[NEW] public/images/apple-touch-icon.png
[NEW] public/images/icon-192.png
[NEW] public/images/icon-512.png
[NEW] public/images/icon-maskable-512.png

Craft guard:
- `sw.js` and `public/js/runtime/pwa-update-handler.js` should stay single-purpose and well under 600 lines.
- No import growth risk is expected; the client script remains a small PWA shell helper.

## QA Reconciliation — 2026-07-13

- **Public outcome**: install metadata is present on every rendered route; a newly installed worker has a complete offline shell; updates wait for explicit reload consent; compact controls meet the shared touch-target floor; and broken static fragments fail local validation.
- **Semantic fixity tier**: structural. Existing route and runtime names remain stable while validation becomes stricter around them.
- **Alignment seam**: aliases must resolve authored `data-spw-surface` values to a real route bundle, authored same-page links must resolve to a static or explicitly runtime-owned target, and runtime resource probes must resolve from the module catalog's directory.
- **Automation seam**: production fingerprinting, generated catalog references, manifest icons, offline dependencies, and worker precache paths are one built-artifact contract. The deploy workflow must run the same offline/local QA gate before publishing; `?spw-sw-test=1` is a localhost-only behavioral-smoke override.
- **Privacy seam**: install-hint dismissals are time-bounded and disclosed alongside Cache Storage and external font behavior.
- **Do not touch**: creator identity, route information architecture, full-site visual redesign, or speculative offline mirroring.

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
- **Automated gates**: `npm run check:local`, the built-artifact PWA contract, `npm run build`, targeted static-fragment checks, edited-JavaScript syntax checks, and `git diff --check`.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
