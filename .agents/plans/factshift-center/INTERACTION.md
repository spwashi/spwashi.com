# Interaction depth

Companion to [PLAN.md](./PLAN.md); the whole canvas model is [.spw/surfaces/factshift-center.spw](../../../.spw/surfaces/factshift-center.spw). What the app does with a gesture, a submenu, a primed act, a device, and an annotation. `wonder_factshift_interaction` holds the open question.

A behavior either primes a concept or actualizes it. In the tools, the primed act is `primedAction` and actualizing it is `performPrimed` (`workers/factshift-center/app/src/js/ui/tool-primed.ts`). Actualizing writes the line, or changes the simulation in a way the line or the address can say back. A behavior that cannot say what it did is outside the examination.

## Four constants

A surface chooses its own acts. Four things stay the same from one surface to the next, and each has one owner in the app. A new gesture names all four before it lands.

- **Direction, the compass** (`ui/compass.ts`). On the reading plane, which is the frame and the held line's bodies, a direction means one thing everywhere. Breadth: the content follows the finger, so rightward brings what came before (the part, the body, the line, the concept). Depth: as a scroll moves a page, up goes in and toward more (a nested body, the next stratum), and down comes out and toward the line as written. A diagonal's vertical half keeps depth's sign, so on a body ↗ goes in a level and ↙ comes out. That diagonal was reversed until 2026-11-27 (app hash in PLAN.md pins). The keys follow the scroll: ↓ and Shift+↓ go in. Chrome handles (`gestures.ts`: handle, lens, tile) keep their own verbs. The canvas ring is a radial picker. It places choices around the finger and does not read a direction.
- **Ownership.** One touch is one gesture. Once a gesture crosses its line, no sibling listener answers that pointer (`claimedPointer` in `frame-refresh.ts`, `swallowsTap` in `gesture-claim.ts`). P0 carries the same rule to the horizontal owners that remain.
- **Saying.** Words go where nothing on screen shows the result. A landmark that shows it answers instead (Accessibility and annotation, below).
- **Grade.** Every act is a lean (L0, gone on lift), a hold (L1, kept for this visit), or a keep (L2, which writes the line or the address). The act says which one (Grain aperture, below).

## Behaviors

The gesture table in PLAN.md is the grammar. This is what each family does.

| behavior | primes | actualizes |
| --- | --- | --- |
| tap a tile | | opens the tool (`tool-tiles.ts`) |
| hold a tile | nothing yet: `tool-tiles.ts`'s header says the card names the tap and the swipe →, and no hold opens it | |
| swipe → on a tile, or → on a tool in the tool menu | | takes what that tool has primed, and does not open it |
| tap the lens on an open tool | puts the tool's field in focus | |
| → with nothing stepped, tool open | | takes what the open tool has primed, as → on its tile does |
| hold | grip, and the count of gestures found (`gesture-found.ts`); the card comes from the [...] gestures row, a swipe toward nothing, or the context-menu key (`gestures.ts`) | |
| drag a node, let go slowly | the home line, while it is carried | the node stays where it was put |
| throw | | the node goes home |
| drop on a node, a container, or a slot | the ring while the drop is near | a drawn link, a membership, or a new order in the held line |
| hold the canvas ring, drop a brace | the slot that could be filled | that slot, with `·` to name |
| pinch on the stage | the coming size, said above the fingers | the radius, kept through the reinit (`pinch.ts`) |
| swipe ↑ | | a new node, named in place, arriving selected |

The [...] rows follow the same split. A row shows one verb. Turning the row (a swipe, ›, ← →) primes the next verb and remembers it. A tap actualizes the verb that is showing. A row is listed only while it has something to act on.

## Submenus

With a tool open, the nub steps in three levels (`tool-steps.ts`): the tool menu, a tool's cards (its submenus: lore, motion, make, keep), and a card's controls.

- At the tool menu, and among cards, ↑ ↓ stay in that list. A tap goes in; → goes into a card (on the tool menu, → takes what the tool has primed, below). ← comes back out, to the same tool or the same card.
- Among a card's controls, ↑ ↓ move to the row above or below and carry on into the next card. ← → crawl along the row onto the next row. ← from a card's first control steps out.
- On the tool menu, → takes what that tool has primed and does not open it. A tap opens it at its first card.
- A stepped thing is ringed (`data-stepped`). It is not focused, so stepping onto a field does not raise a phone's keyboard. A press does.
- A tool without cards is one card. ← from its first control is the tool menu.
- A vertical step keeps the column it started in, the way a text cursor keeps its column.
- A held slide keeps stepping. A slide taken back returns to what was stepped before it.

