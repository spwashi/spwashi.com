# factshift.center tools: design and theory

Status 2026-11-06. A plan, nothing built. The creator asked to improve the design and theory of each tool, plan first. This file reads the nine tools as they run at app `b1fd11a` (deployed as Wrangler version `ecdf9aa0`). It proposes one theory they share, then names a slice per tool. Code paths are in the app checkout, `workers/factshift-center/app`. The census behind it was read on 2026-11-06 from the source and from a phone-width capture of every tool open on `?spw=beans<food>(kitchen)[mode]{stew}`.

## The feel to design toward

The creator, 2026-11-06: the feeling of entering and navigating onto a surface to immediately actualize a fluent action, with learnable surroundings, should be a key design of factshift.center. It should feel a bit like playing the piano or dancing across a keyboard, playing with a synthesizer, casting rain, playing the bagpipes, modeling clay, playing cat's cradle, knitting a sweater, arranging cables, laying a circuit, tracing a blob, painting with stars.

- **On arrival, one act is ready.** Entering a frame (by `#>`, a tile, or a node) lands on a surface whose head line is already primed, so the first touch plays something. The focal point's five states are the surroundings, and they never move: a reader learns where default, preview, select, crawl and reflex live once, and plays every tool from there.
- **Each image is a proposal for the tool it fits.** These are for the demo to test, not decisions.

| image | tool | what the image asks of it |
|---|---|---|
| piano, a dance across a keyboard | the column and the focal point | keys 1–9 and the arrows played in runs; a tool opens, crawls and acts in one motion |
| a synthesizer | reflex, node's feel card | knobs named in words that change the field while held, the sound heard as it is turned |
| casting rain | map | a cast falls across the selection and lands on every node it touches, visibly |
| bagpipes | story | a held drone, play, under stepped notes, the kept states |
| modeling clay | node | make, pinch and press a node to its size, as the pinch already does |
| cat's cradle | the hand's link | strung between two fingers, a link made by drawing from node to node |
| knitting a sweater | spw, story | lines added row by row, each held line building on the last |
| arranging cables | node's ties, query | ties pulled from slack to tight; the address's chips laid in order |
| laying a circuit | frames, `#>` | a path of frames closed by entering and returning; a circuit that lights when it closes |
| tracing a blob | filter | a question traced around a region of the canvas, its answers lit inside the trace |
| painting with stars | color | a perspective brushed across nodes, each node a star taking the color |

## What the nine tools are today

The column runs reflex, color, map, filter, node, query, debug, story, spw (`src/js/spwashi/interface.ts`, `DEFAULT_MODE_ORDER`). Keys 1–9 open them; so do `?mode=`, a Spw line `mode X`, and a ← slide of the lens. Folder names differ from the keys:

| key | folder | the tool |
|---|---|---|
| color | `modes/dataindex` | swatches |
| node | `modes/direct` | node cards |
| map, filter | `modes/mapfilter` | both editors |
| query | `modes/querystring` | the address |
| debug | none | the JSON view |

- **The tools do not share a design.** Node's cards speak plain words: huddle to spread, glide to stuck, free to pin, slack to tight. Reflex labels its buttons with arithmetic (`/=2.3`, `*-1 → 30`, `-10k`) beside a row of lore words. Color's thirteen swatches run off the right edge of their window at 390px. Map and filter show a blank editor and "submit". Query shows raw `spw=…` and "go". Debug lays a JSON dump over the canvas. Story is a single "context" chip. Spw is a prompt with "run" and "trace".
- **A press means different things.** There are four submit words: submit, go, run, and Enter, which adds a node in node and starts a new line in spw. Color, map, filter and reflex close on a press; node and spw stay open.
- **The primed act is often invisible.** Map, filter and query press their submit. Reflex, color, node and story repeat the last press, so nothing is primed until something has been pressed once. Debug primes nothing. (`ui/tool-primed.ts`)
- **One parameter has three homes.** Reflex, node's feel card and the `[...]` forces row all set velocity decay; only the feel card writes the address.
- **"Tool" names two things.** It is the nine modes, and also what is held in hand: the palette of link, grow, shrink, remove, color, raise and spin (`ui/tool-palette.ts`).
- **Three bugs, confirmed in code:**
  - opening color restarts the story sequence (`modes/dataindex/mode-dataindex.ts`, `onColorModeStart` calls `initializeStorySequence(true)`);
  - query's field is filled once and goes stale after a `?spw=` or a feel write (`modes/querystring/mode-querystring.ts`);
  - filter removes the nodes that match, the inverse of `Array.filter` (`simulation/nodes/data/selectors/multiple.ts`, `selectOppositeNodes`).
