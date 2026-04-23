## Goal

Make RPG Wednesday, character development, and nearby design routes feel more like live thinking surfaces:

- `swag` and `dice` become valid local asset concepts instead of only `item` and `threat`
- topic links read as metacognitive handles for the kind of thinking a visitor needs next
- some component descriptions carry a clearly identified narrator voice so dialogue and characterization can accumulate over time

## Public outcome

- Visitors can treat topic links as practical thinking moves:
  - algorithms for procedure
  - statistical analysis for evidence
  - scale intuition for scope
- RPG Wednesday gains more playful “what if we…” seed language around:
  - title-first scene cards
  - dice reads
  - swag / props / souvenirs
  - spoken hooks for demos, screenshots, and later prompt packets
- Character development feels more individual and more beautiful at the point of portrait upload.
- The component glossary models a narrator-style description pattern instead of reading only like neutral documentation.

## Likely files

- `play/rpg-wednesday/index.html`
- `play/rpg-wednesday/character/index.html`
- `play/rpg-wednesday/arcs/index.html`
- `design/index.html`
- `design/components/index.html`
- `public/js/rpg-wednesday-state.js`
- `public/js/rpg-wednesday-asset-atlas.js`
- `public/js/rpg-wednesday-character-lab.js`

## Constraints

- Keep the patch copy-first and reversible.
- Prefer existing frame/card primitives over inventing a new component family.
- Use `swag` rather than `loot`.
- Keep the narrator voice explicit enough to be recognizable, but not so theatrical that it stops being useful UI copy.

## Validation

- `node --check public/js/rpg-wednesday-state.js`
- `node --check public/js/rpg-wednesday-asset-atlas.js`
- `node --check public/js/rpg-wednesday-character-lab.js`
- `git diff --check`
- `npm run check`

## Out of scope

- new storage models
- new art-generation runtime
- a dedicated topic route for linguistics in this pass
