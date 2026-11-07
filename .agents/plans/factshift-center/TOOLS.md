# factshift.center tools: design and theory

Status 2026-11-06. A plan, nothing built. The creator asked to improve the design and theory of each tool, plan first. This file reads the nine tools as they run at app `b1fd11a` (deployed as Wrangler version `ecdf9aa0`). It proposes one theory they share, then names a slice per tool. Code paths are in the app checkout, `workers/factshift-center/app`. The census behind it was read on 2026-11-06 from the source and from a phone-width capture of every tool open on `?spw=beans<food>(kitchen)[mode]{stew}`.

Operators as lifecycles, the line as something to change, and what this app suggests for spwashi.com's runtime: [OPERATORS.md](OPERATORS.md) (2026-11-07).

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

## The canvas's ground: regions, names, hands (2026-11-06, evening)

The creator, in a run of notes: mind which regions and labels show while a node is dragged, the geometry of nodes, and editing. Don't overexplain the interface; maintain ground. Regions such as "the stage" could be renamed and reanchored, per page or in local storage. Other wonders:
- pinching in from the top edges to wrap the whole page in a container whose type can be changed;
- easy encapsulation to reduce noise, and moving between stored pages;
- pinching the charge between two nodes;
- pressing and holding a dot on the frame to wake the page's heat, then dragging up to change a setting configured or pinned in the reflex panel;
- the color panel as a grouping and layering tool;
- the `[...]` menu clustered for cognitive ease. Learning it is fine, and moving between its items is almost easy.

Editing expressions should be easy, with selections in the prompt populating the tools.

**What the canvas does today** (a read of the app, 2026-11-06):
- **During a drag**, empty slots appear (`body[data-line-drag] .region-empty`), but filled regions are not lit. A node near another rings as a link target (`handling/circle.ts`).
- **On drop**, `dropIntoLine` picks the smallest region under the point and rewrites the line byte for byte.
- **Region titles** come from `PLACES` on every layout (`{ } body`, `( )`). `region.title=` renames one only until the next layout. `factshift.regions` keeps geometry alone, keyed `word|regionId`, and saved frames (`factshift-frame-<md5>`) keep no regions.
- **Node radii** are set by role in `line-anatomy.ts`: word 34 (24 nested), scene 26, concept 30/20, part 16, charge 12. Labels sit two radii below the circle. A double tap renames a node in an input.

**Proposals**
- **The ground is quiet.** At rest a region shows its outline and no label. During a drag, only the regions that would take the drop light up, filled or empty, each labeled with what the drop does in a word or two (*into the body*, *as the scene*); the rest stay quiet. Labels sit one gap below a circle, not two radii. This is G1 with its labels decided.
- **A region's name and anchor are kept with its geometry.** A double tap on a label renames it in place, as a node is renamed. Anchor is the edge or corner a region holds when the window changes (the stage could hold the top left or the center). The page keeps a name in its saved frame, and a reader's own name lives in local storage.
- **The hands.** Two fingers on two nodes, pinched, tighten the charge between them, and spread, loosen it; the receipt names the pair and the new pull. Pinching in from the top edges wraps the held line in a pair, `{…}`, and a tap on its walls turns the pair, the `< & >` move spw.quest's pivot now plays. A wrapped container folds to one node to quiet the canvas and opens on a spread. Saved pages form a strip the reader steps through.
- **Held dials.** A press and hold on a dot on the frame wakes the page's heat. Dragging up turns whichever setting the reflex panel pins to that dot, so the dot is a dial the reader chose.
- **Color as layers.** A color gathers nodes into a layer that can be dimmed, hidden or selected whole.
- **The `[...]` menu** is clustered by what each item does (make, see, keep, tune). Arrows move within a cluster first, and the menu remembers the last item. It starts from an inventory, and nothing is renamed before the creator reads the list.
- **Editing by selection.** Text selected in the prompt is a target: the reading names its slot, the operator field marks that word rather than only the front, and map, filter and query open with it as their query. A canvas selection already fills an empty prompt (`selectionAsLine`).

