# Interaction depth

Companion to [PLAN.md](./PLAN.md); the whole canvas model is [.spw/surfaces/factshift-center.spw](../../../.spw/surfaces/factshift-center.spw). What the app does with a gesture, a submenu, a primed act, a device, and an annotation. `wonder_factshift_interaction` holds the open question.

A behavior either primes a concept or actualizes it. In the tools, the primed act is `primedAction` and actualizing it is `performPrimed` (`workers/factshift-center/app/src/js/ui/tool-primed.ts`). Actualizing writes the line, or changes the simulation in a way the line or the address can say back. A behavior that cannot say what it did is outside the examination.

## Behaviors

The gesture table in PLAN.md is the grammar. This is what each family does.

| behavior | primes | actualizes |
| --- | --- | --- |
| tap a tile | | opens the tool (`tool-tiles.ts`) |
| hold a tile | the card names the tap and what a swipe → would take | |
| swipe → on a tile, or → on a tool in the tool menu | | takes what that tool has primed, and does not open it |
| tap the lens on an open tool | puts the tool's field in focus | |
| → with nothing stepped, tool open | | takes what the open tool has primed, as → on its tile does |
| hold | the card, the compass, the count of gestures found (`gesture-found.ts`) | |
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

- A coarse pointer hides keyboard hints (`pointer: coarse` in `hotkey-menu.scss`). That is the touch-screen rule.
- At 40rem or narrower, one surface shows at a time, and the mode column stays one column (`modes.scss`). The squares match the title box. They are not a 44px target. The nub's minimum is `max(44px, 2.75rem)`.
- On the canvas, a pinch, including a trackpad pinch, resizes nodes: the one under the pointer, else the selection, else every node. A trackpad's two-finger scroll pans. The camera zooms only from a pinch begun on the lens, or a trackpad pinch over the lens (`pinch.ts`). A window's edges are grab bands on a fine pointer.
- A keyboard uses the focus ring only. The context-menu key or Shift+F10 is the hold.
- One touch is one gesture. Direction locks once the path crosses its line. It unlocks by returning near the start.

The canvas does not read pointer pressure. The magnitudes it already has are distance, speed, and time: how far past grow or shrink, how fast a throw, how long a hold, how wide a pinch. A stylus or a force-sensitive pad would use that same scale. The open choice in `wonder_factshift_gestures`, whether the count of found gestures is play or pressure, sits inside this. Until a device reports force, distance and time remain the pressure.

## Accessibility and annotation

Every primed act and every actualized act has one sentence. The card says it, or the note beside the handle does. That sentence is the accessible name. Hue does not carry it. The relation table, the runtime card (parse, normalize, interpret, register), and the link card are the annotations already on the canvas. A node's picture and label take no touches. The circle does. Anatomy nodes are named by word, slot, and frame. Enter and Space reach a node only while that node holds focus.

Still unnamed:

- A stepped level is a ring (`data-stepped`) and a bar on the card's band. It has no accessible name for "tool menu", "card", or "control".
- The svg is a group. Its region and edge layers are hidden from assistive tech. The accessibility-tree check and the keyboard walk from the canvas are still open (slice 1 in PLAN.md).
- An annotation says what the runtime or the relation made of a thing. It does not become a second title on a region. The concept's region stays unlabeled. Its node and its tie carry the name.

A submenu level, a primed act, and an actualized act each need that one sentence before a new control is added.
