# factshift.center

**Status 2026-11-06.** Nothing has moved in either repository since 2026-10-30. The snapshot in `workers/factshift-center/version.json` is the app's last commit, the `revision` it records, carried on the site as `76c70f77`; the app's own hashes resolve only in `workers/factshift-center/app` (gitignored here), so they sit in the pins below. factshift.com is the prototype, settled October 2024; factshift.center examines which concepts a particular set of physics can represent (*The difference*, below, in the creator's words). Next on the canvas: slice 5, one reading from the workbench in place of the app's second slot reader; slice 1a and slice 2 need no gate. Interaction depth is in [INTERACTION.md](./INTERACTION.md) and is not yet a patch. Deploy remains the creator's (Wrangler).

**Related:** [the UI model](../../../.spw/surfaces/factshift-center.spw) (the canvas as the site's .spw tree holds it: decisions apart from readings, and known gaps) · [spw-quest](../spw-quest/PLAN.md) (its pivot and construct cards can open a line here) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) (parser releases, the capability ledger) · [brace-semantics](../brace-semantics/PLAN.md) (`[ ]` as a frame) · [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (depth passes) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (peers).

operation: align (the app's canvas with the workbench's reading of a line)

## Ground and center

- factshift.com is the ground, the one readers should find familiar: oxblood and wheat, the `<concept>` title, the `[...]` shortcuts face, the square focal mark. factshift.center develops the same concepts so they are easier to work with. At the start, its proportions and layout match factshift.com. Its menus and behaviors may differ (creator, 2026-10-27).
- The live site deploys from the app repository's `main` or `netlify` branch; the creator is not sure which. The last fetch in this checkout was on 2024-10-30. The workbench research ran through the end of 2025, after that deploy, so the live app knows little of how Spw developed.
- The app is TypeScript and Vite, with a d3 v7 force simulation drawn in SVG. It compiles the workbench from source through two aliases, `spw-workbench/runtime` and `spw-workbench/parser`, both pointing into its own submodule.

```text
pins (2026-11-06; app hashes resolve in workers/factshift-center/app)
app            main b1fd11a (2026-11-06), past 99c10e6 by e6ed1b9 (the slot reader) and b1fd11a (the parser);
               deployed 2026-11-06 as Wrangler version ecdf9aa0, snapshot 5734c357
app reader     src/js/vendor/spw-reader, prerelease 2026.11.07-pre.1 from spw-workbench 3f53adf2: the slot
               reader (readLine, writeLine, slotHash) and, since b1fd11a, spw-workbench/parser
app workbench  submodule fffab72 for the runtime only, spw-workbench 0.2.0-alpha.1, 2026-03-12: from before the
               workbench's 2026-03-26 history rewrite, so the clone keeps it only on
               backup/history-rewrite-pre-20260326, not on main; it defines no outline, roles or formAt
site reader    public/js/semantic/spw-workbench-reader.js, v0.3.0 @ 27fa1e3 (the site's mount, 2026-11-06):
               exports outline and roles
spw.quest      assets/parser/2026.10.13, v0.3.0 @ 0eb1d1c, nine commits behind the site's mount:
               workbench.min.js exports outline, roles, formAt and all six names the app imports
```

## Landed 2026-10-27 (app repository, local)

- **Safety.** Tab walks nodes only from the canvas. Ctrl and Cmd never fire from text fields, so copy, paste and zoom stay the browser's. Clearing the node cache and resetting the interface now ask first. The socket opens only from its own panel, and the node save sends only on an open socket. The link tool opens http(s) addresses with noopener. htmx is removed.
- **Ground.** factshift.center now shares factshift.com's theme and layout. They measure identically at pocket width. The center's own controls sit behind the main menu. The square focal mark and `[...]` are back, and the menu's "open" subheading is gone.
- **Spw as the canvas.** `?spw=` holds a line of up to 400 characters. The line becomes the title and the heading, waits in a corner box (`#held-expressions`) where a tap reopens it in Spw mode, and runs through the workbench. Its anatomy was laid out as the word framed by `[mode]`, the body's parts in a `{ }` region, `( )` and `< >` in regions of their own, nested bodies as regions within regions, and recurring words in resonance, each part anchored in its place.
- **Three runtime bugs** surfaced on the way: ids were rewritten from identity, so the projection's stage links failed; normalize overwrote projected fields on every reinit; regions were never drawn.

```text
24d2a48 0756029 ee0c00a   menu faces, focal mark, safety
2d0d257                   factshift.com's ground and layout
f1999d6 faf14f2 a792749   ids, ?spw=, normalize fills only what is missing
656c6e5 6b67304           regions drawn; the anatomy, title and corner box
e9a390d                   the phone pass and the interaction contract below
e601855                   the handle, the gesture grammar, the slot, and the Spw stage
619432e                   the handle and the lens, the verb ring, the five-row menu
f5e9ffc                   the canvas edits the held line; select, link, pinch; verb families; the lens submits
```

## Landed 2026-10-27 to 2026-10-30 (app commit, then the site commit that carried it)

```text
5eff5b1  c191e467   links by relation, one home a node, the nub, names from node:0
381c07c  f9a4ff0a   the reflex instrument, tool bezels, pinches
f662879  608b14bc   the node panel as cards that answer each press
0779802  5c2b0b2b   presses and saves answered
1fd8bd1  2cc85547   the feel card: the physics set in words
c22cd5d  13009f61   the handle carries a tool across; → fills Spw; boon grows from the origin
8e6b418  747f2667   a run holds its line; the runtime's trace behind a toggle
e281183  a234438e   joins written without spaces (ecestudent@ece.120~?[transistors work.how])
9336713  a4e6ecbf   predictable joins: what a node is brought to holds still
ee32665  831064c3   the nub steps in three levels
9bfe7ce  10dff034   primed tiles: → on a tile takes what its tool has ready
6b85a42  cdc2a6db   a node says what the runtime made of it, and can be entered as a page
2fb7184  fe75de95   ( ) applies to the word with its body; containers resize
99c10e6  76c70f77   < > refers to the whole reading, unlabeled
```

## Layout

factshift.com, read in its most accessible way, is a frame of work on a ground, with its chrome held at the screen's corners: the title at the top right and [...] at the bottom left. factshift.center keeps that, and gives each corner one job:

| where | what it holds |
| --- | --- |
| top right | what this is: the title, or the held expression |
| top left | where you are: the mode column, solid squares with no label, the open one marked on its button |
| bottom left | what you can do: [...] and its menu, labels left and outlined buttons right |
| bottom right | what you hold: the held lines |
| the frame | the work: the canvas, and the open tool, held by its handle |

- **The handle joins them.** The focal mark is the open tool's handle, at its bottom-left corner, so each tool is a tablet or a palette held by its corner.
  - Spw rests centered in the frame, as a stage for a held prompt.
  - The other tools, and no tool, rest at home above [...].
  - A menu puts the tool away while it is open, and the handle goes home with it.
  - Dragging the handle carries the tool. A handle placed by hand is remembered, and every tool opens there.
- **Chrome to the screen's corners; work to the frame's edges.** The frame is inset 5% on each side. A tool on a phone reaches the frame's right edge, and Spw's stage is the frame's width.
- **The improvement over factshift.com** is in what each corner says, not where it is:
  - The corners name their state (the open mode, a toggle's on or off).
  - Every control can be reached by keyboard and is named for assistive tech.
  - A phone shows one surface at a time.
  - Nothing widens or reflows the page.

## Interaction contract

The creator set this on 2026-10-27; the phone pass built it, and the demo in the app's working tree revised it. Write each new rule here as it lands.

- **Attention arcs.** Every activation ends an arc. Either it opens something to decide with, or it meets the reader with the same state and shows what could be next (the hold card). A swipe taken back is the reader's own decision, and stays quiet.
- **The tap toggles the tool.**
  - It puts the open tool away, or brings back the last one.
  - With a menu open, it closes the menu.
  - Showing a tool does not take focus; → is the way in.
  - [...] opens the primary menu.
- **The focal mark item** in the menu brings a moved handle home, focuses one at home, and shows the card for one already focused there.
- **Tools are picked up and put down.**
  - No tool is in hand at the start. (A story or a node's own link may still choose one.)
  - Tapping the tool in hand puts it down, and the palette's word shows above the handle only while a tool is held.
  - A node tapped with no tool is named, not changed.
- **The menu ([...]).** It keeps factshift.com's alignment: a category on every row along one left edge, and outlined buttons on one right edge. Level 0 is factshift.com's five rows (more nodes, saved nodes, mode menu, handle home, yoink) plus "all options", which opens level 1; every row is also on the keyboard.
  - A row names where a press leads, such as "link force off" while it is on, or "velocity decay 0.6".
  - A row is listed only while it has something to act on: fewer nodes, saved nodes, yoink and positions need nodes, and handle home needs a moved handle.
  - The list is rebuilt after a press, and focus stays on its row.
  - Focus is a ring for the keyboard only.
- **Labels.**
  - Labels are nouns or adjectives naming the thing toggled or the state left behind ("mode menu", "link force").
  - A toggle's state is a box beside its name: lightly filled when on, outlined when off. The name keeps full contrast either way.
  - No words appear beside the handle. Names live in the hold card.
- **Phones.**
  - A tool hangs from its handle.
  - The mode column stays one column of squares the height of the title box.
  - Touch screens hide keyboard hints.
  - Nothing widens the page.
- **The Spw panel:**
  - Its heading names the prompt's form as a mode: `spw[line]`, `spw[join]`, `spw[lines]`, or `spw[unread]`; plain `spw` while it is empty.
  - Under the prompt is one quiet line, of reserved height. It names the bond between two expressions, and the words the canvas already holds as buttons that go to their nodes. Otherwise it says "unread", or nothing.
  - One row of buttons: run at one end, clear (which empties the prompt) at the other.
  - The four priming buttons are gone; priming from the keyboard remains (`wonder_factshift_priming_dialects`).
  - The heading sits flush with the prompt, and the panel has wider side margins.

Verified at 390px and 1440px from the app's `dist/` in Chrome, driven with touch input. The page held its width in every state.

## Gesture grammar

The creator asked on 2026-10-27 for swipe and tap semantics that localize meaning, adapt to each tool, and serve expert use and discovery through play. One rule is read the same way everywhere, and each tool decides what it means there. On the handle, a swipe points at where the thing it opens lives:

The tool is a handle, a lens and a window (`workers/factshift-center/app/src/js/ui/tool-window.ts`). The handle (the small square) carries it. A window's corner is the handle's center, and it opens toward the screen's center: the handle's quadrant picks the corner. It keeps the direction and size it opened with, so a carried handle stops at the edge rather than the window squeezing. The lens is where the tool is used. With no window, it is a faint square cornered on the handle, facing the center; with one, it is a small red nub on the window's near edge beside the handle, like a ThinkPad's point, giving toward a push. It shows on every load; the [...] interface row hides it for a visit. The nub steps in three levels (`workers/factshift-center/app/src/js/ui/tool-steps.ts`, [INTERACTION.md](./INTERACTION.md)): the tool menu, a tool's cards, and a card's controls. ↑ ↓ move within the menu or among cards; among controls they carry into the next card. A tap goes in, and on a control presses it. → goes into a card and crawls along a row of controls; on the tool menu it takes what that tool has primed. ← comes out. A tap with nothing stepped enters at the control nearest the nub. With nothing stepped, → takes what the open tool has primed and ← opens the tool menu. All are placed from the top of the screen, so the corner holds on a phone whose address bar shows.

| gesture | handle | lens | node | empty stage |
| --- | --- | --- | --- | --- |
| tap | toggle the tool: a menu closes and the tool returns; an open tool is put away; with none, the last tool | open the tool (keyboard down); open, prime it (its field in focus) | select or deselect; tap empty stage to clear | clear the selection |
| tap a link | | | | what it is and does (a card); a drawn link can be unlinked there |
| double-tap | | | rename in place; a node of the held line is renamed in the line | |
| drag | carry from the first 3px (grab area 12px past the square) | (a swipe past 10px; direction locks at 36px) | let go slowly, it stays where it was put (a light ring); thrown, it goes home, the line to its home lit while a release would throw; near another node (radius + 16px), link to it, the selection with it, and spring back; near a linked node, unlink; into a container of its expression, become its member; along an ordered body, take the slot the drop falls in | |
| hold | grip | grip, then drag to carry | the verb ring and a faint line to its home, named; past grow or shrink, more the farther, said on the button; the name at the ring's center primes Spw with it; with a selection, ← links it here | the canvas ring: [ ] mode ↑, node ↗, { } body ↘, < > concept ↓, ( ) ↙; a brace adds that slot to the held line with a · to name |
| pinch | | zoom the camera, from a pinch begun on the lens or a trackpad pinch over it | resize the node under the fingers, alone, even when it is selected | the node nearest the pinch's middle (within 28px of its edge), else the selection, else every node. A trackpad pinch follows that order from the pointer. Two-finger scroll pans |
| ← | | the mode column, sliding to a mode | | |
| ↓ | | the primary menu (named for the selection when there is one) | | |
| → | | submit: Spw runs; another tool presses its submit; with none open, the last tool | | |
| ↑ | | a new node where the swipe lets go, named in place | | |

- **The held line is the editor's document.** A run in the Spw prompt holds its line, as `?spw=` does; the runtime's own trace is a toggle. A rename, a drop into a container, a reorder or a spawned slot rewrites the line (`workers/factshift-center/app/src/js/modes/spw/held-line.ts`): the title, the heading, the corner box and the address follow, and nodes that survive keep their place. `a.b.c` is ordered (a row, reordered by dragging); `a, b` is common (a ring).
- **The [...] menu is a few rows, each a family of verbs.** A row shows one verb; a tap does it; a swipe across it, its › at the right edge, or ← → turns it to another, and the row remembers. The families are the selection (linked in a row, linked to each other, as a line, with neighbors, opposite, the run between, pinned, loose, larger, smaller, next color, on top, remove, none selected), more (names turns up from it), fewer, store (save, …), transport (yoink, …), interface (whole stage, mode menu, reset handle, gestures) and forces.
- **Names.** A node with no name of its own takes a word and the first count from 0 no node holds: node:0, node:1 (`workers/factshift-center/app/src/js/simulation/nodes/data/names.ts`). The [...] menu's names row sets the word for this browser, `?names=seed` for one visit, and `letters` gives a, b, c. A node swiped up arrives with its name selected; a placeholder slot is ·. A batch from "more nodes" arrives selected, so the selection's verbs set it up at once.
- **One home a node** (`workers/factshift-center/app/src/ts/simulation/homes.ts`). Each node is drawn to one home, for one reason: placed (where a hand let it go), slot (its anchor in the held line), region (the innermost region with a pull it is in), or stage (the middle). Centering pulls only stage nodes, a region only its loose nodes.
- **Heat and feel.** The node tool's feel card sets the physics in words (spacing, flow, gather, ties; a toggle shows each as its parameter), written into the address. Only the first layout runs at full heat. A later setup (a link, a rename, a resize, a line edit) warms the simulation to a steady low heat until the line's parts are still or home, so what changed eases in and the rest does not jump; a throw stays warmer until the node arrives.
- **Links by relation** (`workers/factshift-center/app/src/js/simulation/edges/relations.ts`). Each relation has its own length, pull, width and dash: charges, bond, same word (resonance), drawn. A word is tied by one line to its { } body (defines), a ( ) to an outline of the word with its body (applies), and a < > to an outline of the whole reading (refers); the parts sit in their regions by their slots. Dots read as object access (a.b: b on a, accesses); ; and ~> read as order (follows, dashed). A link is never shorter than its ends' radii and a gap, so a grown node pushes out what it is linked to.
- **The title.** A pinch resizes and moves it, and a trackpad's pinch over it resizes it, so a long title can clear the hash for a screenshot. Its left edge, dragged out or in, snaps to one line or to wrapping. Two taps on the square behind it put it back; this browser keeps the layout (`workers/factshift-center/app/src/js/ui/title-layout.ts`).
- **Desktop.** An open window's edges are grab bands. A trackpad pinch resizes nodes, in the same order as a pinch on the stage. Two-finger scroll pans. The camera zooms from a pinch on the lens.
- **Spw.** Run has its row; clear lives in the prompt's corner while there is text; the keyboard's Enter key says "enter", because Enter makes a new line and run is the submit. The window is a fixed size that fits the stage with a margin each side.
- **Taps reach the node meant.** A node's picture and label take no touches; only its circle does.
- **One gesture per touch.** A swipe's direction locks once it crosses its line, so a path that drifts diagonally keeps the gesture it began. It unlocks only by coming back near where it started, which takes it back.
- **Guided.** A swipe that would land lights the edge on that side of the handle or the lens (a tool tile lights nothing), and the column lights the mode under or beside the finger. A swipe toward nothing shows the card. The handle is above everything else on the page.
- **Taught on asking.** The menu's "gestures" row shows the card (`teachFocalGestures` in `focal-point.ts`) and counts what this browser has found. With a keyboard, the context-menu key or Shift+F10 shows it (`gestures.ts`). A pointer hold grips; it does not show the card, though earlier drafts of this plan said so (the verbs audit, `.spw/audits/factshift-center-verbs-2026-10.spw`, `^"claims".hold_shows_card`). Nothing teaches itself uninvited.
- **Expert use.** Every gesture has a visible control. Choosing a mode takes one touch: ←, slide, let go.

Built in the app (`workers/factshift-center/app/src/js/ui/gestures.ts`) and committed at the creator's ask after a sitting of live notes. The next tools and the open choices are in `wonder_factshift_gestures`.

## Refreshing the snapshot

1. In the app, run `npx tsc --noEmit`, then `npx vite build`.
2. `rsync -a --delete --exclude='*.map' --exclude='.assetsignore' workers/factshift-center/app/dist/ workers/factshift-center/assets/`
3. In `workers/factshift-center/version.json`, update `revision` and `snapshot`, and add any new query key.
4. `npm run check:workers`, then commit in this repository when the creator asks.

Nothing scripts these steps yet. A carry script like spw.quest's is a candidate once the steps run a third time.

## The difference (2026-10-30)

factshift.com is the prototype. factshift.center is the examination of which concepts a particular set of physics can represent. The public page is [about/domains/factshift.center/](../../../about/domains/factshift.center/index.html).

The differential is relevant because people hesitate to engage with AI. The creator understands that and, as an engineer, can't really mind it. The center extends the prototype by agentic development: more depth in how the concepts cohere, and in how the canvas performs.

The canvas still lays a line out from `line-anatomy.ts`, a second reader beside the workbench. The app compiles its own workbench submodule from March (pins, above), which has no `outline`, `roles` or `formAt`. The site mounts `27fa1e3d` (2026-11-06), whose reader bundle exports `outline` and `roles`; spw.quest's dated 2026.10.13 workbench build exports all three. Slice 5, carrying a dated build, is the next cut. Draw that outline. A body holds its parts, a ( ) applies to the word with its body (its part of speech open), a concept refers to the whole reading, and a join is the edge between two forms. `line-anatomy.ts` stays until that projection can say the line back. Broader geometry stays dormant in the workbench. This canvas projects the parse.

## Next slices

The tools themselves, each read as an operator whose window opens on its act as one line, are planned in [TOOLS.md](./TOOLS.md) (2026-11-06): hygiene first, then one theory for all nine, a demo on three, and a slice per tool; four questions for the creator sit in `index.spw`.

Each is one session in the app (`workers/factshift-center/app`, its own repository), checked with `npx tsc --noEmit` and `npx vite build`, then carried into the snapshot here when the creator asks (*Refreshing the snapshot*, above). The numbers are the ones `index.spw` and INTERACTION.md cite.

1. **SVG and UI semantics** (asked 2026-10-27). Landed in the phone pass (carried here in `b5d19bc9`): the svg is a group with its region and edge layers hidden from assistive tech; mode buttons say aria-pressed; the tabpanel role and the radiogroup without radios are gone; anatomy nodes are named by word, slot and frame; Enter and Space reach a node only while it holds focus.
   - **1a. Accessibility tree and keyboard walk.** Read only. In Chrome, read the snapshot's accessibility tree, then walk from the canvas with Tab, the arrows, Enter and the context-menu key. Confirm or correct `^"by_parity".keyboard_misses` in `.spw/audits/factshift-center-verbs-2026-10.spw` (a node's rename, ring, drag and pinch; every container cell). Gate: none. Verify: a wip line listing what the keyboard reached.
   - **1b. Name the stepped level.** A stepped level is a ring (`data-stepped`, `tool-steps.ts`) with no accessible name. It would say "tool menu", the card's title, or the control's label through the polite note `handle-said.ts` already keeps. Gate: the creator confirms the three sentences, since each is the accessible name (INTERACTION.md, *Accessibility and annotation*).
2. **Canon names for the containers.** `CONTAINER_META` in `src/js/modes/spw/workbench-runtime.ts` labels thirteen affinities in the app's 2025 words. Value, Substrate and Measure already speak the workbench's word. Stream and Capsule (`<< >>`) have no mark among the workbench's twelve, so they keep theirs. Eight change:

   | App's 2025 word | Workbench name |
   | --- | --- |
   | Void | Action |
   | Promote | Ascension |
   | Deferred | Potential |
   | Conditional | Concept |
   | Property | Definition |
   | Perspective | Scene |
   | Category | Mode |
   | Confluence | Subject |

   The line's joins already use these names (`BONDS` in `line-anatomy.ts`). Gate: none in the app. Verify: a held line's card shows the new label.
3. **Links and forces.** Landed, and carried here in `c191e467` (see *Names*, *One home a node* and *Links by relation* above). The feel is the creator's, in the browser. The first knobs are `THROW_SPEED` (8) in `src/js/simulation/nodes/handling/circle.ts`, the throw heat, and the relation table in `relations.ts`. The demo is the probe in `wonder_factshift_relations`: three settings held on one line.
4. **First load.** Ends at a demo for the creator's look.
5. **Carry a dated workbench build** in place of compiling the submodule's source. `wonder_factshift_rebundle` holds the choice; the probe of 2026-11-06 found the dated build exports every name the app imports.
   - **5a. Carry.** Point the `spw-workbench/runtime` and `spw-workbench/parser` aliases in `vite.config.js` at a carried copy of `workers/spw-quest/assets/parser/2026.10.13/workbench.min.js` with its manifest. The release ships no type declarations, and the app imports thirteen types from the runtime, so `tsconfig.json` keeps its paths into the submodule's source for types, or the release grows a `.d.ts` (a workbench ask). Verify: tsc, vite build, and the falsification line in `index.spw` (`?spw=home[hook]{software.art.practice}(atlas)<person>` keeps its regions and frame).
   - **5b. Draw the outline.** A body holds its parts, a ( ) applies to the word with its body, a concept refers to the whole reading, and a join is the edge between two forms. `line-anatomy.ts` stays until the outline can say the line back. Gate: the creator's look.
   - **5c. Re-read the runtime gaps.** After 5a, hold `<person>` and a line with `@`, and check `runtime_capsule` and `runtime_prose` in `.spw/surfaces/factshift-center.spw#gaps`. Either the newer runtime closes them or each becomes a workbench ask.
6. **From spw.quest.** Once this is deployed, cards on `/pivot` and `/constructs` can open their line here with `?spw=` (spw-quest owns those cards; its slice O1 is the nearest).
7. **Layout gaps** the UI model names (`.spw/surfaces/factshift-center.spw#gaps`), one each, every one ending at the creator's look:
   - **7a. Nested order.** A body holding a nested expression stacks its plain parts in a column with the nested box beside them, so written order breaks.
   - **7b. Kept sizes.** A kept container's size and place are canvas pixels, not shares of the line's column.
   - **7c. Loose nodes.** A node added with ↑ cannot join the line by a drop, so an entered page with nothing inside has nothing to drag into an empty slot.

   The gesture collisions in the verbs audit (two taps on a container's corner also make a loose node) wait on its `#>wonder_factshift_gesture_meanings`.

## Open questions

Thirteen, held as wonders in `index.spw` (`npm run wonder -- --contour --surface .agents/plans/factshift-center/index.spw`). They run from the line's spaces, frames and channels, its gaps and parity with the workbench, through the rebundle, which relations pull, priming in dialects and the gestures each tool takes, to spells over a set, containers as physics and frames, sizes along arcs, the examination itself, and interaction depth (`wonder_factshift_interaction`, [INTERACTION.md](./INTERACTION.md)). Gesture meanings, one per gesture, are asked in the verbs audit as `#>wonder_factshift_gesture_meanings`.