**Built 2026-11-06** (app 21af4a9, 1ca9167, 42d8da6):
- The Spw window, restyled. The line sits in one ruled container, and its front mark in a gutter opens an operator field (a slider over the twelve, the primed line dashed, *use* holds it with a `*` receipt).
- Context rows show only when they hold something, in one voice and three tones, with fewer words.
- The action → fills an empty prompt with `word[lens]{part}` when nothing is selected or held.

**Questions for the creator**
- Should a page's region name or a reader's win?
- Is spreading to enter (Multi-touch, below) still right once a spread also opens a folded container?
- The window's taste calls: the ring `◌` for "no mark yet", *use* for the act, and *two joined* for a compound.

**The operators as keys** (app 6a64614, the creator: "the Spw input is still not clear; improve the operational tapping and priming of the operators"):
- Twelve keys sit under the line, and the row itself is the slider. One rule serves every hand: a key primes, and the primed key acts.
  - A mouse primes by hovering, so one click acts.
  - A finger taps twice, or slides along the row to prime each key it crosses.
  - The arrows step and Enter acts.
  - The line's own mark primes letting it go.
- The primed line shows inside the line's box under its text. The box grows upward, so the keys never move from under the finger.
- Using a key keeps the window open for the next one. The prompt follows the line on the canvas.
- A held key plays its operator on the word's node. A tapped node whose word carries an operator plays it once.

**Nodes by their operator.** The creator: nodes should behave differently by operator when tapped and activated. Today each operator has only its motion. Proposed acts, one per operator, each a question for the creator:

| op | motion (built) | a tap would |
|---|---|---|
| `~` potential | edge runs, never closes | show its paths not taken as dashed ties, without moving |
| `?` wonder | tilts | open or close: its body shows or folds |
| `!` action | beats | fire its superpower now, with a receipt |
| `*` value | glows | grow by one step, its weight kept in the line's measure |
| `.` ground | settles | return to its home |
| `^` ascension | lifts | gather its parts into one group |
| `#` vibration | trembles | keep it as a bookmark the [...] menu can find |
| `@` perspective | looks outward | re-center the view on it |
| `&` subject | double beat | select it with everything tied to it |
| `=` configuration | held still | pin or unpin it where it is |
| `%` measure | breathes | show its size and its ties' pulls |
| `$` substrate | flickers | show what it is made of (its metadata) |

**The ring by node kind** (app bf7cc06; the creator: "some of the special nodes should probably have a different set of verbs as their action menu"). A node of the held line takes the line's verbs. Each sits where a free node's verb of the same role sits, so one ring is learned:

| direction | free node | node of the line |
|---|---|---|
| up, down | grow, shrink | grow, shrink |
| up-left | select | select |
| down-left | remove | drop it from the line (not the word) |
| left, right | link, color | earlier, later in the body (a part); the word keeps link and color |
| up-right | raise | turn its braces to the next empty pair; on the word, mark it (opens the keys) |
| down-right | spin | rename in place |

Earlier and later point toward the neighboring terms, so the direction is also the place. Still to give their own rings:
- the steps' registers and events (show the value, step, write out);
- an entered frame (leave, open the parent);
- a hyperlinked node (open, copy the address).

The same commit keeps a placed node inside the stage. The creator: some nodes got locked off screen with no way to free them. A pin past an edge now comes back in, whether it was let go there or kept from a larger window.

**Pull to refresh, and a drag that only moves** (the creator: refreshing by swiping down on the frame was too difficult on a phone, and nodes should be draggable for physics instead of linking):
- The frame pulls to refresh at any time, not only with `[...]` open. A pull may start on the bare frame or on the title's box in the top band, so the top edge is one handle; a tap on the title still opens it. Letting go does what the note last said.
- Reflex's motion card has a drag switch, links or moves. Moves is physics only: no node lights as a link target, and no container changes the line. The choice is kept in this browser.

