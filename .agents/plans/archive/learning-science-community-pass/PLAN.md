# Learning Science Community Pass

## Public Goal

Improve core site copy and route markup so the site serves Spwashi's community more directly across three needs:

- education: help people enter difficult material with clearer scaffolds
- stabilization: help people find smaller next steps, safer boundaries, and better re-entry
- play: protect experimentation, wonder, and artifact-making as real learning modes

## Quality Axis

Clarity and interaction learnability, informed by Learning Science:

- signaling: highlight what matters now
- segmenting: break large routes into smaller, self-paced moves
- worked examples: show how to begin before asking for synthesis
- retrieval and transfer: encourage people to reuse patterns across routes
- self-explanation: invite the visitor to name their current need and next move

## Likely Files

- `index.html`
- `about/index.html`
- `topics/index.html`
- `topics/pedagogy/index.html`
- `care/index.html`
- `play/index.html`

## Semantic Seams

- strengthen route-entry and re-entry copy without changing shell structure
- use existing `site-frame`, `frame-grid`, `frame-panel`, and returner patterns
- add route-local feature framing only where the cluster is coherent and worth naming

## Out Of Scope

- sitewide CSS refactors
- new runtime behavior
- deep rewrites of secondary topic routes
- changes to `.spw/_workbench`

## Validation

- `git diff --check`
- targeted markup sanity checks with `rg`
- balanced structure review on edited routes
