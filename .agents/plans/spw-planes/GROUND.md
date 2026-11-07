# Ground: the three lands, the pentad, and what the material is worth

Status 2026-11-07. A read-only pass, one of four; the plane notes sit beside it. I wrote only this file and gitignored captures, and read the workbench without editing it. The creator's sentence about lands and planes is left open in §7.

## 1. What I read and captured

- `.spw/domains.spw` whole (lands :77–79, valence lens :44, boonhonk :131, unlinked hosts :137–148).
- `.spw/caches/host-frame-2026-09.spw` whole (lands :101–105, physics :107–111, do_not :119–127).
- `.spw/caches/boonhonk-combinatoric-genre.spw` whole (transforms :60–69, linguistic play :241–255, component jobs :257–278).
- The three land pages (147 lines each), the Boonhonk Register (`about/index.html:1176–1380`), the library folio (`play/rpg-wednesday/library/index.html:115`).
- Workbench at 27fa1e3d: `CLAUDE.md:182`; `valence-architecture.spw` and `charge-valence-brace-bridge.spw` whole; `interpreter.ts:40–90, 150–345`; spw-seed `catalog.ts:44–50`, `names.ts:63–64`, `expression-charge.test.ts:82–96`; the `#:valence` tags under `.spw/`.
- The factshift app at f06caf5: `src/ts/domains/config.ts:55–92`, `force-config.ts:1–8`, commit 07a8442 and the config before it (5eff5b1); its older workbench copy (fffab721) `.spw/surfaces/domains.spw:55–90, 160–175`.
- Repo theory: `operator-semantics.spw` (lineage, positional grammar, voices); `operator-namespace-alignment.spw` whole; `site-cluster.spw` roles and loops; `compound-expressions.spw:160–170`; the upstream asks, searched for valence, lifecycle and lands.
- Plans: `factshift-center/OPERATORS.md` whole; spw-inquiry-loop and operator-resonance-alignment `PLAN.md` whole; spw-metaphysical-language `PLAN.md:1–200`. Memory, read-only: the seven notes the brief names. Folio art I looked at: the mnemonic page, the land-tree page, and the prime "Operator years, valence lands".
- Captures, live spwashi.com, headless, 8 shots in `design/components/captures/spw-planes-2026-11-07/ground/`, no page exceptions: 01–03 the land pages at 390×844; 04 bone's Physics panel; 05 the Register's head; 06 the Register at 1366×900; 07 the library mnemonic; 08 the Register's lattice and legend at 390.
- Seen: the three land pages differ only in words, with the same three chips (`~cluster_register ~about_surface ~lore_surface`) under two empty rounded bars, and none links to factshift.center or spw.quest. In 06 the five legend pills are cut off at both ends ("e = reusable skele"), and the caption runs under the fifth.
- Seen in 05: the Register's lede (`about/index.html:1199`, "Boonhonk is five transforms on one beat") is absent. A probe found it computes `display:none` at default density, so a reader meets "Specificity is which voice is loud." first.

## 2. The ground as it stands

**Lands, site side.** boon `+1 arrival/benefit`, bane `-1 departure/cost`, bone `0 structure/carrier`, as "material worth … not decoration" (`domains.spw:44, 77–79`). The same line gives the other two members operators, not numbers: `(+1/−1/0/@/~)`. `boof.land` is still listed at :143, though it expired (factshift `wip.spw:81`). The composite `boonbanebone.com` is dormant (:165).

**Lands, engine side.** host-frame says the lands "are the same app as factshift.center … The frame is neutral. The hostname is the pull"; bone is the unset query (:102, :109). The app already gives each land a force profile (`config.ts:55–82`): boon is creation, charge −50, velocityDecay 0.3, sigil `*`; bane is entropy, −80, alphaDecay 0.01, `.`; bone is structure, −20, velocityDecay 0.6, `#`. All three are negative, which in d3 means all three repel; they differ in strength and damping, not sign. Before 07a8442 the app also held bonk (force, −200, `!`), honk (signal, −40, `*`) and boof (absorption, −10, `_`). The app's older workbench copy called each land "a physics flavor": boon the thermodynamics of advantage, bane friction and drag, bone structural mechanics, bonk collision, honk signal propagation. Its genre engine had five primitives and the composite `boonbanebone.com` (fffab721 `domains.spw:82, 166–171`). The current mount has neither.