- **Dead code:** `initSpwPrimeControls` still queries `[data-spw-prime]` after the priming buttons were removed.

## One theory for all nine

**A tool is an operator applied to the canvas, and its window is that act written as one line.** The creator's pair is primed and actualized (`INTERACTION.md`): a primed act is a line the reader can read before anything happens; an actualized act is the press. This plan makes the pair visible in every tool with two lines:

- **The head line is the primed act**, written with the tool's operator. Its slots are the tool's controls, as floating-chrome-stack made each floating piece one expression whose slots are its controls. Pressing Enter, swiping → or tapping the operator actualizes it. One key, every tool.
- **The receipt is a `*` line, the value the act came to.** Reflex already reports `x before → after` beside the handle; every tool would. A receipt names what changed, and where an act can be undone it says how. This answers the audit's finding that a tile's → lands at once and cannot be undone (`.spw/audits/factshift-center-verbs-2026-10.spw`).

The operators come from the canon table (`public/js/kernel/operator-detection.js`). Which tool takes which operator is the creator's call (`#>wonder_factshift_tool_operators`). The proposal reads each tool's job:

| tool | operator | what the tool is | a head line, primed |
|---|---|---|---|
| reflex | `!` action | a kick to the field: a force applied once, felt, and reported | `!reflex[charge]{-100}<field>` |
| color | `@` perspective | the point of view new nodes are made under; the legacy parser already dedupes identities by it | `@color[3]{new nodes}` |
| map | `~` potential | what each node could become, cast over a selection as a line | `~map[selection]{word ~> word.kitchen}` |
| filter | `?` wonder | a question asked of each node; the answers stay | `?filter[kind]{nominal}<keep>` |
| node | `.` ground | where nodes are made, kept, and settled | `.node[feel]{apart.even.near.drawn}` |
| query | `#>` frame | the address that frames the whole state, to read, edit, and share | `#>query{spw.mode.charge}` |
| debug | `$` substrate | what the canvas runs on, read as lines instead of a dump | `$debug[run]{parse.normalize.interpret}` |
| story | `^` integration | states gathered into an order you can step through | `^story[3/5]{kept states}` |
| spw | `&` subject | the held line, the subject every other tool acts on | `&spw{beans<food>(kitchen)[mode]{stew}}` |

The ten canon operators then mark nine tools and the one receipt. A reader who learns that the head is the act and the `*` line is what it came to has learned every tool. That is the learnable-surface rule: one key, taught once, varied by role.

## The focal point: one square, five states, per tool

The creator likes the focal point and asked for the handle and the square to be designed with each tool in mind, across selection, crawling, reflex, default and preview. The square and handle (`ui/focal-point.ts`) already carry, step (`ui/tool-steps.ts`) and fire the primed act. The proposal gives the square the same five states in every tool, with each tool supplying what each state means:

- **default:** what the square shows at rest with this tool in hand;
- **preview:** the primed line, before anything happens (the head line above);
- **select:** what the square gathers;
- **crawl:** what the arrows and the d-pad walk along, the tool's axis;
- **reflex:** what a swipe → or a tap on the operator actualizes, leaving a `*` receipt.

| tool | default | preview | select | crawl | reflex |
|---|---|---|---|---|---|
| reflex `!` | the field's charge | the kick and its outcome | the field, or the selection | across force words (the lore row) | kick |
| color `@` | the perspective new nodes take | how many nodes it would color | the nodes in that perspective | across perspectives | give the selection that perspective |
| map `~` | the last cast | the cast line, and how many nodes it rewrites | a slot query's answers | across a line's slots: word, mode, body, scene, concept | cast |
| filter `?` | the question | "keeps 4 of 13", the kept nodes lit | the answers | across slot queries `{…}` `<…>` `[…]` | keep |
| node `.` | the node under the square | what add or replace would do | that node | along links to neighbor nodes, the canvas's crawlable edges | the last card choice |
| query `#>` | the address | the address after an edit | one parameter | across parameters | load |
| debug `$` | the last run's last stage | the next stage's line | a node's reading at that stage | across stages: parse, normalize, interpret | run again |
| story `^` | the current kept state | the next state | a kept state | step through states | keep a state, or play |
| spw `&` | the held line | the line after the prompt's edit | one slot of the held line | across slots, and into and out of frames | run |

