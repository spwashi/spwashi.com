# Plan: brace-semantics

**Status 2026-11-06.** No slice of this plan has landed. Since 2026-10-13 the creator settled one thing the plan leans on: each brace pair names its slot wherever it sits (2026-11-05), and `readExpressionSlots` (9f2e3af4) and spw.quest (d3dcda9f) now read both orders. The braces still mean different things in different files, the parser reads labels as words, and eleven serializers each invent a shape. The plan asks the creator five decisions (section A), then gives pages, regions and components one way into Spw (C), a `< & >` instrument as the first authored element (D), and a door from the home page into spw.quest (E). Slices 2a, 2b, 3a, 3b and 3.5 wait on nothing.

**Related:** [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (the language, and labeled braces as drift) · [spw-quest](../spw-quest/PLAN.md) (the instrument's first host) · [spellcraft-authoring](../spellcraft-authoring/PLAN.md) and [cauldron-lens-composition](../cauldron-lens-composition/PLAN.md) (the cauldron) · [copy-localization](../copy-localization/PLAN.md) (copy units) · [module-contract-overhaul](../module-contract-overhaul/PLAN.md) (modules as authored hosts) · [landing-visual-hierarchy](../landing-visual-hierarchy/PLAN.md) (the home page) · [upstream asks](../../../.spw/reviews/upstream-workbench-recommendations.spw).

## Direction (creator, 2026-10-13)

- "plan to revise brace semantics"
- The hero of spw.quest as `< & >`, with swipe, tap and drag on the container handles, a subscript ghost box on either side that can be filled with `.` or `~`, and a way to label a brace, turning `{` into `{_paper`.
- "the architecture of the spwashi.com runtime should be improved this way"
- The home page should make it easier to enter spw.quest with something relevant from the cauldron, the clipboard, or what was recently pinned.
- "the page/region/component serialization into Spw has been poorly considered"
- Expressions were first tied to elements through copy units, before there was infrastructure for granular progressive enhancement or for preprocessing and preweighting edges.

## A. What the braces mean today

Surveyed 2026-10-13. WB is the mounted workbench (`.spw/_workbench`).

| Pair | WB canon (`docs/theory/spw/operators.spw:67-70`) | Site registry (`public/js/kernel/operator-detection.js`) | Site conventions (`operator-semantics.spw`, `semantic-braces.spw`) | Parser node | Also in WB theory |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `< >` | concept | `<` concept, `>` concept-edge: two operators | concept, lens, conduit | capsule | membrane, coupling; `<>` is "coupling" (`operators.spw:41`) and "the concept operator" (`spw-seed/.../containers.ts:578`) |
| `( )` | scene | scene | scene, "stage a context" | ScopeNode | observation, lexical isolation |
| `[ ]` | mode | mode | mode, variant | FrameNode | individuation, selection aperture |
| `{ }` | definition | **direction** | direction, behavior | BodyNode | cavity, procedure |

Where a reader trips:

1. `{ }` is *definition* on spw.quest and in WB canon, *direction* in the registry and CSS (`--op-direction-color`), *behavior* in the conventions. `operator-namespace-alignment.spw:63` carries both: "direction · definition".
2. *Frame* is `[ ]` to the parser and `#>` to the site.
3. `( )`'s color is the surface color in `tokens/core.css:1596`, but its fallback in `handles/operators/bias-and-phrases.css:115` names the ref color, so any page without core.css paints scenes as references.
4. `< >` is one pair to the parser and two operators to the site.
5. WB's `operator-atlas.spw:28-30` pairs the braces with the wrong parser nodes.
6. `runtime/interaction/brace-pivots.js:69-70` aliases boon and bane onto the walls, which `site-semantics.spw:45` forbids. The alias is wider than the script: `shell/layout.css` §5 gives `.spw-boon-wall` and `.spw-bane-wall` the objective and subjective wall rules, `effects/cinematic.css:616` repeats them, and four `recipes/` routes carry both classes on each wall.

**Labels.** The site's notes treat `{_A … }_A` as labeled scopes that may overlap ([spw-metaphysical-language](../spw-metaphysical-language/PLAN.md), drift-brace-006 in its ledger). The parser does not. `{_paper a }_paper` reads as a body holding the words `_paper a` and a loose word after it, and reports success. `{_A {_B }_A }_B` puts each label on the wrong pair, silently. The AST has `openLabel` and `closeLabel` on container nodes (`spw-seed/src/types/ast/nodes.ts:232-240`), and no grammar rule sets them. WB allows nesting and disjoint spans, and leaves overlap open (`docs/theory/spw/brace-charge-crawl.spw:157`).

**Side marks.** `.<&>~` parses as three neighbours. Nothing says what a mark after a container attaches to.

### The decisions, the creator's

1. **One name per pair**, said the same way in canon, registry, CSS, spw.quest and the atlas; other words become glosses. The live one is `{ }`: *definition*, *direction*, or *behavior* as a reading of one of them.
2. **The walls.** `{` objective and `}` subjective as a reading of every pair, or of `{ }` only; boon and bane off the walls either way.
3. **`< >`**: one pair, or `<` and `>` as marks of their own.
4. **Labels**: nesting only, or overlap too; whether a label closes only its own pair; whether an unmatched label is an error.
5. **Side marks**: whether `.` and `~` beside a container bind to it (`.<&>` grounds it, `<&>~` leaves it open after), and which marks may stand on which side.

Once made: the table is written once in WB canon as an upstream ask, with the lexer change for labels (set the label fields, check that a close matches, say what overlap does); the site reads that table instead of restating it (the registry's brace entries, the brace colors, `semantic-braces.spw`, spw.quest's `CONTAINERS`, and its route test, which today asserts literal lines of `operators.spw`). The `( )` fallback and the wall aliases are site fixes that wait on nothing.

## B. How a page becomes Spw today

**Association.** 1,075 elements carry `data-spw-semantic-expression` (978 distinct), 361 carry `data-spw-copy-unit`, 108 lines carry both. `copy-accessor.spw` calls the copy unit the flat localization key and the expression the handle; a nested unit inherits its outer unit's expression only in `narrative-instrumentation.js:398-405`.

**Edges.** The manifest (`scripts/build-expression-manifest.mjs`) keeps each expression's slots and drops the kin index on purpose (`:39`). `buildKinIndex` (`runtime/expression/expression-resonance.js:157`) builds the edges in the page on every load, with fixed weights (subject 1, mode .7, projection .55, else .45) and a 700 ms dwell. Salience is stored under `spw-expression-salience`, which is missing from `STORAGE_KEYS`.

**Eleven serializers, eleven shapes.**

| Level | Where | Emits |
| :--- | :--- | :--- |
| region | `region-menu.js:952` `buildSeed` | `route<region> <lens> operator{expression}` |
| element | `spw-block-association.js` `serializeElementToSpw` | `#>id[expression]` and claims; exported, called by nothing in the site (only the unimported `SPW_BLOCK_ASSOCIATION_CONTRACT` names it); see C |
| page | `page-anatomy.js:812` | `#>page[surface]{ route= anatomy=#[…] frames=#[…] }` |
| page | `topical-payload.js:204` | `topical_payload = .{ route= topics= handles= }` |
| component | `semantic/cauldron/storage.js` `toSpwExpression` | `sigil nucleus[role.affordance]{region.liminality}<consequence>` |
| composition | `interface/composition.js:289` | the vessel spec with `{a + b + c}` |
| spell | `spells.js` `constructSpell` | `!cast_spell(…)` then a `^"replayable_navigation"{…}` block |
| seed card | `seed-card.js:111` | `^seed[Template year:YYYY]{ key: "json" }` |
| module | `catalog/contract-spw.js:58` | `#>id #:layer`, `$[sel]{scope}`, `~[when]{arc}` |
| pins | `bookmark-registry.js:46` | `^[pinned_frames]{…}`, on screen only |
| narrative | `narrative-instrumentation.js:611` | `narrative_seed_*` blocks |

**The cauldron writes back.** When a host has no expression, `ensureElementDeepLink` in `composition.js` (the write at :625-627) puts its feature, kind, label or id onto `data-spw-semantic-expression`, so later readers meet a word that nobody authored. The `SpwIngredient` type (`types/spw.d.ts:281`) has none of the expression fields items carry.

**Memory.** Pins (`spw-pins`, `buildPinRecord` in `runtime/memory/pin-registry.js`, called from `brace-gestures.js:798`) keep page, id, title, wonder, operator and context, and no expression, though the gesture that makes them has one. "Pin region" in the region menu marks the region and saves nothing. Nothing reads the clipboard; copies are not remembered. No "recent" list exists.

**Home.** "Have some Spw?" (`index.html:151-160`) sends text to the site's parser. spw.quest is reached through related routes and the domain page only; nothing on home reads pins or the cauldron.

## C. One way into Spw: labeled scopes, and a way back

- **One serializer, three levels, one shape.** A component, a region and a page each serialize as a scope labeled with its handle, holding its authored expression, its children's scopes, and its links. The pair and the label syntax follow decisions 1 and 4. Until then fixtures use `{_handle … }_handle`, marked provisional, or the one-line block `#>handle expression` with `#:key #!value` claims below it (`.spw/conventions/spw-serialization-hydration.spw#serialization_grammar`).
- **The element pair in `semantic/spw-block-association.js`, probed 2026-11-06.** Neither function has a caller, so no reader meets these defects yet; the pair is the seed of the component level, not a repair visitors would notice.
  - `serializeElementToSpw` writes `${handle}[${expression}]`. The workbench reader accepts `#>card_one[topic[lens]{a, b}]` with no error, because it reads the whole line as the handle's mode; the site's own `parseSpwDefinition` reads subject `""` and mode `topic[lens`, so the word is lost on the way back.
  - `hydrateElementFromSpw` writes the text to `data-spw-definition` and never to `data-spw-semantic-expression`. `resolveElementSpwBlock` reads the definition first and the serializer reads the expression first, so serializing after hydrating returns the old line. It also writes every `#:key #!value` claim as a `data-spw-<key>` attribute, so pasted text can found an attribute family, which the guards forbid.
  - A two-line block does not fix it: `expressionLineFrom` takes the first line that is not a claim, so `#>card_one` on its own line is read as the expression. `#>card_one topic[lens]{a, b}(studio)<receipt>` on one line keeps every slot, in either order, when read with `readExpressionSlots`; `parseExpressionQuery` keeps the first `[ ]`, `{ }` and `< >` and drops `( )`.
  - `__SPW_SITE__.parser.hydrate(el)` already exists (`site.js`) and returns `readSpwHydration(el)` (`semantic/expression-query.js`), a read of three precipitates. Writing a line into a host needs its own verb, or `hydrate` names a read and a write (see homonym-renaming's ledger).
- **Association leaves copy units.** The expression stays on `data-spw-semantic-expression`; the copy unit stays a localization key and nothing else. A host with no authored expression gets none written into the page: derived readings live in the serializer's output, never on the element. The cauldron's write-back (`ensureElementDeepLink`, B) stops.
- **Edges before load.** The manifest carries the kin index with its weights, so the page looks edges up instead of building them. Measure the manifest's growth against the runtime build before choosing.
- **The eleven route through it.** Page anatomy (`serializePageAnatomy`), topical payload (`serializeTopicalPayloadToSpw`), region seeds (`buildSeed`), block association and cauldron items (`toSpwExpression`) call the one serializer at their level and keep their own buttons. Seeds, spells, module contracts and compositions are other genres. They keep their shapes, and are named as genres rather than serializations.
- **Sensor.** Three fixtures, a component, a region and a page, serialize and parse back through `semantic/spw-workbench-reader.js` with no error and no prose fallback, every label closes its own pair, and a fixture written in, then read out, comes back as the same line in its author's order (`readSlotOrder`).

## D. The instrument: `< & >`, the first authored element

**A component that reads its line back.** Several hosts already rewrite their expression when their state changes: the lens switch (`writeLensModeState` in `runtime/page/lens-modes.js`, through `composeModeSeatExpression`), the cauldron chip (`*cauldron{…}` from `composeLiveExpression`, c672468e), the design-ecology specimen (`buildEcologyExpression` in `modules/design/experiments.js`) and the boonhonk mixer. None reads a line back into its controls. The same contract is held for chrome in [floating-chrome-stack](../floating-chrome-stack/FIX.md) ("Useful, Spw-native chrome") and for the cauldron in [spellcraft-authoring](../spellcraft-authoring/PLAN.md) ("Operators, not verbs; magic, not cooking"); this plan owns the serializer and the instrument, not every such host.

| Host | Slots ↔ controls | Writes its line today | Reads a line back |
| :--- | :--- | :--- | :--- |
| `< & >` instrument (spw.quest hero, then `/topics/software/spw/`) | pair kind, label, side marks | not built (Slice 7) | the design below |
| Lens switch (`/design/components/#lens-seat-b`, `data-spw-lens-chrome="silent seat"`) | `[mode]` ↔ the `aria-pressed` seat (`data-set-mode`) | yes, on every press | no; `requestLensMode` (`lens:request`) is the one way to ask for a seat |
| Nested layout frame (`pre > code.language-spw`) | nested pairs ↔ nested regions | owned by [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) Pass 2 | — |
| SVG host with a `.spw-svg-rail` (`media/svg-tunability.js`) | `( )` ↔ `spw-svg-env` (`studio\|proof\|poster\|model`), `{ }` ↔ the focused rail node | no line; `copy-url` chips write its tuning as URL params | URL params, not a line |

Proposal: prove the way back on the lens switch first, since half of it is built. Reading `[mode]` from a line with `readExpressionSlots` and asking `requestLensMode` for that seat keeps lens-modes' one-writer rule, and a node test can hold the round trip before the instrument's look is approved. A reader who pastes `bench_b[kernel]{open.sit}` under the seat row and watches the kernel seat press itself learns, in one gesture, that the line is the control. The paste field's place and feel end at a browser demo (`#>wonder_brace_semantics_first_way_back`).

```
   ▫ < & > ▫          ▫ a ghost box, set low like a subscript
   . < & > ~          a ghost filled on either side
   {_paper & }_paper  a handle pulled open and labeled
```

| Gesture | On | Does | Keyboard | Scripts off |
| :--- | :--- | :--- | :--- | :--- |
| tap | a handle | turns the pair to the next kind, both walls together | Enter or Space | each handle is a link to the next kind |
| swipe up or down | a handle | turns forward or back, like a dial | ↑ ↓ | links both ways |
| drag outward | a handle | opens the pair and raises a label slot under it | L, then type | a label field in the form |
| drag inward | an open handle | folds the label away | Esc | the field cleared |
| tap | a ghost box | fills `.`, then `~`, then empties | type `.` or `~`; Backspace | a link through the three states |

Every change says what it did: a line under the instrument writes the expression as text, reads it in words, and shows the parser's verdict. Handles, ghosts and the label slot hold their space from first paint, so nothing reflows; reduced motion keeps every state and drops the travel. Side marks and labels are provisional until decisions 4 and 5.

**A first half on spw.quest (2026-11-06, on main, not deployed).** On `/pivot` every part of a line is this form with something inside, and `<&>` is the first start.
- A tap shows the part's walls turned to the next empty pair (the `walls` pivot), and a second tap goes there.
- A swipe dials on through its other turns. The swipe is sideways, not up and down, so the page still scrolls through the parts; that is a taste call for the creator.
- A pinch shows the line without the part.
Labels, side marks and the runtime element are not built.

**Where it lives.** In the site's runtime, as one light-DOM element that wraps a readable expression (the 2026-10-06 direction: modules as authored hosts, state on the host, the expression on the host read into tokens there). spw.quest takes it through the peer kit (`scripts/build-peer-kit.mjs`), which carries modules as well as tokens and faces, with the same drift check. It is spw.quest's hero first and one site route second. The feel is approved in a browser before it ships.

## E. A door from home into spw.quest

- One door beside "Have some Spw?": **take this to spw.quest**, with three sources, each chosen, none automatic.
  - *Cauldron*: the items whose expressions are authored Spw. The fallback words are left out until C stops writing them.
  - *Clipboard*: read only on a tap of its own, or pasted into the field that is already there.
  - *Pinned*: needs pins to keep the expression they were made with: one field added to the record in `pin-registry.js`, under the existing key.
- The door shows the script it will carry before it goes: one labeled scope per source, through C's serializer.
- **The handoff rides the fragment** (`spw.quest/build#script=…`), so clipboard text never reaches the worker or its observability logs (`workers/spw-quest/wrangler.jsonc`). spw.quest reads the fragment in the page; `?script=` stays for links a reader makes on purpose.
- Static markup first, counts filled in place, no reflow on load.

## F. The runtime, "this way"

Not a rewrite: one pilot of each, measured before more.

- **Kits that run in two places.** Like spw.quest's file reader, the serializer and the reader run at build time (manifest, edges, static seeds) and in the page (live), from one source.
- **Authored hosts.** The instrument is the pilot element. `npm run audit:root-writes` and a frame trace decide whether a second module follows.
- **Peers by generation.** Modules reach spw.quest the way tokens and faces now do: generated, carried, checked.

## Slices, ranked

One commit each. "Nothing" means the slice can land today.

| # | Slice: what it touches and changes | Waits on | Verified by |
| :--- | :--- | :--- | :--- |
| 1 | The five decisions (A); decision 1 is `#>wonder_brace_semantics_curly_name` | the creator | answers in `index.spw` |
| 2a | `buildPinRecord` (`runtime/memory/pin-registry.js`) keeps the expression its caller (`brace-gestures.js:798`) already holds, under the same `spw-pins` key | nothing | `npm run test:modules`; a pin made on a host reads back its expression |
| 2b | `ensureElementDeepLink` (`interface/composition.js`) stops writing `data-spw-semantic-expression`; the fallback word stays in the returned state | nothing | `rg -n 'element.dataset.spwSemanticExpression = semanticExpression' public/js/interface/composition.js` finds nothing; `test:modules` |
| 3a | `( )` fallback in `handles/operators/bias-and-phrases.css:115` names the surface color, as `tokens/core.css:1596` does; CSS bundle rebuilt in the same commit | nothing | `rg -n 'op-scene-color, var\(--op-ref' public/css` finds nothing |
| 3b | Boon and bane off the walls: the selector in `brace-pivots.js:69-70`, the alias selectors in `shell/layout.css` §5 and `effects/cinematic.css:616`, the alias classes in four `recipes/` routes and the symphony lab's CSS. Inert, since every wall already carries the objective or subjective class | nothing | `rg -l 'spw-(boon\|bane)-wall' --glob '!**/bundles/**'` finds nothing; one recipe route looks unchanged |
| 3.5 | The element pair (C): one-line `#>handle expression` out, `readExpressionSlots` and `readSlotOrder` in, `data-spw-semantic-expression` written, claims kept as claims rather than attributes, and the write under its own verb rather than `hydrate` | nothing | a module test written in this slice, beside `scripts/tests/expression-query.test.mjs`, holds the round trip on the lens-switch fixture; `test:modules` |
| 4 | One serializer, three fixtures (component, region, page); page anatomy, topical payload, cauldron items and region seeds through it | 3.5; decision 1 for the final label syntax | C's sensor |
| 5 | Upstream ask: the brace table and label lexing, in `.spw/reviews/upstream-workbench-recommendations.spw` | decision 1 | the ask cites `operators.spw:67-70` and `nodes.ts:232-240` |
| 6 | The home door (E), with the handoff on `spw.quest/build#script=` | 2a, 2b, then 4; a browser look for its place | `check:workers`; the door's script parses before it goes |
| 7 | The `< & >` instrument demo on spw.quest, carried by `scripts/build-peer-kit.mjs` | decisions 4 and 5 for labels and side marks; a browser look | `build:peer-kit -- --check`; phone stills |
| 8 | Kin index in the manifest (`build-expression-manifest.mjs:39` says why it is not shipped today) | 4; a measurement of manifest growth | the page stops calling `buildKinIndex` on load |

## Guards

- No edit to `.spw/_workbench`; changes to canon and the parser go upstream as asks.
- No new `data-spw-*` family; expressions stay on `data-spw-semantic-expression`, copy units stay localization keys.
- Every affordance works with scripts off.
- The clipboard is read only on an explicit tap; nothing leaves the browser except what the reader sends, and the handoff rides the fragment.
- Gestures, pacing and the door's place on home are approved in a browser first.

## Validation

- `npm run audit:plans -- --slug=brace-semantics`.
- Serializer fixtures parse back through `public/js/semantic/spw-workbench-reader.js` with no prose fallback and matched labels.
- `npm run check:workers` and `npm run build:peer-kit -- --check` for anything carried to spw.quest.
- `npm run audit:root-writes` and phone stills for the instrument; `npm run check:local`.
