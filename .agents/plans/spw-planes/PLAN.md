# Plan: spw-planes

**Status 2026-11-07.** Four agents read the Spw sites as planes and left inspectable work: a report each, phone and desktop stills, and probe scripts.
- **Ecology** read spwashi.com's components.
- **Physics** read factshift.center's field.
- **Quest** read spw.quest, the bench between them.
- **Ground** read the workbench's theory and the boon/bane/bone lands.

Two bugs the quest agent found are fixed and live on spw.quest (eade0c38; Wrangler version 75b5b8a2-0dfd-47bc-9c84-bc69f0431ab1). The guide's note boots, and a script carried back from factshift.center fills /build in place, never reaching the server. Their 21 wonders are in [wonders.spw](wonders.spw), where `npm run wonder` reads them; two are answered. The rest of this plan waits on the creator's answers to the questions below.

**Related:** [factshift-center OPERATORS.md](../factshift-center/OPERATORS.md) (the lifecycle note this pass tested) · [brace-semantics](../brace-semantics/PLAN.md) (§E door, §F) · [spw-quest](../spw-quest/PLAN.md) · [interaction-grammar](../interaction-grammar/PLAN.md) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) · [host-frame cache](../../../.spw/caches/host-frame-2026-09.spw).

The creator, 2026-11-07: "consider spwashi.com component ecological theory and factshift.center informatic physics as separate planes united by spw.quest … partially a reflection on the boon/bane/bone .land trichotomy … clarifying how the material metareality of these surfaces relates to business or academic value."

## The agents, to inspect or run again

| agent | asked | report | stills (gitignored) |
|---|---|---|---|
| ecology | Which niches do components hold, what do they eat, where do they compete, and is "ecology" more than a metaphor? | [ECOLOGY.md](ECOLOGY.md) | `design/components/captures/spw-planes-2026-11-07/ecology/` (10) |
| physics | What are the physics of a line, what is conserved, and does the lifecycle read in motion? Includes a throwaway prototype. | [PHYSICS.md](PHYSICS.md) | `…/physics/` (10 live, 6 prototype) |
| quest | How does spw.quest join the two planes? Test the round trip and read the public copy about Spw. | [QUEST.md](QUEST.md) | `…/quest/` (10) |
| ground | The workbench's theory, the three lands, and what the material is worth. | [GROUND.md](GROUND.md) | `…/ground/` (8) |

**The brief each one ran under:**
- Write only your report and gitignored stills. Read the workbench, never write it. Change no git state.
- Run headless Chrome through `scripts/lib/chrome-headless-harness.mjs` at 390×844 touch and 1366×900. Interact, capture before and after, and open each still before describing it.
- The report has seven sections: what I tried (receipts), the theory as it stands (file:line), where theory and surface disagree, proposals (theory, interactivity, copy, workbench asks), material and value, wonders in inquiry-loop form, and questions handed back.

Probe scripts and JSON receipts sit in the session scratchpad (`planes-*/`) and are not kept. To run a plane again, give an agent the same brief and the report it replaces.

## What the four found together

1. **The line is bone on every plane.** Each report found the same layer: what survives without the plane's own runtime.
   - **Physics:** `editLine` keeps every byte but the one place changed, a conservation law in the plain sense (a drag moved `~rain` between rooms whole).
   - **Quest:** a line on paper, held in an address.
   - **Ecology:** what reads with scripts off. On home that is 1,987 authored `data-spw-*` uses.
   - **Ground:** one string read three ways, as a card, as slots and as a field.

   Read as an accounting, each plane is bone plus boon plus bane:
   - **Ecology:** boon is what arrival grows (55,590 grown uses, 545 grown gesture contracts). Bane is what that growth costs: root recalc, 51% of a phone screen covered after one hold, and two answers to one touch.
   - **Physics:** boon is every pull (anchor, tie, center), bane every push (charge, collision, edge), and heat is the time either may act.

   This holds as an accounting on each plane. It does not hold as a map of lands onto sites. The lands live inside factshift.center's physics, as force profiles that all repel and differ in damping (GROUND M1). "Partly a reflection" is the right strength.
