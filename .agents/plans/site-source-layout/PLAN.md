# Plan: site-source-layout

Reframe the repository around an explicit authored-site boundary so the root stops doubling as both source tree and project-control surface. The target shape is `site/` for publishable source, `dist/` for generated output, `scripts/` for the pipeline, and optional `docs/` only for maintainer-facing documentation.

## Public Goal

The desired end state is a repo where:

- the authored website lives under one obvious source root: `site/`
- generated deploy output continues to live in `dist/`
- build/dev/check scripts continue to work without changing public URLs
- non-site concerns such as `.agents/`, `.spw/`, `.github/`, and tooling no longer visually compete with route folders at the repo root
- templates and partials stay inside the site source tree as non-routable authoring surfaces

This is a repository-clarity change, not a framework migration. The public site should still behave like a hand-authored static site with root-relative asset paths and directory routing.

## Recommendation

- Preferred direction: move the public source tree into `site/`, not `src/`.
- Keep `dist/` as the generated publish surface.
- Keep `scripts/` at the repo root because it is pipeline logic, not site content.
- Keep `.spw/` and `.agents/` at the repo root because they are editor and agent surfaces, not public website source.
- Add `docs/` only if the repo gains maintainer documentation that should not be published as part of the site.
- Keep underscore-prefixed non-routable site authoring directories inside `site/`, for example:
  - `site/_partials/`
  - `site/_templates/` or `site/_layouts/` only if full-page shells become distinct from fragments

## Target Shape

```text
site/
  index.html
  about/
  blog/
  contact/
  design/
  play/
  recipes/
  rpg/
  services/
  settings/
  tools/
  topics/
  public/
    css/
    js/
    images/
    data/
  _partials/
  _templates/         optional
  CNAME
  favicon.ico
  manifest.webmanifest
  sw.js

dist/
scripts/
.spw/
.agents/
.github/
package.json
AGENTS.md
```

## Scope

- In scope:
  - repo structure around a new `site/` source root
  - moving route HTML, static assets, partials, service worker, and web manifest into `site/`
  - updating build/dev/check/catalog/sitemap/template scripts to understand `site/`
  - preserving current public URLs and deploy output under `dist/`
  - deciding where partials and templates belong in the new tree
- Out of scope:
  - framework adoption
  - bundler adoption
  - changing route URLs
  - changing root-relative public asset conventions
  - converting the site into `src/html`, `src/css`, `src/js`, `src/ts`
  - broad `.spw` ontology redesign unless the site/source boundary itself needs explicit inspection notes

## Current Seams

- `scripts/build.mjs` currently treats the repo root as the source tree and copies tracked files into `dist/`.
- `scripts/dev-server.mjs` serves the repo root directly and resolves route directories from there.
- `scripts/template.mjs` resolves partials from `_partials/` at the repo root.
- `scripts/generate-sitemap.mjs` discovers route files from the repo root while excluding internal directories.
- `scripts/generate-design-catalog.mjs` scans the repo root and emits catalog output that assumes the current public source layout.
- `scripts/site-contracts.mjs` expects route files and shared assets at current root-relative source paths and validates `/public/css/style.css` plus `/public/js/site.js`.
- `.spw/site.spw` and `.spw/surfaces.spw` currently reference public routes via `../index.html`, `../about/index.html`, and similar repo-root-adjacent paths.

## Files Likely To Change

[NEW] `.agents/plans/site-source-layout/PLAN.md`
[MOD] `scripts/build.mjs` - add an explicit source-root constant and copy from `site/` into `dist/`
[MOD] `scripts/dev-server.mjs` - serve from `site/` instead of the repo root while preserving route behavior
[MOD] `scripts/template.mjs` - resolve partials from `site/_partials/`
[MOD] `scripts/generate-sitemap.mjs` - discover route HTML under `site/`
[MOD] `scripts/generate-design-catalog.mjs` - scan `site/` for public HTML/CSS/JS while keeping `.spw/` and scripts references intentional
[MOD] `scripts/site-contracts.mjs` - validate routes and assets against the new source root
[MOD] `.spw/site.spw` - update public route path references if local inspection should follow moved source files
[MOD] `.spw/surfaces.spw` - same as above
[MOD] `AGENTS.md` - update project-overview wording if the repo officially adopts `site/`
[MOVE] `_partials/` -> `site/_partials/`
[MOVE] route directories and `index.html` -> `site/`
[MOVE] `public/` -> `site/public/`
[MOVE] `CNAME`, `favicon.ico`, `manifest.webmanifest`, `sw.js` -> `site/`
[MAYBE NEW] `site/_templates/` - only if page-shell abstraction actually appears
[MAYBE NEW] `docs/` - only for maintainer-facing architecture/build notes

