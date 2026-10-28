# factshift.center

**Status 2026-10-27.** factshift.center serves a snapshot of the factshift app. The snapshot was refreshed today to the app's latest local commit, recorded in `workers/factshift-center/version.json`. A line of Spw held in the address (`?spw=`) now lays out on the canvas as its anatomy. The app is its own repository at `workers/factshift-center/app`, gitignored here, and the twelve commits from this sitting are local and unpushed. The last three came from the creator's live notes. They cover a phone pass, the tool as a handle and a lens, a gesture grammar, a verb ring on nodes, the Spw stage, and most of the SVG semantics. Deploy is the creator's (Wrangler).

**Related:** [spw-quest](../spw-quest/PLAN.md) (its pivot and construct cards can open a line here) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) (parser releases, the capability ledger) · [brace-semantics](../brace-semantics/PLAN.md) (`[ ]` as a frame) · [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (depth passes) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (peers).

operation: align (the app's canvas with the workbench's reading of a line)

## Ground and center

- factshift.com is the ground, the one readers should find familiar: oxblood and wheat, the `<concept>` title, the `[...]` shortcuts face, the square focal mark. factshift.center develops the same concepts so they are easier to work with. At the start, its proportions and layout match factshift.com. Its menus and behaviors may differ (creator, 2026-10-27).
- The live site deploys from the app repository's `main` or `netlify` branch; the creator is not sure which. The last fetch in this checkout was on 2024-10-30. The workbench research ran through the end of 2025, after that deploy, so the live app knows little of how Spw developed.
- The app is TypeScript and Vite, with a d3 v7 force simulation drawn in SVG. It compiles the workbench from source through two aliases, `spw-workbench/runtime` and `spw-workbench/parser`, both pointing into its own submodule.

```text
pins (2026-10-27)
app            main 619432e, 79 commits past origin/main 2ba127a (fetched 2024-10-30)
app workbench  submodule fffab72, spw-workbench 0.2.0-alpha.1, 2026-03-12
site reader    public/js/semantic/spw-workbench-reader.js, v0.3.0 @ 850077a (the site's mount)
spw.quest      assets/parser/2026.10.13, v0.3.0 @ 0eb1d1c, nine commits behind the site's mount
```

## Landed 2026-10-27 (app repository, local)

- **Safety.** Tab walks nodes only from the canvas. Ctrl and Cmd never fire from text fields, so copy, paste and zoom stay the browser's. Clearing the node cache and resetting the interface now ask first. The socket opens only from its own panel, and the node save sends only on an open socket. The link tool opens http(s) addresses with noopener. htmx is removed.
- **Ground.** factshift.center now shares factshift.com's theme and layout. They measure identically at pocket width. The center's own controls sit behind the main menu. The square focal mark and `[...]` are back, and the menu's "open" subheading is gone.
- **Spw as the canvas.** `?spw=` holds a line of up to 400 characters. The line becomes the title and the heading, waits in a corner box (`#held-expressions`) where a tap reopens it in Spw mode, and runs through the workbench. Its anatomy is laid out as:
  - the word, framed by its mode as `[mode]`;
  - the body's parts on a ring inside a `{ } definition` region;
  - scene `( )` and concept `< >` in regions of their own;
  - nested bodies as regions within regions;
  - recurring words drawn in resonance.

  An anchor force keeps each part in its place.
- **Three runtime bugs** surfaced on the way:
  - Ids were rewritten from identity, so the projection's stage links failed.
  - Normalize overwrote projected fields on every reinit.
  - Regions were never drawn.

```text
24d2a48 0756029 ee0c00a   menu faces, focal mark, safety
2d0d257                   factshift.com's ground and layout
f1999d6 faf14f2 a792749   ids, ?spw=, normalize fills only what is missing
656c6e5 6b67304           regions drawn; the anatomy, title and corner box
e9a390d                   the phone pass and the interaction contract below
e601855                   the handle, the gesture grammar, the slot, and the Spw stage
619432e                   the handle and the lens, the verb ring, the five-row menu
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
  - The mode column stays one column of 44px squares.
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

The tool is a handle and a lens. The handle (the small square) is for carrying; the lens (the faint, light larger square whose bottom-left corner is the handle's center) is where the tool is used. Both are placed from the top of the screen, so the corner holds on a phone whose address bar shows.

| gesture | on the handle | on the lens | on a node |
| --- | --- | --- | --- |
| tap | show or hide the lens | toggle the tool: put it away, or bring back the last one | with a tool in hand, use it; with none, open the node's verbs |
| drag | carry the tool at once (its grab area reaches 10px past the square) | (a swipe) | move it, ringed; thrown on release |
| hold | grip: the handle rings, its tool lifts | grip; then drag to carry | open the node's verbs in a ring around it |
| ← | | the mode column, at once; the same touch slides to a mode | |
| ↓ | | the primary menu ([...]) | |
| → | | into the tool: its main control in focus | |
| ↑ | | a new node where the swipe lets go, named in place | |

- **The verb ring.** Each verb keeps its direction: ↑ grow, ↓ shrink, ← link, → color, ↗ raise, ↘ spin, ↙ remove, ↖ select. Hold and slide toward one, then let go to use it once. Let go in the middle and the ring waits for a tap. A tap anywhere else closes it. Only the node's name shows in the middle; the full description is the ring's accessible name.
- **The lens by keyboard.** The arrows do the swipes (← focuses the open mode's square), Enter or Space toggles the tool, and Escape returns to the handle. Enter on the handle shows or hides the lens.

- **One gesture per touch.** A swipe's direction locks once it crosses its line, so a path that drifts diagonally keeps the gesture it began. It unlocks only by coming back near where it started, which takes it back.
- **Guided.** A swipe that would land lights the handle's edge on that side, and the column lights the mode under or beside the finger. A swipe toward nothing shows the card. The handle is above everything else on the page.
- **The slot.** The larger square at the handle is the tool's slot. Empty, it has a faint, light, solid outline and takes the handle's gestures, a target sized for a thumb. When a tool is open, the tool fills the slot and takes its touches.
- **Taught on asking.** A hold shows the card, and so does the menu's "gestures" row, which counts what this browser has found. With a keyboard, the context-menu key or Shift+F10 is the hold. Nothing teaches itself uninvited.
- **Expert use.** Every gesture has a visible control. Choosing a mode takes one touch: ←, slide, let go.

Built in the app (`workers/factshift-center/app/src/js/ui/gestures.ts`) and committed at the creator's ask after a sitting of live notes. The next tools and the open choices are in `wonder_factshift_gestures`.

## Refreshing the snapshot

1. In the app, run `npx tsc --noEmit`, then `npx vite build`.
2. `rsync -a --delete --exclude='*.map' --exclude='.assetsignore' workers/factshift-center/app/dist/ workers/factshift-center/assets/`
3. In `workers/factshift-center/version.json`, update `revision` and `snapshot`, and add any new query key.
4. `npm run check:workers`, then commit in this repository when the creator asks.

Nothing scripts these steps yet. A carry script like spw.quest's is a candidate once the steps run a third time.

## Next slices

1. **SVG and UI semantics** (asked 2026-10-27). Most of it is in the phone pass:
   - The svg is a group, and its region and edge layers are hidden from assistive tech.
   - Mode buttons say aria-pressed, not aria-selected.
   - The tabpanel role and the radiogroup without radios are gone.
   - Anatomy nodes are named by word, slot and frame.
   - Enter and Space reach a node only while the node holds focus. Before, a node walked with Tab kept them, even from a focused button.

   Still open: a check in Chrome's accessibility tree, and a keyboard walk from the canvas.
2. **Canon names for the containers.** `CONTAINER_META` in `workers/factshift-center/app/src/js/modes/spw/workbench-runtime.ts` labels the eight affinities in the app's 2025 words. These are the workbench's names for them:

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
3. **Links and forces.** The creator asked for an overhaul of the link and force physics. Each relation gets its own link distance and strength, read from the relation names the anatomy already draws, in place of one global `linkStrength`. Feel is browser-gated: this slice ends at a demo.
4. **First load.** Ends at a demo for the creator's look.
5. **Carry a dated workbench build** in place of compiling the submodule's source. `wonder_factshift_rebundle` holds the choice.
6. **From spw.quest.** Once this is deployed, cards on `/pivot` and `/constructs` can open their line here with `?spw=`.

## Open questions

`index.spw` holds them as wonders (`npm run wonder`):

- conceptual space against performative or descriptive space;
- frames and channels;
- what the canvas shows about Spw's strengths and gaps;
- what earlier parity would have grown;
- the rebundle;
- which relations pull;
- what the Spw panel's priming becomes now that Spw has dialects;
- which gestures the other tools take, and the choices the demo leaves open.