The open column marks the open tool by a step in from the side. The tile a hand is on takes a thick inner border. The number on a tile is its key. The squares are the title box's height (`--title-box`), square.

Still open, from `wonder_factshift_gestures`: the handle's arrow keys nudge the handle. They do not follow these levels. While a tool is open, the nub's levels are those arrow keys.

## Primed and actualized

`primedAction` is the primed act, in this order: Spw fills an empty prompt from the selection, else the held line, or runs the line already there; a control marked `data-submit` (map, filter, query) is pressed; any other tool presses again the control last pressed in its panel; otherwise the tool opens and the steps go in. `performPrimed` actualizes it. A tool that was closed says what it did beside the handle (`handle-said.ts`, `aria-live="polite"`). The tool that was open stays open. Reflex is the exception: its own press closes it, so after a primed press it opens, to show what changed.

On the line, an empty slot appears only while a drag could fill it. A drop writes it into the line.

The line's parts sit by anchors, not by a `holds` tie. `holds` is in the relation table and this layout does not emit it. The ties that pull are `accesses`, `follows`, `charges`, `bond`, `resonance`, and a link a hand drew. `defines`, `applies`, and `refers` are drawn at strength 0.

Calling those zero-strength ties a primed relation, and calling `refers` the concept actualized onto the whole reading, was a reading of the code. The creator has not said it. It stays out of this plan's language until they do. Which drawn ties may later pull is `wonder_factshift_relations`, felt in the browser.

## Devices and pressure

- A coarse pointer hides keyboard hints (`pointer: coarse` in `hotkey-menu.scss`), rests the Spw prompt as its print until a tap opens the painted editor (`spw-mode.scss`), and starts sideways steps in a 72px band (below). A fine pointer keeps the editor open, so typing needs no tap.
- At 40rem or narrower, one surface shows at a time, and the mode column stays one column (`modes.scss`). The squares match the title box. They are not a 44px target. The nub's minimum is `max(44px, 2.75rem)`.
- On the canvas, a pinch, including a trackpad pinch, resizes nodes: the one under the pointer, else the selection, else every node. A trackpad's two-finger scroll pans. The camera zooms only from a pinch begun on the lens, or a trackpad pinch over the lens (`pinch.ts`). A window's edges are grab bands on a fine pointer.
- A keyboard uses the focus ring only. The context-menu key or Shift+F10 shows the card, the keyboard's way to learn a surface (`gestures.ts`).
- One touch is one gesture. Direction locks once the path crosses its line. It unlocks by returning near the start.
- Back and forward walk this visit's concepts, which are the browser's history (`concept-history.ts`). On touch, a 72px band inside each side of the canvas steps back (rightward) or forward (leftward), since the system or the browser takes the bare edge; it may start on a region, and a tab at that edge names where it lands. The frame's ← → do the same. A phone tab's own edge swipe, Android's back, a trackpad's two-finger swipe and Alt+← → walk the same entries. A mouse never starts the band. The lines this browser keeps across visits stay on the hash's ← →.
- Editing the prompt by its reading is a keyboard's Alt+Shift+→ (grow) and ← (back in), Alt+↑ ↓ (move a part) and Tab (only while a line owes closers); the bar under the line holds the same acts for a thumb (`line-edit.ts`).
- What each device should add and hold back is open in `wonder_factshift_devices`.

The canvas does not read pointer pressure. The magnitudes it already has are distance, speed, and time: how far past grow or shrink, how fast a throw, how long a hold, how wide a pinch. A stylus or a force-sensitive pad would use that same scale. The open choice in `wonder_factshift_gestures`, whether the count of found gestures is play or pressure, sits inside this. Until a device reports force, distance and time remain the pressure.

## Accessibility and annotation

