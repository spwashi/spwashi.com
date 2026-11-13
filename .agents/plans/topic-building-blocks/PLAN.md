# topic-building-blocks

**Status 2026-11-06.** Course wiring landed (`dae5c297`, `5eacfbc0`): stubs, hubs, field portals, `scripts/tests/topic-wiring.test.mjs`. The root shelf has not: `/topics/` links 38 leaves directly (13 software, 10 math, 6 film, 4 fields, 3 craft, one each knowledge bases and andragogy; distinct `/topics/<area>/<leaf>/` targets, 2026-11-06), and the test has no depth rule. `1a84b975` (2026-11-05, the creator's own art) moved three figure homes forward: the field wash left `/topics/math/`, the constellation left pedagogy, the clockwork left complexity. Next: the root shelf. Programs' Parallel and Competing Theories stays its own content slice.

**Related:** [semantic-copy-depth](../semantic-copy-depth/PLAN.md) owns the sentences, including `/topics/math/#pure-math-routes`. [component-region-personality](../component-region-personality/PLAN.md) owns the six `spw-visual-link-card`s. [runtime-plane-consolidation](../runtime-plane-consolidation/PLAN.md) owns a later catalog mount for `public/js/modules/math/diagrams.js`. Figure homes and the tuner are claimed in [index.spw](./index.spw).

**Absorbed 2026-10-06:** [calculus-trigonometry-field-guides](../archive/calculus-trigonometry-field-guides/PLAN.md) · [learning-science-enhancement](../archive/learning-science-enhancement/PLAN.md) · [pure-math-routes](../archive/pure-math-routes/PLAN.md) · [topical-learning-links](../archive/topical-learning-links/PLAN.md). **Absorbed 2026-10-10:** [living-learning-surface](../archive/living-learning-surface/PLAN.md), below.

## Public Goal

A reader on `/topics/` sees areas. Each area hub offers one ordered path, one figure that is that subject, and either a lab or a link to the page that holds the lab. Portals from the fields of peers, mentors, and family still route into the topics where those questions already live.

## Voice

First person. The creator consults on software and works in A&R. Adult education is `/topics/andragogy/`. Pedagogy stays the broader learning-science route. Name roles, never private people.

## Landed

Software `#building-blocks` runs programs, data structures, algorithms, complexity, version control, testing. `#working-practice` and `#refresh-before-a-build` sit beside it. Math `#building-blocks` runs logic through forecasting. Andragogy, fields (eight portals), and biochemistry (five patterns) are hubs. Parallel and Competing Theories is on the portals, andragogy, biochemistry, linear algebra, and logic. The wiring test checks that the nearest hub lists each leaf and that the leaf links a neighbor. Stub shape: hero, two to four sourced essentials, a route bridge with a reason on each link. Bodies stay hand-written.

## Next slices

One patch each. Homes for the repeated figures are in [index.spw](./index.spw).

1. **Root shelf.** `topics/index.html` lanes and directory list area hubs. The `[current]` lane keeps the rooms that are not topics. The six visual cards stay. The visual-studies row (`#visual-studies`) drops pictures that already have a home, and the craft directory card stops repeating `craft-fragment-studio-square.webp` (twice on the root today). Extend `scripts/tests/topic-wiring.test.mjs` with the depth rule. Verify: the test fails on any `/topics/<area>/<leaf>/` link from the root; `npm run audit:copy:accessor`.
   - Proposal: each area card carries its path as one Spw line with `;`, such as `software[path]{programs; data_structures; algorithms; complexity; version_control; testing}`; the separator says order matters, as spw.quest's "hold the parts in order" does. Gate: the creator's look.
2. **Math field wash.** `public/images/routes/math-signal-field-square.webp` keeps one home, the topics visual card. Trigonometry, differential equations, vector calculus, scale intuition, and `/topics/software/differential-lambda-calculus/` lead with their lab or link the hub. Verify: `rg -l math-signal-field-square topics` lists only `topics/index.html`.
3. **Labeled plates.** Clockwork stays on `/topics/software/schedulers/` (complexity is done). Crystals stay on `/topics/software/compression/`; field theory still wears them and should link it. The sunflower webp stays on `/topics/nutrition/`; symmetry and `/topics/film/scene-composition/fermentation-hold/` still wear it and should link it, and symmetry drops its png twin.
4. **Paper still and tuner.** `public/images/renders/papergami/papergami-kinetic.webp` stays on `/topics/craft/svg/`; six other topic pages wear it today, `/topics/math/` among them. Calculus keeps the diagram that moves. Software and math link `/topics/#topics-tuning` (neither does yet). Pedagogy's four vibe widgets become principle cards. The eight lab pages share one `diagrams.js` query string; five load `?v=0.0.1` and three `?v=0.0.2`.
5. **Programs frame.** Parallel and Competing Theories on `/topics/software/programs/`, then data structures, probability, optimization, and forecasting, one page a session. Cite only what a stable source attributes.

A decorative SVG map that repeats a route bridge goes when that hub is already open. It is not its own slice.

## The curriculum keeps its promises — 2026-11-12

Read 2026-11-12 from `curriculum/index.html` and the hosts that teach beside it. The page offers a practice and then forgets it: `!mark[module_complete]` is only a link to `#progress-stub` (:254), the progress box stays `☐` (:291), the export says `complete: true` with `artifacts: [ /* collected in real version */ ]` (:515–517), `clearBoundary` clears the form and leaves storage (:453–458), and with scripts off the boundary buttons are `type="button"` and do nothing (:209–210). A course that rewards practice has to remember it and say so (feedback memory: every interaction rewards with feedback or clarity).

1. **C1 · The script keeps what it promises.** Persist and restore the memo and the boundary test under the existing `spwashi:curriculum:memory-buffers:*` keys; `!clear` clears storage and says so; `!mark` marks the module and the progress box reads it; the export counts the artifacts it holds and says `complete` only when they exist. With scripts off, the boundary test is a `<details>` checklist that reads without the buttons. Gate: whether a completion mark is a reward or a count (no streaks, no counts of absence). Check: `npm run audit:copy:accessor`, then the page at pocket width with scripts on and off.
2. **C2 · One lesson, one place.** On this page the modules 2–6 list appears three times (:266–270, :291–297, :338–377) and the boundary test is explained five times (:72, :79–80, :191, :217, :388). Keep one of each and link the rest to it. The question form (`?` with `~#expect` and `!probe`) is taught here (:145–150) and in spw.quest's question example; one keeps the lesson and the other links. Gate: which host keeps the question form. Check: `npm run audit:copy:accessor`, `npm run check:workers`.
3. **C3 · A path across hosts.** One ordered line a learner can follow: spw.quest's first steps (read a mark), this page's tiny show (one mechanism, one test, one artifact), texture.website's pivots (one change, one technique named), factshift.center (a line as nodes to move). Written as one Spw path with `;`, beside the root-shelf proposal above, and linked from each host's own page. Gate: the order, and whether texture.website belongs on a computer-science path. Check: `npm run spw:integrity`.
4. **C4 · The opener names who teaches.** The h1 (:68) says "I teach computer science the way I learn math" and drops "I build software and make art". Proposal only, from lines the creator already wrote: keep the h1 and let the lede open on the adult learner, whom the page names only at the andragogy link (:136). Gate: the creator's words. Check: `npm run audit:copy:accessor`.
5. **C5 · The module stem.** `data-spw-curriculum-module` has 13 uses on this page, no reader in `public/js` or `public/css`, and no row in `.spw/site.spw`. Map it onto an existing stem or drop it; no new family. Gate: the no-new-family review. Check: `npm run spw:integrity`.

texture.website's technique curriculum has its own slices in [texture-website](../texture-website/PLAN.md).

## Still open

- More field portals as more peers and mentors name their fields. Both pedagogy and andragogy keep their names and state the pairing.
- A biochemistry knowledge base waits until the creator confirms the reading. No public page names it before then. Leaves grow under `/topics/biochemistry/`.
- Living terms: wrap a principle where the page first defines it. Slug is `data-spw-concept`. Card expressions stay `principle|theory|model|channel|pattern[slug]{parts}<scope>`.
- The pale glyph folio, the ladder, the hash knot and the little house, is on `/topics/mental-health/` and `/topics/site-design/`. Which page keeps it is `#>wonder_topic_building_blocks_glyph_folio`.

## Validation

`node --test scripts/tests/topic-wiring.test.mjs` · `npm run audit:copy:accessor` · `git diff --check`. After a figure move, read `/topics/` and the touched leaf at pocket width. `npm run audit:plans -- --slug=topic-building-blocks` after this plan changes.

## Non-Goals

- No new components or `data-spw-*` families. Reuse `spw-route-bridge`, `frame-card`, `spw-visual-link-card`, `ref-card`, and `data-math-visual`.
- No generated filler. A page with nothing sourced waits.
- No sitewide copy rewrite, and no edit to the Home field note. The math textbook note and `/topics/slop/#feeling` stay with semantic-copy-depth.
- Do not split `public/js/modules/math/diagrams.js`. Do not merge the film scene beds with the recipe pages.
- `design/experiments/symphony/` is not a second topics hub. Leave it until a pass is already in that folder.
- The other five curriculum modules wait for the creator's ask.

## Absorbed 2026-10-10 — living-learning-surface

[living-learning-surface](../archive/living-learning-surface/PLAN.md) left five unbuilt modules as spec entries on `curriculum/index.html`: modules 2 to 6 in `#curriculum-ontology`, after the one built module, memory buffers. A second module uses this stub shape as plain HTML. Every analogy ends in a visible boundary test, then returns to the native technical model. `data-spw-curriculum-module` (13 uses on `/curriculum/`, absent from `.spw/site.spw`) maps onto an existing stem before another module adds to it.