**The pentad in canon** reads three ways that disagree:
- Material, not merit: "Each valence is a plane of reality" (`valence-architecture.spw:4`). Runtime quality has four states (boon, bane, bone, honk), with bonk "a catalytic overlay" (:30–35). The tag glosses agree: "material quality, not merit" (`.spw/caches/tree/vocabulary.spw:60`).
- Status: the catalog reads bane as "destructive hazard … error state" and boon as "completed deliverable" (`catalog.ts:44–50`), a merit reading.
- A slot called charge: a valence word may lead a line "as its charge" (`names.ts:63`, `read.ts:89`; tests use `chargeOf`). The bridge's law says "valence is charge-neutral quality; do not sum valence into operational charge" (`charge-valence-brace-bridge.spw:66–72`).

As file tags the pentad appears 460 times upstream: bone 229, bonk 70, boon 67, honk 63, bane 31. The site's own `.spw` tree carries none.

**Operators at runtime** (`interpreter.ts`): `#` resonates into a register (202–214); `@` observes (216); `&` merges (225); `=` sets (236); `%` measures (247); `.` reads a path (264); `?` returns its second argument when the first is true (272–283); `!` returns its first (285); `^` wraps its arguments as `{integrated}` (289); `~` returns `{deferred}` (293); `*` collapses and writes (297). A valence frame is stripped from the semantic frames and travels as metadata on register writes (:56–90). No case reads it. At runtime, valence colors a write; it does not act.

**The lifecycle note.** Every operator runs "primed → held → actualized → residue", and *let go* returns to ground (`OPERATORS.md:43`). Only the tie modes are built (:35).

**The creator's own hand.**
- Mnemonic folio: Plot → Boon, Texture → BANE., Characters → bone; "BANE" carries a closing period twice, and "bone" has bone-shaped, brace-like ends. Land-tree folio: three `.LAND` tags branch from a trunk lettered *Boon BANE bone com*.
- The prime "Operator years, valence lands": the five lands sit on one arrow toward a speech bubble, beside a ladder from 2024 POTENTIAL to 2036 INTEGRATION, with **2026 GROUND** and 2027 WONDER. Three braces group it (2024–27, 2028–31, 2032–36), and a `Spw.quest` card sits alongside.

## 3. Mappings tested

