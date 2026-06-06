# Relational Attention Media

## Public Goal

Make attention and meditation practical relational dimensions across the site: self relation, local context, and global horizon. Use those dimensions to generate stable, copyable media seeds across prose, lyric, visual, storyboard, audio, and curriculum work.

## Scope

- `index.html`: homepage reason strip names attention as relational infrastructure.
- `settings/index.html`: browser-local attention posture controls and Contemplative Hearth preset.
- `public/js/kernel/site-settings.js`: persisted attention dimension settings, labels, datasets, and preset.
- `public/js/runtime/prepaint-state.js`: early dataset projection for saved attention posture.
- `_partials/media-cauldron.html`: reusable local media production surface.
- `public/js/modules/media-cauldron.js`: client-only seed generation and copy behavior.
- `play/index.html`: first route host for the Media Cauldron partial.
- `.spw/conventions/relational-attention-media.spw`: durable semantic contract.

## Semantic Rail

- Model-guided refinement: focus dimension is relational attention; semantic fixity tier is contract-level naming with implementation-light behavior.
- Semantic capacity operation: `contract`, because self/local/global attention should remain reusable beyond this patch.

## Validation

- Run `git diff --check`.
- Run `node --check public/js/kernel/site-settings.js public/js/runtime/prepaint-state.js public/js/site.js public/js/modules/media-cauldron.js`.
- Use targeted `rg` checks for `attentionSelfRelation`, `media-cauldron`, and `contemplative-hearth`.

## Out Of Scope

- No external AI generation calls.
- No new npm dependencies.
- No broad CSS redesign.
- No migration away from hand-authored HTML.
