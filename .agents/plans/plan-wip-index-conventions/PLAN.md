# Plan: plan-wip-index-conventions

Normalize plan-directory navigation and wip-notebook hygiene across `.agents/plans/` after the wip.spw / index.spw convention evaluation.

## Public Goal

Every plan folder should expose a small `index.spw` dispatch surface, and every `wip.spw` should declare operation, fixity, and plan linkage without pretending to be cold convention. Agents and returning humans can enter a plan folder and know what to read first.

## Scope

- In scope: `.spw/conventions/wip-notebook.spw`, `.spw/conventions/plan-index.spw`, `.agents/plans/index.spw`, `.spw/surfaces/index.spw`, `scripts/maintain-plan-directory-indexes.mjs`, plan-specific `index.spw` / `wip.spw` / named `.spw` with Spw features (dimensions, owner_claim, editor_prompts, selection_probes, operational_hooks, virtual buckets), dispatch wiring in `planning-ecology.spw` and `conventions/index.spw`.
- Out of scope: bulk rewriting legacy wip body content, physical plan-folder moves, generated `.agents/state/plans-index.json` (follow-up for `agentic-dev-contracts/`).

## Validation

- `node scripts/maintain-plan-directory-indexes.mjs --check`
- `git diff --check`
- `npm run check:local` when only plan/.spw/script files change

## Worktree

- Branch: `feature/plan-wip-index-conventions`
- Worktree: `../wt-plan-wip-index-conventions`