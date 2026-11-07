# factshift.center as informatic physics

Status 2026-11-07. One of four plane reports, read-only on the app. *Live* is the deployed build of app f06caf5: its bundle has the map and color strings and not the tie modes' `factshift.tie`. *Working tree* marks the other session's uncommitted `operator-tap.ts` and `link-confirm.ts`.

**Headline.** The line is conserved; the picture is not. Every force is multiplied by heat, and heat is gone in about two seconds. So an operator's motion is a short transient that freezes into a resting offset. Of six operator forces, two are felt at rest (ground, lift), one under a disturbance (potential), and the rest are noise. In the demo, the lifecycle reads best as heat: held is warm and circling, a decision is a kink in every path, residue is a fall to the floor.

## 1. What I tried

Captures: `design/components/captures/spw-planes-2026-11-07/physics/` (gitignored). Probes and JSON receipts: scratch `planes-physics/` (`live-desk.mjs`, `live-phone.mjs`, `live-extra.mjs`, `proto-shots.mjs`), not kept.

- `?spw=garden{.soil, ^sun, ~rain, *seed, ?weed, !hoe}`, 1366×900, 6 s → `02-desk-ring-settled.jpg`. The hexagon is crooked: `.soil` low, `^sun` high. Looks: dashed `~`, hollow `?`, heavy ring `!`, glow `*`.
- Same line unmarked → `03-desk-ring-unmarked.jpg`, an even hexagon. Marked minus unmarked offset: `.` +8 px down, `^` −9 px up, `*` −4, `?` +3, `~` +2, `!` 0.
- Heat, same page: α 0.87 at 0.3 s, 0.05 at 1.2 s, 0.004 at 2 s, 0.001 at 3.5 s. No part moved after 2 s.
- A kick (programmatic): every part 80 px right, α 0.3 → `04-desk-kick-250ms.jpg`. After 3 s none were home. `~rain` came back 10 px; the others 26–37.
- `?spw=trip{home ~> road ~> sea}` → `05-desk-path.jpg`: a path rising left to right. It reads at once.
- `tag{red.green.blue}`: a row, ±17 px off its tight slots. `garden{@view, soil, sun, rain}`: `@view` 7 px nearer the center than unmarked (data only).
- `?spw=?garden[care]{seed; water{rain, sun}}(yard)`, tap `?garden` → `07-desk-tap-wonder.jpg`. The word is pinned, hollow, ringed; a small card titled `?garden word` opens at the top. `sun` rests below its own nested body.
- Phone 390×844 touch, ring line → `08-phone-ring.jpg`. `~rain` sits 56 px from its slot; the others 16–36.
- Phone taps (data): `!hoe` beats, no receipt. `.soil` says ". soil back to ground", though never placed, and moves 5 px. `*seed` says "* seed heavier · r 18". `~ ? ^` play only.
- Phone drag of `~rain`, 220 px down, held → `10-phone-drag-held.jpg`: a line to "{ } body, slot 3"; the empty `( )` and concept slots appear.
- Let go → `11-phone-drag-let-go.jpg`. The line became `garden{.soil, ^sun, *seed, ?weed, !hoe}<~rain>`. `<~rain>` is large and green, with no dash. The ring re-formed as a pentagon.
- Phone, thread map over an 8-line file → `12-phone-map-by-operator.jpg`: six columns, `? wonder · 2` to `no mark · 2`. Column titles run together; two names overlap.
- Phone, color 6 chosen and soloed → `13-phone-color-solo.jpg`: "new nodes: color 6 · 6 on the canvas"; the word dims, 1 of 7.
- **Prototype** `lifecycle.html` (scratch), d3 7.8.5 from cdnjs. `?garden` opened → held → `!garden` answered → residue, and a `.` let-go branch. Wordless stills with two-second trails: `p1`–`p5-desk-*.jpg`, `p4-phone-residue.jpg`. Mean speed of the untaken answers, px a tick: held 0.55, answered 0.28, residue 0.23, let go 0.17.
- **What the demo showed.** Motion carried *open vs settled*: held circles, its trails curved (p2); residue is still. It carried *the moment of decision*: every path kinks, one pulled in, three pushed out (p3). It did not tell *answered* from *let go* (p4 vs p5): the untaken fall in both. The fill and the one taut tie tell them apart. Without trails a still of primed and held look alike. On a phone, room had to shrink to the stage, or answers left the screen.