**Lands and surfaces**
- **M1. The lands are pulls inside the physics plane, not peers of the surfaces. Holds.** host-frame:101–109, the app's profiles and the old "physics flavor" line agree: the lands are settings of factshift.center.
- **M2. bone is spw.quest (the carrier that unites), with boon and bane as the two planes. Partly holds.** It matches the shape of the creator's sentence, bone.land:49 ("holds the space where boon and bane act") and spw.quest's place between the others in `site-cluster.spw` `^"loops"`. Nothing says which plane is +1. host-frame makes factshift.center the neutral frame, so bone is contested.
- **M3. The mnemonic: plot = boon = factshift.center ("narrative under transformation", domains.spw:80); characters = bone = spwashi.com (the person, cast and cards); texture = bane. Partly holds.** The third seat is forced: texture belongs to spw.quest's neighbour texture.website (domains.spw:144), not to spw.quest.
- **M4. Two unifiers for two triads. Holds as a reading.** spw.quest unites the surfaces (the creator's framing), and `boonbanebone.com`, the trunk in the land-tree folio, unites the lands. "Partly a reflection" is then the right strength; it is not an isomorphism.

**Lands and lifecycle stages**
- **boon → arrival (primed) and bone → hold. Both hold** (domains.spw:77; "ground state, skeleton, idle", valence-architecture:62; "persistence layer", bone.land:71).
- **bane → departure. Partly holds.** *Let go* returns to ground, which is bone's state. bane reads better as the cost a commit spends: the "commitment spent" of postfix residue (operator-semantics positional grammar).
- **Residue has no land of its own.** bone.land:71 claims it too ("what remains after … bonk … honk"), so bone carries two stages.
- **The finding.** The three held lands are rest states. bonk ("transition shader … the moment of shift", valence-architecture:68–74, 127) and honk (the "buzz" receipt on a hand-off, host-frame:96) are the two transitions, and they are the two lands that lapsed. A one-to-one match with four stages is forced.

**The pentad and the operators: forced as one-to-one.** Three tables disagree on every land, and canon keeps valence out of the operator table, as a word slot and as write metadata:
- Site (mixer `boonhonk-mixer.js:29–75`, land pages :45): boon `>`, bane `!`, bone `^`, bonk `@`, honk `~`.
- App (`config.ts`): boon `*`, bane `.`, bone `#`, and before its removal bonk `!`, honk `*`.
- The creator's lettering: boon cursive, `BANE.` with a stop, bone brace-ended. Single pairs with support follow.
- **honk ↔ `#`: partly holds.** `#` resonates at runtime (:209), and the Register's honk card is `honk[signal]{resonance}` (about:1365). The mixer's `~` only defers (:294), against honk's "declarative" (valence-architecture:80).
- **bone ↔ `.`: partly holds.** Canon calls bone "the ground state", and the public verbs give `.` "intrinsic structure, ledgers" (`operator-resonance-alignment/PLAN.md:35`). The lettering's brace ends point to `{ }` instead, which the ladder names STRUCTURE.
- **Valence colors an operator's field: holds** (operator-semantics.spw:92; interpreter.ts:84).

**The physics on the land pages**
- boon.land:65 says "Attractive force" with +1, and bane.land:65 "Repulsive force" with −1. A sign alone does not decide attraction, and in the engine all three repel. The barrier pair holds: nucleation (boon.land:66) against activation energy (bane.land:66).
- bone.land:65 says "it conducts". A conductor screens a field; what carries one without conducting is a dielectric (memory `user_background.md`). The lattice paragraph (:66) is sound.

## 4. Proposals

**(a) Workbench asks.** None of these is in `upstream-workbench-recommendations/` yet. They build on the bridge's gaps and OPERATORS.md S1.
- **A1. One reading of the pentad.** Rewrite `VALENCE_PARTICLES` (`catalog.ts:44–50`) as material quality, or name its status reading as a dialect. Probe: `rg -n -A6 VALENCE_PARTICLES .spw/_workbench/packages/spw-seed/src/canonical/catalog.ts`.
- **A2. A bridge gap G9: "the leading valence slot is named charge"** (`names.ts:63`, `read.ts:89`, `chargeOf`). Either rename the slot `valence`, or status-tag it under the bridge's own "status-tag every public use of charge" (:182).
- **A3. An order parameter for bonk.** `phase-and-transition.spw:149` says bonk has none. Candidate: the lifecycle stage. bonk names *held → actualized*, honk names the residue announced, and boon, bone and bane name rest states. Ask canon to accept or refuse this in `^["runtime_bridge"]`, beside the descriptor's lifecycle fields (OPERATORS.md:92, S1).
- **A4. "Plane" is a homonym.** valence-architecture:4 calls each valence a plane, and the creator now calls surfaces planes. Canon should say whether "plane" is a valence noun.
- **A5. A law for carried valence.** Valence rides every register write (interpreter.ts:84), and no case reads it. Ask for the law (it stays metadata, or `*` keeps it on its receipt), not a build.
- **A6. Keep fffab721's "physics flavor" sentence as theory without hostnames,** in valence-architecture or surface-archetypes. It was lost when domain identity was retired (domains.spw:21–22).

**(b) Repo side**
- **B1. `domains.spw`:** mark `boof.land` (:143) expired; say at :44 that `@` and `~` name bonk and honk, which have no land; state once, near :77, what the numbers are (a ledger sign, not a force).
- **B2. `boonhonk-mixer.js` is an unlisted sigil table.** Give it a "Workbench relation:" line and list it in `operator-namespace-alignment.spw` `^"workbench_relation"`, as :74 requires. Extension is the honest word: canon gives valence no sigil.
- **B3. Record the three land-sigil tables side by side in host-frame `^"lands"`, as a mapping, not a migration.** The boonhonk cache already says "Do not merge those tables in one patch" (:253). Also note at host-frame `^"physics"` (:109) that the app already holds numbers for all three lands, which the creator has not confirmed (do_not :121).

**(c) Public copy** (current, file:line → proposed)
- boon.land:49 / bane.land:49 "— the +1 force." / "— the −1 force." → drop the clause; the kicker already carries the sign.
- boon.land:65 "Attractive force. Boon pulls inward." → "A well, not a push. Things settle toward boon."
- bane.land:65 "Repulsive force. Bane pushes outward." → "A rise, not a push. Bane is the climb a change must make."
- bone.land:65 "— it conducts." → "It carries: forces pass through it, and it stays."
- boon.land:71 "discharged by bonk, transmitted by honk" → "set off by bonk, announced by honk". Discharge has three meanings in the bridge (G6).

## 5. Material metareality and value

**What it is.** One string, three readings, each live today. `bane[bone]{limit}` is a card on /about/ (about:1380). It is also a parser fixture upstream, since the five pair cards are test cases (`expression-charge.test.ts:82–96`). It opens as a canvas on factshift.center (`?mode=spw&spw=…`, `wip.spw:66`) and as one slot to change on spw.quest ("Change one slot and keep the rest", `about/domains/spw.quest:71`). `#spw64=` carries it between sites: a round trip of `bone[bonk]{hit}` through `spw.quest/src/build.js:128–134` came back byte for byte.

**For an academic reader** (applied learning science, adult education):
- **Three levels of reading.** The readings line up with the levels a reader builds from text: wording on a page, propositions as slots, a situation model laid out as relations. That is the construction-integration frame of the Learning from Text lineage Spw began in (2017). It is my reading, and W5 tests it. Notation beside diagram also lets a study ask which form a reader recalls.
- **The parting point can be counted.** `spw delta` counts edits between lines: `release[boon]{single.video}<summer>` against the same line with `bane` gave `lexOps=1` (scratch run). `spw:routes --diff` found bane.land and boon.land "part only at the name" (motions.spw:100–101). Two people write one concept, and the first slot where their lines part is the founding question, counted.
- **A scaffold for adults.** The lands are a three-word valuing scaffold (gain, cost, carrier) needing no prior vocabulary. The library already writes with it: plot, texture, characters.

**For a business reader** (product and A&R):
- **A brief as lines.** Each stakeholder writes the brief as one line. Pivots change one slot at a time, and the slot where the lines part is the meeting's agenda.
- **A review in three words.** What the release brings (boon), what it costs or refuses (bane), and what carries it after launch (bone). bane.land:85 already says it in product terms: "the constraint that makes the system trustworthy by making it finite."
- **A&R notes and shared structure.** Plot, texture and characters are a development checklist, and "which voice is loud" (about:1202) is a mix note. Lines and cards are a team's shared structure in plain files, and receipts land on the same closes, the 13th and 26th (host-frame:80).
- **No promise.** Work and money settle in a reply, never a checkout (host-frame:60). Anything about Dregg or prices is the creator's to word, and I flag it for confirmation.

**What a reader can do today:** read a card, open its line on spw.quest and change a slot, hold it on factshift.center, and carry it back by `#spw64=`.

## 6. Wonders

```spw
#>wonder_ground_land_sign
?["When a land says +1, is the number a ledger sign, a pull in the engine, or a depth in the ground?"]{
  ~#with: @host_frame_2026_09 @factshift_center_plan
  ~#expect: "Ledger. The pages already say benefit and cost; the engine gives all three lands a push of different size."
  ~#probe(run)
  !probe{ `rg -n "charge|velocityDecay|alphaDecay" workers/factshift-center/app/src/ts/domains/config.ts && rg -n "force|attract|repel" about/domains/b*.land/index.html` }
  $%[sign.ledger, sign.engine, sign.depth]
}
#>wonder_ground_valence_lines
?["Which routes carry a line that leads with a valence word, and does any land page write one?"]{
  ~#with: @metaphysical_language @compound_expressions
  ~#expect: "Under twenty, nearly all on /about/ and RPG Wednesday; none on the land pages, which talk about valence without writing it."
  ~#probe(run)
  !probe{ `rg -c 'data-spw-semantic-expression="(boon|bane|bone|bonk|honk)[\[.{]' --glob '*.html' .` }
  $%[lines.register, lines.rpg, lines.lands]
}
#>wonder_ground_canvas_valence
?["When factshift.center holds bane[bone]{limit}, does bane draw as a node, a region, or a pull?"]{
  ~#with: @factshift_center_plan @operators_note
  ~#expect: "A node with no pull; land profiles load by hostname, not from the line."
  ~#probe(read)
  !probe{ "open https://factshift.center/?mode=spw&spw=bane%5Bbone%5D%7Blimit%7D at 390 wide; say what bane became, then try boon[bane]{cost}" }
  $%[valence.node, valence.region, valence.pull]
}
#>wonder_ground_lifecycle_valence
?["Do boon, bone and bane name an operator's rest states, and bonk and honk its two transitions?"]{
  ~#with: @operators_note @valence_architecture
  ~#tension: "Let go returns to ground, and canon calls bone the ground state, so bane may not own departure."
  ~#expect: "Partly. bonk fits held to taken; bane reads as the cost a commit spends."
  ~#probe(read)
  !probe{ `rg -n "arrives as|closes into|Let go" .agents/plans/factshift-center/OPERATORS.md; rg -n "ground state|transition shader|signal shader" .spw/_workbench/docs/theory/spw/valence-architecture.spw` }
  $%[stage.boon, stage.bone, stage.bane, transition.bonk, transition.honk]
}
#>wonder_ground_three_readings
?["Does one line read as wording on spwashi.com, slots on spw.quest and a situation on factshift.center?"]{
  ~#with: @site_cluster @spw_quest_plan
  ~#expect: "Wording and slots, yes; the canvas shows relations, but a reader recalls places more than meanings until the operator's word sits by each node."
  ~#probe(read)
  !probe{ "take board[workshop]{mill.laminate.cure} from /about/domains/spw.quest/, open it on spw.quest/pivot and factshift.center; after a minute away, write what you recall from each" }
  $%[recall.wording, recall.slots, recall.relations]
}
#>wonder_ground_parting_slot
?["When two people's lines for one brief use different words, does the delta still name where they part?"]{
  ~#with: @inquiry_loop
  ~#expect: "No; with one word changed it counts one edit, and with different words it says only that much moved. A slot-level delta is an ask."
  ~#probe(run)
  !probe{ `d=$(mktemp -d); printf 'b = release[boon]{single.video}<summer>\n' >$d/a.spw; printf 'b = drop[boon]{clip.video}<summer>\n' >$d/b.spw; npm run -s spw -- delta $d/a.spw $d/b.spw | head -1` }
  $%[delta.names_slot, delta.counts_only]
}
```

Plans each wonder refreshes: land_sign → factshift-center and host-frame; valence_lines → spw-metaphysical-language (variety slice 2); canvas_valence → factshift-center OPERATORS.md; lifecycle_valence → operator-resonance-alignment and descriptor ask S1; three_readings → spw-quest and site-cluster; parting_slot → spw-inquiry-loop. `npm run plans:twinkle` should light each one when its wonder is answered. I ran every command probe once, for exit status only.

## 7. Questions handed back to the creator

1. **The sentence is yours.** Fill it, or leave it as a line: `planes[spwashi.com · factshift.center]{ ___ }<spw.quest>` and `lands[boon · bane · bone]{ ___ }<___>`. One sentence or two? "Partly a reflection" may be exactly right.
2. **What are the land numbers?** A ledger sign (benefit, cost, carrier), the engine's push and damping, or depth (well, rise, lattice)?
3. **Which unifier for the lands?** spw.quest, bone, or `boonbanebone.com`, the trunk in the land-tree folio, now dormant?
4. **Which sigil per land, if any?** The mixer's `> ! ^`, the app's `* . #`, the lettering (BANE with its stop, bone with brace ends), or none, since canon keeps valence a word? And bonk and honk without lands: do they stay as the two transitions (taken, announced)? The app keeps their actions without a domain; does that already say it?
5. **The Register's lede.** Should it show at default density, or should the legend pills carry first contact?
6. **The ladder.** Do its three braces (2024–27, 2028–31, 2032–36) have names? Is "2026 is GROUND" a reading you want a page to say, given that this note is the ground under the planes?
7. **A lettering voice.** Should the land pages take one from your lettering: boon in cursive, BANE with a stop, bone shaped like a bone? That is a feel decision, so it ends at a demo you approve in a browser.
