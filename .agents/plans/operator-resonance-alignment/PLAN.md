# Plan: Operator Resonance Alignment

**Status 2026-10-10.** Slices 1–3 have landed. The chip audit (`npm run audit:operator-controls`, 4e96100b) gates `check:local`, and `public/js/semantic/sigil-annotation.js` writes the resolver attributes. Slice 4 has landed in part: wonder.css rings same-family kin through `data-spw-resonance-family` on `<html>`. Nothing reads the per-element `data-spw-operator-family` or `data-spw-transformation` yet. `operator-alignment.spw` keeps both as an additive inspection contract, and since no selector names them they cost no style invalidation. The one next slice is the creator's open decision (wonder block in `index.spw`): spend them on per-family colour in a browser review, or stop writing them.

**Related:** [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) · [spw-language-v04](../spw-language-v04/PLAN.md). **Absorbed 2026-10-10:** [operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) (craft guard 3).

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

- Status: landed (`.spw/conventions/operator-alignment.spw`; `$` is substrate in the canonical table).
- Files: `.spw/conventions/operator-alignment.spw`, this plan, `public/js/kernel/shared.js`, `public/js/semantic/operators.js`.
- Outcome: canonical public gloss, runtime gloss, examples, anti-examples, and `$` as substrate.

### Slice 2: Operator-Chip Normalization

- Candidate files: `index.html`, `tools/index.html`, `tools/midjourney/index.html`, `tools/budgeting/index.html`, `tools/character-sheet/index.html`, `play/rpg-wednesday/index.html`.
- Normalize `@` to perspective, `*` to play/run, `$` to substrate, `^` to proof/publish, `%` to estimate/measure, and `#` to anchors.
- Prefer chip anatomy: visible sigil, verb, target, optional `data-spw-action`, optional `data-spw-target`.
- 2026-09-19: landed across the routes, not only the candidates. `scripts/audit-operator-controls.mjs` (`npm run audit:operator-controls`, a `check:local` gate) reads every chip, sigil, and operator host: 75 controls whose attribute disagreed with their sigil now follow the sigil (`!clear` was potential, `@character[lens]` was action), 32 spaced labels bind tight, 684 sigil-led frame sigils author the operator the runtime used to backfill. `scripts/audit-operator-css.mjs` closed 114 stylesheet rules that keyed on one spelling of an operator (`stream` but not `value`).

### Slice 3: Runtime Resolver

- Candidate files: `public/js/semantic/operators.js`, `public/js/semantic/component-semantics.js`, `public/js/site.js`.
- Add sparse, additive metadata such as `data-spw-operator-resolved`, `data-spw-operator-family`, `data-spw-operator-phase`, and `data-spw-transformation`.
- Do not rewrite authored copy or author-owned `data-spw-operator`.

### Slice 4: CSS Family Resonance

- Candidate files: `public/css/effects/wonder.css` (where the family ring landed; no `operator-resonance.css` was created), `public/css/shell/chrome/`, `public/css/components/cards.css`.
- Style families subtly: inquiry, potential/config, location/scope, action/resolution, resource/output, relation.
- Avoid noisy one-color-per-sigil treatment except where the operator is the actual teaching surface.
- 2026-09-03: landed the narrower "pinned resonance shares its family" version of this, in `public/css/effects/wonder.css` rather than a new file — `data-spw-operator-family` (already written by `applyOperatorMetadata`) was unread by any CSS. The resonance probe (`public/js/runtime/attention/resonance-probe.js`) now also writes `data-spw-resonance-family` on `<html>`, and wonder.css gives same-family kin a fainter `--spw-resonance` ring than an exact match gets. Covers the four multi-member families that OPERATOR_DEFINITIONS actually has (resonance, grounding, relational, conceptual) — the other ten families are singletons, so there is nothing to group yet. Broader per-family color/background treatment (the "location/scope", "action/resolution" style buckets above) stays open.

### Slice 5: Prompt and Evidence Integration

- Candidate files: `public/js/interface/prompt-utils.js`, `tools/midjourney/index.html`, `play/rpg-wednesday/index.html`.
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

## Absorbed 2026-10-10 — operator-semantics-refinement

[operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) landed `.spw/conventions/operator-semantics.spw` (lineage, physics, symmetry, priming), and that file stays the semantics reference. The character table is `public/js/kernel/operator-detection.js`, mapped onto the language in `.spw/language/operator-namespace-alignment.spw`. One rule moves here, first inherited from the archived spw-operator-pages:

- **Craft guard 3.** Every no-op still explains itself in copy, title, link or route. That is why the operator pages read with JavaScript off. Any chip or sigil this plan normalizes keeps that reading without the runtime.

## One table (2026-10-25, [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S2)

The parallel tables are views of `operator-detection.js`: each keeps its own columns and takes operator names from the canon. `runtime/experiential/operator-info.js` keeps a memo phrase and a wonder per type and resolves every canon prefix, type and alias (46 keys to 76); `$` there read `meta` and now reads substrate, as Slice 1 settled, and `%` takes the canon label. `modules/profile/builder.js` names each option from the canon and keeps its hint. `kernel/shared.js` drops its copy of the prefix regex, and its threshold sequence and composite pairs keep their states and physics. `semantic/spw-expression-geometry.js` scans the canon's prefixes less the brace openers. The boonhonk mixer's table is the five charges, each printed with a glyph that makes no operator claim, so it stays. `scripts/tests/operator-views.test.mjs` holds the views to the canon. When the workbench table lands (creator, 2026-10-11), `operator-detection.js` becomes its adapter and these views follow without edits.