## Migration Phases

### Phase 1: Path Abstraction Before Move

- Introduce a shared notion of:
  - repo root
  - site source root
  - dist root
- Make scripts accept `site/` as the source tree before moving files.
- Keep temporary compatibility where helpful so the tree can migrate in a controlled patch sequence rather than one giant rename-only diff.

Recommended implementation seam:

- add `SITE_DIR = path.join(ROOT_DIR, 'site')` in the affected scripts
- separate "source root for public files" from "repo root for tooling and `.spw`"
- keep public browser paths unchanged as `/public/...`, `/about/...`, and so on

### Phase 2: Move Public Source Into `site/`

- Move all publishable route directories and top-level route files into `site/`.
- Move `_partials/` into `site/_partials/`.
- Move `public/` into `site/public/`.
- Move site-root deploy artifacts that are authored source, not generated output:
  - `CNAME`
  - `favicon.ico`
  - `manifest.webmanifest`
  - `sw.js`
- Leave non-site project surfaces at the repo root:
  - `.agents/`
  - `.spw/`
  - `.github/`
  - `scripts/`
  - `package.json`
  - `AGENTS.md`

### Phase 3: Restore Build, Dev, and Validation Parity

- Confirm that `npm run dev` serves `site/` and still maps `/about/` to `site/about/index.html`.
- Confirm that `npm run build` writes a deployable `dist/` identical in URL shape to the current site.
- Confirm that sitemap generation still emits canonical route URLs, not source-file paths.
- Confirm that the design catalog still scans the public source tree plus `.spw` philosophy references without accidentally cataloging `dist/`.
- Confirm that route/runtime checks still discover the moved HTML files and public assets.

### Phase 4: Update Inspectable References

- Update `.spw/site.spw` and `.spw/surfaces.spw` route paths if the editor-facing source of truth should point at the moved `site/...` files.
- Update `AGENTS.md` so future agents do not keep assuming route HTML lives at the repo root.
- Add a short maintainer note only if the new layout is non-obvious enough to need onboarding.

### Phase 5: Optional Follow-up Cleanup

- Introduce `site/_templates/` or `site/_layouts/` only if the current fragment system grows into full-page shells.
- Add `docs/` only if there is genuine internal documentation to keep outside both `site/` and `.spw/`.
- Consider a small shared path helper for scripts if path logic starts to repeat too much.

## Risks

- A broad move-first patch without path abstraction will create avoidable breakage across build, dev server, sitemap, and validation scripts.
- The current worktree already has uncommitted edits in `scripts/build.mjs` and `scripts/generate-sitemap.mjs`; migration work should integrate with those edits rather than overwrite them.
- Catalog and manifest scripts may accidentally mix repo-root and site-root assumptions if they are only partially migrated.
- Service worker and manifest paths can silently regress if the site-root move is handled as an internal file move rather than a public-site source move.
- `.spw` route references may go stale if the repo adopts `site/` but the inspection surfaces keep pointing at old paths.
- A top-level `docs/` created too early can become a catch-all junk drawer instead of a real maintainer-docs surface.

## Validation

- `git diff --check`
- `node --check` for each edited script module
- `npm run build`
- `npm run check`
- targeted route checks in local dev on:
  - `/`
  - `/about/`
  - `/blog/`
  - one deep route such as `/topics/software/spw/operators/frame/`
- targeted fetch checks for:
  - `/public/css/style.css`
  - `/public/js/site.js`
  - `/manifest.webmanifest`
  - `/sw.js`
- sanity-check template rendering using at least one route that includes partials

## Decision Rule

Choose `site/` if the primary goal is to make the authored website feel like one coherent surface while keeping the existing static-site model intact.

Choose `src/` only if the repo is intentionally becoming a compile-first application where most authoring files are not directly site-shaped anymore.

Choose `docs/` only for maintainer documentation, not as a second home for public site content.
