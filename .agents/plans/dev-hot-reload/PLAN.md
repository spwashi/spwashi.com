# Plan: dev-hot-reload

Add a development-only build/runtime loop that improves authoring speed with live reload or hot reload, while preserving the site's production shape as hand-authored static HTML, CSS, and ES modules.

## Goal

The desired end state is not "make the site depend on a bundler." The desired end state is a faster local editing loop: save a file, see the browser update, and avoid cache confusion from the service worker while developing. Production should remain a static export that still works from ordinary hosting, and the dev stack should stay legible enough that it does not become the new center of gravity for the project.

## Recommendation

- Preferred direction: add a dev-only server with live reload first, and treat bundling as optional follow-up rather than the initial migration.
- If a mainstream tool is desired, use Vite in a minimal multi-page configuration for the dev server and keep its build step opt-in until the asset pipeline truly benefits from it.
- If the goal is only refresh speed and not module-level state preservation, a custom Node dev server with file watching and SSE reload is the smallest honest fit.

Current implementation:
- Vite is now the primary `npm run dev` server, with the legacy custom server kept as `npm run dev:legacy`.
- Vite runs in multi-page mode and discovers route HTML entries recursively so nested pages participate in the dev/build graph.
- Template directives render through the shared `scripts/template.mjs` path, so dev and deploy share the same HTML composition behavior.
- Route HTML and `_partials` changes should trigger full-page reloads; CSS/module edits stay on Vite's native update path.

## Scope

- In scope: local dev server choice, route-aware local serving, automatic browser refresh on HTML/CSS/JS changes, and explicit development handling for service worker registration and cache state.
- In scope: Vite multi-page entry discovery, route-aware HTML reload, template partial reload, and explicit development handling for service worker registration and cache state.
- Out of scope: framework adoption, template compilation, CSS preprocessing, route generation, or forced production bundling of the site.

## Files Likely To Change

[MOD] `.agents/plans/dev-hot-reload/PLAN.md`
[MOD] `vite.config.ts` - route HTML discovery, template rendering, and dev reload handling
[MOD?] `package.json` - only if new scripts are needed for watch loops
[MOD?] `scripts/template.mjs` - only when template caching or dependency behavior affects reload
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
- Status: kept as `dev:legacy` for fallback/template debugging.

### Option B: minimal Vite dev server

- Best fit if the goal includes future module HMR and a possible later production build.
- Likely shape: multi-page dev server rooted at the repo, with HTML entry points preserved and production build disabled or kept opt-in at first.
- Strength: strong dev ergonomics and mature HMR story.
- Weakness: introduces a package/tooling layer that the current repo does not otherwise need, and would require careful handling of `public/`, root-relative paths, and service worker behavior.
- Status: current primary path. Keep it minimal and route-aware; do not convert authored pages into a framework app.

## Validation

- `git diff --check`
- `node --check scripts/template.mjs` when template behavior changes
- `npm run typecheck`
- `npm run build:vite`
- targeted route checks on `/`, `/about/`, `/blog/`, and one nested topic route in the local server
- confirm that editing CSS triggers immediate visual refresh
- confirm that editing route HTML or `_partials` performs a full reload
- confirm that editing JS performs either a full reload or HMR, depending on Vite's module graph
- confirm that local development does not remain controlled by a stale service worker after refreshes

## Current Decision Rule

Keep Vite as the primary authoring server while it remains a thin multi-page wrapper around the hand-authored route tree. Keep `dev:legacy` available for fallback debugging, but new hot-reload and page-entry work should land in `vite.config.ts` unless it is specific to the legacy SSE server.
