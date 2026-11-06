# Plan: model-collaborator-lore-surfaces

**Status 2026-11-06.** Parked until a shoot is booked. Nothing has landed since 2026-10-10: no terms card exists, and `/play/rpg-wednesday/lore/` is absent. When a shoot is booked, the next slice is slice 1, the terms card, gated on the creator writing its copy. Re-read 2026-11-06: the lore reader need not be a new route, because `/play/rpg-wednesday/cast/` and `/world/` have existed since 7dbd4a10 (2026-04-07) and answer "who" and "where".

**Related:** [designer-conversation-canvas](../designer-conversation-canvas/PLAN.md). **Absorbed 2026-10-06:** [town-atlas-story-kit](../archive/town-atlas-story-kit/PLAN.md).

Operation: prime. Fixity: experimental. Named slice: tools and lore a human model can work from.

## Public goal

A collaborator who models should be able to open the site and find, without a walkthrough:
the lore they would be inhabiting (town, cast, artifacts, the folio lineage), the frames a
shot should sit in, the prompts and references already in play, and the terms — credit,
consent, usage, release — written before any image is made. The surfaces exist to make
professional work easy to start and easy to keep clean; they are not a portfolio of the
collaborator and they do not describe the collaborator.

Book covers and supplemental materials (folio inserts, character sheets, town-atlas
plates, seed cards) are the first outputs.

## What already exists — 2026-09-19

- `.agents/plans/archive/rpg-asset-capture-frames` — stable screenshot-friendly frames for
  character, item, place, and artifact images (RPG Wednesday, local uploads).
- `.agents/plans/archive/town-atlas-story-kit` — the town atlas as story substrate, indexable and
  cross-linkable, separate from visitor utility.
- `.agents/plans/archive/promptable-image-library-pass` — promptable links as shareable seeds; the
  image bench; Midjourney session artifacts promoted only with a role.
- `/design/folios/#folio-request` — the request seed card; the folio soil ecosystem
  (`.spw/caches/folio-soil-ecosystem-2026-09.spw`) with production triad seed / frame /
  anchor.
- `.spw/conventions/capture-ecology.spw`, `component-capture-pipeline.spw` — capture is
  already a discipline here.

Nothing in this plan needs a new `data-spw-*` family; a lore surface is a frame with
`data-spw-role` and `data-spw-kind` the atlas already uses.

## Surfaces

1. **A lore reader** (`/play/rpg-wednesday/lore/` or a town-atlas plate): the cast, places,
   and artifacts a cover could carry, each with the one-paragraph brief the capture frames
   already want, its operator, and the plates it has appeared on. The atlas story kit
   owns the shape; this adds the reading order a model needs (who am I, where is this,
   what am I holding).
2. **A shot book**: the capture frames from `rpg-asset-capture-frames`, listed with their
   aspect ratios, the prompt seeds from the image library, and an example plate per frame.
   A model can rehearse a frame before a session.
3. **A terms card** (a seed card, screenshottable, versioned): credit line and how it is
   printed, consent scope (which outputs, which channels), usage window, release status,
   revocation path, and the contact for changes. Authored as copy on the site, exported
   as the `.spw.txt` the folio pipeline already produces, kept beside every plate. This is
   authored first and gates the other two.
4. **A working folio** for the collaboration: requests, plates, and terms as one folio
   in the soil ecosystem, so the work accrues the way the site's other folios do.

## Boundaries

- Professional and boundaried. The surfaces describe lore, frames, and terms; they never
  describe the collaborator, and the site carries no personal register about them.
- No image lands without the terms card versioned beside it. No likeness is generated or
  edited by a model tool without the same.
- Reuse the atlas, capture-frame, and folio seams; do not start a parallel gallery.

## Sequence

Each slice is one commit once the plan is unparked.

1. **Terms card.** A `terms` template in `SEED_TEMPLATES` (`public/js/modules/cards/seed-card.js`, beside `folio` and `ask`), offered only where a host names it with `data-templates="terms"`, the way `costuming` is pinned. It copies as a Spw block and exports the same `.spw.txt` the folio request does. Gate: a booked shoot, then the creator's copy. Verify: it reads on a phone, it copies, and no other host offers it. Proposal: the card is one Spw expression whose slots are its terms, such as `terms[cover]{credit consent usage release}<v1>`. A change or a revocation bumps the version, and that version is printed beside every plate, so a reader can see which terms a picture was made under without opening a document.
2. **Lore reader.** A reading order across the pages that exist: cast (who am I), world (where is this), then the artifacts (what am I holding). It is not a new `/lore/` route. Those pages belong to the RPG Wednesday route, which [profile-character-card-development](../profile-character-card-development/PLAN.md) has owned since 2026-10-10, so this slice is a request to that plan. After slice 1.
3. **Shot book.** The capture frames that `rpg-asset-capture-frames` landed live in the local gameplay kit (`/play/rpg-wednesday/#local-gameplay-kit`, with presets in `public/js/modules/rpg-wednesday/asset-atlas.js`). The shot book lists them with their aspect ratios, a prompt seed and one example plate each. After slice 1.
4. **Working folio and the first cover brief,** as one folio in the soil ecosystem (`.spw/caches/folio-soil-ecosystem-2026-09.spw`). After slices 1 to 3.

## Validation

- `npm run check:local`; `npm run manifest` after route HTML.
- The terms card exports through the existing folio `.spw.txt` path and reads on a phone.
- A cold reader can answer, from the lore reader alone: who, where, holding what.
