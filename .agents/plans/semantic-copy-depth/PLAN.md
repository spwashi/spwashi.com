# Semantic Copy Depth

**Status 2026-11-06.** The Proficiency Production Note slice landed (eba561ba), and so did the math half of the thought trace (89475c6c): `/topics/math/#pure-math-routes` keeps its claim, its reading grammar and its stubs sentence, carries `math[reading]{picture.then.formalism}(turn)<paragraph>`, and leaves the five diagram anchors to the lens grid below; the note went from eight links to three. The grid carries no `[case]` expression: haptics gathers the nearest expression host on a hold while brace-gestures arms the card, so an expression on the grid would split one hold across two elements (wip 2026-11-05). Next slice: C2, the three Home units `audit:copy:accessor` flags as `flat-only`, which is the entrance debt this plan absorbed and needs no one's call. C1, the `/topics/slop/#feeling` half, waits on the creator's answer to whether those paragraphs are a display case at all (`#>wonder_semantic_copy_depth_slop_feeling` in `index.spw`). The smell cache's October pass does not replace that slice: a higher effort setting is not the edit. Holds tone and voice, the reading groove, editorial readability, and the entrance routes.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.math_note, topics.slop_feeling, seams.entrance_copy.

**Entrances:** this plan owns the words on the `/`, `/about/`, `/services/` and `/topics/` entrances, and `npm run audit:copy:accessor` reports to it. [component-region-personality](../component-region-personality/PLAN.md) owns their cards and chips. [topic-building-blocks](../topic-building-blocks/PLAN.md) owns the shelf, the figure homes, and the wiring test.

**Related:** [audience-onboarding-copy](../archive/audience-onboarding-copy/PLAN.md) (absorbed 2026-10-10, below).

**Absorbed 2026-10-06:** [editorial-readability](../archive/editorial-readability/PLAN.md) · [fairytale-cookbook-theory](../archive/fairytale-cookbook-theory/PLAN.md) · [narration-markup-cold-reads](../archive/narration-markup-cold-reads/PLAN.md) · [typography-reading-groove](../archive/typography-reading-groove/PLAN.md) · [voice-grounding-pass](../archive/voice-grounding-pass/PLAN.md).

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

## Landed

- **Proficiency production note** (eba561ba): one shared premise read at entry, developing and deepening depths on `/about/` and `/play/rpg-wednesday/`, never sorted by age. `.spw-production-note` in `public/css/components/content.css`; the contract is `.spw/conventions/intergenerational-literacy.spw`; it reuses `data-spw-copy-depth` and `data-spw-proficiency`.
- **The math half of the thought trace** (89475c6c): `/topics/math/#pure-math-routes` as one claim that turns, with the shelf left to the lens grid below.

## Read aloud (2026-11-09)

