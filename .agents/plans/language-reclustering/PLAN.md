# Plan: language-reclustering

Recluster the codebase's language — 1,212 `data-spw-*` attributes, 140 events, ~10 metaphor families — into declared dimensional clusters so the lexicon grows like tended soil instead of sprawl. The census (`scripts/language-census.mjs` → `.spw/audits/language-census.spw`) is the soil test; this plan is the tending practice.

## Public Goal

A contributor (human or agent) who learns one cluster can predict the rest: suffix tells grammatical category, family tells dimension, altitude tells scope, temporal shape tells lifecycle. New vocabulary lands *inside* a cluster or deliberately founds one — never beside the system. The census baseline (2026-07: 18% full-trace coverage, 712 attributes unregistered in `.spw`) trends toward full trace without a big-bang rename.

## The Cluster Model

A cluster is a coordinate frame, not a folder: **family** (metaphor territory: electricity=interaction energy, weather=lifecycle time, music=pacing, alchemy=composition, pedagogy=progression, ecology=module relations) × **suffix category** (`-state`, `-phase`, `-mode`, `-kind`, `-posture`, `-tier`, per the census suffix taxonomy) × **altitude** (root/region/component) × **temporal shape** (state/arc/pulse/residue, per governance rhythm). Every attribute is a point in this space; reclustering means assigning coordinates, not moving files.

## Nutritious Architecture Over Time

Adopting the runtime-medium-ecology vocabulary: clusters are guilds, the census is the soil test, and conventions are the nutrient pathways. Practices that keep development nutritious rather than extractive:

- **Census as recurring measurement**: rerun `language-census.mjs` at review time; the full-trace percentage and unregistered count are the two health numbers. A patch that adds vocabulary without trace legs shows up as soil depletion in the diff of the generated audit.
- **Cluster registration before growth**: a new attribute family ships with its convention frame in the same patch (the trace rule enforced at the seam where it's cheapest).
- **Retirement as nutrition**: the census's `css_only` and `js_only` lists are compost candidates — each entry either gains its missing legs or is retired. Retirement is a first-class outcome, not a failure.
- **Dimensional budgets**: clusters declare how many values their ladders carry (packing has 3 tiers; climates have 5). A ladder that wants a 9th value is a signal to split the dimension, not stretch it.

## Event Grammar: Why Two Grammars Developed, and What To Do

The census confirms two grammars: `spw:noun-verb` broadcast (65) and `domain:verb` bus-local (75). They developed for real reasons — broadcast names need global uniqueness and grep-ability; module-local names want terse domain prefixes (`cauldron:gardened`, `key:potentiated`) that read as the module's own voice. The drift (three settings-changed spellings; `cauldron:updated` vs `spw:collection-updated`) comes from the *boundary* being undeclared, not from either grammar being wrong.

Consolidation direction — keep both, declare the boundary:

- `domain:verb` is the **bus-local dialect**: emitted and heard within a module's guild.
- `spw:domain-verb` is the **broadcast register**: anything a stranger module or CSS may depend on.
- The bus's existing legacy-dispatch mechanism formalizes promotion: a bus-local event that gains an external listener gets a declared `spw:` mirror, recorded in the emitting module's contract — never a second ad-hoc spelling.
- One canonical settings-changed event with aliased legacy names is the first consolidation patch (three spellings today; loading-ecology listens to all three defensively).
- The census's `events_emitted_never_heard` / `heard_never_emitted` lists are standing dead-air audits.

## Generativity: Diverse Features Within Reasonable Constraint

Clusters should inspire features, not just police them. The constraint that generates: a well-declared dimension invites filling (the packing ladder invited occupancy; charge phases invited the reward contract; arrival arcs invited locomotion). The likelihood of *diverse* features rises when families stay orthogonal — electricity never names speed, music never names memory — because orthogonal axes compose combinatorially (charge × tempo × climate already produce distinct legitimate surfaces). The likelihood of *constrained* features rises when the hyper-register rule holds: capabilities beyond a metaphor get explicit values rather than quietly bending the family. Extending ecologies (new guilds like the module-medium one) is welcome exactly when the new family claims an unoccupied dimension and registers its frame on arrival.

## Timing and Association With Other Plans

- **spw-metaphysical-language** owns arbitration when clusters disagree with operator canon; its drift ledger is the shared instrument. This plan feeds it runtime-word entries; it feeds back rulings.
- **homonym-renaming** (sibling, same patch window) executes the word-level moves this plan's clustering exposes; reclustering never renames, renaming never reclusters.
- **symphonic-loading-layered-editions** and **locomotion-collapse-redistribution** consume the settled cluster vocabulary (movement tokens, window names); schedule cluster declarations for timing/motion words *before* those plans' next implementation slices so they land on stable names.
- **agentic-dev-contracts** owns the census artifact's generated-file doctrine.
- **module-export-uniformity** guild map and this plan's clusters should share family names (one ecology, two lenses).

## Implementation Prime

Operation: `prime`. Fixity: `experimental` until the first cluster (recommend: the settle/arrival/window timing cluster, freshly contracted) is fully registered and the census shows it at 100% trace.

Safe first patch: (1) add a `clusters` facet to `data-spw-attribute-governance.spw` naming the families and their owned dimensions; (2) register the timing cluster's attributes; (3) rerun the census and commit the improved numbers as the baseline.

## Validation

- Census rerun shows monotonic full-trace improvement per touched cluster; no new unregistered attributes in reviewed patches.
- Settings-changed event consolidated to one canonical + aliases; defensive triple-listeners removed.
- New feature patches name their cluster in review; vocabulary landing outside any cluster is flagged.
