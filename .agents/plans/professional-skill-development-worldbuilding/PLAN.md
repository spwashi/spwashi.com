# Plan: Professional Skill Development & Worldbuilding Architecture

## Context & Objectives
We want to reframe the relationship between worldbuilding/character design and professional/technical skill development.
Instead of treating play as a mere metaphor for work, we frame **character development and worldbuilding as active, immersive sandboxes for practicing, discovering, and mapping professional capabilities** (e.g. system design, accessibility, information architecture, interface prototyping).
This creates an immersive reason to engage in both sides of the mirror.

The larger product thesis is:

```text
spwashi.com as an immersive skill-development operating system
```

The public promise should be narrower and more usable than the architecture:

```text
Spwashi helps people convert imagination into operational capacity.
```

The core loop:

```text
choose/build a character
-> define pressures and constraints
-> fund a sprint
-> play/simulate/practice
-> log evidence
-> publish or reuse the artifact
-> choose the next quest
```

## Model-Guided Rail

- **Focus dimension:** writer-worldbuilder bridged to engineer-toolmaker and patron-collaborator.
- **Semantic fixity tier:** stable thesis, tending public copy, experimental card-protocol fields until repeated across routes.
- **Primary element:** metal, because the valuable change is schema, evidence, and route contracts.
- **Secondary element:** wood, because the system should support growth, quests, and practice over time.
- **Owner surface:** this plan plus `wip.spw`; public routes are follow-on implementation surfaces.
- **Validation path:** `rg` for the loop terms, route anchors, `data-spw-card`, `data-spw-skill`, `data-spw-evidence`, and `git diff --check`.
- **Do not touch yet:** shared CSS, shared JS runtime state, dependency surfaces, or route-wide component rewrites.

## Routes & Changes
1. **Home (`/index.html`)**: Update the RPG Wednesday card to emphasize that worldbuilding is a training ground for systems engineering and structured collaboration.
2. **Tools Index (`/tools/index.html`)**: Reframe the character sheet description to show how designing character pressures and tools directly maps to designing technical portfolios and collaborative roles.
3. **Character Sheet Builder (`/tools/character-sheet/index.html`)**: Update the lede, subheadings, and fields to prompt users to think about their professional trajectory as an immersive character arc.
4. **RPG Wednesday main page (`/play/rpg-wednesday/index.html`)**: Re-align the action prompts and cards to prompt action and highlight skill growth.
5. **Town Library (`/play/rpg-wednesday/library/index.html`)**: Reframe the "Considering college? Build a world first" sections to highlight how worldbuilding practices translate directly to real-world academic/professional domains.

## Architecture Moves

### Narrative Architecture

The visible layer should make routes feel like parts of one learning world:

- character sheets become identity models
- RPG Wednesday becomes the weekly simulation loop
- budgeting becomes sprint funding and pressure planning
- the Town Library becomes the knowledge, quest, and evidence registry
- Local Proof Cards become shareable artifacts and receipts

### Semantic Architecture

The HTML/data layer should let future tools inspect what each card or surface is doing without inferring from prose alone. Candidate card-protocol attributes:

- `data-spw-skill`
- `data-spw-discipline`
- `data-spw-pressure`
- `data-spw-output`
- `data-spw-timebox`
- `data-spw-evidence`
- `data-spw-next`

These fields are experimental until they appear on repeated card families with a clear contract. The first likely home is Town Library quest and guide cards, because they already name mechanic, quest, college skill, and portfolio output.

### Runtime Architecture

Do not introduce new runtime state yet. The current architectural rule is enough:

```text
html = dynamic global state
body = static route metadata
component = local semantic object
```

If the evidence loop later becomes interactive, state should flow through existing local-first tool patterns and `site-settings.js` ownership rules instead of direct ad hoc storage.

## Evidence Engine

The strongest missing loop is:

```text
build -> fund -> play -> log -> publish -> reuse
```

Useful concepts:

- `log`: records what happened
- `artifact`: captures output
- `receipt`: proves work occurred
- `signal`: turns work into portfolio value
- `reflection`: converts activity into learning
- `next quest`: keeps the loop alive

Initial copy should prefer concrete, low-friction outputs: screenshot, route map, one-page diagram, object card, session note, prompt packet, budget goal, proof card.

## Implementation Sequence

1. Cache the thesis and card protocol in `wip.spw`. Done.
2. Update route copy in the smallest honest places listed above. First pass done for Home, Tools, Character Sheet, RPG Wednesday, and Town Library.
3. Add experimental `data-spw-*` protocol fields only to existing card elements that already express the relevant concepts. First pass done on Town Library guide and starter quest cards.
4. Validate with `rg` for route anchors, protocol attributes, and balanced local copy context.
5. Promote the protocol into `.spw` conventions only after at least two card families use it cleanly.

## Landed Slice: Town Library Evidence Briefs

The first implementation slice adds experimental evidence protocol fields to Town Library guide and quest cards, then hydrates those cards with a copyable evidence brief through `public/js/modules/rpg-wednesday.js`.

Touched surfaces:

- `index.html`
- `tools/index.html`
- `tools/character-sheet/index.html`
- `play/rpg-wednesday/index.html`
- `play/rpg-wednesday/library/index.html`
- `public/css/components/cards.css`
- `public/js/modules/rpg-wednesday.js`

The interaction deliberately stays route-local to RPG/Town Library surfaces. It does not add new global runtime state, localStorage keys, or dependencies.

## Risks

- Over-framing play as productivity can flatten the fantasy and make the site feel extractive.
- Adding many `data-spw-*` fields before a contract exists can create semantic drift.
- Treating budgeting as a generic finance tool can weaken the specific sprint-funding idea.
- Public copy can become too abstract if it says "Skill OS" without giving a concrete first action.

## Out Of Scope For This Plan

- New npm packages or client-side frameworks.
- New account, cloud storage, or social features.
- Shared JS state-machine changes before the local evidence loop is proven in route copy and local tool affordances.
- Renaming existing routes or moving assets.