2. **The two lapsed lands were the transitions.** boon (arrival) and bone (hold) are rest states, and bane reads best as the cost a commit spends. bonk (held → taken) and honk (the receipt announced) are the lifecycle's two moves. They are the two lands that lapsed (GROUND §3).
3. **Readers disagree where the grammar should be shared.**
   - The dot is "one name" on /forms/ and two nodes on factshift.
   - `< >` is "what this is about" on the guide and "where it goes" on /forms/ and /pivot.
   - spwashi.com names three operators differently from spw.quest and factshift.center.
   - Three tables give each land a different sigil.
   - The workbench reads the pentad three ways: as material, as status, and as a slot named charge.

   Every report's first workbench ask is the same: one descriptor for operators, joins and valence (OPERATORS.md S1, grown).
4. **Answers the reader can't see, or two answers to one touch.** Each breaks the reward contract the way silence does:
   - one hold gets the cauldron and the region menu together;
   - lines carried to factshift land in a closed window;
   - operator motion is a two-second transient, so marks show only as offsets;
   - the Boonhonk Register's lede is hidden at default density.

   The contract should add: a touch resolves once, where it is seen (ECOLOGY a2).
5. **The look carries the stage, and motion marks the change.** In the physics prototype, motion told open from settled and showed the moment of decision. It did not tell answered from let go; the fill and one taut tie did. That fits OPERATORS.md ("the look follows the stage"), and the attention research PHYSICS.md cites. Lifecycle slices L1–L3 lean on the look and spend motion on transitions.

## What the material is worth

One expression is read three ways today: wording on a spwashi.com card, slots on spw.quest, relations on a factshift.center field. `#spw64=` carries it between them byte for byte.
- **For an academic reader:**
  - Where two readings part can be counted: one changed slot, every other byte kept.
  - A hold is a countable unit of attention. Home offers 523 things to hold, and a visit takes one or two.
  - /forms/ is a set of contrasting cases.
  - GROUND reads the three readings as levels of text comprehension (wording, propositions, situation model), the lineage Spw began in (2017). That is a reading to test (`wonder_ground_three_readings`), not a claim.
- **For a business reader:**
  - A brief is a line, and the slot where two stakeholders' lines part is the meeting's agenda.
  - A screenshot is both the receipt and the source.
  - The ecology probes make a short, repeatable audit for a client's site: which components claim one gesture, what covers reading text at rest, and how much arrival grows against what was authored.
- **Nothing here is a price or a promise.** The order card's wording and anything about Dregg stay the creator's.

## Ready without a taste call

Each is a verified bug, small, in a file no other session has dirty, or recorded until it is clean.
- **R1** factshift: read a node's mark from its bare word, so `<~rain>` keeps its dash and force (PHYSICS P3). `operator-tap.ts` is the other session's, uncommitted, so this waits for it.
- **R2** spwashi.com: the Boonhonk Register's lede shows at default density, and its legend pills fit at desktop (GROUND §1).
- **R3** spwashi.com: a chrome-over-ground probe beside `measureFloatingChromeOcclusion`, as a receipt only, with paint unchanged (ECOLOGY b3).
- **R4** `.spw/domains.spw`: boof.land marked expired. This plan's first commit carries it.

## Questions for the creator

1. **The sentence is yours.** `planes[spwashi.com · factshift.center]{ ___ }<spw.quest>` and `lands[boon · bane · bone]{ ___ }`.
2. Should bone, boon and bane be the accounting every slice in a plane names (what it keeps, grows, costs), or stay a reflection?
3. bonk and honk without lands: are they the lifecycle's two transitions?
4. What are the land numbers: a ledger sign, the engine's push, or a depth? The land pages call +1 "attractive", but in the engine all three repel.
5. Which word does spw.quest answer to: bench, path, or guide?
6. The dot: one node with a seam, or two bonded? And is `< >` "what this is about" or "where it goes"?
7. Should a held word go to the cauldron only, or to the cauldron and the region menu together?
8. Should a held question circle on the canvas, and where do untaken answers go?
9. Does a first visit owe the reader an install hint, or does that wait for a return?
10. Are "ecology" and "heat" public words, or working words that stay in `.spw`, as "soil" does for folios?

The reports hold the rest: 20 copy changes quoted with file:line, 16 workbench asks to record on this repo's side, and each agent's full question list.
