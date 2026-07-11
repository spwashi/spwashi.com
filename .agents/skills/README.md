# Mounted Skills

Local skills for agents and editors working on spwashi.com. Each `SKILL.md` is
the entry. Some include `references/` or scripts.

Workbench skills also live under `.spw/_workbench/.agents/skills/` when the
workbench is the source of truth. See `_shared/site-vs-workbench.md`.

These notes accumulated while the site was still figuring out what “agentic”
and “inspectable” should mean. Treat them as tools, not obligations.

## Core skills

| Skill | Reach for when |
|-------|----------------|
| `spw-interactive-medium` | Play/scene/practice beds—not ordinary editorial reading |
| `spw-semantics-rigor` | Naming drift, ontology mess, cross-layer attribute cleanup |
| `spw-feature-planning` | Truly multi-route or shared-layer work *before* coding |
| `spw-fix-planning` | Regressions that need a FIX note, not a novel |
| `spw-craft-quality` | Clarity, a11y, device parity, maintainability passes |
| `spw-css-dom-lab` | Small reversible experiments |
| `spw-ui-containment-audit` | Overflow, measure, touch targets, packing |
| `spw-plan-maintenance` | After a landing that actually moved plans/skills/dispatch |
| `spw-typescript-affordances` | Checks, contracts, kernel-adjacent types—not route rewrites |
| `patch-consolidator` | Mixed diffs that need reviewable commit shape |
| `image-optimize` / `image-naming-magic` | Promoting and naming public images |

Secondary: privacy, math radar, operator lattice, ontology workbench, research rigor—when that domain is the job.

## Rails (optional, not a checklist for every patch)

- model-guided-refinement, daily-kernel, experience slices
- semantic-capacity (cache / audit / align / prime / contract / **archive**)
- dimension-vocabulary, interaction-microstates

If the patch is one route’s copy, you probably do not need a rail.

## Agent environment (meta)

- `agent-optimization/PLAN.md` — skills, plans page, editor DX
- `agentic-dev-contracts/PLAN.md` — manifest + `npm run check*`
- Audits that record weight and hygiene:
  - `commit-skill-induction-2026-07` — when skill phrasing overgrew the tree
  - `agentic-development-2026-07` — HTML/CSS/TS/Spw feature matrix + hygiene roadmap
  - `build-runtime-performance-2026-07` — boot and build cost

## Restraint (prefer product calm over more system)

I used to resolve ambiguity by adding inspectability. That was only half right.

- Do not add `data-spw-*` without an existing family or a volatile/local label
- Do not add catalog `IMMEDIATE` for labs/metacognition without a cost note
- Do not create `PLAN.md` for single-file fixes (`FIX.md` or just ship)
- Do not generate empty plan `index.spw` without an owner plan
- Prefer `VISIBLE` / `IDLE` / `INTERACTION` over `IMMEDIATE` for non-core work
- Prefer one coordinate row over a new metaphor taxonomy
- Review CSS **sources**, not only `public/css/bundles/*`
- Run `npm run manifest` when route/catalog identity matters; do not trust stale caches

## Validation

- `npm run check:local` — ordinary patches (no network audit)
- `npm run check:runtime` — catalog / export / mount hygiene
- `npm run manifest` — refresh agent route/runtime cache
- `npm run check` — dependency-sensitive landings

`spw-plan-maintenance` is for real multi-surface landings—not a victory lap after every commit.