**The hash and the title** (the creator: the hash should have swipe and toast semantics, and tapping the title should select its text). The hash is the page's identity, the title's md5, which also keys the page's kept frames. Its swipes, each answered by a toast beside it:
- left and right step to the later or the earlier line this browser held (kept sixteen deep);
- up copies a link to the page;
- down keeps the page as a frame;
- a tap still opens its page, and a hold shows its compass.

A tap on the title opens its editor focused, with the text selected, by any hand. The keyboard rises on a phone, so that typing replaces the title.

**Putting nodes into a line, and naming them** (app 3d5c465; the creator: it should be easier to add miscellaneous nodes to a word's body or mode, its scene, or as a neighbor, and to edit a node's name and composition, with a mode that goes straight into node titles):
- A free node let go on the line's word joins its `[mode]`; the word reads *into*, not *link*.
- Let go in a body, it joins as a part where it fell, beside the parts on either side. Let go in a scene or a concept, it joins that slot. The empty slots show while it is carried.
- A node of the line opens its editor with its whole composition: a part, or a nested term's word, opens as the whole term (`water{rain}`). Tab and Shift+Tab settle and walk to the next or previous title in reading order.
- Reflex's motion card has a tap switch, selects or names. In names, a tap opens the title at once, Enter walks on, and titles show a dotted underline.

**Titles: layout, behavior, scale** (the creator: they might need UX work). Proposals, each for a browser look:
- A title sits one gap below its circle, not two radii (`ui/text.ts`), so a word and its title read as one thing.
- Size by role, clamped (word 16, part 13, scene and concept 12, charge 11) rather than the radius, so a grown node does not shout.
- A long title ends in an ellipsis on the canvas and shows whole while selected, focused, or in names.
- While the camera zooms, titles keep a legible size; a counter-scale holds them between 10 and 20px on screen.

**Built at 489eaad** (the creator: implement the other proposals, and continue refining):
- Titles are sized and placed by role, one gap below their circles. A long one ends in an ellipsis unless selected or named. Zoom's counter-scale is not built.
- A marked node does its operator's act when a tap selects it, with a receipt: `.` home, `=` kept or let loose, `@` to the center, `*` heavier, `#` kept as a frame, `&` with its ties, `%` and `$` said. `?` `!` `~` and `^` only play.
- The frame's swipes cross the page's states: left and right through the lines it held, up through the frames it kept, down still refreshes. A pull from the title's box goes without capture, so the title's edge drag and pinch stay its own.
- `spwashi` grounds the canvas instead of leaving for `/_spwashi@`. At app 6804471 it holds `.spwashi{spwashi.com, spw.quest, factshift.center}`: the creator named the live sites, and honk, bonk and boof .land have expired. A node whose word names a site is a link: a tap selects it and says so, and a second tap opens the site. The expired lands left the site names, configs and themes at app 07a8442. The workbench's `.spw/surfaces/domains.spw` still names them, and is the workbench's to change.

**Nodes and the focal square: what each promises** (the creator: consider their semantics and expectations more deeply; refreshing should be easy; pivoting may be accessible; pinching from the frame could cluster or enter).

*A node says what it is before it is touched.* A word of the line, a part, a scene, a concept and a charge each have one size, one title size and one place. A free node reads as loose (no region). A marked node shows its mark in its title, and that mark is the promise of its act. A region shows only when something could land in it. Three promises follow:
1. **Nothing changes the line without a receipt.** Drops, verbs, names and operator acts each say what they did.
2. **Every change can be walked back the same way.** The line's history is the undo: ← on the hash or the frame is the line before. A promise to keep, not yet a guarantee for every act: a kept frame or a pin is not in that history.
3. **One gesture means one thing on every node of a kind:**

