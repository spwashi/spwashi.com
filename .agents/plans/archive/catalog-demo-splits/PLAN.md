# Design Catalog Field Guide

## Public Goal

Turn the generated design catalog into a visitor-readable field guide: stills should help people study component anatomy, typography, layout pressure, recurring visual tropes, and then wander back into the live routes that produced them.

The complete scan remains canonical in `catalog.json`; the HTML should reveal it in useful rooms instead of placing thousands of records in one opening page.

## Semantic Posture

- Operation: `prime` the still-study direction, then `align` the generated surfaces.
- Fixity: `tending`; scanner facts and existing component/capture contracts remain stable.
- Focus: hierarchy and discovery.
- Elements: air for readable disclosure; wood for routes that invite continued study.

## Non-Goals & Boundaries

- Do not publish the gitignored visual-capture archive or treat every screenshot as a public asset.
- Do not add image generation, packages, a framework, or a global runtime module.
- Do not invent new `data-spw-*` families or change canonical operator meanings.
- Do not turn visual similarity into an automated quality score; stills provide evidence and questions.

## Visitor Lenses

1. Component — compare slot order, edges, actions, and density.
2. Type — compare hierarchy, line length, wrapping, and reading rhythm.
3. Layout — compare device-reason stills for clipping, empty tracks, and over-regular grids.
4. Trope — name the material, motif, posture, and composition worth carrying into another page or model prompt.

## Seams & Minimal Touch Files

- Generator, scanner, and route-local runtime/CSS: `scripts/generate-design-catalog.mjs`
- Generated public rooms: `/design/catalog/`, `/design/catalog/assets/`, `/design/catalog/tokens/`, `/design/catalog/systems/`
- Design-hub links already point at the asset and token rooms.
- Durable screenshot boundary: `.spw/conventions/component-capture-pipeline.spw`
- Targeted scanner tests: `scripts/tests/infrastructure-contracts.test.mjs`

## Runtime Contract

- Search/filter state is URL-restorable and local to the catalog.
- The overview searches the canonical JSON graph without rendering the entire graph up front.
- Child indexes remain meaningful before JavaScript; enhancement adds filtering, density, copy briefs, and back-to-top behavior.
- Search results are capped and link to the complete child indexes.

## Validation

1. `node --check scripts/generate-design-catalog.mjs`
2. `node --check design/catalog/catalog.js`
3. `node --test scripts/tests/infrastructure-contracts.test.mjs`
4. `npm run catalog && node scripts/generate-design-catalog.mjs --check`
5. `npm run check:local`
6. Browser review at pocket and broadsheet widths for all four generated routes.

## Status

- [x] Public direction and capture boundary named.
- [x] Image use and route context added to the scan.
- [x] Overview and child indexes generated.
- [x] Route-local CSS/runtime refactored.
- [x] Responsive and local contract checks pass.