## 2. The plane's theory as it stands

- Six operator forces, each × heat, skipped on a pinned node (`operator-physics.ts:13–20, 29–72`). The mark is the name's first character (`:30`).
- Anchors pull a part to its slot × heat (`anchors.ts:8–15`). Part anchor 0.12; the held word is pinned (`line-anatomy.ts:226, 262`).
- Charge by role: word −260, concept −160, part −90, charge −80, scene −60 (`line-anatomy.ts:221, 262, 292, 300, 383`).
- Regions damp all inside and pull only loose nodes (`regions.ts:15, 26–44`); the body is 0.92 / 0.04 (`line-anatomy.ts:93–97`). One home per node, with a reason (`homes.ts:5–15`).
- Mass is r²/400 (`normalize.ts:34`). Only the edge bounce (`forces.ts:166–184`) and wells over mass 2 (`forces.ts:206–255`) read it.
- Heat: α 0.35, decay 0.05, velocity decay 0.52 (`force-config.ts:1–8`). An edit keeps it warm until parts are home (`forces.ts:448–526`).
- Bytes: `editLine` rewrites one place and keeps every other byte. A place read only in part is refused (`line-slots.ts:119–148`).
- Place: a node keeps its place across an edit by role and name (`line-anatomy.ts:430`).
- Lifecycle: primed → held → actualized → residue (`OPERATORS.md:37–44`). "The look follows the stage… Motion plays the transition" (`:62–64`). Built once: prime holds a tie as `~` until `!` (`link-confirm.ts:1–6, 87–128`, working tree).
- OS: "the path should remain visible" (`operator-semantics.spw:214`); "A question should remain open even after interaction" (`:244`).

## 3. Where theory and surface disagree

1. **No resting motion.** `OPERATORS.md:64` keeps a "resting motion" for ground and lift. At rest α is 0.001 and nothing moves. The motion is a 1–2 s transient that leaves an offset.
2. **Two forces are felt.** Ground and lift move 8–9 px, half a part's radius. `~ * ? ! @` stay under 7 px. Charge pushes parts 4–18 px outward, more than any mark.
3. **`*` is drag, not weight.** "Heavier" (`TOOLS.md:368`) is a damp of ×0.86 a tick. A `*` tap grows the radius; the mass it changes moves only the edge bounce.
4. **`!` makes no room it keeps.** ≤3 px on its neighbours. A `!` tap pins the node (working tree, `operator-tap.ts:112–119`), which switches its own force off.
5. **`~` loosens only when disturbed.** 2 px at rest. Under a kick it came back a third as far. On a crowded phone ring it drifted most. This is the hidden force that does carry meaning.
6. **The lifecycle's own word cannot move.** The held word is pinned. `?garden` → `!garden` happens on the one node with no motion.
7. **A lifecycle step loses its place.** Place is keyed on the name with its mark, so `?weed` → `!weed` starts over at its slot. `OPERATORS.md:85` asks for continuity.
8. **A mark does not survive a change of room.** `<~rain>` starts with `<`, so its dash and force are gone (11). The bytes kept the mark; the field stopped reading it.
9. **A mark breaks kinship.** `resonate` echoes bare words only (`line-anatomy.ts:394`). `?garden` and `!garden` would not echo.
10. **Home is a promise only while warm.** Anchors scale with heat, so a part moved after cooling stays moved (04). Edits and throws re-warm; nothing else does.
11. **Two symmetry tables.** OS pairs prefix `?` with postfix `.` and `~` with `^` (`:179–186`), and elsewhere `?`/`!`, `~`/`@` (`:407–416`). `OPERATORS.md:41` takes the second. The first reads as a lifecycle: what a prefix closes into.
12. **Wells are noise.** At 100 px the word's pull is about a ten-thousandth of a part's anchor at 10 px.
13. **The runtime has no lifecycle.** `~` returns `{deferred}`; `!` returns its argument as is, so it never takes what `~` holds. `?` returns null when false, so an open question is nothing (`interpreter.ts:272–296`).