| on a node | does |
|---|---|
| tap | select (in names: name); a marked node also acts |
| double tap | name |
| hold | the ring, its verbs by kind |
| drag | move, link, or join the line (reflex's drag) |
| pinch | size |
| two nodes, pinched (proposed) | their charge |

*The focal square is where a primed act waits.* It is the one place the hand returns to, docked above `[...]`. It always says what → would do, and its five states (default, preview, select, crawl, reflex) are where every tool keeps them. Proposals that tie it to the nodes:
- Over a node, the square primes that node's act (its operator's, or its kind's first verb), and → actualizes it. A marked node is then played one-handed or by key.
- ← on the square walks back the line, as the hash and the frame do, so walking back is one gesture everywhere.
- A pivot (one slot changed, the rest kept, as spw.quest's /pivot does) could be the square's ↑ over a part, primed and then taken. Pivots stay reachable without crowding a tap.

*The frame's hands.* Down refreshes from anywhere along the top band, the side bands or the bare frame, and stays the easiest gesture. Left and right cross the line's states, and up the kept frames. Two proposals for a pinch that begins on the frame:
- Inward, it clusters: free nodes fold into one group node, and the line folds to its word.
- Outward over a node, it enters that node as a frame (`#>`).
Both are for a phone look first.

**The title and its payload** (app 56c111c; the creator: a verbose title is hard to read; they wonder about a distinction between the title and the payload). The title names the line: a line short enough to read at a glance is its own title, and a longer one shows its head (`.spwashi …`) with the whole line as its tooltip. The payload, the whole line, stays in the corner box, the prompt, the address and the title's editor, and it keys the hash and the kept frames, so two lines with one head never share a page.

**Reading the prompt, and a run's steps** (app daa4ddd and a82a9e6; the creator: the parse behavior is confusing, the steps do not make sense interactively, and it is worth asking what is desirable to show and to touch).
- **What Run will do is said while the prompt changes:** a setting (`charge=-100`), a command (`home`), a superpower (`!prune`), or the line it holds. A run's receipt replaces the preview.
- **`!` takes up a superpower only by name.** `!garden[care]{seed}`, the line the `!` key writes, is held as a line.
- **A run always holds its line on the canvas.** The runtime's stages, registers and anchors are no longer drawn as nodes in its place.
- **With steps chosen, the window stays open and shows what the run did beside the line.**
  - The stages are chips, each opening what it changed.
  - The events are listed in order. A tap or the arrows step them, each lighting the part of the line it came from.
  - The registers carry the names written for them, and the issues are given in words.
  - The whole run can be copied as Spw.
- **A command word held as a line** (app 6ae8693): a bare word that names a command (`home`, `link`, `group`, `frame`) still runs the command by default. Its preview now offers *hold it as a line*, which reads that one run as Spw. The runtime the app carries is an older build that rejects `;` in a body. Its issue now shows in words beside the held line instead of an older drawing.

**The reflex panel for a node** (the creator: consider it for node configuration). Proposed: with one node selected, the reflex panel's cards speak for that node, not the whole field. Size, charge and mass (its weight in the field) would set its own values, and a pin row would offer kept or loose. Its mark row would offer the twelve operators, so the panel is where a node's operator and physics are configured. A card names the node it is acting on, and with nothing selected the cards return to the field.

**Frame swipes** (the creator: still not easy enough) are being made easier by another session's uncommitted work in the app checkout: a 72px band for sideways steps with the line they would step to. This session left those files alone.

**A conversation, files, and routing with spw.quest** (app 4447a90; the creator: think about what becomes easy, which verbs enhance the context; imagine the tool used conversationally and to load .spw files; improve routing between spw.quest and factshift.center, considering base64).
- **The thread.** The Spw window keeps a thread of the lines held, newest first, folded to one row until opened. A row's verbs build on the context:
  - a tap holds the line again;
  - **+** adds it into the held line's body, held together, so what was said becomes part of what is said next;
  - **↗** opens it in spw.quest's editor.
- **Files.** A .spw file comes in by the load button or by a drop anywhere. Each top-level expression becomes a row, and the first with content is held.
- **Routing.** A script travels between the sites as base64url in the fragment (`#spw64=`), so it never reaches a server.
  - spw.quest's /build links its file as "Open on factshift.center", and the guide links each example as Canvas. Both carry what the editor holds when clicked.
  - factshift.center loads that script into the thread, and spw.quest's /build reads one back into its editor.
  - `?spw=` still carries a single line.

**Fractal zoom over a file** (the creator: fractal zooming across linguistic features would make navigating file regions easier; cluster by feature, and choose a canvas configuration for lines or nested containers). Proposed, for a loaded file:
- **Zoom levels:** a pinch or a key steps through file → frames (`#>`) → lines → slots → parts. Each level draws only what can be told apart there: a frame as one node with its count, a line as its word, a slot as its brace.
- **Clustering:** a feature switch groups the file's lines by operator in front, by lens (`[mode]`), by frame or by what they hold, each group a region.
- **Configuration:** a choice of *lines*, each expression a node in a row, or *containers*, nested expressions as nested regions. It is kept with the page, and the thread's rows stay the index into it.

**What d3 offers here** (a read of the app, 2026-11-07; d3 7.8.5). The forces in use are `forceLink`, `forceCollide` and `forceManyBody`, plus custom ticks:
- `center`, which pulls only the nodes homed to the stage;
- `boundingBox` (`ts/simulation/forces.ts:150`), which treats the screen as the whole world;
- `anchor`, `regions`, `dimensional`, `gravity` and `spin`.

There is no d3 camera. `js/simulation/pinch.ts` keeps its own view, `{k,x,y}` clamped from 0.35 to 3, and writes it onto `g.simulation-content`. A `d3.zoom` on the svg only changes charge on Shift+wheel. Transitions, hierarchy, brush, quadtree and `forceX`/`forceY`/`forceRadial` are unused. The verb lists (`NODE_VERBS`, `CANVAS_VERBS`, `lineVerbsFor`) are already plain data. Fits, each kept under `pinch.ts`'s ownership of gestures:
- **Fractal zoom.**
  - `zoomToBox(region)` tweens the view with `d3.interpolateZoom`.
  - `d3.stratify().path()` builds the file → line → slot → part tree from ids like `anatomy:part2`: `ancestors()` zooms out, and `depth` sets level of detail.
  - A `--zoom-k` variable lets deep titles fade at low zoom.
  - The file level needs `boundingBox` widened to a world, not the screen.
- **Clustering by feature.** `d3.group` by operator (the first character of the word), lens (`node.frame`) or role (the kind's suffix), placed on a `scaleBand` or radially for the twelve. The simplest move is to set each node's anchor to its cluster's center, so homes, tethers and anchors keep working. Each cluster is drawn as a region with a `cluster:` id, which region-rects renders as it is.
- **Lines or containers.** `d3.partition` gives rows by depth, `d3.treemap` with slice or dice gives a row or nested boxes, and `d3.pack` gives nested circles. These are added as layouts beside `lineAnatomy`, not in its place, since kept regions and drops depend on its geometry.
- **Menus.** A Spw line such as `ring{grow, shrink, link}`, read by the slot reader, could produce a ring's verbs. `d3.pie` and `d3.arc` could draw the ring as wedges matching its angle hit test.
- **Slices, smallest first:** zoom to a container (`pinch.ts`); cluster by feature (a new `clusters.ts` plus `forces.ts`, toggled by a Spw setting); the file as one world (`spw-talk.ts`, `line-anatomy.ts`, `forces.ts`).

**Spw-native menus: the theory to build on** (a read of the repo's Spw docs, 2026-11-07). Already pointing this way:
- The creator retired verbs for operators: "the verbs were not clear and should rather be operators" (`.spw/conventions/word-sets.spw:49`).
- A menu row already behaves like a `[mode]`: it shows one verb, turning it primes the next, and a tap actualizes it (`.spw/surfaces/factshift-center.spw:70`).
- The verb audit writes gestures as `noun[gesture]{verb}<writes>` (`.spw/audits/factshift-center-verbs-2026-10.spw:200`).

The menu's families already carry charge words: forces bonk, nodes boon and bane, interface honk, data bone. A proposed idiom for one menu line:
- the mark names the cluster's force: `?` open (a disclosure you can close), `!` act, `=` keep in place, `#` keep as a findable frame, `%` tune an amount, `@` see from a place, `$` see what it is made of;
- `[ ]` holds the verb shown (the primed one);
- `{ }` holds the verbs the row turns through, with `;` when the order matters and `,` when it does not, never tight dots;
- `< >` says where the act writes. This last one is contested.

`*` stays the receipt's mark, so no cluster takes it. Open in the docs, and not settled here:
- what `{ }` is called (definition, direction, behavior or body), and whether `< >` is one pair or two marks;
- the part of speech of `( )`;
- "frame" meaning both `[ ]` and `#>`;
- how `@` reads between lines;
- whether the dot is a separator or a word;
- `;`, which the app's bundled runtime rejects;
- which tool takes which operator, which is the creator's call.

**The `[...]` menu and the tool panels, as they are** (an inventory, 2026-11-07).
- **The menu's rows are one array** (`init/hotkeys/keystrokes.ts:184`), shown by family: selection (fourteen verbs, shown only with a selection), more, fewer, save, store, transport, interface, forces, menu.
  - A row remembers its last verb, a tap acts, and a swipe or `›` turns it.
  - No arrow moves between rows, so going down a row takes two Tabs.
  - Escape never closes the menu.
  - Ctrl+- (empty node cache) is swallowed by the zoom guard, and titles name the state a press leaves.
  - The reveal order is read by nothing.
- **Panels:**
  - **spw:** Enter adds a line and Cmd+Enter runs; `initSpwPrimeControls` is dead.
  - **story:** context and color delete the other chips.
  - **map:** cast is disabled until something matches; the js run replaces every node.
  - **filter:** keep is enabled even with nothing matched, and keeping zero deletes every node, with no undo.
  - **query:** filled once and stale.
  - **node:** nothing is primed on first open; more, save, loose and empty repeat menu rows, and empty also erases what was saved.
  - **color:** thirteen unlabeled swatches, and its primed act reads " again".
  - **reflex:** arithmetic labels; link and speed decay share one counter; every press closes the panel.
  - **debug:** nothing before a run.
- **Proposed:** the menu as four acts (make, see, keep, tune), each a row that turns through its items. ↑ and ↓ move between acts, and the menu remembers the item in each act. It is configured by `=` lines ("keep this here, under this name"), kept word for word in local storage:

  ```
  =menu{make; see; keep; tune}
  =menu[make]{more; link; line; grow; remove}
  =ring[part]{grow; turn; later; rename; shrink; drop; earlier; select}
  ```

  A ring's body has eight slots clockwise from up, `·` for an empty one, so a verb's place is its direction. An unknown word is skipped and named in the status. The first files are `keystrokes.ts` (a key and an act for every row), `hotkey-buttons.ts` (rows by act, ↑ ↓ between them) and a handler for `=(menu|ring)` lines. `line-verbs.ts` is another session's open file, so the ring waits for it.

**Built: a menu kept by a line** (app 0812cca). `=menu{forces; interface; save}` keeps the `[...]` menu to those rows, in that order, and `=menu{}` shows every row again. The rows go by the names the menu already gives its families: selection, more, fewer, save, store, transport, interface, forces, menu. Nothing is renamed, and the prompt previews it as a setting. ↑ and ↓ move between rows. The four acts, and `=ring` for a node kind's verbs, wait on the creator's reading of the inventory, and on `line-verbs.ts`, which is another session's open file.

**Built: a map of the thread** (the first step of fractal zoom).
- The thread's map button draws the thread whole: each line a node, gathered into labelled regions by operator, then lens, then the `#>` frame it falls under. The next press steps the feature, and after the last the map goes and the line held before it comes back.
- A tap on a line goes in and holds it whole.
- The title reads "map · by operator" while the map stands in for the line.
- A tap on a cluster's region frames it with the camera (app 71beaef, `zoomToBox` in `pinch.ts`): eased in a quarter second, or at once with reduced motion. A tap again comes back out, and leaving the map or going into a line brings the camera back. A held line's own regions are the next level (app b097d9e): a tap on its body, its scene or a nested body frames that region, a tap on another frames that one, and a tap on the framed one again comes back out. The file as one world (app 2d22d36): the map's step after frame is *whole*, every line drawn whole at once in its own cell, each cell titled by its `#>` frame and its head. The cells fit the stage, so the bounding force needs no change, and the camera's zoom does the rest. Past four lines, each is drawn at a nested line's scale. A tap frames a cell or a region; a tap on a line's node goes in. A region the map lays out is fixed (app bcf3d66): no corner, no drag, since moving it there changes nothing. A world larger than the stage, for long files, waits on `boundingBox`.

**Operators and joins, told apart** (app 5ba8ad0; the creator: differentiate more across operator types and expression layout patterns, with more intuitive mutation or clustering physics).
- **At rest:** each operator wears its reading on any node it marks, by stroke and fill only, so a capture reads it still. `~` a dashed edge, `?` an open fill, `!` a heavy ring, `*` a glow, `.` a ground shadow, `^` a lift, `#` a ringing edge, `@` a dotted look, `&` a long dash, `=` a kept edge, `%` a ruler, `$` a muted base.
- **In motion:** gently, and only on a node not pinned (`operator-physics.ts`). Ground settles, ascension lifts, value is heavier, potential's tether loosens, perspective leans to the middle, and action makes room. The rest keep the field's physics.
- **Each join has its figure:** in common a ring, in order a row, one name a tight chain held close, a path rising across the body.
- **Open, for a browser look:** the strength of settle and lift, and whether `&`, `#`, `=`, `%`, `$` should move as well as look different.

**The color tool as layers** (app f06caf5; the creator: reflect on the color tool's utility and its visual meaning). A color is a perspective that new nodes take. So:
- each swatch says how many nodes carry it, and the chosen one is marked;
- a tap chooses it, and the panel stays open to say what that means;
- the chosen color can be selected whole, soloed (the rest dim, a lens that changes nothing), or painted onto the selection.

Open: names for colors (a color is still a number), solo kept across redraws, and color as the map's fourth feature.

**Cross-document links and `.spw` files** (the creator's wonder). A node whose word names another page or a `.spw` file could open it as a frame, the way `#>` enters one. A `.spw` file dropped on the canvas or given in `?spw=` by address could load as held lines, one frame per top-level expression, stepped through with the action →. Both would read through the workbench's reader that the app already carries.

**A play mechanic on hold.** A hold plays and a release lets go; nothing commits on a hold. On a node, a hold could play its operator and a drag up or down while holding could turn the operator's own quantity (a value's weight, a measure's scale). The receipt comes when the finger lifts.

**Edges and the focal region, one rule.** The focal square primes what is under it, and the action → acts on it. That pair could reach the edges:
- A tie is primed when both its ends are selected. Its keys are the joins (`.` `,` `;` `~>`) or the compound marks (`~` `^` `&` `@`), the same row of keys as the operators.
- Each side of the frame holds one kind of act, and a swipe in from that side opens it. The top wraps and folds (the pinch from the top edges). The bottom keeps the tools, `[...]` and the held line. The sides keep the line's history.
- The square docks just above `[...]` (settled 2026-10-27) and stays the one place a primed act waits.

**What run draws** (the creator: "it isn't very clear what the trace feature does"). The lone *trace* toggle became a switch naming both choices, **line · steps**: run draws the line itself, or the steps the runtime took to read it (its stages and registers as nodes). The creator added that a structure shown should be convertible into other forms, or be interactive. So the steps could become a structure of their own:
- each register a node whose value a tap shows;
- the events stepped one by one with the action →;
- the whole written out as a Spw line for the prompt, a list or a table, chosen from the same switch.

*Slices*, each a feel change ending at a demo:
- E1, selection-aware operator field and reading. It also covers a term selected in the prompt being moved left or right (repositioning terms) and its brace pair turned to the next kind (pivoting braces, the `< & >` move), on the same prime-then-act keys;
- G1, the quiet ground and drag-lit drops;
- N2, names and anchors kept;
- H1, the pinched charge;
- W1, wrap and fold;
- M2, the menu's clusters, after its inventory.

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
