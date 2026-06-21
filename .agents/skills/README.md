# Mounted Skills

These skills are installed into this repository as local wrappers.

Each wrapper points to the canonical workbench skill under
`.spw/_workbench/.agents/skills/<skill>/`.

The goal is discoverability, not duplication:

- local `.agents/skills/*/SKILL.md` makes the skill visible from this repo
- mounted workbench files remain the source of truth
- commands should be translated through `.spw/_workbench` when the workbench
  expects its own scripts or package.json

## Core Skills for Site Work (Editor / Agent Surfaces)

For maintaining the planning ecology, semantics, and agent contracts on spwashi.com:

- `spw-plan-maintenance` — Sweep plans, refresh `.spw` bridges, archive superseded notes, and reduce plan-tree overgrowth through virtual buckets before ref-safe moves.
- `spw-ontology-workbench` — Model reusable concepts (routes, interactions, editor seams) in `.spw`.
- `spw-semantics-rigor` + `spw-craft-quality` — Ontology cleanup, structural polish, and inspectability passes.
- `spw-feature-planning` / `spw-fix-planning` — Create focused plans before cross-layer work.
- `spw-research-rigor` — Turn questions into reproducible notes.
- `spw-css-dom-lab` — Run small reversible daily-kernel-style experiments across HTML, CSS, and DOM behavior.

Current semantic rails:

- `model-guided-refinement/PLAN.md` + `.spw/conventions/model-guided-refinement.spw` for focus dimensions, fixity tiers, elemental effects, cross-language tracing, and creative marketing contracts.
- `daily-kernel-development/PLAN.md` + `.spw/conventions/daily-kernel.spw` for one-session cross-discipline kernels involving engineers, animators, illustrators, designers, musicians, artists, and collaborators.
- `.spw/conventions/semantic-capacity.spw` for `.spw` operations: cache, audit, align, prime, contract, archive.
- `spw-surface-normalization/PLAN.md` for navigable, dimensional `.spw` surfaces with higher diff value.

See `.agents/plans/agent-optimization/PLAN.md` for the current track improving these surfaces themselves (the primary home for ongoing skill, planning, and `.spw` dispatch improvements).
See `.agents/plans/agentic-dev-contracts/PLAN.md` for executable validation contracts and future agentic development caches (route/runtime manifest, plan census, skill index, validation posture memo).

Default validation for routine site work is `npm run check:local`; reserve `npm run check` / `npm run audit` for dependency-sensitive work because npm audit may hit the network.

Use `spw-plan-maintenance` after landing changes that affect multiple plans or the agent layer.
Use it before major feature implementation when the next patch depends on finding the right owner plan quickly.