The same idea is landing elsewhere. spw.quest's shelf now offers each operator as a handle (`/shelf/`), and the creator pointed at Notion's block handle and embedded pages. Both are one handle per part, as the square is here. Whatever the square learns about selecting, crawling and acting should read the same on the shelf.

Crawling is where the creator's question about crawlable edges lands on the canvas. Node crawls links, map crawls slots, spw crawls frames, and story crawls time. Each axis is drawn the same way (the square moves, and the edge it moves along lights), so a reader learns to crawl once.

## Map and filter, Spw-native

The creator asked that map and filter integrate selection, projection, slots and topography the Spw way. The reading:

- **Selection is a slot query.** spwashi.com's `expression-query.js` and spw.quest's shelf already answer `{seed}` (holds seed), `<receipt>` (goes to a receipt), `[pi]` (a lens starting pi) and `medium[*]` (medium through any lens). Filter asks the same queries of the nodes, each node read by the slot reader (`readLine`), so one query grammar runs on three sites.
- **Projection is a slot rewrite.** Map's cast names the slot it changes and what it becomes, `~map[body]{stew ~> stew.slow}`, and runs through `writeAt`, so a node's line is rewritten byte for byte and nothing it held is dropped.
- **Topography is where the answers stand.** The canvas already stacks a line's slots as regions (word, scene, body, concept). Filter and map light the regions their query touches, so a reader sees which part of each line answered before keeping or casting.

Slices M1 and F1 take this shape once `#>wonder_factshift_spells` and `#>wonder_factshift_filter_sense` are answered. The shared query code is an ecosystem-architecture carry (`.spw/surfaces/site-cluster.spw#carries`).

## Frames: navigating with Spw

The creator: ideally Spw navigates between factshift.center frames. Entering a node already opens a page with the node as its frame and the parent line in the address (6b85a42). The proposal: a `#>` line held in the spw prompt, or given in `?spw=`, enters that frame, and `.` returns to the parent, so the address reads as a path of frames. Every plan's head line begins with `#>`, so a plan opens as a frame a reader can walk into. Held as `#>wonder_site_cluster_frame_navigation`.

## Regions: consequence, or quiet

The creator: dragging containers or interacting with regions should come with more consequence, positionally or behaviorally, or the regions should not be visible when the interactions are not meaningful. It should also be possible to add to a container, and perhaps to use selection semantics to change the connector, delimiter or separator. The slot reader the canvas now uses (readLine, writeAt, joinParts) can carry each of these:

- **A region shows only where an act means something.** At rest, the slot regions (word, mode, body, scene, concept) are quiet outlines or absent. A region lights when the square is over it, when something is dragged over it, or when a tool's query touches it (map and filter's topography). The resize corners appear only on a region that can take a size.
- **Moving a region moves its slot in the line.** Each brace pair names its slot wherever it sits, so dragging the scene's region before the word writes `(kitchen)beans<food>…` and the head line and title follow, byte for byte. A drag that would not change the line snaps back and says so in the receipt.
- **A container takes what is dropped on it.** A node dropped on `{ }` joins the body as a part, written with the body's separator; dropped on `( )` it becomes the scene; on `< >`, the concept. The receipt is the new line.
- **Selection reaches the joins.** Selecting two parts of a body selects the separator between them. Pressing `.` `,` `;`, or `~>` (or choosing it from a chip row under the selection) rewrites that join; `.` ident, `,` common, `;` ordinal, `~>` project, the joins `expression-query.js` already reads. The same selection over a compound (`~` `^` `&` `@`) offers its marks.
- *Slices.* G1, quiet regions, is a feel change ending at a demo. G2 moves regions and G3 drops into containers, both under the C2 receipts. G4, joins by selection, follows G3. Each is checked in the browser by a held line rewritten byte for byte.

