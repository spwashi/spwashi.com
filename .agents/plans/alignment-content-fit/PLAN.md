# Alignment Content Fit

## Public Goal

Keep reading, controls, and inspectable frames aligned from phone to wide desktop, including after a reader changes text scale with pinch or settings. Give the brochure-facing home, about, and services routes a shared outer rhythm while preserving a memorable local arrangement for each route.

## Non-Goals & Boundaries

- No broad copy rewrite or replacement of the established route identities.
- No new semantic attribute family; reuse composition, fit, pinch, and Pretext contracts.
- Pretext remains an invited measurement engine, not a live sitewide text renderer.
- Design, play, recipes, and other specialist routes keep their existing worktable, session, and publication arrangements unless a measured containment defect appears.

## Seams & Minimal Touch Files

- Shared containment: public/css/grammar/syntax.css and public/css/components/runtime-states.css
- Route fit: public/css/routes/surfaces/home.css, settings-forms.css, and topics.css
- Dimensional anatomy: route navigator + shared interactive-expression HUD, preserving the existing 0D–4D contract
- Pinch posture: existing touch-action declarations across authored CSS
- Runtime: composition-box-model, frame-metrics, fit-report catalog wiring
- Durable measurement: .spw/skills/ui-containment.spw and stylesheet-ecology.spw
- Brochure alignment: route-owned home, about, and services CSS; the shared shell continues to own the outer page edge.

## Arrangement Contract

- **Shared edge:** the main shell padding is the one public left/right datum. Route CSS must not add a second page gutter.
- **Cluster edge:** section seams run flush across the cluster track; individual frames keep their material inset and radius.
- **Home fingerprint:** a masthead followed by an atlas of balanced and full-width regions.
- **About fingerprint:** a wide identity band followed by an operating-memo register matrix.
- **Services fingerprint:** a studio-house threshold followed by a compact offer/terms/proof brochure matrix.
- **Responsive posture:** one readable column first; richer packing begins only at the established 61.25rem broadsheet rung.

## Validation Steps

1. Run breakpoint and Pretext copy probes.
2. Inspect home, about, services, settings, and Pretext at phone and 1280px desktop measures.
3. Run JS syntax checks, CSS/component contracts, navigation smoke, and check:local.

## Outcome

- Phone containment is exact on the home frame, all settings fieldsets, and the Pretext lab.
- Tablet and desktop arrangements retain their intended multi-column posture.
- Native pinch zoom remains available while the optional text-scale gesture continues through canonical settings.
- Runtime fit and frame measurements refresh after typography-setting changes without turning Pretext into a sitewide renderer.
- The 0D–4D navigator and HUD now share a clearer order/role/body/evidence rhythm, with horizontally aligned headers and evenly distributed transition feet.
- Brochure routes share the same shell edge but no longer share the same page silhouette: about opens its intended wide hero and register matrix; services packs offers and proof into editorial tracks; home keeps its atlas cadence with route-colored cluster seams.

## Audit receipts — 2026-09-17

`npm run qa:alignment` (bottom-up near-miss probe) is now the instrument for this plan; it reports clipped overflow, sibling ladders, and near-flush edges per route and viewport.

- **Failure class named:** a wrapping flex container that a route rule turns into a column, while the handles layer gives its children a 100% basis, makes that basis a height and opens one column per child. Every blog topline overran its frame by 140–196px this way; fixed by keeping the row. Rule for the containment seam: route CSS may change `align-items` and `gap` on `.frame-topline` / `.frame-heading`, never `flex-direction`.
- **Box-sizing seam:** full-width slot strips (`[data-spw-slot]`, `.spec-strip`, `.frame-operators`) now size as border-box in `runtime-states.css`, so the route-marker padding stays inside the width the card gave them.
- **Accepted, not a defect:** the hero's `.spw-living-term` inline highlight bleeds 3px past the copy box on purpose; it stays inside the frame's padding and is never clipped. Exclude inline highlights from clipped-overflow triage.
- **Next measured slice (home, pocket):** sibling ladders, not overflow — `#home-entry-panels` six panels with content edges at 44/44/44/44/47/44, the promo-wonder-cycle cards spreading label/why/cta edges by 4.5px, the returner grid by 2px, and `#choose-your-entrance` role hooks vs the depth disclosure by 6px. Each is a shared inset token missing on one member, which is the shape this plan's "cluster edge" contract forbids. Settings at pocket reports 153 near-flush edges in 36 sites and is the largest single target.
