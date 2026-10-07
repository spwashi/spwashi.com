# Discovery Powerups

## Public Goal

Make vocabulary and route regions behave like rediscoverable material: a visitor should be able to find a term, understand why it matters, gather it into the cauldron, and use it to compose an arc across the site.

## Semantic Tier

- Fixity: `experimental`
- Operation: `prime`
- Focus dimension: `slice=discovery-powerups`, `region=topics/search`, `component=cauldron ingredients`
- Primary element: `wood` for growth and practice loops
- Secondary element: `metal` for search, indexing, and path integrity
- Owner surfaces: `/topics/search/`, `/topics/pedagogy/`, `/topics/`, `/`, `.spw/conventions/discovery-powerups.spw`

## Contracts

- Term powerup: a vocabulary handle that changes what nearby routes, ingredients, or prompts make available.
- Regional powerup: a route-region affordance such as studio, library, garden, theater, workshop, or lab.
- Arc seed: a sequence of terms and routes that can be revisited as a practice path.
- Conduit event: a named path from curiosity to a public artifact, session, screenshot, prompt packet, or proof card.

## Applied Learning Science + Search

- Retrieval practice: routes should leave handles that a visitor can reconstruct later.
- Query formulation: search should reward naming a better question, not only finding a page.
- Interleaving: route suggestions should cross domains so software, art, play, pedagogy, and production inform each other.
- Sensemaking: pages should expose why a term belongs to a region and what it can unlock.
- Desirable difficulty: discovery can be playful and slightly strange if the next action remains legible.

## Current Patch

- Add `/topics/search/` as the explicit search and rediscovery route.
- Wire topic and pedagogy routes toward the new surface.
- Add homepage copy that names rediscovery as a reward of attention.
- Prime the reusable semantic family in `.spw/conventions/discovery-powerups.spw`.
- Extend spell copy across home, about, play, tools, services, cards, and topics so spells read as portable semantic recipes rather than decorative effects.

## Spell Dimensions

- Anchor spell: route fragment and return path.
- Cluster spell: related terms that can become a prompt packet or proof card.
- Component spell: reusable surface kind such as frame, panel, chip, card, or footer console.
- Settings spell: reading climate and behavior controls that explain how a screenshot was produced.
- Attribute spell: `data-spw-*` structure that keeps semantics legible to people, agents, and future maintenance.
- Event spell: curiosity-to-output path for sessions, image drops, teaching sprints, and community production.

## Validation

- `git diff --check`
- `npm run check:local`
- targeted route/contract search for `topics/search` and `discovery-powerups`