## Multi-touch: frame or canvas

The creator asked to consider multi-touch gestures on a frame against the canvas. PLAN.md's gesture grammar already reads one rule per target (handle, lens, node, empty stage). This adds the count of fingers and the difference between where they land: on the canvas, the fingers move the view and the field; on a frame, meaning a region, a container, or an entered node's page, the same fingers act on that frame.

| fingers | on the canvas | on a frame |
|---|---|---|
| two, pinch | zoom the camera | size the frame (G2's consequence) |
| two, spread on a node | — | enter the node as a frame (`#>`) |
| two, pinch closed inside an entered frame | — | return to the parent frame (`.`) |
| two, drag | pan the camera | move the frame, which moves its slot in the line (G2) |
| two, twist | turn the field | turn the selection's join through `.` `,` `;` `~>` (G4) |
| three, swipe | step the story's kept states (`^`) | step this frame's own history |

- **Why.** The fractal the creator named (embedded frames, perspective, layering) becomes something the hands do: spreading enters a frame and closing leaves it, at any depth, and the address bar shows the path of frames (frame navigation, above).
- **The guards.** A two-finger gesture never fires a one-finger act on the way in. A gesture the target cannot take does nothing and shows no region (Regions, above). A trackpad's pinch and a two-finger scroll keep their desktop meanings.
- **Gate:** a demo on a phone, after G1 and C2, and `#>wonder_factshift_multitouch` for whether spreading to enter is the right hand for the fractal.

## A glass tool (Apple's Liquid Glass)

The creator asked about designing a tool that could accommodate Apple's Liquid Glass design future: controls as a translucent layer that floats above content and takes its light from what lies beneath. factshift.center is close already, since every tool window floats above the canvas, and spwashi.com has a glass metamaterial (`effects/material.css`, `data-spw-metamaterial="glass"`).

- **The proposal.** A tool window becomes a glass layer: `backdrop-filter` with a small SVG displacement filter refracts the canvas through the window, and its tint follows the region under the square, so a window over a scene reads warmer than one over a body. Corners run concentric with the window's frame and the device's safe area. A window shrinks to its head line while the canvas is being dragged and returns when the drag ends.
- **The guards.** Legibility comes first. Under `prefers-reduced-transparency` and `prefers-contrast: more` the glass turns matte. The head line and receipt keep a contrast floor measured against the busiest canvas behind them. Capture mode renders the matte form, so a screenshot reads.
- **Ownership.** The focal point table is unchanged by this: glass is how a window is made, not what it does. Gate: a browser demo on a phone and a desktop, and `#>wonder_factshift_glass_tool` for whether it suits the canvas or only the chrome.

## Shared slices (the chrome)

- **C0 — Hygiene, ungated** (app repo).
  - The color grid wraps to the window at phone width.
  - Color stops restarting the story.
  - Query reads the address each time it opens.
  - Remove the dead `initSpwPrimeControls`.
  - Correct the "1-6" comment in `init/hotkeys/_.ts` to 1–9.
  - Check: `tsc --noEmit`, `vite build`, a headless phone shot of color and query, the snapshot tests.
- **C1 — The table.** The creator answers `#>wonder_factshift_tool_operators`. Nothing in C2 to C3 is built before that answer.
- **C2 — Head line and receipt on three tools** (node, reflex, query). Each window opens on its primed line, and every press leaves a `*` receipt. Enter, →, a tap on the operator, and the tile's → all actualize the same line. The button names the act's verb, but the key never changes. Gate: a browser demo for the creator's look on a phone and a desktop, then the other six.
- **C3 — One home for each parameter.** Node's feel card owns settled physics and writes the address. Reflex keeps only impulses (C2's kicks), so decay leaves it. The `[...]` forces row points to the feel card instead of setting values. Gate: C2's look.
- **C4 — The close rule.** The creator decides whether a press closes its window (`#>wonder_factshift_tool_close`). Either way, the receipt stays visible after it.
- **C5 — Names.** The modes stay tools. What is held in hand needs a word that is not "tool" (`#>wonder_factshift_tool_words`). The stepped levels get accessible names, slice 1b in PLAN.md.

