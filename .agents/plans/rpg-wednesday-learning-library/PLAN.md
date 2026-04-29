# RPG Wednesday Learning Library

## Public Goal

Make the education direction useful without scattering the site into many top-level routes. The first public surface is a namespaced town-library hub under `/play/rpg-wednesday/library/` that turns RPG Wednesday into a college-facing learning world: visitors can enter a civic-magical library, choose a quest, meet guide characters, use boonhonk as a reflection fit, plant a garden seed, and map the work to portfolio-ready college skills.

## Scope

- Add `/play/rpg-wednesday/library/` as the education-oriented hub.
- Add homepage and play-surface gateway links that point to the library without repositioning the whole site at once.
- Add RPG Wednesday route links so the existing campaign surface promotes the library as an actionable learning path.
- Improve discoverability through header navigation, contextual `data-spw-related-routes`, hero action chips, active-game cards, and route-atlas cards.
- Keep proposed future routes as anchors or route cards for now:
  - `#library-map`
  - `#guide-cards`
  - `#starter-quests`
  - `#boonhonk-fit`
  - `#college-wonder-path`
  - `#garden`
  - `#isee-map`

## Semantic Notes

- The route remains namespaced to RPG Wednesday because the town library is currently campaign canon and a live playtest surface.
- `data-spw-feature` names coherent clusters on the new route instead of creating top-level route families prematurely.
- Primary sigils declare `data-spw-operator` and `data-spw-sigil`; runtime inference remains a fallback, not the source of truth.
- Existing `public/js/spw-operators.js` now projects parsed sigil parts to the DOM so inspection can read prefix, normalized name, and label.
- Quest cards are authored as static, printable-oriented cards first. Interactive storage, upload, PDF, or share-image generation stays out of scope until a specific workflow proves useful.

## Out Of Scope

- Top-level `/library`, `/characters`, `/quests`, `/garden`, `/college`, or `/make/card` routes.
- New client-side state or localStorage.
- New JavaScript files.
- New image assets.
- Admissions-advice copy. The college bridge is studio practice, documentation, and field-of-study translation.

## Validation

- `git diff --check`
- `rg` checks for `/play/rpg-wednesday/library/` links and new anchors
- HTML sanity review around edited sections
