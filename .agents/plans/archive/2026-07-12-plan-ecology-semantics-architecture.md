# Plan Ecology Semantics Architecture — 2026-07-12

Maintenance sweep: strengthen plan `.spw` indexes for standalone reading, local research bridges, and virtual archival of landed work.

## Census

| Metric | Count |
|--------|------:|
| Active top-level plan folders | 183 |
| `PLAN.md` | 174 |
| `index.spw` | 187 |
| `FIX.md` | 13 |

## What changed

### Convention layer

- **`plan-index.spw`** — Added `conceptual_model`, `research_bridge`, `connection_points`, and `archive_status` templates; standalone readability rule.
- **`planning-ecology.spw`** — Updated census; `research_bridge_map` by bucket/rail; `archive_policy.research_pointer_rule`; wired 2026-07 audits and appendices.
- **`.spw/audits/plan-ecology-semantics-2026-07.spw`** — Audit artifact for this pass; registry in `audits/index.spw`.

### Maintain script

- **`scripts/maintain-plan-directory-indexes.mjs`** — New `completed_reference` virtual bucket; generates `conceptual_model`, `research_bridge`, `connection_points`, `archive_status` blocks on plan indexes; expanded `semantic_rails` classification.
- **`scripts/plan-refinements-data.mjs`** — Hand-authored `plan_refinement` (tone, accuracy, direction, inspiration, alignment) and improved `conceptual_model` for 24 rail/canonical/high-signal plans.

### Virtual archive (`completed_reference`)

These folders **stay in place** (direct citations preserved). They move out of `fix_queue` / high-signal active lists into `completed_reference` with `archive_status` in `index.spw`:

| Slug | Kind | Retain reason | Research pointer |
|------|------|---------------|------------------|
| `state-satchel-card-gesture-fixes` | plan | Cited by gesture/card tracks | `component-philosophy-harmony-2026-07` |
| `card-anatomy-interactions` | plan | Prior art for RPG portal work | `page-component-census-2026-07` |
| `overlay-layer-ownership` | fix | `data-spw-overlay` contract rationale | `css-module-attribute-impact-2026-07` |
| `menu-containment-navigation` | fix | Route/menu containment landed 2026-06-28 | `chrome-navigation-wonder` |
| `mobile-image-effects` | fix | Historical paths; ownership in metaphysical-paper | `image-metaphysics-aesthetic-pass` |
| `runtime-route-css-regressions` | fix | Regression history | `build-runtime-performance-2026-07` |

## Research bridge map (local only)

Plans route to repo-local research instead of re-deriving context:

- **Copy / vocabulary** → `vocabulary-metaphor-growth-synthesis-2026-07`, `internal-external-vocabulary-clusters-2026-07`
- **Spacing / material** → `page-spacing-runtime-synthesis-2026-07`, censuses
- **Nav / interaction / metaphor** → `metaphor-primitive-research-branching-2026-07`, `javascript-module-census-2026-07`
- **Discipline history** → `appendices/index.spw` (w500→w5 windows)
- **Agent / plan inflation** → `commit-skill-induction-2026-07`, `commit-history-deep-2026-07`
- **Module / runtime** → `module-export-standalone-2026-07`, `javascript-module-census-2026-07`

## Consolidation posture (unchanged)

- Prefer virtual buckets + `archive_status` before physical moves.
- Regenerate indexes: `node scripts/maintain-plan-directory-indexes.mjs`
- Record next sweep on `agent-optimization/PLAN.md` when meta-track shifts.

## Validation

```bash
node scripts/maintain-plan-directory-indexes.mjs
rg 'conceptual_model|research_bridge|completed_reference' .agents/plans/index.spw
git diff --check
npm run check:local
```