# Plan: brace-semantics

**Status 2026-10-13.** Proposed; nothing built. The braces mean different things in different files, the parser reads labels as words, and eleven serializers each invent a shape. This plan asks the creator five decisions (section A), then gives pages, regions and components one way into Spw, a `< & >` instrument as the first authored element, and a door from the home page into spw.quest.

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
3. `( )`'s color is the surface color in `tokens/core.css:1600`, but its fallback in `handles/operators/bias-and-phrases.css:115` names the ref color, so any page without core.css paints scenes as references.
4. `< >` is one pair to the parser and two operators to the site.
5. WB's `operator-atlas.spw:28-30` pairs the braces with the wrong parser nodes.
6. `runtime/interaction/brace-pivots.js:69-70` aliases boon and bane onto the walls, which `site-semantics.spw:45` forbids.

**Labels.** The site's notes treat `{_A … }_A` as labeled scopes that may overlap (`spw-metaphysical-language/PLAN.md:48-61`). The parser does not. `{_paper a }_paper` reads as a body holding the words `_paper a` and a loose word after it, and reports success. `{_A {_B }_A }_B` puts each label on the wrong pair, silently. The AST has `openLabel` and `closeLabel` on container nodes (`spw-seed/src/types/ast/nodes.ts:232-240`), and no grammar rule sets them. WB allows nesting and disjoint spans, and leaves overlap open (`docs/theory/spw/brace-charge-crawl.spw:157`).

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
| element | `spw-block-association.js:106` | `#>id[expression]` and claims; exported, called by nothing in the site, and contradicts `spw-serialization-hydration.spw:27-44` |
| page | `page-anatomy.js:812` | `#>page[surface]{ route= anatomy=#[…] frames=#[…] }` |
| page | `topical-payload.js:204` | `topical_payload = .{ route= topics= handles= }` |
| component | `semantic/cauldron/storage.js:114` | `sigil nucleus[role.affordance]{region.liminality}<consequence>` |
| composition | `interface/composition.js:288` | the vessel spec with `{a + b + c}` |
| spell | `spells.js:270` | `!cast_spell(…)` then a `^"replayable_navigation"{…}` block |
| seed card | `seed-card.js:111` | `^seed[Template year:YYYY]{ key: "json" }` |
| module | `catalog/contract-spw.js:58` | `#>id #:layer`, `$[sel]{scope}`, `~[when]{arc}` |
| pins | `bookmark-registry.js:44` | `^[pinned_frames]{…}`, on screen only |
| narrative | `narrative-instrumentation.js:611` | `narrative_seed_*` blocks |

**The cauldron writes back.** When a host has no expression, `composition.js:616-628` writes its feature, kind, label or id onto `data-spw-semantic-expression`, so later readers meet a word that nobody authored. The `SpwIngredient` type (`types/spw.d.ts:279`) has none of the expression fields items carry.

**Memory.** Pins (`spw-pins`, `pin-registry.js:22-34`) keep page, id, title, wonder, operator and context, and no expression, though the gesture that makes them has one. "Pin region" in the region menu marks the region and saves nothing. Nothing reads the clipboard; copies are not remembered. No "recent" list exists.

**Home.** "Have some Spw?" (`index.html:151-160`) sends text to the site's parser. spw.quest is reached through related routes and the domain page only; nothing on home reads pins or the cauldron.

## C. One way into Spw: labeled scopes

- **One serializer, three levels, one shape.** A component, a region and a page each serialize as a scope labeled with its handle, holding its authored expression, its children's scopes, and its links. The pair and the label syntax follow decisions 1 and 4. Until then fixtures use `{_handle … }_handle`, marked provisional.
- **Association leaves copy units.** The expression stays on `data-spw-semantic-expression`; the copy unit stays a localization key and nothing else. A host with no authored expression gets none written into the page: derived readings live in the serializer's output, never on the element. The cauldron's write-back stops.
- **Edges before load.** The manifest carries the kin index with its weights, so the page looks edges up instead of building them. Measure the manifest's growth against the runtime build before choosing.
- **The eleven route through it.** Page anatomy, topical payload, region seeds, block association and cauldron items call the one serializer at their level and keep their own buttons. Seeds, spells, module contracts and compositions are other genres. They keep their shapes, and are named as genres rather than serializations.
- **Sensor.** Three fixtures, a component, a region and a page, serialize and parse back through the site's parser: no prose fallback, and every label closes its own pair.

## D. The instrument: `< & >`, the first authored element

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

| # | Slice | Value | Cost | Waits on |
| :--- | :--- | :--- | :--- | :--- |
| 1 | The five decisions | unblocks 4, 5, 7 | a conversation | creator |
| 2 | Pins keep their expression; the cauldron stops writing to the page | honest memory for the door | small | nothing |
| 3 | `( )` color fallback; wall aliases off | two contradictions gone | small | nothing |
| 4 | One serializer, three fixtures; page anatomy and region seeds through it | one shape | medium | 1 for the final syntax |
| 5 | Upstream ask: the brace table and label lexing | the parser agrees with the notes | an ask | 1 |
| 6 | The home door, with the fragment handoff on spw.quest | the entry the creator asked for | medium | 2, then 4 |
| 7 | The instrument demo on spw.quest, carried from the site | the hero; the pilot element | medium | 1 for labels and side marks; a browser look |
| 8 | Kin index in the manifest | edges before load | measure first | 4 |

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
