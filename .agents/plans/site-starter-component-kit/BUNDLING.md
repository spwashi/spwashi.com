# Capability Bundling For Other Sites

Operation: `prime`. Fixity: `experimental`. Status: proposed, 2026-09-20.
Owner: [site-starter-component-kit](./PLAN.md).
Folder imagination: [bundling.spw](./bundling.spw).

## Public Goal
Let another site adopt one Spw capability with its required styles and assets,
customize it, and remove it without importing the Spwashi site runtime.

## Evidence
- `compose.js` exposes 315 exports; `compose.css` imports 37 sheets in the current starter census.
- Native ESM follows the static re-export graph even for one requested export.
- Four compose re-exports use `/public/js/` paths, tying relocation to the host root.
- `starter:inventory -- --check` falsely reports those four files missing because it joins root-relative paths to `public/js/`; all four files exist.
- Composition CSS includes document typography and global token defaults.
- CSS bundle targets describe core/routes/behaviors; Vite chunks describe implementation folders.
- Texture-slice already has focused JS, opt-in markup, CSS, and stylesheet-relative motif URLs.

## Boundaries
Preserve current source owners, public entrypoints, layer order, and site behavior.
No framework, new attribute family, dependency installation, publishing, or source migration in this planning patch.
Treat package names and folders in the sketch as candidates, not established contracts.
Keep creator identity, navigation, analytics, service worker, and route content host-owned.

## Patch Sequence
1. **Repair the evidence.** Correct starter path resolution; test relative and root-relative imports. Extend the portable audit to transitive imports and CSS assets, with explicit external-resource reporting.
2. **Prove one capability.** Package texture-slice from existing source owners into a disposable distribution. Include required motifs and a minimal consumer fixture. Audit licensing before redistributing assets.
3. **Prove relocation.** Serve the fixture under a nested path with no `/public/` tree. Rebase CSS URLs against each source stylesheet before flattening; emit relative JS references and copy only required assets.
4. **Define adoption boundaries.** Record markup, JS, CSS, assets, tokens, accessibility, lifecycle, and host policies per capability. Preserve `(ctx, root)` where applicable and verify cleanup/refresh semantics against the actual module.
5. **Add narrow entrypoints after proof.** Candidates: DOM, lifecycle, frames/chips, attention, SVG, texture-slice. Keep compose as an optional aggregate. Separate tokens, components, document typography, and effects; scope component defaults to their hosts where possible.
6. **Produce two consumption modes.** Modular ESM with type declarations for bundlers; ready-to-host ESM/CSS for plain HTML. Reuse existing build tools, preserve lazy boundaries, and audit import-time effects before declaring tree-shaking metadata. Explicitly preserve CSS side effects.
7. **Stabilize only after a real second consumer.** Document exports, customization, versions, license, source maps, and upgrade policy. Select a package name and publishing destination separately; a fixture alone does not justify a framework or scaffold generator.

## Minimal Touch Map For Implementation
- Evidence: `scripts/starter-inventory.mjs` and focused tests under `scripts/tests/`.
- Pilot sources: `public/js/media/texture-slice.js`, `public/css/effects/texture-slice.css`, referenced motifs.
- Build: a capability manifest/build entry under `scripts/`, using existing CSS/build utilities where appropriate.
- Distribution metadata and consumer specimens: proposed `packages/spw-compose/`; source implementations remain under `public/`.
- Documentation: this track, existing starter convention, CSS/JS READMEs, then `/design/composition/` once behavior is proven.

## Acceptance And Validation
- Run the corrected starter inventory; reject unresolved transitive imports/assets and undeclared site dependencies.
- Test native ESM and a consumer build separately: importing one capability must not pull unrelated capability graphs.
- In the nested-path fixture, verify no missing assets, no unexpected requests/storage, and no styling changes outside opted-in hosts.
- Verify two instances, cleanup/remount, keyboard behavior where interactive, and reduced motion.
- Record raw/compressed bytes and request count for the pilot; set budgets from that baseline.
- Preserve CSS layer semantics and URL query/hash suffixes; verify source maps point to authored owners.
- Run `node --check` for changed JS, targeted tests, `git diff --check`, and `npm run check:local` for implementation patches.
- Run selector/visual checks if public nouns or attention/ink change; dependency changes require a reviewed plan and `npm run audit`.

## Stop Condition
The first implementation slice ends when texture-slice works independently with
documented dependencies and repeatable relocation checks. Broader extraction
waits for consumer evidence. This patch writes the plan and sketch only.
