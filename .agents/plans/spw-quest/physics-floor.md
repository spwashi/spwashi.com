# A line at rest: a physics floor for spw.quest

Operation: `prime` (a design concept with a demo). Fixity: experimental.
Date: 2026-11-10. The feel is the creator's.

Demo: `/physics` (`workers/spw-quest/src/physics.js`, `test/physics.test.mjs`).

## The concept

One line of Spw is drawn as bodies inside bodies and comes to rest. A hand can do
three things, and each says what it did to the line:

| Act | What moves | The line |
| --- | --- | --- |
| Touch: push or drag a part, let go | the part, and what it bumps; it comes home | as written |
| A visitor: let in a word the line does not write | neighbours, by contact or by the visitor's mark | as written |
| Keep: write the visitor before the body's closing brace | the body takes it as a part | changed, and Undo puts every byte back |

That is rest, touch, keep from the workbench's exhibit floor, on one line. The
state is always a line on screen: the line itself, the line a keep would write
(shown before the keep), and the floor's own state, `floor[sky]{visitor: ^pebble, share: softer}`,
which the reader reads.

## The rules it lets a hand try

From the workbench notebook `docs/theory/spw/depiction-frames.spw` (pin be2df2ff),
`frame_rules` and `random_nodes`. They are proposals there and proposals here.

1. The line is kept; the picture is not. Every picture has a rest.
2. A body's leading mark is its law, felt by its own parts. A body inside feels a share: alike, softer, faint (the canvas's words; 1, 0.6, 0.3).
3. Each body has its own clock. A touch warms the body it lands in and, by the share, the bodies inside it. Never the one beside it or around it.
4. `key: value` is a joint with a rest length. The value moves with its key.
5. `@name` is a sight line. It is drawn under every word and moves nothing. A tap follows it: a ghost of the far end comes into view, and the far end stays.
6. Closed braces are neutral from outside. The page measures what moved beyond the brace: 0.0 px.
7. A visitor joins the line only by an edit that writes it. A bare word moves a neighbour only by touching it. A marked word carries its mark's law to the parts near it, less with distance.

Seven marks have a law here (`. ^ * ~ @ ? !`). The table on the page is the
simulation's own data (`PHYSICS_DATA.laws`). The other marks have none yet, and the page says so.

Not on the floor yet: an open pair as an ion (the reader falls back to prose on an
unclosed brace, so the page refuses the line and says why), `=x` as a lean,
bodies that move as wholes, and depth as reach.

## What the creator asked while this was being made

**Symmetry outside cards and code; mobile first; more like math and physics; an
introduction to navigable scale.** On this page:

- The body sits on one axis: the heading, the lede, the line, the stage, the scale row, and the carry row are centred. Cards (the three hands, the share) and the two tables set their own left edge inside themselves.
- Scale is the navigation. "Stand in: the whole line, sky's body, bed's body" steps the view into a body. The stage keeps its box, so nothing below it moves. A rule under the stage says how long 20 px of the floor is now, and how many times nearer you are. A visitor lands in the body you stand in, so where you are is also where you act. On a phone a word is 27 px tall in the whole line and 41 px inside a body: stepping in is how the hand gets room.
- Measures are numbers with a unit and a stated grain (a tenth of a pixel), in a table a person can check against the picture.

Proposed for the rest of the quest, not built: the same axis rule in `PAGE_CSS`
(page headers and ledes centred; `.measure` left only inside cards, code and
tables); the scale row as a shared piece, so `/build` (file, line, slot) and
`/specimens` (shelf, family, line) step the same way; and one ruler convention
wherever a page shows a size or a count.

**Carry a thought across contexts, as a proactive mutation or a pivot between
forms and constructs.** Built:

- The floor takes a line by address (`/physics?line=`), and after a keep the address, and the links out, hold the line as it reads now. "Carry this line" opens it in Pivot, in Build, on the canvas, or sends you to Constructs.
- Build, Pivot, each Constructs card with a pressed line, and each Forms row with a body now offer the floor ("Feel it at rest", "rest"), only where the floor can read the line (`physicsHref`).
- The visitor is the proactive mutation: the line one edit away is shown before the edit, in the body you chose, and the keep is undoable.

Proposed, not built: one "line in hand" that every room reads, so the thought
travels without a link being chosen each time. The walk already keeps the last
made line per room in this browser (`spw.quest.walk/1`); the smallest version is a
masthead chip that shows that line and offers the other rooms for it. From a
Constructs card, "this shape, with your line" (the line in hand pivoted into that
construct's separator or brace) would be the pivot between forms and constructs
the creator named. It needs the creator's call on whether the guide may show a
held line, since the guide does not assume a visitor brings Spw.

## The feel, all in one place

`PHYSICS_DATA.feel` and `.laws`: spring 90, damping 0.7 of critical, a law's offset
6 px, hold 2.6 and drift 0.3 on the spring, gather and open a quarter, a marked
visitor's lean 1.5 times its law with a 70 px reach, a child's shiver, a 24 px
push. Contact is positional: two words never share ground, each gives half the
way, a held word and a closed body give none.

## The creator's calls

- The room's name. The address is `/physics` and the shelf row says Physics; the heading is "A line at rest".
- Whether a part should come home after a drag (as built: the exhibit's reset) or stay where it was put (the canvas's slow hand). A visitor does stay where it is put.
- The seven laws' words and sizes, and whether `*` and `~` should be felt on the spring at all.
- What a marked visitor does. As built it carries its mark's law to nearby parts. The notebook says "parts its mark acts on lean toward it" and does not say which parts those are.
- Whether a warm body should show as a dashed rim (as built), a colour, or only the words under "Warm now".
- Whether the seventh shelf room is worth the second row it makes on a phone.
- Whether the floor's own state line belongs on the page or reads as schema.

## Do not

Do not deploy from this note. Do not answer the workbench's depiction wonders
from this page: its floor has seats by construction, and their question is about
the canvas. Do not add a mark, a `data-spw-*` family, or a second reader.

## Validation

- `node --test workers/spw-quest/test/physics.test.mjs` (14): a touch comes home within 0.1 px and warms no sibling; a joint returns to its rest length; a carried end of a sight line leaves the other at 0; a visitor leaves no trace and nothing moves outside its braces; a keep writes only its own bytes; the same act gives the same measures twice.
- `node --test workers/spw-quest/test/*.test.mjs` (119) and `npm run check:workers`.
- Headless, 390 and 1366 px, through the harness's `CdpSession`: no page widening, no exceptions; a bare visitor in sky moved sun 9.8 px and rain 15.9 px, 0.0 px outside the braces; out, 0.0 px from rest in 1.0 s; keep wrote `, pebble` at 40 (+8 bytes); undo returned 61 of 61 bytes; reduced motion gave the same numbers at once; with scripts off the stage, six words, the measures and seven rules show, and the hands are hidden.
