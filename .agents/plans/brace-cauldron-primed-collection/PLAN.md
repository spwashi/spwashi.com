# Plan: brace-cauldron-primed-collection

Align brace charged priming gestures with cauldron collection so containment forms surface local value as gatherable ingredients. Make cauldron interaction semantics discoverable through the brace charge/armed/committed paths people already use for inspection and pinning. Update surrounding copy to name the root + local-value relationship instead of restating the obvious.

Extends the prior `spell-cauldron-lifecycle-memory-gardening` track with a focused behavioral bridge (no duplication of gardening or phase work).

## Public goal
- Braces (already rich with `data-spw-gesture`, `data-spw-charge`, semantic expressions) become live priming vessels.
- Charging/holding a brace containment now feeds the cauldron with a "primed" ingredient carrying the expression + origin context.
- Cauldron footer/mirrors react subtly; copy in grammar lens and Spw docs teaches "braces hold local value attached to a stable root."
- Everything stays additive, progressive, inspectable via bus + data attrs, reversible via existing prune.

## Scope (smallest surfaces)
- Homepage grammar-lens copy (index.html).
- `public/js/runtime/brace-gestures.js`: emit `spell:capture` with `primedBy: 'brace-containment-charge'` on committed gestures that carry semantic expressions.
- `public/js/interface/composition.js`: accept the payload in `onCapture`, normalize into ingredient metadata (`data-spw-ingredient-primed`, origin), surface in render for learning value.
- CSS: minimal additive rules inside existing gesture and cauldron blocks for visual tether (armed brace → cauldron host highlight via :has() or host attrs).
- `.spw/conventions/semantic-braces.spw` + `site-semantics.spw`: short additive notes documenting the bridge.
- This plan dir + lightweight `alignment-note.spw`.

**Explicitly out**: new chrome, floating buttons, objective/subjective axis changes, style.css edits, new storage, route rewrites.

## Approach
Bus-mediated (reuse `spell:capture` path that already feeds cauldron from semantic surfaces). Brace gestures stay focused on charge physics; cauldron owns policy (dedupe + primed metadata). CSS reacts to resulting state. Matches existing "gathering forces" model and `.spw` metaphysics (charge as stored tendency in braced containers; collection as stable counterpart).

Trade-offs considered and rejected: pure CSS (no discoverable action), direct mutation from gestures (boundary violation).

## Files (ordered)
1. Copy in `index.html` (and light check on `topics/software/spw/index.html`).
2. `brace-gestures.js` (additive emission only).
3. `composition.js` (onCapture + render, additive fields only).
4. `handles/operators.css` + `shell/chrome.css` (inside existing sections).
5. Two `.spw` convention files (additive notes).
6. Plan scaffolding here.

## Craft + validation
- Preserve all existing brace:* events, cauldron actions, data attr contracts.
- `node --check` on every JS touch; `git diff --check`; full `npm run check` before contract-touching commits.
- Manual smoke: homepage + Spw operator pages — charge a brace → primed ingredient appears with context → prune works → mix reflects origin.
- Negative controls: pinning, expansion, mix/clear/gardening, charge decay all unchanged.

## Commit shape
- `.[copy] — non-redundant brace copy (containment + local value)`
- `&[priming] — brace-gestures emits primed spell:capture on committed semantic braces`
- `&[ingest] — cauldron accepts + renders primed-by-brace ingredients`
- `&[tether] — subtle CSS bridge for charged braces + cauldron hosts`
- `.[spw] — document primed containment collection in semantic-braces + site-semantics`
- `#[plan] — new focused plan as follow-on to spell-cauldron-lifecycle`

## Status
Implementation in progress.
- Done: grammar-lens copy names braces as containment carrying local value.
- Done: pointer hold/commit on semantic braces emits primed `spell:capture` payloads.
- Done: cauldron ingests and renders `primedBy` metadata on ingredients.
- Done: cauldron footer visually tethers to charged braces and highlights primed ingredients.
- Enhanced: keyboard commits now also prime the cauldron, duplicate captures refresh existing ingredients instead of silently doing nothing, and the footer now exposes a live status/gloss for priming behavior.
- Enhanced: gesture consequences are now documented in HTML through data-spw-interaction-* attributes, design runtime/palette pages include a style specimen, and semantic brace double-click provides a deliberate inspect+prime shortcut.

See the full session plan artifact for deeper rationale and exact success criteria. This surface is the stable tracking point in the repo.