## Per tool

- **reflex (`!`).**
  - *Theory:* the lore words are a stated dimension map: forces bonk, nodes boon and bane, interface honk, data bone (`init/hotkeys/keystrokes.ts`). Reflex is the tool where those dimensions are felt as forces.
  - *Design:* label each button with its word and move the arithmetic into the receipt: "a hard push" over `*charge{-30 → -130}`. The lore row explains its word on hover and focus.
  - *Slice R1* follows C2 and C3.
- **color (`@`).**
  - *Theory:* a color is a perspective, which the code already treats it as and no page says.
  - *Design:* the swatches fit their window. Each swatch shows how many nodes stand in that perspective, and the head line says which perspective new nodes will take.
  - *Slice K1* after C0. Gate: the look.
- **map (`~`).** (See "Map and filter, Spw-native" above for selection, projection and topography.)
  - *Theory:* `#>wonder_factshift_spells` already holds the hypothesis that map should take a Spw line cast over the selection, and that the cast should be recorded.
  - *Design:* the prompt is a Spw line; the JavaScript editor moves behind a fold for those who want it. A cast leaves a receipt and can be undone, and a recorded cast can be cast again.
  - *Slice M1* follows the spells answer.
- **filter (`?`).**
  - *Theory:* a filter asks each node a question. Today it removes the answers, which reads backwards (`#>wonder_factshift_filter_sense`).
  - *Design:* the head line says how many nodes the question keeps before it runs ("keeps 4 of 13"); the receipt names what left.
  - *Slice F1* follows the answer.
- **node (`.`).** The model for the rest: words, not numbers, in cards, with a foot line that reports each press. *Slice N1* is the C2 pilot: the four cards gather under one head line whose slots are the card choices.
- **query (`#>`).**
  - *Theory:* the address is state you can hold, send and edit.
  - *Design:* each parameter is a slot chip in the head line; editing a chip loads it in place; Shift opens it as a new page, as Shift-go does today.
  - *Slice Q1* after C0's freshness fix and C2.
- **debug (`$`).**
  - *Theory:* what the canvas runs on, said in the runtime's own terms; the node panel already does this for one node (6b85a42).
  - *Design:* replace the JSON dump with the last run as one line per stage (parse, normalize, interpret, registers touched) and the parameters as the address line. The raw JSON stays one fold down. The trace toggle in spw then opens debug instead of repeating it.
  - *Slice D1.* Gate: the look.
- **story (`^`).**
  - *Theory:* the creator decided that a story is an ordered sequence of canvas, runtime and simulation states (`.spw/surfaces/factshift-center.spw`), and "keep a state, step through states" is still planned.
  - *Design:* a strip of kept states with keep, step, and play. The scripted demos (context, demo, options, boon) become example stories in that strip.
  - *Slice S1.* Gate: the look.
- **spw (`&`).**
  - *Theory:* the held line is what every tool acts on, so spw's head line is the held line itself.
  - *Design:* the prompt keeps run and trace (trace opens debug, D1). What priming becomes stays with `#>wonder_factshift_priming_dialects`, and the bare-word `*boon` gap with its own entry in `wip.spw`.
  - *Slice P1* follows that wonder.
  - *Slice P2, editing with the parser.* The creator: editing a Spw expression should benefit from the parser's affordances and from predictions based on the local Spw tree. In the title's editor and the spw prompt, as a line is typed:
    - a closing pair is offered for an open brace;
    - the slot the caret stands in is named (word, mode, body, scene, concept);
    - the parse's errors mark the place they start. Since b1fd11a the parse is the workbench's own.
    - Words are predicted from the local tree: the held line's slots, the nodes on the canvas, and the frames entered on the way here.
    - Nothing is completed without a key, so typing stays the reader's.
    - Gate: a demo for the creator's look.

## Order

C0 needs no gate. C1 is a question. C2 is a demo on three tools. Then C3, R1, N1 and Q1 ride on C2's look; K1 and D1 can follow C0; M1, F1 and S1 wait on their answers; C4, C5 and P1 wait on theirs. Each app slice is an app commit, a snapshot (`workers/factshift-center/assets`, `version.json`), and a deploy recorded in `wip.spw`.
