# Plan: Skill-Folio Operating System

## Context & Objectives
Update **spwashi.com** into a clearer public surface for skill development, artifact processing, visual systems, and community-rooted creative practice.

The site presents Spwashi as a creator who builds software and makes art, with recurring work organized into durable artifacts: folios, cards, routes, diagrams, notes, sessions, tools, and reusable practice loops.

This plan tracks the folio archive route at `/design/folios/` and its integration into navigation, shared chrome, and adjacent learning surfaces.

## Strategic Goals

- **Clarify the site's role:** Frame the site as a creator identity, visual archive, and route map for teaching/collaboration.
- **Connect art and software:** Make the relationship between visual practice (composition, hierarchy, material judgment) and software practice (structure, interfaces, systems) legible.
- **Establish the folio archive:** Establish the laminated folio archive as a first-class public surface.
- **Grounded Language:** Favor concrete nouns (folio, card, route, diagram, proof, artifact) and verbs (notice, name, make, test, package, share, return).

## Model-Guided Rail

- **Focus dimension:** artist-maker bridged to visual-system design.
- **Semantic fixity tier:** initial folio archive route structure, using existing card/panel metadata and layouts.
- **Primary element:** wood, because we are initiating a new branch for the folio archive that will grow.
- **Secondary element:** metal, because the route introduces initial card-field candidates.
- **Owner surface:** this plan, `.agents/plans/skill-folio-operating-system/wip.spw`, and `design/folios/index.html`.
- **Validation path:** `npm run check:local` and verifying the route renders correctly.
- **Do not touch yet:** homepage hero copy, about/services wholesale rewrites, product lines, or site graph automation.

## Landed (Phase 1)

### Routes
1. **Folios route (`/design/folios/index.html`)**: Public archive with hero, reading lenses, processing loop, seed studies, training/community value, and adjacent routes.
2. **Design Hub (`/design/index.html`)**: Route bridge, operator chip, and spoke card for discoverability.
3. **Cards (`/cards/index.html`)**: Folio archive link in semantic anchors.
4. **Footer site map**: Folios entry under Design.

### Shared integration
- Folio lens switchers wired through the shared `mode-switch` runtime (`data-mode-group` / `data-mode-panel`).
- Folio surface CSS in `public/css/routes/design-surface.css`.
- Navigation trail registry entries for design, folios, cards, curriculum, and craft.
- Spell pocket (cauldron) defaults compact with discoverability copy; floating chip opens and respects user preference.
- Navigation trail collapsed by default with closed-state hints on all viewports; inspect trail tucked behind `<details>`.

## Next Planning Steps
1. **Phase 2:** Connect the folio route into `.spw/site.spw`, `.spw/surfaces/product-lines.spw`, and `/curriculum/`.
2. **Phase 3:** Update homepage, about, and services copy to name folios alongside cards and curriculum.