## 4. Proposals

**(a) Theory, named plainly.**
- **Bone, boon, bane.** The line is bone: the carrier, kept. Boon is every pull (anchor, tie, center, a region's well). Bane is every push (charge, collision, room, the edge). Heat is the time either may act. The menu's lore already says "data bone" (`TOOLS.md:316`).
- **Law of the line.** An act changes one place, and every other byte stays; where it cannot, it refuses. This is a conservation law in the plain sense: a drag moved `~rain` between rooms whole (11).
- **Law of heat.** Every force is proportional to heat, and heat is spent. The picture is recomputed, never kept. An operator's motion becomes its resting offset, which is residue in OS's own sense.
- **Law of identity** (proposed). A node is the same across an edit when its role and bare word match. The mark is its state, not its name.
- **Keep, cut, re-say.** Keep ground and lift. Keep `~` as loose when disturbed. Re-say `*` as drag, or make it true mass. Cut the wells, and `!`'s room, or give `!` room only while it commits.

**(b) Interactivity.**
- **P1, heat as the commit.** While a tie or question is pending, hold a low warmth (α target ~0.05) and let the pending parts circle; `!` cools the field. The tie modes' pending state is the hook. A demo first.
- **P2, place on the bare word.** Strip the mark in `placeOf`, so a lifecycle step plays from where the node stands.
- **P3, the mark inside a room.** Read the operator from the bare word, so `<~rain>` keeps its dash and force.
- **P4, the held word speaks by look.** Keep the pin. Give its look the stages (hollow, filled, halo) and give the parts the motion.
- **P5, a reference ghost.** A toggle drawing the unmarked layout faintly under the marked one, so ground and lift read as offsets (02 against 03).
- **P6, the map at phone width.** Column titles as sigil and count (`? 2`), names stacked.
- **P7, receipts for events only.** `.` on a part never placed says "already home".

**(c) Public copy.**
- Meta description, live: "factshift.center lays out a line of Spw: who is looking, from where, and what is still open, as nodes to move, link, and rewrite." Proposed: "factshift.center lays out a line of Spw as a small field. Move a part and every other letter stays; let go and the field cools where you left it."
- `about/domains/factshift.center/`: keep "What the physics can represent is whatever still reads as the line after you move it." Then add: "Heat is how long the field may move. A question keeps it warm; an answer lets it cool." The second sentence holds only once P1 is built.
- Receipt, live: ". soil back to ground", on a part never placed. Proposed: ". soil, already home".

**(d) Workbench asks** (recorded here only; `interpreter.ts:264–300`).
- **W1.** `!` takes a deferral: `!` of `{deferred: x}` returns `x` and writes a `*` receipt through the collapse path.
- **W2.** An unanswered `?` stays a value, `{open: args}`, not null. An answer writes its register, marked answered.
- **W3.** `.` with no path lowers `{integrated}` to its parts, so `^` and `.` pair in the runtime too.
- **W4.** The shared operator descriptor carries both a partner and what a mark closes into: `?` partners `!`, and closes into `!` or `.`. That settles OS's two tables.

## 5. Material and value

**What it is made of:** a line of bytes, a field of pulls and pushes, a heat that runs out, and looks drawn in stroke and fill. The bytes are kept and the picture is recomputed, so a still and its source are one object.

**How it behaves:** a part sits where its room and its neighbours leave it. Marks tilt the field a little. A drag across a wall rewrites the line and keeps every other letter. When the heat is gone, the picture holds.

**To an academic reader** (learning science, attention, diagrams):
- Spw began in a 2017 Learning-from-Text course, built to find where two understandings stop sharing ground. Here that place is one changed slot between two lines, with every other byte the same. A disagreement becomes local and countable.
- Diagrams help when location groups what belongs together (Larkin and Simon, 1987). Regions and anchors do that grouping.
- Motion onset captures attention (Abrams and Christ, 2003). So motion should be spent on changes of state. The noise forces spend attention and buy little.
- Animation often teaches no better than stills (Tversky, Morrison and Bétrancourt, 2002), unless it is easy to take in and matches what changes. The demo's trails keep the motion in a still.

**To a business reader** (product, A&R, services):
- A client's open question can be held as a line: `?launch[spring]{site; video; event}`. The options circle while it is open. One is taken; the rest settle and stay in view.
- The screenshot is the receipt: what was asked, what was taken, what was left. It is also the source.
- A shortlist in A&R works the same way: demos on a ring, one signed, the rest kept, not deleted.
- This shows a decision. It promises no outcome, and nothing here is financial.

## 6. Wonders

```spw
#>wonder_factshift_felt_forces
?["Which marks does a reader feel at rest, beside the same line unmarked?"]{
  ~#expect: "ground and lift (8–9 px); the rest under 7 px; charge larger than any mark"
  ~#probe(read) !probe{ "open ?spw=garden{.soil, ^sun, ~rain, *seed, ?weed, !hoe} beside garden{soil, sun, rain, seed, weed, hoe}; name each mark without its label" }
  $%[felt.ground_lift, felt.all_six, felt.none]  ~#refreshes: ~"../factshift-center/OPERATORS.md"
}
?["Does a lifecycle step keep the node's place?"]{
  ~#expect: "no: place is keyed on role|name with the mark, so ?weed → !weed starts at its slot"
  ~#probe(run) !probe{ "rg -n 'placeOf' workers/factshift-center/app/src/js/modes/spw/line-anatomy.ts" }
  $%[place.kept, place.lost]  ~#refreshes: ~"../factshift-center/OPERATORS.md"
}
?["Does a mark survive a change of room?"]{
  ~#expect: "no: the field reads the name's first character, so <~rain> drops its dash and force"
  ~#probe(run) !probe{ "rg -n 'charAt\\(0\\)' workers/factshift-center/app/src/ts/simulation/operator-physics.ts workers/factshift-center/app/src/js/simulation/nodes/operator-tap.ts" }
  $%[mark.kept, mark.lost]  ~#refreshes: ~"../factshift-center/TOOLS.md"
}
?["Can a reader tell held from settled, and answered from let go, in the demo with no words?"]{
  ~#expect: "held vs settled yes (circling, 0.55 vs 0.23 px a tick); answered vs let go only by the fill and the taut tie"
  ~#probe(read) !probe{ "open scratch planes-physics/lifecycle.html?wordless; play ! then ↺ then .; say each stage aloud" }
  $%[stage.motion, stage.look, stage.neither]  ~#refreshes: ~"../factshift-center/TOOLS.md"
}
?["Does ! take what ~ holds in the runtime?"]{
  ~#expect: "no: ! returns {deferred} unchanged"
  ~#probe(run) !probe{ "sed -n 285,296p .spw/_workbench/packages/spw-runtime/src/interpreter/interpreter.ts" }
  $%[runtime.takes, runtime.passes]  ~#refreshes: ~"../factshift-center/OPERATORS.md"
}
```

## 7. Questions for the creator

- **Should a held question move?** In the demo it circles. Circling may read as open, or as restless.
- **Where do untaken answers go?** To the floor (as built, findable), out of view, or back into the word?
- **Should *answered* and *let go* differ in how the others move?** Now both fall, and only the fill and one taut tie tell them apart.
- **Is the look the carrier and motion the accent?** In the stills, hollow → filled said more about the stage than motion did.
- **Should the held word leave its pin for a beat** when its mark changes?
- **What is `*`:** drag, mass, or size?
- **What is the residue?** The demo keeps a dashed halo around an answered word. Is that the answered wonder's mark, or should the line write it (`garden?`, `~#answer`)?
- **Heat as a word.** Is "the field cools" the site's own imagery, or a schema word in disguise?
