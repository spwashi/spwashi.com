# neuroplasticity-topic

**Status 2026-10-28.** Planned, nothing built. The creator asked for a neuroplasticity topic tied to how Spw grew out of factshift, with a plan for its visuals and interactives. The factshift.com domain page now tells that origin (a better Wikipedia that turned toward learning) and gives Spw's reason in one line: a claim written with its place in it. This plan is the topic that follows from that. The page waits on the decisions below, and every claim waits on its source.

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
| Two learners, one claim | Two lines side by side, `studentA@ece.120~?[transistors work.how]` and `tutor@ece.120~[transistors work.how]`. Shared words resonate, and the canvas shows where their understandings stop sharing ground. | It shows shared words, not shared understanding. |

New mechanics this needs: a tie's pull that changes with co-activation and fades without it (per link), and a hold that loosens a placed node. Both belong in factshift-center first. The topic page links to the canvas with each line in `?spw=` and `?linkPull=`.

## Decisions for the creator

1. **Where it lives.** A new area on the shelf (`/topics/neuroplasticity/`), or under `andragogy/` (it concerns adult learning), `pedagogy/` or `biochemistry/`.
2. **Voice.** Plain, in the site's own imagery, written to someone in the middle of learning something. No degree framing.
3. **Which interactive comes first.** "Two learners, one claim" needs nothing new. "Fire together" needs the per-link tie.
4. **How deep the science goes.** A field guide with sources, or a short page that points to them.

## Slices

1. Check the sources above and write the four ideas in plain sentences, each with its source and its limit.
2. The page shell at the chosen route, readable without scripts, with figure homes.
3. "Two learners, one claim" as a link into factshift.center with the lines in the address.
4. The per-link tie in factshift-center, then "Fire together".
5. Figures, then at most one illustration.
