# Relational Attention Media

## Public Goal

Make attention and meditation practical relational dimensions across the site: self relation, local context, and global horizon. Use those dimensions to generate stable, copyable media seeds across prose, lyric, visual, storyboard, audio, and curriculum work.

Extend that surface so a generated seed can also become a lightweight canon increment: a proof card, Town Atlas note, or markdown artifact that preserves source ingredient, posture, and next action without needing a remote model call.

## Scope

- `index.html`: homepage reason strip names attention as relational infrastructure.
- `settings/index.html`: browser-local attention posture controls and Contemplative Hearth preset.
- `public/js/kernel/site-settings.js`: persisted attention dimension settings, labels, datasets, and preset.
- `public/js/runtime/prepaint-state.js`: early dataset projection for saved attention posture.
- `_partials/media-cauldron.html`: reusable local media production surface.
- `public/js/modules/media-cauldron.js`: client-only seed generation and copy behavior.
- `play/index.html`: first route host for the Media Cauldron partial.
- `index.html`: lightweight Living Concepts atlas for early discovery of attention posture, Media Cauldron, operators, Town Atlas, developmental climate, and proof cards.
- `public/css/routes/surfaces/home.css`: route-local styling for the Living Concepts details grid.
- `public/css/routes/play-surface.css`: route-local styling for Media Cauldron canon/export controls.
- `.spw/conventions/relational-attention-media.spw`: durable semantic contract.

## Semantic Rail

- Model-guided refinement: focus dimension is relational attention; semantic fixity tier is contract-level naming with implementation-light behavior.
- Semantic capacity operation: `contract`, because self/local/global attention should remain reusable beyond this patch.
- Concept discovery tier: tending. Homepage concept copy can evolve, but the `living-concepts` feature and cauldron export names should remain stable once public.

## Validation

- Run `git diff --check`.
- Run `node --check public/js/kernel/site-settings.js public/js/runtime/prepaint-state.js public/js/site.js public/js/modules/media-cauldron.js`.
- Use targeted `rg` checks for `attentionSelfRelation`, `media-cauldron`, `worldBuildingMode`, `copy-proof-card`, `living-concepts`, and `contemplative-hearth`.

## Out Of Scope

- No external AI generation calls.
- No new npm dependencies.
- No broad CSS redesign.
- No migration away from hand-authored HTML.
