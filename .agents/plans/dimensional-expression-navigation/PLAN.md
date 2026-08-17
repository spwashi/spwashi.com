# Dimensional Expression Navigation

## Status

Implemented locally 2026-08-17 and refined with pack-local alignment, named dimensional edges, balanced five-item remainder packing, and edge-aware variant events. This is a bounded extension of `content-responsive-layout` and the closed `semantic-navigation-geometry` work, not a replacement for either. Source, generated bundles/manifests, language ecology, runtime contracts, local checks, and measured device postures are recorded beside the slice.

## Public goal

Let a reader travel from a named Spw handle to operator direction, form, field, and replayable path without first learning the site's architecture. The same path should use a narrow phone as a calm touch rail, a medium container as a wrapping study grid, and a wide container as one legible five-part field.

The relation between dimensions is an edge, not a generic “next”: `direct`, `bound`, `situate`, `replay`, then `return`. Layout variants follow the same rule by preserving their `from → to` transition instead of reporting only the selected endpoint.

## Focus contract

- Focus dimension: `dimensional-expression-navigation` experience slice
- Operation: `align`
- Semantic fixity: stable dimensional meaning; tending visual and interaction projection
- Primary element: air — responsive measure, breathing room, and disclosure
- Secondary element: metal — ordered dimensions, real destinations, and testable geometry
- Owner surfaces: software route HTML/CSS, expression geometry, interactive expression HUD, slice contract
- Validation: geometry tests, language ecology, local checks, and browser widths from 320px through wide desktop

## Dimensional contract

| Order | Reader-facing role | Source |
|---|---|---|
| 0D | Handle — name the thing | expression root or address |
| 1D | Vector — choose a directed operator | authored operator |
| 2D | Form — contain a mode, scene, topic, or practice | paired boundary |
| 3D | Field — relate the expression to host context | route/section semantics |
| 4D | Path — revisit or replay a consequence | runtime route, checkpoint, or spell |

Text geometry may prove 0D–2D. The interface must present 3D and 4D as host/runtime projections, never pretend they were parsed from the string.

## Implementation

1. Add a semantic five-stop navigator to `/topics/software/` using existing anchors and route destinations.
2. Add a route-owned component whose base posture is a horizontal snap rail, whose medium posture is an auto-fit grid, and whose wide posture is five equal columns; keep it out of the shared bundle until a second consumer appears.
3. Export a pure 0–4D contract from `spw-expression-geometry.js` and report which dimensions are authored versus contextual.
4. Upgrade the existing expression HUD with real dimension destinations and viewport-clamped positioning.
5. Keep the HUD demand-coupled and reuse the existing module; add no feature token, storage key, parser authority, or viewport listener outside its visible lifetime.
6. Opt the route component into the existing pack-local mirror, align its 26rem/44rem arrangement edges with the shared stack/split/feature bands, and keep CSS—not the mirrored attribute—as geometry authority.
7. Pack five cards as `2 + 2 + 1`, then `3 + 2`, then `5` as component width grows; each row spends the full available measure.
8. Make variant-selection events report their previous and selected endpoints as an inspectable edge while keeping authored defaults local to each group.

## Boundaries

- No global layout rewrite, new breakpoint family, CSS layer reorder, or dependency.
- No new `data-spw-*` namespace and no decorative operator-chip proliferation.
- No inferred 3D field or 4D history from source text alone.
- No workbench changes, canonical operator changes, or settings-storage changes.
- Keep authored expressions useful without JavaScript; the main dimensional path is ordinary HTML links.

## Validation

- `node --check public/js/semantic/spw-expression-geometry.js`
- `node --check public/js/runtime/interactive-expression-lab.js`
- `node --import ./scripts/tests/register-public-imports.mjs --test scripts/tests/spw-expression-geometry.test.mjs`
- `npm run ecology:language`
- `npm run check:local`
- `git diff --check`
- Browser smoke at 320px, 768px, 1280px, and 1920px; verify no page overflow, 44px touch targets, keyboard order, HUD clamping, and all five destinations.
