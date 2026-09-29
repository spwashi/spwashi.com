# Semantic Copy Depth

## Public Goal

Let readers tune how much copy is visible without splitting the site into separate versions. The base page should remain readable and crawlable; optional layers should reveal theory, genre, culinary vocabulary, and route bridges when semantic density or runtime posture asks for more depth. This plan now also covers the entry/normal/dense distinction that route-register and inspect surfaces need to stay legible.

## Current Contract

- `data-spw-copy-depth="entry|normal|rich|dense|technical|genre"` marks optional copy layers.
- `data-spw-copy-label` names the layer in the UI.
- `data-spw-semantic-expression` stores the compact Spw-shaped meaning label.
- `data-spw-semantic-cluster` names resonance families such as `culinary`, `programming`, `learning`, and `genre`.
- `data-spw-vocab` marks inline vocabulary that can resonate across routes.
- `semantic-crossrefs` reads those annotations and marks same-token peers on hover/focus without changing link clicks.
- `data-spw-emphasis="primary|secondary|tertiary"` marks importance tiers when CSS and copy need to agree about the current objective, supporting neighbor, or ambient context.
- `spw-learning-game` gives the site a configurable metacognitive loop: notice, name, fold, note, return.

## Display Rules

- Minimal semantic density keeps the page calm.
- Entry copy keeps first-contact routes legible.
- Normal semantic density reveals `normal` copy.
- Rich semantic density reveals `normal` and `rich` copy.
- Dense copy is reserved for route registers and deep topical surfaces that can tolerate denser labels.
- Technical copy is reserved for inspect/tool pages where the operational model should stay precise.
- Resonant and theatrical runtime postures reveal `genre` copy.
- Palette and developmental climate may bias which vocabulary cluster receives stronger visual emphasis.

## Constraints

- Essential meaning stays in visible HTML.
- Optional copy layers should explain, connect, or deepen; they should not hide required navigation.
- Foodie vocabulary should motivate shared noticing, not gatekeep.
- Internal route bridges should include reasons for links, not only labels.
- Collection should represent useful awareness or return value; reset paths should make tuned runtime state comparable to authored defaults.
- Navigation anchors should not receive semantic topic markers that alter their default link behavior.
- Copy depth and proficiency are independent: a new reader may want rich lore, while an expert may want a terse production brief.
- Proficiency labels describe the demands of a local practice, never the worth, age, credentials, or fixed level of a person.
- Production notes may identify an entry, developing, and deepening path, but must not gate the complete base reading.

## Proficiency Production Note Slice

**Public outcome:** readers on About and RPG Wednesday can see how one shared premise supports several depths of interpretation and practice without being sorted by age.

**Daily kernel:** component; writer + designer; commons + theater; threshold; studio intensity; `contract`; HTML/CSS pattern + semantic convention; validate with copy measure, CSS/site checks, and mobile/desktop smoke.

**Non-goals:** no age inference, learner scoring, persistent profile, gated content, universal proficiency rank, new runtime module, or separate audience-rating route tree.

**Minimal seams:**

- `about/index.html` — creator history, individuated education, AI, and standardization boundary.
- `play/rpg-wednesday/index.html` — shared WAP mystery with entry/developing/deepening production handles.
- `public/css/components/content.css` — shared `.spw-production-note` anatomy and responsive packing.
- `.spw/conventions/intergenerational-literacy.spw` — task-local proficiency and concurrent-register contract.
- `.spw/site.spw` + `.spw/conventions/index.spw` — make the existing literacy convention discoverable.

**Component anatomy:** `header -> body -> proficiency paths -> footer`. Reuse `data-spw-kind`, `data-spw-role`, `data-spw-copy-depth`, and the existing `data-spw-proficiency` values; do not create a new attribute family.

## Follow-Up

- Add a settings UI note or control that previews copy-depth behavior directly.
- Let route templates emit bridge sections with consistent `spw-route-bridge` markup.
- Use `entry` for home/landing surfaces, `dense` for route registers, and `technical` for inspect pages rather than inventing new copy-depth names.
- Consider a topic index for vocabulary clusters once enough culinary, programming, and genre terms have accumulated.
- Explore exporting annotated components as compact Spw recipe cards, e.g. `card[reason]{produce.artifact}`, for future model expansion and crawler-facing route briefs.
- Expand emphasis-tier audits across route hubs so primary, secondary, and tertiary meaning can be inspected consistently in screenshots and generated design catalogs.

## Thought trace (2026-09-28)

Operation: cache, then a later align of two paragraphs. The smell research is `.spw/caches/ai-writing-smells-2026-09.spw`. This section is how a link-dense paragraph stops reading like a display case.

A display case is a paragraph whose links are the point. Delete the labels and no claim remains. A thought trace is one claim that turns. The claim survives as plain text, and each link changes the next clause. Chip rows, `ul.spw-route-bridge__links`, and header nav stay shelves. A shelf is an honest index. The miss is a shelf wearing a paragraph.

First slice, when someone edits copy. Two hosts, no others:

- `/topics/slop/#feeling` — three citation paragraphs. The claims are already there (fatigue, cheer, the accusation pulling away from the evidence). The sentences currently are the sources.
- `/topics/math/#pure-math-routes` — the textbook note. The first two sentences are the trace (why these pages are more textbook-like). The five diagram routes are a shelf inside the paragraph. The reading grammar that follows (notice the move, the invariant, the collapse) is a real three-part structure. Leave it.

Home's field note at "recursive editorial loop" is the same shape and waits. The loop sentence is the trace. "The center of gravity is this site" is a shelf of nine links. Do not open Home in the first slice. The live note `home[live]{cycle.close}(b)<now>` is already a trace.

Markup, on the stems that exist:

- The base paragraph is the trace, with one or two links.
- The shelf moves to a list, or to a sibling with `data-spw-copy-depth="dense"`. Essential meaning stays in the base paragraph.
- Expression, same grammar as `home[live]{cycle.close}(b)<now>`. Direction is the turn: `{fatigue.then.gate}`. Scene is `(turn)`. A kept shelf uses mode `[case]` and stays a list. Subject stays shared so kinship still lights the trace and the shelf together: `slop[reading]{fatigue.then.gate}(turn)<paragraph>` beside `slop[case]{source.shelf}<feed>`.
- Scene is `(turn)`, not `(trace)`. Dose-trace, load-trace, and session traces already own that word.
- `data-spw-textual-role` stays what it is (lede, note, kicker, narration). Do not add `data-spw-trace`, `data-spw-voice`, or a fourth accessor.
- Do not infer a trace from a link count. Three links and a claim can be a trace. Three links and no claim are a list.

The rewrite test is the slop page's own test: a reader can restate the point. A rewrite that reaches for "not a list, but a journey", a closing echo, or a fresh rule of three has imported the smell. The cache names that failure.

Validation, when the slice lands: `npm run audit:copy:accessor`, `npm run manifest:expressions` if an expression changed, and the paragraph read aloud. If it still sounds like a contents page, it is still a case.
