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

- `spw-plan-maintenance` — Sweep plans, refresh `.spw` bridges, archive superseded notes.
- `spw-ontology-workbench` — Model reusable concepts (routes, interactions, editor seams) in `.spw`.
- `spw-semantics-rigor` + `spw-craft-quality` — Ontology cleanup, structural polish, and inspectability passes.
- `spw-feature-planning` / `spw-fix-planning` — Create focused plans before cross-layer work.
- `spw-research-rigor` — Turn questions into reproducible notes.

See `.agents/plans/agent-optimization/PLAN.md` for the current track improving these surfaces themselves (the primary home for ongoing skill, planning, and `.spw` dispatch improvements).
See `.agents/plans/agentic-dev-contracts/PLAN.md` for the executable validation contracts (manifest + `npm run check`).

Use `spw-plan-maintenance` after landing changes that affect multiple plans or the agent layer.
