# Plan: model-collaborator-lore-surfaces

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

- `.agents/plans/rpg-asset-capture-frames` — stable screenshot-friendly frames for
  character, item, place, and artifact images (RPG Wednesday, local uploads).
- `.agents/plans/town-atlas-story-kit` — the town atlas as story substrate, indexable and
  cross-linkable, separate from visitor utility.
- `.agents/plans/promptable-image-library-pass` — promptable links as shareable seeds; the
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

1. Terms card copy and seed-card export (gate for everything after).
2. Lore reader on the atlas plate, reading order first.
3. Shot book from the existing capture frames.
4. Working folio; first cover brief.

## Validation

- `npm run check:local`; `npm run manifest` after route HTML.
- The terms card exports through the existing folio `.spw.txt` path and reads on a phone.
- A cold reader can answer, from the lore reader alone: who, where, holding what.
