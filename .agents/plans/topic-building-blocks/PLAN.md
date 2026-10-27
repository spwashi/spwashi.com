# topic-building-blocks

**Status 2026-10-27.** Course wiring has landed (dae5c297, 5eacfbc0): stubs, hubs, field portals, and `scripts/tests/topic-wiring.test.mjs`. Next slice: the root shelf. `/topics/` lists the seventeen area hubs. Its 33 grandchild links go back to their hubs (13 under software, 6 film, 5 math, 4 fields, 3 craft, one each under knowledge bases and andragogy), and the wiring test gains the depth rule in [index.spw](./index.spw). Parallel and Competing Theories on `/topics/software/programs/` stays the content slice and does not ride in that commit. `/topics/math/logic/` already has the frame.

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

1. **Root shelf.** `topics/index.html` lanes and directory list area hubs. The `[current]` lane keeps the rooms that are not topics. The six visual cards stay. The visual-studies row drops pictures that already have a home, and the craft directory card stops repeating `craft-fragment-studio-square.webp`. Extend `scripts/tests/topic-wiring.test.mjs` with the depth rule.
2. **Math field wash.** `public/images/routes/math-signal-field-square.webp` stays on `/topics/math/` and the topics visual card. Trigonometry, differential equations, vector calculus, scale intuition, and `/topics/software/differential-lambda-calculus/` lead with their lab or link the hub.
3. **Labeled plates.** Clockwork stays on `/topics/software/schedulers/`. Crystals stay on `/topics/software/compression/`. The sunflower webp stays on `/topics/nutrition/`. Complexity, field theory, symmetry, and `/topics/film/scene-composition/fermentation-hold/` link those pages. Symmetry drops the png twin.
4. **Paper still and tuner.** `public/images/renders/papergami/papergami-kinetic.webp` stays on `/topics/craft/svg/`. Calculus keeps the diagram that moves. Software and math link `/topics/#topics-tuning`. Pedagogy's four vibe widgets become principle cards. The eight lab pages share one `diagrams.js` query string.
5. **Programs frame.** Parallel and Competing Theories on `/topics/software/programs/`, then data structures, probability, optimization, and forecasting, one page a session. Cite only what a stable source attributes.

A decorative SVG map that repeats a route bridge goes when that hub is already open. It is not its own slice.

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

[living-learning-surface](../archive/living-learning-surface/PLAN.md) left five unbuilt modules as spec entries on `curriculum/index.html` (the list sits at lines 317–333). A second module uses this stub shape as plain HTML. Every analogy ends in a visible boundary test, then returns to the native technical model. `data-spw-curriculum-module` (13 uses on `/curriculum/`, absent from `.spw/site.spw`) maps onto an existing stem before another module adds to it.
