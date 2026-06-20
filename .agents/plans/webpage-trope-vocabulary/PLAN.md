# Webpage Trope Vocabulary

## Public Goal

Make the site introduce itself as a literal website and reference document before it asks visitors to understand broader metaphors. The home page should refer to itself as the home page, while supporting routes can introduce more illustrative anchors for page anatomy, restaurant ownership, and garden maintenance.

## Scope

- Home route: literal self-reference, smaller first-screen copy, page anatomy anchors.
- Website field guide: reference-document vocabulary for masthead, route bridge, inspection, and publishing surfaces.
- Site design route: diagrammatic surface anatomy as a reusable design trope.
- Recipes route: restaurant and garden anchors that connect ownership, service, maintenance, and seasonal practice.
- Shared CSS: color-coded anatomy anchors with stable sizing, hover/focus/tap states, and readable reduced-motion behavior.
- Shared JS: progressive enhancement for anatomy focus, pinning, load timing, and cross-route inspection state.
- Floating chrome: explicit island anatomy, dismiss affordances, z-index and compact placement rules.
- Serialization: route-level Spw snapshots that include page anatomy, parallel groups, publisher signals, palette ecology, and floating islands.
- Publisher surfaces: inline semantic emphasis, audience/disclosure/trope/timing metadata, and mature/context-sensitive joke pathways that stay generous by default.
- Palette ecology: theme packs act like biomes, palette resonance acts like species pressure, and material settings act like surveying lenses for overlays and inline foregrounds.
- `.spw` surfaces: durable contract for the vocabulary stem and validation path.

## Semantic Rails

- Focus dimension: `slice = webpage-reference-document`.
- Fixity tier: stable vocabulary contract, tending route copy, experimental microinteraction timing.
- Primary element: metal, because the feature is a reference-document schema.
- Secondary element: wood, because restaurant/garden ownership is framed as maintenance and seasonal tending.
- Owner surfaces: route HTML, `public/css/components/page-anatomy.css`, `public/js/runtime/page-anatomy.js`, `public/js/runtime/region-menu.js`, `.spw/conventions/page-anatomy-vocabulary.spw`.

## Risks

- The home page could become too abstract again if route copy talks about "home" as a life concept instead of this page.
- Anatomy labels could become decorative noise if they are not tied to route-specific examples.
- Floating chrome changes can break keyboard or touch flows if dismissal is too aggressive.
- Publisher metadata could become a dumping ground unless it stays tied to audience, disclosure, timing, and spatial affordance.
- Context-sensitive humor can alienate readers if it appears before the page has established consent, audience, and route-local context.

## Validation

- `node --check` for touched JS modules.
- `git diff --check`.
- `npm run check:local`, with generated CSS bundle changes kept when they mirror source CSS.
- Targeted `rg` checks for `data-spw-anatomy`, `page-anatomy`, `region-menu-popover`, and home-page self-reference.
- Targeted `rg` checks for `data-spw-parallel`, `data-spw-inline-tone`, `data-spw-audience`, `data-spw-disclosure`, and `__SPW_PAGE_ANATOMY__`.

## Out Of Scope

- A full redesign of the home page.
- New npm packages or runtime frameworks.
- Moving route files or renaming existing assets.
