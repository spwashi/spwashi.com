# Mounted Skills

Site-local skills for spwashi.com agent and editor work. Each `SKILL.md` is the entry point; some skills include `references/` or `scripts/`.

Workbench-mounted skills also exist under `.spw/_workbench/.agents/skills/` — use those scripts when the workbench is the source of truth. See `_shared/site-vs-workbench.md`.

## Core Skills for Site Work

| Skill | Use when |
|-------|----------|
| `spw-interactive-medium` | Entertainment/scene beds, device-aware tokens, keyboard scenes, topical/LM handoff |
| `spw-semantics-rigor` | Ontology, naming, dimension vocabulary, cross-layer attribute alignment |
| `spw-feature-planning` | Plan before cross-route or cross-layer features |
| `spw-fix-planning` | Plan before fixing test/build/UI regressions |
| `spw-craft-quality` | Clarity, maintainability, device parity, runtime/CSS polish |
| `spw-css-dom-lab` | Small reversible interaction/layout experiments |
| `spw-ui-containment-audit` | Overflow, measure, container queries, touch targets |
| `spw-plan-maintenance` | Sweep plans, `.spw` dispatch, skills index after significant landings |
| `patch-consolidator` | Group messy working-tree diffs into reviewable commits |
| `image-optimize` / `image-naming-magic` | Promote and name site images |

## Semantic rails (plans + conventions)

- `model-guided-refinement/` + `.spw/conventions/model-guided-refinement.spw`
- `daily-kernel-development/` + `.spw/conventions/daily-kernel.spw`
- `modular-experience-slices/` + `.spw/slices/` — practice beds, tending notes, slice ownership
- `spw-surface-normalization/` — navigable `.spw` surfaces
- `.spw/conventions/semantic-capacity.spw` — cache, audit, align, prime, contract, archive
- `.spw/conventions/dimension-vocabulary.spw` — spatial/temporal/semantic/attention/interactive_medium
- `.spw/conventions/interaction-microstates.spw` — gestures, phases, scene/key-event contracts

## Agent optimization track

- `.agents/plans/agent-optimization/PLAN.md` — skills, planning ecology, public `/about/plans/`
- `.agents/plans/agentic-dev-contracts/PLAN.md` — validation caches, route/runtime manifests

## Validation defaults

- `npm run check:local` — ordinary patches (no network audit)
- `npm run check:runtime` — module catalog / runtime contract changes
- `npm run check` — dependency-sensitive or pre-land sweeps

Use `spw-plan-maintenance` after landing changes that affect multiple plans, conventions, or skills.