Every primed act and every actualized act has one sentence. The card says it, or the note beside the handle does. When a landmark already shows the result, the landmark answers: the node that acted, the body the camera framed, the part stepped to, the hash, a mode's panel. It is lit for the ephemeral hold, and the sentence goes to the live region only. Each kind of landmark shows its words the first two times it answers in a browser (`handle-said.ts` `landmarkAnswers`, key `factshift.landmarks-taught`), and the touch tag shares that count. A note with nothing to point at (an edge, a refusal, the whole stage) always speaks. A cue under a moving finger holds its words still and lets its armed style say that a release would land. That sentence is the accessible name. Hue does not carry it. The relation table, the runtime card (parse, normalize, interpret, register), and the link card are the annotations already on the canvas. A node's picture and label take no touches. The circle does. Anatomy nodes are named by word, slot, and frame. Enter and Space reach a node only while that node holds focus.

Still unnamed:

- A stepped level is a ring (`data-stepped`) and a bar on the card's band. It has no accessible name for "tool menu", "card", or "control".
- The svg is a group. Its region and edge layers are hidden from assistive tech. The accessibility-tree check and the keyboard walk from the canvas are still open (slice 1 in PLAN.md).
- An annotation says what the runtime or the relation made of a thing. It does not become a second title on a region. The concept's region stays unlabeled. Its node and its tie carry the name.

A submenu level, a primed act, and an actualized act each need that one sentence before a new control is added.

## Ephemeral UI

The leans, the scrub, the joint preview, and the theme that expires are [hub.spw](./hub.spw) `^"ephemeral"`. `/{path}` is the title by default (`^"path"`): a file answers first, `/demo` and `/help` stay, and any other miss is that title. A domain is not its own route.

## Grain aperture & effect-grade contract (2026-11-26, proposed)

Derived in [factshift-aperture-rederivation](../../../.spw/caches/factshift-aperture-rederivation-2026-11.spw) and gated on `#>wonder_factshift_grain_aperture` (`index.spw`). Every gesture on the canvas declares its effect grade so the hand always knows whether a motion is reversible on lift, reversible in the session, or mutating the line:

| Grade | Meaning | Examples | Inverse |
| --- | --- | --- | --- |
| `L0` transient lean | Lives only while the finger is down or until the next act starts; leaves `0` diff on cancel | edge-rail stop preview, joint turn preview, aperture scrub in flight, hover ring | return to dead zone or lift |
| `L1` session hold | Survives lift in this browser/session; leaves the held line and URL untouched | camera frame, brace fold/stratum, aperture rung (`lean`/`hold`/`saturate`), kept reference (`spw-kept.ts`), `=` node pin | symmetric close / undo / clear |
| `L2` document write | Rewrites the held line (`editLine` / `writeAt`) or URL physics parameters | rename, container drop, reorder, spawn slot, `Shift+wheel` / Reflex `forces.charge`, primed submit | browser undo / history back |

- **Symmetric grain aperture (`open <-> quiet <-> close`):** Bound to the active grain's real brace boundary (only after P0 retires horizontal body-edge resize and `#held-expressions` horizontal swipe, and never onto unmounted `#frame-scrub`). Called **aperture** (open/close disclosure), never `charge`, so `forces.charge` stays strictly on `Shift+wheel` and Reflex, and `boon/bane` stays on valence.
  - **Open (objective, toward left opener):** leans unnamed seats (`[ ]`, `( )`, `< >`) toward the focal square and weights the left `where` rail.
  - **Quiet (`0`):** dead zone matching `edge-scrub.ts`; ending where the scrub began commits nothing.
  - **Close (subjective, toward right closer):** walks open disclosure back to `quiet`, and past `quiet` folds settled seats cleanly (without hijacking `=` node pinning, which remains node-level kept/loose).
  - **Rungs & receipt:** snaps on lift to `quiet`, `lean`, `hold`, `saturate`. While held, only the live rung speaks; one receipt names brace + rung on lift and leaves when the next act starts.
- **Single pointer ownership (`claimedPointer`):** Once a gesture crosses its dead zone (`gesture-measure.js` / `swallowsTap`), no sibling listener (`body-gestures.ts`, `edge-scrub.ts`, `pinch.ts`, `tool-window.ts`) may answer the same pointer. Page left/right margins remain `where` / `how`; the focal square remains `out` / `in`.
