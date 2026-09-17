# Template Dimensional and Editorial Refinement

## Public Goal

Make every route rendered through the shared template inherit a deliberate spatial measure, packing density, and editorial posture while preserving route-authored choices.

## Scope

- Correct the template census to distinguish `<spw-site-head>` from `<spw-site-header>`.
- Migrate the remaining 35 manual metadata heads to `<spw-page>` and `<spw-site-head>`.
- Extend page-family personality from layout/wonder/modes to the existing `context` and `density` axes.
- Add missing family defaults for `syntax-atlas` and `town-library`.
- Preserve special stylesheets, inline head blocks, metadata, and body content.
- Update the page-template authoring contract and regression coverage.

## Editorial Direction

- Reading, care, policy, chronicle, and recipe surfaces default to roomy prose.
- Software, design, specifications, tools, and experiments default to compact inspection.
- Hubs, campaigns, studios, and coordination surfaces default to balanced packing.
- `data-spw-context` remains the editorial posture; no new tone attribute is introduced.
- Creator-facing and public invitation copy remains separate from technical inspection language.

## Granular Copy Pass

- Enforce canonical Creator Identity: Lead with Spwashi ("I'm Spwashi. I build software and make art.") on shared & hub metadata.
- Tighten shared header and footer guidance before editing route-local prose.
- Replace generic operator metadata with one concrete declarative sentence per operator.
- Shorten overlong descriptions and remove repeated scaffolding terms such as “hub utility,” “stub topical path,” and “route atlas.”
- Preserve technical precision on software, design, and QA routes.
- Preserve first-person creator identity and route-specific nouns.

## Non-goals

- Do not rewrite 149 route bodies or add decorative metadata.
- Do not extract portable experiment code or redesign route content.
- Do not override any authored body layout, density, context, wonder, or modes.
- Do not introduce runtime JavaScript or new packages.

## Files

- `scripts/template.mjs`
- `scripts/migrate-route-to-template.mjs`
- `scripts/tests/template-personality.test.mjs`
- remaining manual-head route `index.html` files
- `.spw/conventions/page-template-authoring.spw`
- generated route search index

## Validation Sequence

1. Exact `<spw-site-head>` and `<spw-page>` coverage equals the route census.
2. Render all route sources with zero warnings or unexpanded directives.
3. Check authored-wins behavior for layout, density, context, wonder, and modes.
4. Run validation steps in exact order:
   a. `npm run manifest` (refreshes route runtime manifest and search index; prevents stale cache)
   b. `npm run catalog` (validates design catalog tokens and attribute surfaces)
   c. `npm run check:local` (validates all 147 rendered HTML files, CSS builds, TS, PWA, and unit tests)
   d. `git diff --check` (verifies zero whitespace or formatting errors)

## Status

- [x] Audit template coverage, page families, contexts, and spatial dependencies.
- [x] Extend shared personality dimensions and tests.
- [x] Migrate the remaining manual metadata heads.
- [x] Update the durable authoring contract.
- [x] Validate every rendered route and local contracts.
- [x] Refine shared template guidance and route metadata copy (including operator declarative sentences).
- [x] Revalidate metadata rendering and local contracts after copy edits.
