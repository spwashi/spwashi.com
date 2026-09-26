# Landing Page HTML Hierarchy — 2026-08-21

## Owner Relationship

This dated folder is the measured primary-navigation companion to `../landing-visual-hierarchy/`, which remains the active implementation owner. Use this folder for the eight-route census, 0–4D review lens, and responsive gates; claim implementation work in the owner plan so concurrent agents do not create competing patches.

## Public Goal

Make the eight primary navigation landings recognizable at a glance: one clear opening promise, one legible next move, deliberate cluster boundaries, and device-stable sizing/alignment. Preserve route-specific density and personality instead of making every page share one silhouette.

## Declared Focus

- Operation: `audit`; semantic fixity: `tending`.
- Primary dimension: page region and visual hierarchy; supporting dimension: containment and spacing.
- Primary element: air (measure, breath, disclosure); secondary: metal (outline, boundaries, validation).
- Owner surface for the first patch: route HTML. Route CSS follows only where structure cannot carry the distinction.
- Do not touch shared runtime, CSS layer order, canonical creator identity, or operator meanings.

## Scope

- `/`, `/about/`, `/topics/`, `/play/`, `/design/folios/`, `/services/`, `/now/`, `/settings/`.
- Review headings, opening intent, section order, component slots, cluster boundaries, action placement, figure/prose balance, and responsive title fit.
- Treat `/now/` and `/design/folios/` as restraint references, and `/settings/` as a utility workbench rather than a brochure.

## Evidence Snapshot

- Density spans 15,195 bytes (`/now/`) to 227,169 bytes (`/settings/`); equal density is not a goal.
- `/play/` moves from H1 to H3 before its first H2.
- `/services/` presents tuning before the central offer taxonomy.
- `/settings/` has 49 buttons and 13 disclosure groups but no authored cluster markers.
- Pretext marks the `/topics/` H1 and `/settings/` hook volatile at 288px.
- Shared core CSS is 1,629 KiB against a 1,638 KiB soft budget; route-local structure is the first lever.

## Sequence

1. Repair outline and opening intent in HTML: Play, Services, Settings.
2. Clarify dense editorial tiers without flattening voice: Home, About.
3. Preserve visual-directory and folio identities while checking figure/prose packing: Topics, Art.
4. Use Now as the restraint control; change it only when a measured defect appears.
5. Run the phone/tablet/desktop matrix before any shared CSS proposal.
6. Promote only repeated, named needs to route CSS; one CSS owner at a time.

## Reviewable Work Parcels

- A — `play/index.html`: restore a coherent heading outline and name the entry action without adding wrappers.
- B — `services/index.html`: put offer/proof/action ahead of optional tuning; preserve pricing and contact paths.
- C — `settings/index.html`: group Quick Start into task-shaped regions and improve progressive disclosure.
- D — `index.html` + `about/index.html`: establish primary, secondary, and tertiary region weights while preserving copy.
- E — `topics/index.html` + `design/folios/index.html`: protect visual identity, fix only measured title/figure packing.
- F — `now/index.html`: validation control and support-action comparison; no speculative expansion.

## Acceptance Gates

- Main outline never jumps from H1 to H3; heading levels express content nesting, not font size.
- Within the first two viewport heights: route identity, opening promise, and one meaningful next move are legible.
- No body-level horizontal overflow at 320, 390, 768, or 1280px; test 100% and 125% text scale.
- Cluster starts align to the owning page track; nested components do not create a second accidental gutter.
- Every added cluster answers a reader task; no empty wrapper exists only for metadata.
- Route fingerprints remain distinct: creator atlas, identity memo, topic atlas, play threshold, folio loop, service ladder, live bulletin, settings workbench.

## Validation

- `node scripts/spw-anatomy-audit.mjs`
- `npm run audit:copy:align`
- `node scripts/normalize-breakpoints.mjs`
- `npm run smoke:nav:ci`
- `npm run check:local`
- Manual matrix with reduced motion plus keyboard-only traversal.

## Non-goals

- No universal hero, action-slot, grid, or metadata migration.
- No copy rewrite solely to satisfy a line-count score.
- No new runtime state, dependency, or sitewide `data-spw-*` family.
- No ornamental pass until hierarchy and containment pass at phone width.

## Session State

Review and planning are complete for 2026-08-21. Implementation has not started.

2026-09-26, parcel D, first structural patch (creator: desktop layout fundamentals were too dependent on compromises with the mobile version; refine the HTML semantics). The home hero was one flat list of eleven siblings that CSS reordered twice: an `order: 1–13` ladder for the pocket column and `grid-column`/`grid-row: 1 / span 6` placements for broadsheet, with rows for elements the hero no longer holds. The markup now says the structure both layouts share: an `<hgroup>` binds kicker, headline, and tagline; `.home-masthead` holds that plus the lede and notes; `.home-hero-rail` (an aside) holds the two figures. `home.css` places by named area — pocket `masthead / hook / motifs / reasons / narration / rooms`, broadsheet `masthead hook` on one row, wide `copy rail` — so DOM order is the pocket order and no child is placed by count. The three wrappers each name an area the CSS spends; none exists for metadata. Not yet seen at pocket, fold, or broadsheet; run the matrix before parcel D continues.

Second patch, same day, wider pass over the home route. Structure now addresses what a roster remembered: the pocket padding rule keys `main.home-atlas-flow > [data-spw-cluster] > .spw-frame` instead of twelve section ids, so the four it had missed (living concepts, learning use, reader-builder paths, wonder kin) pack to the same 0.9rem as their siblings — the one visible change, at pocket only. Dead viewport branches removed: the hero topline's pocket and desktop `grid-template-areas` (the topline is flex everywhere, and no script creates the compose field or copy inspector they placed), and three `main > .spw-frame` rules that matched nothing once sections moved into clusters. Found and left for a browser: `shell/layout.css` split seats its rail by `grid-row: 1 / span 99` and `order: 99` because no reading-column element exists (one route, /design/, authors the rail last, so the order is a fence); `navigation.css:1359` re-places the header sigil and toggle by row and column over their named areas in toggle mode; the home h1's ≤48rem viewport query beside its 32rem container query is the miss `page-frame-sizing.spw` already names, and wants its probe first; the entrance sorter stacks a role-hook list, five asides, and a panel grid full-width at every width, which is a seating decision, not a markup one. Extend `session-2026-08-21.spw` with evidence, then claim the corresponding packet in `../landing-visual-hierarchy/session-2026-08-21.spw` before changing route files.
