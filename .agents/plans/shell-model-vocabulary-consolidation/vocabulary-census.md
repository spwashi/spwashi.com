# Vocabulary Census - 2026-07-03

Phase 1 + 1b deliverable. Measurements are file counts (`rg -l`), not occurrence counts; generic-English inflation is flagged where a term is also an ordinary word. Ends at the Phase 2 gate: two glossary candidates and two attribute-grammar candidates for Spwashi to react to. Nothing is renamed in this pass.

## Structural Terms

| term | css files | js files | .spw files | reading |
|---|---|---|---|---|
| shell | 51 | 28 | 92 | healthy: names the strata dimension |
| chrome | 30 | 28 | 45 | umbrella word, contested below |
| floating-chrome | 10 | 9 | 12 | the floating subset of chrome |
| chrome-tier | 2 | 0 | 2 | young; the z-negotiation word |
| overlay | 24 | 12 | 65 | healthy: full-coverage modes; `data-spw-overlay` landed contract |
| edge | 38 | 30 | 171 | inflated (gradients, edge-cases); structural sense is thin |
| rail | 39 | 30 | 79 | strong: gutter-rail, region-rail, page-region-rail |
| island | 2 | 3 | 7 | topology word, barely realized |
| panel | 77 | 50 | 131 | topology workhorse (also inflated: generic panels) |
| vessel | 5 | 3 | 1 | topology word, barely realized |
| dock | 8 | 8 | 14 | a state (docked), not a place |
| pocket | 1 | 2 | 3 | one metaphor, one component (section-context) |
| section-context | 2 | 0 | 0 | the pocket's formal name |
| disclosure | 9 | 7 | 67 | behavior word, owned by navigation-header-disclosure |
| trace | 11 | 19 | 211 | inflated in .spw; header trace is the structural sense |
| mast | 1 | 0 | 32 | .spw-side word that barely reaches CSS |

**The two-dimension insight:** the vocabulary serves two different dimensions that should not be merged. **Strata** = page depth (shell, chrome/tier, overlay). **Topology** = how components sit in content flow (island, panel, vessel, rail - the interaction-contract words). Consolidation collapses synonyms *within* a dimension, never across. `edge` has no owned meaning in either dimension; `rail` already carries the boundary-clinging sense.

## Glossary Candidate A - "Stagecraft" (retire chrome)

Consistent with the 2026-07-03 chapter voice (proscenium, usher corps, exit music):

- **shell** - fixed strata: header, nav, footer, frame. (unchanged)
- **tier** - anything floating above content; numbered (`data-spw-tier="1..n"`); absorbs `floating-chrome` and `chrome-tier`.
- **overlay** - full-coverage modes. (unchanged)
- **rail** - boundary-clinging affordances; absorbs `edge` (structural sense), `pocket`/`section-context` becomes the mobile rail.
- Topology words (island, panel, vessel, rail-as-topology) stay owned by the interaction contract; `dock` survives only as a state (`data-spw-docked`).
- Cost: `chrome` appears in 30 css + 28 js files; the word also names the directory `shell/chrome/`. Biggest rename in either candidate.

## Glossary Candidate B - "Tightened Chrome" (keep chrome)

- **shell** - the strata dimension as a whole (layer name stays).
- **chrome** - the floating subset, always tiered: `floating-chrome` folds into plain `chrome` + `data-spw-chrome-tier`. Files keep their names.
- **overlay**, **rail** - as in A (edge/pocket retired the same way).
- Cost: much smaller (retire `floating-` prefix, `edge`, `pocket`); keeps browser-jargon "chrome," which reads as engineering vocabulary rather than site voice.

The fork is taste: A pays a large rename for one coherent theatrical voice; B pays almost nothing and accepts a two-register vocabulary (stage words in prose, chrome in code).

## Data Attribute Families (Phase 1b)

Totals: **1,049 distinct `data-spw-*` names, 374 families; 231 single-member (healthy tail), 143 multi-member; the top 10 families hold 195 names.**

| family | members | JS-written | shape | classification |
|---|---|---|---|---|
| page | 30 | 18 | identity axes + subcomponent roles | split: identity -> bundle; roles -> role-enum |
| cauldron | 26 | 19 | component roles + states | role-enum + state ladder |
| image | 23 | 21 | effect axes | axis bundle |
| sigil | 20 | 8 | `sigil-payload-*` is one object as five attributes | textbook axis bundle |
| state | 18 | 16 | `state-inspector-*` is element roles in one component | role-enum |
| region / discovery | 18 each | ~15 | mixed axes + notice roles | bundle + role-enum |
| accent | 8 | 8 | pure axes of one concept | textbook axis bundle |

Migration cost model: **JS-written families are cheap** (writer and reader change in the same patch; accent, image, state are 90-100% JS-written). **HTML-authored families are expensive** (`data-spw-page-*` is authored in ~106 route files). Consolidation should start where JS writes.

## Attribute Grammar Candidates (the language-design gate)

**G1 - Axis bundles (genome pattern):** fold a family's axes into one attribute with space-separated `axis:value` terms, following the landed `data-spw-component-genome` precedent.
Before: `data-spw-accent-palette="craft" data-spw-accent-strength="2" data-spw-accent-anchor="hero"` (8 names)
After: `data-spw-accent="palette:craft strength:2 anchor:hero"` (1 name; CSS reads via `[data-spw-accent~="palette:craft"]`)

**G2 - Role enums:** where members are element roles inside one component, one attribute whose value names the role.
Before: `data-spw-state-inspector-close`, `-copy`, `-reset-position`, ... (6+ names)
After: `data-spw-state-inspector="close|copy|reset-position"` on the respective elements (1 name; JS queries `[data-spw-state-inspector="close"]`)

G1 and G2 compose; most large families need one of each. Estimated ceiling if the top 10 families adopt them: roughly 195 names -> ~25, cutting the total vocabulary by ~16% before touching the long tail.

## What Spwashi Reviews (the gates)

1. Glossary A vs B (or a third instinct) - one word for the floating stratum, fate of `edge`/`pocket`.
2. The grammar: are `axis:value` tokens the right reading experience in DevTools and view-source? (The alternative - more attributes, simple values - is what grew to 1,049.)
3. Priority order for family migrations (recommendation: accent -> state-inspector -> image, all JS-written, before any HTML-authored family).
