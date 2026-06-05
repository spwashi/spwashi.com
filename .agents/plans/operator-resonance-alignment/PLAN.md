# Plan: Operator Resonance Alignment

## Public Goal

Make Spw sigils easier to read as semantic handles for transformations across routes, chips, cards, settings, prompt mining, and evidence capture.

A sigil should tell the visitor what kind of operation a link, card, tool, or route performs. It should not be decoration, a generic destination marker, or an accidental synonym for another operator.

## Current Slice

- Added `.spw/conventions/operator-alignment.spw` as the compact site-side registry.
- Wired the registry through `.spw/conventions/index.spw` and `.spw/site.spw`.
- Updated the runtime `$` definition from metacognitive reflection to substrate.
- Made runtime operator lookup accept raw sigils such as `$` and `~` in addition to semantic names.
- Added additive resolver attributes in `public/js/semantic/operators.js` without overwriting authored `data-spw-operator`.

## Alignment Rules

- `?` asks or inspects.
- `~` explores, mines, remixes, or holds possibility.
- `@` enters a perspective, session, role, character, or viewpoint.
- `&` combines or synthesizes.
- `*` runs, plays, tries, or materializes.
- `^` publishes, promotes, exports, or carries proof upward.
- `!` applies, resets, commits, or executes.
- `=` configures, binds, scopes, or constrains.
- `%` measures, estimates, compares, or normalizes.
- `#` anchors, tags, categories, and route fragments.
- `.` grounds local state, intrinsic structure, ledgers, and stored records.
- `$` reveals substrate: money, time, memory, storage, infrastructure, attention, maintenance, or material support.

## Practical Governance

Use a sigil only when it clarifies the transformation.

Good examples:

- `~ mine prompt handles`
- `$ inspect current substrate`
- `^ publish RPG images`
- `% compare memory cost`
- `@ choose a session`
- `? inspect browser substrates`

Weak examples to normalize over time:

- `@ play`
- `$ current sprint`
- `^ quick starts`
- `~ services`

## Implementation Roadmap

### Slice 1: Registry and Copy Discipline

- Status: in progress.
- Files: `.spw/conventions/operator-alignment.spw`, this plan, `public/js/kernel/shared.js`, `public/js/semantic/operators.js`.
- Outcome: canonical public gloss, runtime gloss, examples, anti-examples, and `$` as substrate.

### Slice 2: Operator-Chip Normalization

- Candidate files: `index.html`, `tools/index.html`, `tools/midjourney/index.html`, `tools/budgeting/index.html`, `tools/character-sheet/index.html`, `play/rpg-wednesday/index.html`.
- Normalize `@` to perspective, `*` to play/run, `$` to substrate, `^` to proof/publish, `%` to estimate/measure, and `#` to anchors.
- Prefer chip anatomy: visible sigil, verb, target, optional `data-spw-action`, optional `data-spw-target`.

### Slice 3: Runtime Resolver

- Candidate files: `public/js/semantic/operators.js`, `public/js/semantic/component-semantics.js`, `public/js/site.js`.
- Add sparse, additive metadata such as `data-spw-operator-resolved`, `data-spw-operator-family`, `data-spw-operator-phase`, and `data-spw-transformation`.
- Do not rewrite authored copy or author-owned `data-spw-operator`.

### Slice 4: CSS Family Resonance

- Candidate files: `public/css/effects/operator-resonance.css`, `public/css/shell/chrome.css`, `public/css/components/cards.css`.
- Style families subtly: inquiry, potential/config, location/scope, action/resolution, resource/output, relation.
- Avoid noisy one-color-per-sigil treatment except where the operator is the actual teaching surface.

### Slice 5: Prompt and Evidence Integration

- Candidate files: `public/js/spw-prompt-utils.js`, `tools/midjourney/index.html`, `play/rpg-wednesday/index.html`.
- Express operator paths like `~ prompt -> $ substrate -> ! transform -> ^ proof`.
- Use operator metadata to help prompt mining, screenshot interpretation, and evidence briefs.

## Validation

- `git diff --check`
- `node --check public/js/kernel/shared.js`
- `node --check public/js/semantic/operators.js`
- `npm run check:local`
- Targeted `rg` checks for `operator-alignment`, `data-spw-operator-resolved`, and `$ inspect current substrate`.

## Related Tracks

- `operator-semantics-refinement`: deeper lineage, physics, symmetry, and priming.
- `promptable-image-library-pass`: prompt mining and RPG image publishing.
- `css-sensitive-attribute-writes`: runtime must add inspection metadata without mutating author-owned semantic routing attributes.
