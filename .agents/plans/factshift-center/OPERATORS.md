# Operators: what each does, how it lives, and a line that can change

Status 2026-11-07. A design note; nothing in it is built yet. The creator asked, in turn:
- spend more time on the behavior differentiation and mutability of the operational structure;
- consider lifecycles per operator;
- reflect on the plans and theory, and how factshift.center's recent work may inform spwashi.com's runtime or library.

This note reads what the app does at app f06caf5, plus the other session's uncommitted tap and tie work in the same checkout (`operator-tap.ts`, `link-confirm.ts`), and what `.spw/conventions/operator-semantics.spw` (cited as OS) already says. It then proposes one model and its smallest slices. Tested 2026-11-07 by the planes pass ([PHYSICS.md](../spw-planes/PHYSICS.md)): the look carried a lifecycle's stage better than motion did, and two mismatches block L2 and L3. A node's place and its mark are keyed on the name with its mark, so a step starts over and `<~rain>` loses its mark. The other session's joints work (`src/js/modes/spw/line-joints.ts`, uncommitted) uses the words mark, room and seam for the places a line can change. This note uses them too.

## Where the app is

Each operator now shows up on five channels, built at different times for different reasons. The tap column is the working tree; the runtime column is the workbench interpreter (`spw-runtime/src/interpreter/interpreter.ts`):

| op | look at rest | motion | a tap | the runtime does |
|---|---|---|---|---|
| `~` | dashed edge | tether loosened | lets it loose | defers its first argument |
| `?` | open fill | — | opens its runtime card | returns the second argument when the first is true |
| `!` | heavy ring | makes room | writes a held tie, else keeps it here | returns its first argument |
| `*` | glow | heavier | grows a step | writes a collapsed first argument |
| `.` | ground shadow | settles | goes home | reads a path, or the base |
| `^` | lifted | lifts | writes a gather into the held line | wraps its arguments as one |
| `#` | ringing edge | — | keeps a frame | reduces into a register |
| `@` | dotted | leans to the middle | to the center | observes through an observer |
| `&` | long dash | — | selects with its ties | merges into one register |
| `=` | kept edge | — | pins or lets loose | writes to a register |
| `%` | ruler | — | says its measures | measures a register |
| `$` | muted | — | says its make-up | materializes metadata |

Two things are mixed in that table:
- **Most channels change the view:** where a node sits, how heavy it is, what is selected, what is framed.
- **Only a change of the line changes the structure:** a mark, a room, a seam.

The operators' own meanings are mostly about the structure, and about time: a question opened, then answered; a path held open, then taken. Most of that has no channel yet. A tap on `?garden` opens its card, a reading, and does not offer the answer that `?` waits for.

