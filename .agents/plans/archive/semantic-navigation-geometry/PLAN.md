# Semantic Navigation Geometry

## Status

Extended and landed 2026-07-26. Quiet navigation geometry remains small, while `/tools/spw-parser/` now demand-loads a pinned browser artifact generated from the actual mounted workbench parser. The plan is closed rather than promoted into another plan index.

## Public goal

Let a reader feel the Spw structure of the current section while moving through a page: the section handle should expose a quiet, legible syntax wake derived from authored `data-spw-semantic-expression` values.

## Focus contract

- Focus dimension: operator grammar in page locomotion
- Semantic fixity: stable grammar meaning; tending visual projection
- Primary element: metal — parser-compatible structure and validation
- Secondary element: air — low-noise disclosure and reading calm
- Operation: align
- Owner surfaces: semantic expression geometry, attention architecture, cognitive-navigation convention
- Validation: parser geometry probes, module tests, runtime contracts, local site checks

## Scope

1. Add a site-owned expression-geometry reader for the browser-safe subset already projected into HTML:
   - operator sigils
   - `[]`, `{}`, `()`, and `<>` bounds
   - `<<>>` streams and `<>` couples
   - quoted spans that must not leak delimiters
2. Use the reader in bare Spw markup enhancement instead of a regex-only token pass.
3. Let the section locomotion handle summarize the nearest authored semantic expression as a compact syntax wake.
4. Extend the existing cognitive-navigation `.spw` contract; do not create a parallel navigation ontology.
5. Validate the projection against mounted workbench geometry and current module contracts.
6. Give the language a public proof surface:
   - literal editable source
   - real token stream and AST
   - visible errors and warnings
   - lossless token reconstruction
   - parser package/version/commit provenance
7. Let exact source enter the installed site app through an app-safe URL or registered `.spw` file launch.

## Minimal files

- `public/js/semantic/spw-expression-geometry.js`
- `public/js/semantic/bare-spw-markup.js`
- `public/js/runtime/attention/section-handle.js`
- `public/css/shell/chrome/section-context.css`
- `public/js/runtime/module-catalog-enhancement.js`
- `scripts/tests/spw-expression-geometry.test.mjs`
- `.spw/conventions/cognitive-navigation.spw`
- `.spw/language/feature-utilization.spw`
- `tools/spw-parser/index.html`
- `public/js/modules/tools/spw-literal-parser.js`
- `public/js/semantic/spw-workbench-parser.js` (generated)
- `public/css/routes/surfaces/tools-spw-parser.css`
- `scripts/build-spw-literal-parser.mjs`
- `manifest.webmanifest`

## Runtime posture

- No new runtime feature token.
- No new viewport detection.
- Geometry reader is pure and DOM-free.
- Existing `bare-spw-markup` and `attention-architecture` modules own scheduling and cleanup.
- Authored semantic expressions remain the source of truth; inference supplies presentation only.
- Reduced-motion users receive the same text geometry without transitional flourish.
- The full parser is route-local and demand-loaded; it is not added to the shared module catalog or every page.
- Source is carried by URL or file handle, not a new canonical localStorage key.

## Workbench boundary

The mounted workbench parser remains the full syntax authority. Two browser contracts now coexist:

- Shared navigation and bare-markup code use the small site projection. It agrees with supported workbench geometry, reports partial input, and does not claim ONF, mutation, or evaluation.
- `/tools/spw-parser/` imports a checked-in browser artifact generated from the mounted workbench parser entrypoint. Provenance is embedded at build time so deploy does not require the submodule.
- Regenerating the artifact is an explicit maintainer action: `npm run build:spw-parser`.

## Non-goals

- Shipping the TypeScript parser or workbench runtime to every route.
- Adding another `data-spw-*` namespace.
- Parsing arbitrary prose outside explicit bare-Spw or semantic-expression hosts.
- Turning every section title into an operator chip.
- Changing canonical operator meanings, storage state, or route structure.

## Validation

```bash
node --check public/js/semantic/spw-expression-geometry.js
node --check public/js/semantic/bare-spw-markup.js
node --check public/js/runtime/attention/section-handle.js
node --test scripts/tests/spw-expression-geometry.test.mjs
npm run build:spw-parser
node --import ./scripts/tests/setup-dom-globals.mjs --import ./scripts/tests/register-public-imports.mjs --test scripts/tests/spw-literal-parser-tool.test.mjs
npm run check:runtime
npm run ecology:language
npm --prefix .spw/_workbench run spw -- geometry .spw/language/feature-utilization.spw
npm run check:local
git diff --check
```

## Out of scope

- Workbench source changes
- New dependencies
- Persistent wonder memory changes
- New settings controls
