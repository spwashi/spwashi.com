# Plan: Operator Resonance Alignment

**Status 2026-11-06.** Slices 1–3 have landed, Slice 4 in part, and the one-table move (df32c50f) since. What is left is one creator decision and two small chips. `applyOperatorMetadata` in `public/js/semantic/sigil-annotation.js` writes eight attributes on every sigil, and five have no reader anywhere in `public/js` or `public/css`: `operator-family`, `transformation`, `operator-intent`, `operator-interaction` and `operator-public-label` (probed 2026-11-06). The decision (`index.spw#wonder_operator_resonance_family_attributes`) is whether to spend family and transformation on per-family colour in a browser review, or stop writing them. Near an archive: once that is answered, the rules here already live in `.spw/conventions/operator-alignment.spw`.

**Related:** [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md). **Absorbed 2026-10-10:** [operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) (craft guard 3).

## Public Goal

Make Spw sigils easier to read as semantic handles for transformations across routes, chips, cards, settings, prompt mining, and evidence capture.

A sigil should tell the visitor what kind of operation a link, card, tool, or route performs. It should not be decoration, a generic destination marker, or an accidental synonym for another operator.

## Landed

- Slice 1, registry and copy discipline: `.spw/conventions/operator-alignment.spw`, `$` as substrate, resolver attributes that never overwrite an authored `data-spw-operator` (a664caf5, 2026-06-05).
- Slice 2, chips: `npm run audit:operator-controls`, a `check:local` gate, reads every chip, sigil and operator host; 75 controls follow their sigil, 684 frame sigils author their operator, 114 CSS rules closed by `audit-operator-css.mjs` (4e96100b, 2026-09-19).
- Slice 3, resolver: `sigil-annotation.js` writes the additive attributes (a664caf5).
- Slice 4 in part: pinned resonance rings same-family kin through `data-spw-resonance-family` on `<html>` (`resonance-probe.js` writes it, `effects/wonder.css` reads it), for the four families with more than one member (eeadf214, 2026-09-03).
- One table: every operator view takes its names from `public/js/kernel/operator-detection.js`, held by `scripts/tests/operator-views.test.mjs` (df32c50f, 2026-10-25; *One table* below).
- Names still part. lore.land's PLAN.A, read 2026-11-08, asks whether one row can also hold the story reading and the parse ([lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw), `wonder_lore_plans_one_row`). This site, the workbench, and lore.land's four tables still part on five names (`? # & = %` against this site's types; the survey is [lore-land-support.spw](../ecosystem-architecture/lore-land-support.spw)). The views keep the one table. The five unread attributes stay the creator's decision at `wonder_operator_resonance_family_attributes`.

## Alignment Rules

The public verbs. Workbench relation: mutation (`operator-alignment.spw:13`), so they sit beside the canon names in `operator-detection.js` (`&` subject, `^` integration, `*` value) rather than replacing them.

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

Weak examples to normalize over time (2026-11-06: `$current sprint` and `^quick starts` are gone):

- `@play` (`tools/index.html:105`, a chip into the RPG tools)
- `~services` (`offline/index.html:61`; `~services_overview` on `tools/budgeting/index.html:155`)

## Next slices

1. **The decision.** Spend `operator-family` and `transformation` on per-family colour (`effects/wonder.css`, then a browser review), or stop writing them in `applyOperatorMetadata`. The creator's call; the stop is one commit. The three other unread attributes ride with whichever answer.
2. **The two weak chips.** `@play` and `~services` are read against the rules above: each takes the sigil its move makes, or keeps its sigil with a one-line reason (since 3a009a35, `@` is perspective regarding its operand, which may fit a chip into the RPG tools). Copy, title and link still read with scripts off (craft guard 3). Touches `tools/index.html`, `offline/index.html`, `tools/budgeting/index.html`. Waits on nothing; the chip words are the creator's if they change beyond the sigil. Verified by `npm run audit:operator-controls`.
3. **Operator paths in prompts (old Slice 5), dormant.** No commit since a664caf5 has touched it. If it wakes, a path is written as Spw rather than arrows: one ordinal body, `path{~prompt; $substrate; !transform; ^proof}`, which `readBodyJoins` already reads as a sequence. A proposal for where: the Midjourney tool (`tools/midjourney/`) shows the path of the prompt being built as that one line, each step lit as the reader reaches it, so the line is the instrument's state. Ends at a browser demo.

4. **One set of names a learner meets (2026-11-12).** The canon is one table and the public names still part: `^` is "ascension" in spw.quest's guide (`workers/spw-quest/src/guide.js:13`), "integration" in `operator-detection.js:88`, and "Object" in the operator leaf titles (`topics/software/spw/operators/object/`, "^ Object Operator"); texture.website's RELATIONS (`workers/texture-website/src/vocabulary.js`, `RELATIONS`) is a fourth set of verbs ("lifted over"); the curriculum page uses both `object` and `integration`. Make each public set a declared alias column of the canon, as the workbench journal's one operator table proposes (`.spw/_workbench/.spw/caches/journal/2026-11-11-one-table-many-scales.spw`, operator_table), with one register for a learner: guide, leaf title and chip say the same word, and a host that keeps its own verb (texture's) says whose it is. Gate: the creator chooses which word leads where words differ, or that both stand as aliases. Check: `node --test scripts/tests/operator-views.test.mjs`, `npm run check:workers`, `npm run audit:operator-controls`.

## Validation

- `git diff --check`
- `node --check public/js/kernel/shared.js`
- `node --check public/js/semantic/operators.js`
- `npm run check:local`
- `npm run audit:operator-controls`; the wonder's probe for unread attributes.

## Related Tracks

- [operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) (archived): lineage, physics, symmetry and priming; `.spw/conventions/operator-semantics.spw` is its reference.
- [promptable-image-library-pass](../archive/promptable-image-library-pass/PLAN.md) (archived): prompt mining and RPG image publishing.
- [css-sensitive-attribute-writes](../archive/css-sensitive-attribute-writes/PLAN.md) (archived): runtime adds inspection metadata without mutating author-owned routing attributes.

## Absorbed 2026-10-10 — operator-semantics-refinement

[operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) landed `.spw/conventions/operator-semantics.spw` (lineage, physics, symmetry, priming), and that file stays the semantics reference. The character table is `public/js/kernel/operator-detection.js`, mapped onto the language in `.spw/language/operator-namespace-alignment.spw`. One rule moves here, first inherited from the archived spw-operator-pages:

- **Craft guard 3.** Every no-op still explains itself in copy, title, link or route. That is why the operator pages read with JavaScript off. Any chip or sigil this plan normalizes keeps that reading without the runtime.

## One table (2026-10-25, [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S2)

The parallel tables are views of `operator-detection.js`: each keeps its own columns and takes operator names from the canon. `runtime/experiential/operator-info.js` keeps a memo phrase and a wonder per type and resolves every canon prefix, type and alias (46 keys to 76); `$` there read `meta` and now reads substrate, as Slice 1 settled, and `%` takes the canon label. `modules/profile/builder.js` names each option from the canon and keeps its hint. `kernel/shared.js` drops its copy of the prefix regex, and its threshold sequence and composite pairs keep their states and physics. `semantic/spw-expression-geometry.js` scans the canon's prefixes less the brace openers. The boonhonk mixer's table is the five charges, each printed with a glyph that makes no operator claim, so it stays. `scripts/tests/operator-views.test.mjs` holds the views to the canon. When the workbench table lands (creator, 2026-10-11), `operator-detection.js` becomes its adapter and these views follow without edits.