One lifecycle is already built. In the tie modes (`link-confirm.ts`, cycled from reflex's motion card), a drop in *prime* holds the tie as `~` until `!` writes it. In *gather*, nodes collect on a host until `!` links them or `^` writes them into the held line's body. That is `~` primed → `!` actualized, and `^` as a change of the line, not of the view. The proposal below generalizes it.

## One identity, one lifecycle

**The proposal.** Each operator has one identity, and every channel expresses it. The identity is a lifecycle: how the mark arrives, what it holds while it stands, what closes it, and what it leaves behind. OS already gives the parts:
- the positions: "prefix primes, infix scopes, postfix marks residue";
- the symmetry pairs: `?`/`!`, `~`/`@`, `#`/`.`, `*`/`~`, `&`/`@`, `^`/`.`;
- the priming chains: `?(choice) ! execute`, `~(#frame)`, `* & reference`.

The common shape is **primed → held → actualized → residue**. *Let go* returns to ground from anywhere, since "ground must be reachable from any depth".

| op | arrives as | while held | closes into | leaves behind | partner |
|---|---|---|---|---|---|
| `?` wonder | a question opened | alternatives visible, nothing committed ("closing a probe should leave other exploration paths open") | `!`, an answer taken; or `.`, let go | the question, findable as answered (the repo's own `~#answer(date)`) | `!` |
| `~` potential | a thread to somewhere | the target can be inspected without moving | taken: a tie is made | the thread stays visible ("the path should remain visible") | `@` |
| `!` action | a move primed, its consequence shown first | — | committed | a `*` receipt | `?` |
| `*` value | weight marked | weighed against others (`%`) | kept | the receipt is itself `*` | `~` |
| `.` ground | a return | rest | — | — | `#`, `^` |
| `#` vibration | a name given | found again by its name | kept as a frame | the frame, recoverable | `.` |
| `^` ascension | parts lifted into one relation | the relation inspected | lowered, back to parts | — | `.` |
| `@` perspective | a viewpoint taken | the field regarded from it | left | — | `~`, `&` |
| `&` subject | what it is about, named | joined with its ties | split | — | `@` |
| `=` configuration | bound under a name | kept in place across redraws | released | — | — |
| `%` measure | measured | compared | leveled | the measure | `*` |
| `$` substrate | what carries the charge, shown | carried | spent | — | — |

**What follows for each channel:**
- **The look follows the stage, not only the mark.** A `?` held open is hollow, and the same word answered fills. A `~` taken keeps a faint thread to where it went.
- **A tap offers the lifecycle's next step first, primed.** On `?garden` it primes `!garden`, then `.garden`, and a second tap takes it, with its receipt. The view acts that taps do now (home, pin, center, grow, frame) move to the node's ring, where view verbs already live.
- **Motion plays the transition.** Taking `?` → `!` plays the tilt, then the beat. An operator's resting motion stays as built: ground settles, ascension lifts.
- **The operator keys order themselves by the line's mark.** On `?garden`, `!` and `.` come first and the rest follow. Nothing is hidden; only the order changes, so a key keeps its place.

## The line as something to change

The joints work names where a meaning can change: the mark, the word, each room (a brace pair) and each seam (how a body holds its parts, or how two lines regard each other). Each turn keeps every other place. The kinds of change, and where the hand finds each:

| change | what moves | where it is reached today | where it could be |
|---|---|---|---|
| mark | a lifecycle step, or another operator | operator keys; the word's ring (mark) | a tap on the node offers its lifecycle's next step |
| walls | a room's content to another pair | a node's ring (turn) | the room's own brace, tapped (spw.quest's pivot does this) |
| seam | `.` `,` `;` `~>` in a body | typing only | a tap between two parts turns the seam through the four |
| order | a part earlier or later | ring; drag along the row | as is |
| nest | a part made a nested line, or unmade | typing only | `^` lifts parts into a nested line; `.` lowers it |
| between | two lines joined by `~` `&` `^` `@`, or split | typing only | a line from the thread dropped on the word, with the four marks offered |
| position | a mark moved front ↔ inside | typing only | an operator key dropped on a part marks that part (`garden{?seed}`); on the word, the front |

**Rules that keep change legible:**
1. **One change per act,** with every other byte kept (`editLine`), as spw.quest's pivot does.
2. **Primed, then actualized.** The changed line shows before it is taken. A second press takes it, with a `*` receipt.
3. **The way back is the line's history.** ← on the hash or the frame is the line before, and every change goes through it. View changes (pins, colors, framing) are not in it, and say so.
4. **Continuity.** A changed node moves from where it was to where it goes, and a new one comes from where the act began: the dropped point, the key, the parent. Layout already keeps a node's place by role and name (`projectLineAnatomy`). New parts need a starting point.
5. **A change says what it did,** in the operator's own word ("answered", "taken", "lifted", "let go").

## What this suggests for spwashi.com's runtime and library

factshift.center is where the language is played. Its recent work names parts that spwashi.com's runtime could hold once, in its library, rather than per site:

1. **One operator descriptor.** There are four operator tables today: the workbench's `operators.spw`, the site's `public/js/kernel/operator-detection.js`, spw.quest's `guide.js` and factshift's `operators.ts`. brace-semantics already asks for the table to be written once in the workbench and read everywhere. This note adds the fields a descriptor would need beyond sigil, name and reading: the lifecycle (arrives, held, closes into, residue), the partner, and the resting look. The site paints the look through the existing `data-spw-operator` stem, not a new family. This is an upstream ask, since this repo does not edit the workbench.
2. **The primed and actualized contract for chrome.** factshift's keys, previews and `*` receipts are the same contract brace-semantics §D asks of a component that reads its line back: the lens switch first, then the cauldron chip and the boonhonk mixer. A shared helper could cover it: the line it would become, a receipt line, and the way back.
3. **Saying what a line will do before it runs.** `spw-interpret.ts` previews a setting, a command, or a line held. The site's Spw search and the cauldron take typed Spw too, and the same reading ("this opens", "this collects", "this is a line") would make them legible before Enter.
4. **One codec for carrying a script.** `#spw64=` (base64url in the fragment) now carries scripts between spw.quest and factshift.center. The brace-semantics door from spwashi.com's home into spw.quest already plans to ride the fragment, and it can use the same codec, so a script moves between all three sites the same way.
5. **A head and a payload.** A long line's title shows its head, and the whole line stays the payload. Seed cards, folio headings and the cauldron's chips meet the same problem with long expressions.
6. **The thread as the cauldron's shape.** factshift keeps rows of lines, each tagged with where it came from: typed, a file, a link. The cauldron collects expressions. One storage shape would let a cauldron's contents open as a thread there, and a thread return as a cauldron.
7. **Features as facets.** The file map groups lines by operator, lens and `#>` frame. Those are the facets the site's Spw search and atlas could offer over the expressions its pages carry.
8. **Offer only what has a consequence.** The map's regions became fixed because moving them changed nothing. The site's own rule, "smallest honest surface", says the same of handles and chips: an affordance that changes nothing is not shown.
9. **Small modules, separate files.** Concurrent sessions shared the app checkout. The work that held up came in small new modules with one-line hooks, built from a clean worktree of its own commit. That matches the site's standing advice to keep new behavior in its own module.

## Questions for the creator

- **Residue.** OS says "postfix marks residue". Is an answered wonder written as a mark after the word (`garden?`), as an annotation (`~#answer`), or not at all in the line?
- **Taps.** Should a tap on a marked node offer its lifecycle's next step (a change of the line), with the view acts moved to its ring? Or should taps stay view acts?
- **Partners.** Do the symmetry partners decide the offers (`?` offers `!`), or does each operator keep its own list?
- **The descriptor.** Should the shared operator descriptor carry lifecycles at all, or only sigil, name and reading, leaving behavior to each site?

## Slices, smallest first

- **L1 — lifecycle data, and keys ordered by it.** A `next` list per operator in factshift's `operators.ts`, and the operator keys ordered by the line's mark. Nothing moves; only the order changes.
- **L2 — a tap primes the next step.** It is a change of the line, shown before it is taken, with its receipt and its motion. It builds on the tie modes' pending state, which already holds a primed act until `!`. It waits on the taps question.
- **L3 — continuity.** New parts arrive from where the act began, and a mark's change plays its transition.
- **L4 — seams and nesting by hand.** A tap between parts turns the seam, and `^` and `.` lift and lower.
- **S1 — the descriptor upstream.** The fields above, written as an ask to the workbench; the site and spw.quest read them.
- **S2 — the codec and the preview in the site's library.** `#spw64=` for the home door, and the reading of a typed line for search and the cauldron.
