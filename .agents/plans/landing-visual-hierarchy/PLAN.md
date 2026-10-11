# Landing Visual Hierarchy

**Status 2026-10-10.** The single landing owner. Landed: the early visual pass on Home, Play and Design (3a95fe06) and parcel D's home masthead (b5dfea29). Next slice: parcel B, the Services offer ahead of its tuning panel (see Absorbed below). Parcel D waits while Home is still moving (8b1f44e7, 9c8a7d97, Oct 6–8), and its browser matrix has not run.

**Related:** [layout-seat-squeeze](../layout-seat-squeeze/PLAN.md) · [alignment-content-fit](../archive/alignment-content-fit/PLAN.md). **Absorbed 2026-10-10:** [landing-page-hierarchy-2026-08-21](../archive/landing-page-hierarchy-2026-08-21/PLAN.md).

## Public Goal
A first visit to a public landing should read as identity, then one notice, then one action cluster, then one proof — not as several chip rows and essays competing in the same frame.

## Date
2026-08-21 session. Operation: `audit` (this folder) then `align` (implementation packets).

## Measured companion
The navigation census, responsive fit evidence and 0–4D hierarchy lens stay in [the archived companion](../archive/landing-page-hierarchy-2026-08-21/PLAN.md) as reference. The parcels and acceptance gates still owed now live here, under Absorbed.

## Fixity
Tending visual hierarchy. Stable contracts: creator identity, CSS layer order, wrap-job physics, card slot anatomy.

## Non-Goals
- Rewriting landing copy
- New `data-spw-*` families
- Sitewide card restyle
- Mixing `.agents`/`.spw` with public HTML/CSS in one patch
- Wuxing desk diets, NPK attributes, or a Standard Model of teams

## Findings (see `audit.spw`)
- Home `#home-frame` stacks identity, lens, wrap-jobs, motifs, reasons, narration, and eight quick-start chips in one entry spine.
- Three “pick a door” clusters follow: entrance hooks, discovery cards, illustrated entry cards.
- Chip families split: `.spw-chip`, `.operator-chip`, `.frame-sigil` in the same column.
- About and topics put figure/hook before the identity sentence on some layouts.
- Recipes hook ledes still join sibling verbs with dots (`mise.timing.execution`).

## Regions as desks
Existing `data-spw-cluster` wrappers are team desks. Inner frames supply climate via `hook|hub|cluster|path|read|wide` so region-seats tropes light. Campus biome is authored `data-spw-biome` only. See `region-ownership.spw`. Packet L graduates nicknames or unset climates on one claimed cluster. Do not add empty wrappers, a seventh seat, or team-color CSS.

## Biome seating
Reference material, not a work queue: `biome-nutrient.spw`, `climate-models.spw`, `pnsb-grower.spw` and `ontology-harmony.spw` stay for comparison, and no packet draws on them this season.
Campus biome is habitat type. A seat is condition (light, disturbance, moisture, succession). A component sits by guild (ruderal, networked, stored, decomposer) and one limiting factor, usually attention or canopy. See `biome-nutrient.spw`. Packet M plants, moves, or composts on one desk. Wuxing desk diets are demoted. Model comparison (electrostatic material, thermodynamic phase, chemical/Liebig, particle conservation) lives in `climate-models.spw`. A live grower who sells PNSB is a weekly connection, not a landing mascot — see `pnsb-grower.spw`.

## Ontology harmony
Experimental models in this folder are one chord, not parallel seating rules. `ontology-harmony.spw` lists each voice with status keep, climate, authored, demote, compare, or private. Indexed: named. Structured: one seating voice. Responsive: the question picks the laboratory. Template: `../reference-assignment-template/templates/ontology-harmony.spw`.

## Session packets
Named in `session-2026-08-21.spw`. One packet per agent. Do not run two packets on the same route in parallel.

## Seams
- Primary navigation HTML: `index.html`, `about/`, `topics/`, `play/`, `design/folios/`, `services/`, `now/`, `settings/`
- Adjacent exemplars: `design/`, `recipes/`
- CSS: `public/css/routes/surfaces/home.css`, `grammar/syntax.css`, `handles/operators/sigils-and-chips.css`, `components/cards.css`
- Adjacent: `.agents/plans/archive/wrap-job-utility/`, `card-grid-density-audit/`, `page-region-discoverability/`, `.spw/conventions/typography-packing.spw`, `region-component-ecology.spw`, `component-biome.spw`, `electrostatic-affordances.spw`

## Validation
1. Identity remains the first readable claim on each landing.
2. Above-fold action clusters ≤ 1 rail.
3. Desktop 1280 and mobile 360: braces hug sigils; cards stretch; chips nowrap.
4. Canonical-nav checks also cover 320, 390, 768, and 1280px at 100% and 125% text scale.
5. `git diff --check`, `node scripts/check-site.mjs`, `node scripts/spw-anatomy-audit.mjs`, `npm run audit:copy:align`, `node scripts/normalize-breakpoints.mjs`, `npm run smoke:nav:ci` and `npm run check:local` after any HTML/CSS patch.
6. A claimed desk (`data-spw-cluster`) lights a six-seat trope; no new `data-spw-*` families.

## Early visual pass · 2026-09-27

Operation: `align`; fixity: tending. Browser inspection showed About already pairs its first claim with a visible figure, while Play and Design defer their first artwork past the opening controls and copy. Home now places a folio preview beneath the creator sentence. Play and Design reuse existing small derivatives in their entry hooks through one shared, static figure style. Play also needs a dark route palette whenever the site's color mode resolves dark; its former fixed pale surface sat under light inherited heading ink.

Validation: pocket and desktop browser views show the Home card and the Play and Design previews in the opening screen; the Play auto-dark view now keeps heading ink legible against its route surface. The copy accessor and module selector audits passed. Keep the full figures and route links where they are; these small previews make the subject visible at entry.

## Absorbed 2026-10-10 — landing-page-hierarchy-2026-08-21

Source: [landing-page-hierarchy-2026-08-21](../archive/landing-page-hierarchy-2026-08-21/PLAN.md). Parcel A is done: `play/index.html` no longer jumps from H1 to H3. Still owed, in order, one parcel per agent, claimed in `session-2026-08-21.spw`:
- **B, `services/index.html` (next):** put offer, proof and action ahead of optional tuning. `#services-tuning` (line 215) still precedes `#three-paths` (338) and `#pricing` (615). Keep the pricing and contact paths.
- **C, `settings/index.html`:** group Quick Start into task-shaped regions with progressive disclosure. The page still has no authored `data-spw-cluster`.
- **D, `index.html` + `about/index.html`:** primary, secondary and tertiary region weights. The masthead (b5dfea29) is unseen at pocket, fold and broadsheet; run that matrix before continuing, and wait while Home is moving. Left for a browser: the split rail seated by `grid-row: 1 / span 99` (`shell/layout.css:492`), the header sigil and toggle re-placed in toggle mode (`shell/chrome/navigation.css`), and the home h1's ≤48rem viewport query beside its 32rem container query.
- E (Topics, Art) and F (Now) move only on a measured defect; Now is the restraint control.
- Gates: the outline never skips a level; route identity, opening promise and one next move sit within two viewport heights; no body overflow at 320, 390, 768 or 1280px at 100% and 125% text; every added cluster answers a reader task; the eight route fingerprints stay distinct. Run a manual pass with reduced motion and keyboard only.
