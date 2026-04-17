# Plan: dev-hot-reload

Add a development-only build/runtime loop that improves authoring speed with live reload or hot reload, while preserving the site's production shape as hand-authored static HTML, CSS, and ES modules.

## Goal

The desired end state is not "make the site depend on a bundler." The desired end state is a faster local editing loop: save a file, see the browser update, and avoid cache confusion from the service worker while developing. Production should remain a static export that still works from ordinary hosting, and the dev stack should stay legible enough that it does not become the new center of gravity for the project.

## Recommendation

- Preferred direction: add a dev-only server with live reload first, and treat bundling as optional follow-up rather than the initial migration.
- If a mainstream tool is desired, use Vite in a minimal multi-page configuration for the dev server and keep its build step opt-in until the asset pipeline truly benefits from it.
- If the goal is only refresh speed and not module-level state preservation, a custom Node dev server with file watching and SSE reload is the smallest honest fit.

Chosen implementation:
- custom Node dev server with CSS hot-swap, full reload for HTML/JS/media changes, and explicit local-development service-worker bypass.

## Scope

- In scope: local dev server choice, route-aware local serving, automatic browser refresh on HTML/CSS/JS changes, and explicit development handling for service worker registration and cache state.
- In scope: a small plan note and, if implemented later, a lightweight script entry such as `package.json` plus one dev-server module.
- Out of scope: framework adoption, template compilation, CSS preprocessing, route generation, or forced production bundling of the site.

## Files Likely To Change

[NEW] `.agents/plans/dev-hot-reload/PLAN.md`
[NEW] `package.json` - only if the repo adopts a scriptable dev loop
[NEW] `scripts/dev-server.mjs` or `vite.config.js` - depending on chosen path
[MOD] `public/js/spw-pwa-update-handler.js` - skip or unregister service worker in local development
[MOD] `public/js/site-settings.js` - only if PWA status output needs a clean dev-state branch
[MOD] `sw.js` - only if a dev guard is cleaner than client-side unregister logic

## Semantic And Runtime Seams

- Service worker control is the main seam. Local hot/live reload will feel broken if `sw.js` continues to cache aggressively during development.
- The site is a multi-page static tree, so the dev server must preserve direct navigation to nested `index.html` routes instead of assuming an SPA router.
- Root-relative asset paths are already correct for a static server; avoid rewriting them into tool-specific import conventions unless production build value is clear.
- CSS and most HTML changes only need live reload. JS-heavy surfaces may benefit from HMR later, but that is a second step, not the first contract.

## Options

### Option A: custom Node dev server

- Best fit if the goal is "reload fast, stay simple."
- Likely shape: static file server + file watch + SSE reload client injected only in development.
- Strength: no dependency churn, no production build assumptions, easiest to align with the existing hand-authored site.
- Weakness: no off-the-shelf module HMR; JS edits cause full-page reloads unless more runtime machinery is added.

### Option B: minimal Vite dev server

- Best fit if the goal includes future module HMR and a possible later production build.
- Likely shape: multi-page dev server rooted at the repo, with HTML entry points preserved and production build disabled or kept opt-in at first.
- Strength: strong dev ergonomics and mature HMR story.
- Weakness: introduces a package/tooling layer that the current repo does not otherwise need, and would require careful handling of `public/`, root-relative paths, and service worker behavior.

## Validation

- `git diff --check`
- `node --check` for any new or edited dev-server JS module
- manual route checks on `/`, `/about/`, `/blog/`, and one nested topic route in the local server
- confirm that editing CSS triggers immediate visual refresh
- confirm that editing JS performs either a full reload or HMR, depending on the chosen tool
- confirm that local development does not remain controlled by a stale service worker after refreshes

## Decision Rule

Choose the custom Node dev server if the priority is preserving the current site model with the least machinery. Choose minimal Vite only if you explicitly want the project to grow into a tool-managed asset pipeline and are willing to make the dev server a first-class dependency.