The creator: update and extend the plans for typographic development and readability; consider word- and sentence-local pronunciation and emphasis; imagine someone reading the copy out loud. The theory is [read-aloud-typography](../../../.spw/caches/read-aloud-typography-2026-11.spw). A reader aloud hears what the page says and none of what it only shows: a screen reader at its default punctuation says `~garden[care]{seed, water}` as "garden care seed water", and `·`, `×` and `→` come out as "middle dot", "times" or nothing.
- **R0, a read-aloud sensor**, reporting like `audit:copy:accessor` and changing nothing: sentences past about 28 words, two parentheticals, three nouns stacked before a verb, a mark that carries a meaning the words do not, a Spw run with no spoken twin, a coined word with no pronunciation.
- **R1, spoken twins.** Each Spw run a reader may hear (`code.language-spw` on 30 routes, chips, the crumb, the cauldron's lines) takes an accessible name built only from operator and slot names: "potential garden, mode care, body: seed, water". No connective words, after the creator's ruling that the words a line is read in do not generalize. One spoken name per pair is still the creator's to choose (body or direction for `{ }`, scene or scope for `( )`).
- **R2, mono that reads as typed.** Spw set in JetBrains Mono keeps contextual alternates off, so `~>` stays two marks, and keeps the slashed zero and tabular figures; marks sit in a fixed column and widths count in `ch`.
- **R3, a pronunciation register** the creator writes once (Spw, Spwashi, boonhonk, boon, bane, bone, bonk, honk, dregg, lede, folio), carried by `<abbr title>` on first use and `lang` where a word is borrowed. Never guessed by an agent.
- **R4, stress where the ear needs it.** On the three dense ledes the audit names, `<em>` for the word a reader leans on, the new information last, one stress a clause; a sentence that needs two emphases becomes two.
- **Listening:** agents cannot hear. The creator can run macOS `say` over a page's lede before it ships; the receipt names the sentences re-read.

## Next slices

- **C1. `/topics/slop/#feeling`.** Waits on the creator's call (`wonder_semantic_copy_depth_slop_feeling`). Touches `topics/slop/index.html` only. Verify as in Thought trace below.
- **C2. Home's flat-only units.** `npm run audit:copy:accessor` flags three Home units as `flat-only`, a keyed hook lede with no expression: `home.hook.note` (`#home-note`), `home.library.lede` (`#home-library-lede`) and `home.record.lede` (`#home-record-lede`). Each gains the `subject[mode]{direction}` its sentence already says, read from the sentence, not invented for it. Touches `index.html`; ungated, but no words change. Verify: the accessor's flat-only count falls from 18 to 15, and `npm run manifest:staged` before commit. The other 15 are `/design/` hook ledes, which belong to the design-surface cluster.
- **C3. Home's field note.** Waits until C1 has landed (Thought trace, below). Includes the words "Action layer" at `#home-field-note`.
- **Review passes.** The 2026-11-08 reading of tone, routing, interaction, readability, and uniqueness is sequenced in [copy-review-2026-11.spw](./copy-review-2026-11.spw). One route per commit. R1, Now's fold, and R2, Home's live note and promo, landed 2026-11-08. The review continues at R3, the topics gesture, which waits on a watched chip. It leaves C1, C3, and the three flat-only units C2 still owes for their own turns. Cards and chips stay with [component-region-personality](../component-region-personality/PLAN.md).
- **Clusters.** Those passes group with the instrument commits in [update-clusters-2026-11.spw](./update-clusters-2026-11.spw). A is the clock, and it landed 2026-11-08; its clock wonder is answered. B is the gesture, with interaction-grammar. C is the home map, then the seat line. D and E stay in this plan. Each cluster spends a pattern that already runs (`readExpressionSlots`, the copy clock, the phase arc) and names one objective measure and one subjective measure. A failed measure takes the wonder's next alternative. The mode slot names the question the sentence is answering. A fresher word keeps its expression.

### Variant zero (lore.land's plans, read 2026-11-08)

A lens weights a sentence and leaves the sentence in the HTML. Depth, genre, and lean are lenses. Essential meaning stays in visible HTML. A dated claim names the receipt that would prove it wrong, and the copy clock is that receipt. Cluster A landed on 2026-11-08: the fold and the home live note name open work, and a passed close stays a receipt. The open read is the book paragraph on `/now/` that calls November the writing in Octvember. The reading is [lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw).

## Parked

- A settings preview of copy depth. Settings already layers its own copy (`entry` and `technical` paragraphs in `#applied-state`), but no control shows a reader what changing semantic density would reveal. If it comes back, it is the density control's own receipt: one sample sentence at each depth beside the control, ending at a browser demo.
- Template-emitted `spw-route-bridge` sections (77 pages author them by hand), a topic index for vocabulary clusters, an emphasis-tier audit (22 pages carry `data-spw-emphasis`), and Spw recipe cards for annotated components (`card[reason]{produce.artifact}`).
- Retired 2026-11-06: "use `entry`, `dense` and `technical` by surface", which Display Rules already says.

## Thought trace (2026-09-28)

Operation: cache, then a later align of two paragraphs. The smell research is `.spw/caches/ai-writing-smells-2026-09.spw`. This section is how a link-dense paragraph stops reading like a display case.

A display case is a paragraph whose links are the point. Delete the labels and no claim remains. A thought trace is one claim that turns. The claim survives as plain text, and each link changes the next clause. Chip rows, `ul.spw-route-bridge__links`, and header nav stay shelves. A shelf is an honest index. The miss is a shelf wearing a paragraph.

First slice, when someone edits copy. Two hosts, no others:

- `/topics/slop/#feeling` — three citation paragraphs. The claims are already there (fatigue, cheer, the accusation pulling away from the evidence). The sentences currently are the sources.
- `/topics/math/#pure-math-routes` — the textbook note. The first two sentences are the trace (why these pages are more textbook-like). The five diagram routes are a shelf inside the paragraph. The reading grammar that follows (notice the move, the invariant, the collapse) is a real three-part structure. Leave it.

Home's field note at "recursive editorial loop" is the same shape and waits. The loop sentence is the trace. "The center of gravity is this site" is a shelf of nine links. Do not open Home in the first slice. The live note `home[live]{cycle.close}(b)<now>` is already a trace.

2026-10-25: the Home quotes above predate eff5abfd (2026-10-25 13:45), which rewrote both sentences: the loop sentence is now "Make, name the relation, test it, leave a receipt, and carry it to the next close.", and the nine-link shelf now opens "The work sits in" (the `spw-narration__text` paragraph at `index.html:313-325` on 2026-11-06). The live note is now `home[live]{season.close}(production)<now>` (`#home-live-note`, since c05126f8). Markup below cites the old expression only for its grammar, which the new one shares. Home still waits.

Markup, on the stems that exist:

- The base paragraph is the trace, with one or two links.
- The shelf moves to a list, or to a sibling with `data-spw-copy-depth="dense"`. Essential meaning stays in the base paragraph.
- Expression, same grammar as `home[live]{cycle.close}(b)<now>`. Direction is the turn: `{fatigue.then.gate}`. Scene is `(turn)`. A kept shelf uses mode `[case]` and stays a list. Subject stays shared so kinship still lights the trace and the shelf together: `slop[reading]{fatigue.then.gate}(turn)<paragraph>` beside `slop[case]{source.shelf}<feed>`.
- Scene is `(turn)`, not `(trace)`. Dose-trace, load-trace, and session traces already own that word.
- `data-spw-textual-role` stays what it is (lede, note, kicker, narration). Do not add `data-spw-trace`, `data-spw-voice`, or a fourth accessor.
- Do not infer a trace from a link count. Three links and a claim can be a trace. Three links and no claim are a list.

The rewrite test is the slop page's own test: a reader can restate the point. A rewrite that reaches for "not a list, but a journey", a closing echo, or a fresh rule of three has imported the smell. The cache names that failure.

Validation, when the slice lands: `npm run audit:copy:accessor`, `npm run manifest:expressions` if an expression changed, and the paragraph read aloud. If it still sounds like a contents page, it is still a case.

## 2026-10-25 — effort is not the pass

The smell cache now holds an October pass (`.spw/caches/ai-writing-smells-2026-09.spw`, ws-006 and ws-007). Comparing models across reasoning-effort settings does not retire the structural smells, and it does not replace the two hosts above.

ToneBench, board of 23 Oct 2026, ranks the same model at each effort setting on one creator's YouTube scripts. Across the eleven models with an explicit ladder, the median climb from the lowest setting to the highest is +132 Writing Elo, at about 4.6 times the cost. The top setting is not always the best one. Claude Opus 5.5 peaks at xhigh. Grok 4.7 peaks at medium, and that card says the low-to-high climb is mostly length: voice and substance barely move. The least-slop configuration on that board is not the writing leader. SlopShape (arXiv:2609.15369v3) names the shape this section already refuses: a thesis and a map of the flow before the first section, then a close that restates the thesis. Rewording leaves the shape in place.

The slice stays the two paragraphs. A higher effort setting is not the edit.

## Absorbed 2026-10-10 — audience-onboarding-copy

[audience-onboarding-copy](../archive/audience-onboarding-copy/PLAN.md) refined the entrance routes (`/`, `/about/`, `/services/`, `/topics/`, `/tools/`). That copy landed.

- Settled by the creator (4d4b7262): entrance copy speaks to the visit a reader is on, not to who they are. A reader may be an academic, a business reader, both, or neither on a given visit. The old plan's freshman-and-professional ramp retires with it.
- Landed: the first-fold miss it named, the unkeyed `#home-reason-why`, now has a key (9c8a7d97; `.spw/audits/copy-accessor-cluster-2026-09.spw`).
- Still owed: whatever `npm run audit:copy:accessor` flags in those five routes' first folds. On 2026-11-06 that is three units on Home and none on the other four (C2). A first-fold sentence either names a control and its receipt, or is identity that does not pretend to be a mechanism (`.spw/caches/copy-hypermedia-key-2026-09.spw`).
- Rule kept: an entrance sentence may name a next stop. A paragraph whose job is the list of stops is a display case (Thought trace, above). Internal references add clarity; they must not become a second menu.
- The site is the résumé: `/about/#about-years` and `/about/#career-register` hold the year and practice records.
