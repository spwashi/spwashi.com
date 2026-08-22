# Landing Visual Hierarchy

## Public Goal
A first visit to a public landing should read as identity, then one notice, then one action cluster, then one proof — not as several chip rows and essays competing in the same frame.

## Date
2026-08-21 session. Operation: `audit` (this folder) then `align` (implementation packets).

## Measured companion
`../landing-page-hierarchy-2026-08-21/` records the canonical navigation census, responsive fit evidence, and 0–4D hierarchy lens. This folder owns implementation packets; the companion supplies measurements and route-specific acceptance gates.

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
Campus biome is habitat type. A seat is condition (light, disturbance, moisture, succession). A component sits by guild (ruderal, networked, stored, decomposer) and one limiting factor, usually attention or canopy. See `biome-nutrient.spw`. Packet M plants, moves, or composts on one desk. Wuxing desk diets are demoted. Model comparison (electrostatic material, thermodynamic phase, chemical/Liebig, particle conservation) lives in `climate-models.spw`. A live grower who sells PNSB is a weekly connection, not a landing mascot — see `pnsb-grower.spw`.

## Ontology harmony
Experimental models in this folder are one chord, not parallel seating rules. `ontology-harmony.spw` lists each voice with status keep, climate, authored, demote, compare, or private. Indexed: named. Structured: one seating voice. Responsive: the question picks the laboratory. Template: `../model-guided-refinement/templates/ontology-harmony.spw`.

## Session packets
Named in `session-2026-08-21.spw`. One packet per agent. Do not run two packets on the same route in parallel.

## Seams
- Primary navigation HTML: `index.html`, `about/`, `topics/`, `play/`, `design/folios/`, `services/`, `now/`, `settings/`
- Adjacent exemplars: `design/`, `recipes/`
- CSS: `public/css/routes/surfaces/home.css`, `grammar/syntax.css`, `handles/operators/sigils-and-chips.css`, `components/cards.css`
- Adjacent: `.agents/plans/wrap-job-utility/`, `card-grid-density-audit/`, `page-region-discoverability/`, `.spw/conventions/typography-packing.spw`, `region-component-ecology.spw`, `component-biome.spw`, `electrostatic-affordances.spw`

## Validation
1. Identity remains the first readable claim on each landing.
2. Above-fold action clusters ≤ 1 rail.
3. Desktop 1280 and mobile 360: braces hug sigils; cards stretch; chips nowrap.
4. Canonical-nav checks also cover 320, 390, 768, and 1280px at 100% and 125% text scale.
5. `git diff --check`, `node scripts/check-site.mjs`, and the companion validation commands after any HTML/CSS patch.
6. A claimed desk (`data-spw-cluster`) lights a six-seat trope; no new `data-spw-*` families.
