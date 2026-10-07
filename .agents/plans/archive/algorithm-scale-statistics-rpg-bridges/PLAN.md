## Goal

Add a small topic cluster for algorithm intuition, scale intuition, and statistical analysis, then connect those routes into RPG Wednesday surfaces where layout, compression, mnemonic play, and canon-building already matter.

## Public outcome

- Visitors can move from broad math/software routes into:
  - algorithm visualization as intuition-building
  - scale intuition for teams and systems that interact with social and societal ranges
  - statistical analysis as grounded interpretation rather than detached math theater
- RPG Wednesday gains clearer bridges to:
  - layout as compression
  - arcs as narrative summarization
  - worldbuilding as scale management
  - mnemonic play as a practical aid for recall and collaboration

## Likely files

- `topics/index.html`
- `topics/math/index.html`
- `topics/software/index.html`
- `play/rpg-wednesday/index.html`
- `play/rpg-wednesday/arcs/index.html`
- `play/rpg-wednesday/world/index.html`
- new route HTML:
  - `topics/software/algorithms/index.html`
  - `topics/math/scale-intuition/index.html`
  - `topics/math/statistical-analysis/index.html`

## Constraints

- Keep the new routes intuition-first and team-grounded.
- Avoid abstract “society at scale” language with no operational handle.
- Tie social and societal scale back to budgeting, aggregation, compression, layout, and recall.
- Preserve the already-dirty character-development broadening work.

## Validation

- `git diff --check`
- `npm run check`
- targeted `rg` for route links and anchors

## Out of scope

- new JS runtime for topic interactivity
- a full data-visualization framework
- deep `.spw` ontology expansion unless the route additions reveal a durable missing seam
