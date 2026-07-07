# Plan: literacy-precipitation-press

North-star lore and staged architecture for spwashi.com as a place where literacy precipitates into physical form: named abilities become tangible items, learning leaves printable residue on bulletin boards, the site becomes a publishing surface, and eventually - literally - a paper manufacturer for aesthetics tuned to learnability and genre preferences. (Spwashi direction, 2026-07-03.)

## The Lore (kept intact)

Learning about the web is play with tangible things. Navigational constructs are items you can hold; recognizing an ability you have gained is a **named esoteric effect**, described and conferred via spells, components, panels, popups, or overlays. The page's lore is that literacy *precipitates*: what a reader comes to understand condenses out of interaction into artifacts - first onto bulletin boards on the site, then into published pieces, then onto actual paper. spwashi.com's endgame identity includes being a press: a manufacturer of paper artifacts whose aesthetics are tuned to how people learn and what genres they love.

## The Precipitation Ladder

Each rung is a real deliverable; each inherits the one below:

1. **Named effects (digital, near-term):** casting, decomposing, completing arcs, and demonstrating abilities surface as named, described effects - the discovery-reward credit system already emits these on spell cast; extend to a legible effect ledger. Owner: `spellcraft-authoring/` + the achievement/collection substrate (`article-incentives` memory).
2. **Bulletin boards (digital surface):** a route family where precipitated artifacts pin publicly - seed cards, spell records, proof cards, reading residue. The board is the first "publishing surface": curation, not feed. Aligns with `webpage-trope-vocabulary/` (bulletin board is a literal website trope) and the RPG proof-card architecture.
3. **Print precipitation (digital-to-physical bridge):** `systems/print-precipitation.css` already names the concept - grow it into a real print pipeline: any board artifact renders to a print-faithful sheet (seed-card format, capture-mode legible, edition-stamped). Screenshot-interpretation (Midjourney/Grok) and print stylesheets are siblings: both are projections onto fixed media.
4. **Publishing surface (editorial):** curated collections of precipitated artifacts become publishable editions - the deploy-time edition machinery from `symphonic-loading-layered-editions/` gives each publication a version identity.
5. **Paper manufacturer (physical, long-term):** paper stocks, textures, and layouts tuned to learnability and genre preference - the material grammar (paper/bioplastic/machine art direction) made literal. Applied Learning Science is the tuning discipline: legibility, spacing, rhythm, and genre cues as manufactured parameters.

## Supporting Concepts (routed)

- **Pulsing** - vessel/effect heartbeat cues; owner `spellcraft-authoring/` microinteractions.
- **Local component state caching** - components remember their local state per the interaction-cache stratum; owner `runtime-bootstrap-performance/`.
- **Measurement arcs** - `runtime/observation-beats.js` beats extended into named arcs whose completion can itself precipitate an artifact ("you watched this settle; here is its trace").
- **Gentle state management** - opportunities to touch state that invite rather than demand; cauldron panel affordances are the pattern.
- **Tangible navigation** - spells as carryable items (the RPG item model); a route you have mastered is a thing in your bag.

## Physical Model Rule

Every rung strengthens the same physical metaphor: understanding condenses. Digital surfaces must therefore behave like materials (the existing material grammar), effects must have names and descriptions (RPG substrate), and artifacts must survive projection onto fixed media (print, screenshot, paper) without losing identity.

## Gates

The entire ladder above rung 1 is editorial/brand territory: board curation model, publication cadence, paper aesthetics are Spwashi's calls, staged as proposal + specimen per the standing review-gates principle. Rung 1 (effect ledger) and rung 3's print-stylesheet groundwork are agent-executable when scheduled.

## First Concrete Steps (when scheduled)

1. Effect ledger: collect discovery-reward emissions into an inspectable, replayable ledger surface.
2. One bulletin-board route specimen with three artifact types pinned (seed card, spell record, proof card).
3. Print-precipitation pass: one artifact type rendering print-faithful with edition stamp.

## Materialized Attention Extensions (Spwashi, 2026-07-03)

Spw's endgame is a **layer of materialized attention** - the notation itself becomes merchandise, music, and curriculum:

- **Souvenir boilerplates:** empty or placeholder `.spw` scripts sold as physical artifacts in souvenir shops - a blank spell is a gift the way a fine blank notebook is. Rung 5's paper manufacturing gains a product line: printed boilerplates whose emptiness is the point (open valences at retail). The bench/specimen discipline supplies the print masters.
- **Symphonic sigil animation:** braces and sigils translate into animation with **tone and resonance minded** - the operator geometry table (flow, charge roles, brace bias) becomes a scoring vocabulary. Coordinates with `symphonic-loading-layered-editions/` (movements) and the `data-spw-op` grammar (each operator x operand combination is a phrase that can sound). Audio is opt-in and capture-mode aware; reduced-motion implies reduced-sonance.
- **The math bridge:** Spw as a reason to learn the abstract math meaningful for acoustics and materials science - resonance, wave behavior, and material response are already the metaphor layer; make them the curriculum layer too, routed through `topics/math/` (field theory, complexity) with the Applied Learning Science lens. A visitor who plays with brace resonance should find a graded path to the real mathematics of why bells ring and materials sing.

Gates: product decisions (what sells in a shop), sonic palette, and curriculum sequencing are Spwashi's; the agent-executable groundwork is keeping operator geometry, resonance vocabulary, and specimen discipline coherent enough that sound, print, and curriculum can all read from the same contracts.
