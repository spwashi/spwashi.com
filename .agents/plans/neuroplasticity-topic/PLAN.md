# neuroplasticity-topic

**Status 2026-11-06.** Still planned and unbuilt; nothing has landed since `5d7091f0`. Correction: "Two learners, one claim" needs the canvas to take two lines first. The creator asked for a neuroplasticity topic tied to how Spw grew out of factshift, with a plan for its visuals and interactives. The factshift.com domain page has told that origin since `5f758428` (a better Wikipedia that turned toward learning) and gives Spw's reason in one line: a claim written with its place in it. This plan is the topic that follows from that. The page waits on the decisions below, and every claim waits on its source.

**Guard.** No clinical or diagnostic framing goes public: no conditions named, no therapy or treatment claims, no promise to rewire a reader. The constrained-character onboarding (2026-11-10) is play and a professional brief. It is not a clinical intake, and this topic does not own it.

**Related:** [factshift-center](../factshift-center/PLAN.md) (the canvas the interactives run on) · [topic-building-blocks](../topic-building-blocks/PLAN.md) (owns the topics shelf, its hubs and figure homes) · [semantic-copy-depth](../semantic-copy-depth/PLAN.md) (owns the sentences once they are written).

## Why this topic, and why here

factshift.com set out to improve on Wikipedia, and the first thing it taught was that improving on it would take knowing how people learn. Spw is what grew from that: a way to write information from more than one perspective, so a claim can carry who holds it, from where, and what is still open (`ecestudent@ece.120~?[transistors work.how]`).

Neuroplasticity is the ground under that. Understanding changes because the brain's connections change with use. A topic that explains plasticity plainly, and lets a reader feel it in a model they can push, is the factshift question asked of the learner instead of the encyclopedia.

## Public goal

A reader leaves knowing four things, each with one picture and one thing to try:

1. Connections that are used together strengthen together.
2. Unused connections weaken and are pruned.
3. Change is easiest in warm windows (early sensitive periods, and attention and novelty later), and never fully closes.
4. Recalling a memory can reopen it to change.

The page states what is known, what is contested, and where each model on the page stops being like a brain.

## Claims to check before anything is published

Each line is a candidate, not a citation. Read the source before any sentence leans on it.

| claim | source to check |
| --- | --- |
| repeated co-activation strengthens a connection | Hebb, *The Organization of Behavior* (1949); "fire together, wire together" is Carla Shatz's later summary (Scientific American, 1992) |
| long-term potentiation | Bliss and Lømo, J. Physiology (1973) |
| synaptic density peaks early and is pruned | Huttenlocher, Brain Research (1979) |
| sensitive periods | Hubel and Wiesel, J. Physiology (1970), monocular deprivation |
| adult brains change with practice | Maguire et al., PNAS (2000), London taxi drivers; Draganski et al., Nature (2004), juggling |
| myelin changes with activity | Fields, Trends in Neurosciences (2008); Nature Reviews Neuroscience (2015) |
| recall can reopen a memory | Nader, Schafe and LeDoux, Nature (2000), reconsolidation |
| spacing and retrieval help learning last | Cepeda et al., Psychological Bulletin (2006); Roediger and Karpicke, Psychological Science (2006) |
| adult human neurogenesis | contested: Sorrells et al., Nature (2018) against Boldrini et al., Cell Stem Cell (2018); present as open |

## Visuals

- One hand-authored SVG per idea: a connection thickening with use, a branch thinning and falling away, a warm window closing to a narrow one, a remembered shape opening and resettling. Each lives in the topic's figure home ([topic-building-blocks](../topic-building-blocks/PLAN.md)).
- At most one illustration, through the Midjourney intake (one promoted image with its sidecar). It has to belong to the page, not decorate it.
- Every figure readable with scripts off. Motion is a choice the reader makes, never on by default.

## Interactives, on factshift.center's canvas

Each runs on something the canvas already does, and says where the comparison stops.

| interactive | on the canvas | where it stops |
| --- | --- | --- |
| Fire together | Tap two nodes together, again and again, and the tie between them pulls tighter (the feel card's ties, per link). Leave a tie unused and it slackens, then goes. | Links are not synapses. The strengthening rule is a cartoon of Hebb, not a model of LTP. |
| Warm windows | Heat (the simulation's alpha) decides how much can move. Start warm and watch structure set as it cools, then warm it again with attention (a tap) and see what can still change. | Heat is one number. Real windows differ by system and never fully close. |
| Recall reopens | A placed node, held, loosens for a moment and can be moved before it settles again. | Reconsolidation is narrower and still debated. This shows the idea, not the evidence. |
| Two learners, one claim | Two lines side by side, `studentA@ece.120~?[transistors work.how]` and `tutor@ece.120~[transistors work.how]`. Shared words resonate, and the canvas shows where their understandings stop sharing ground, the question Spw keeps asking (`topics/software/spw/index.html#spw-goals-lede`). | It shows shared words, not shared understanding. |

New mechanics this needs, each in factshift-center first:

- **Two lines.** `?spw=` holds one line (`holdSpwLineFromAddress` in the app's `src/js/init/root.ts`), and a mark between two lines groups to the left (`compoundOf` in `line-anatomy.ts`), so the pair needs a second line in the address.
- **A tie that learns:** a per-link pull that grows with co-activation and fades without it. Today `linkPull` sets one pull for every link.
- **A hold that loosens** a placed node for a moment.

The topic page links to the canvas with each line in `?spw=` and `?linkPull=`.

Proposal: Fire together shows its state in the held line. Two parts tapped together often enough turn from `{a, b}` (held apart) to `{a.b}` (one name), the turn spw.quest's `/pivot` calls "hold it as one name". Where it stops: that is a reader's grouping, closer to chunking than to a synapse.

## Decisions for the creator

1. **Where it lives.** A new area on the shelf (`/topics/neuroplasticity/`), or under `andragogy/` (it concerns adult learning), `pedagogy/` or `biochemistry/`.
2. **Voice.** Plain, in the site's own imagery, written to someone in the middle of learning something. No degree framing.
3. **Which interactive comes first.** "Two learners, one claim" needs only the address to carry two lines. "Fire together" needs the per-link tie.
4. **How deep the science goes.** A field guide with sources, or a short page that points to them.

## Slices

1. **Read the sources** in the claims table; draft the four ideas in plain sentences, each with its source and limit, in this folder. Ungated; nothing goes public.
2. **The page shell** at the home `wonder_neuroplasticity_home` settles, readable without scripts, in topic-building-blocks' stub shape. Gate: the creator's choice. Verify: `node --test scripts/tests/topic-wiring.test.mjs`.
3. **Two lines** in factshift-center's app, then the "Two learners" link.
4. **The per-link tie** in factshift-center, then "Fire together"; its feel is the creator's in the browser.
5. **Figures**, then at most one illustration.
