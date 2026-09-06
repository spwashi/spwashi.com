# Mounted Agent Skills

Local `SKILL.md` files are bounded instruction sets. Invocation, focuses, CSS layers, and tunability live in [`_shared/site-workflow.md`](./_shared/site-workflow.md) and `.spw/conventions/skill-invocation.spw`. Do not treat this README as a third `AGENTS.md`.

Each skill names a default operation. The invoker may override. Sense before acting. Archive what you supersede.

| Skill | Default Operation | Primary Surface | Sense Instrument | Adjacent Surface |
| :--- | :--- | :--- | :--- | :--- |
| [`spw-craft-quality`](./spw-craft-quality/SKILL.md) | `align` | CSS / HTML / JS | `npm run css:payload` | [`.spw/skills/craft-quality.spw`](../../.spw/skills/craft-quality.spw) |
| [`spw-ui-containment-audit`](./spw-ui-containment-audit/SKILL.md) | `audit` | Layout / Components | `node scripts/normalize-breakpoints.mjs` | [`.spw/skills/ui-containment.spw`](../../.spw/skills/ui-containment.spw) |
| [`spw-semantics-rigor`](./spw-semantics-rigor/SKILL.md) | `align` | Data attrs / .spw | `npm run spw:integrity && npm run spw:lattice` | [`.spw/skills/semantics-rigor.spw`](../../.spw/skills/semantics-rigor.spw) |
| copy collectibles | `audit` | `data-spw-copy-unit` / expression | `npm run audit:copy:accessor` | [`.spw/conventions/copy-accessor.spw`](../../.spw/conventions/copy-accessor.spw) |
| [`spw-feature-planning`](./spw-feature-planning/SKILL.md) | `prime` | `.agents/plans/` | `npm run reasons` | `.agents/plans/<slug>/PLAN.md` |
| [`spw-fix-planning`](./spw-fix-planning/SKILL.md) | `audit` | `.agents/plans/` | Browser repro + route check | `.agents/plans/<slug>/FIX.md` |
| [`spw-interactive-medium`](./spw-interactive-medium/SKILL.md) | `contract` | Play / Scenes / JS | `npm run check:runtime` | [`.spw/conventions/interaction-microstates.spw`](../../.spw/conventions/interaction-microstates.spw) |
| [`spw-typescript-affordances`](./spw-typescript-affordances/SKILL.md) | `contract` | `scripts/ts/`, `public/ts/` | `npm run typecheck` | `tsconfig.*.json` |
| [`spw-plan-maintenance`](./spw-plan-maintenance/SKILL.md) | `archive` | `.agents/plans/` | `npm run spw:plan:check --` | [`.spw/conventions/planning-ecology.spw`](../../.spw/conventions/planning-ecology.spw) |
| [`patch-consolidator`](./patch-consolidator/SKILL.md) | `align` | Git staging | `git status --short` | Git working tree |
| [`spw-css-dom-lab`](./spw-css-dom-lab/SKILL.md) | `cache` | Route HTML / CSS | Route visual preview | `public/css/routes/` |
| [`image-optimize`](./image-optimize/SKILL.md) | `contract` | `public/images/` | `npm run images:manifest` | `public/images/` |
| [`image-naming-magic`](./image-naming-magic/SKILL.md) | `align` | Assets / Alt text | Visual inspection + HTML audit | `public/images/` |
| [`spw-ontology-workbench`](./spw-ontology-workbench/SKILL.md) | `contract` | `.spw/` surfaces | `npm run spw:doctor && npm run spw:roots` | [`.spw/index.spw`](../../.spw/index.spw) |
| [`spw-operator-lattice`](./spw-operator-lattice/SKILL.md) | `audit` | Operators / Chips | `npm run spw:lattice && npm run spw:analyze` | [`.spw/conventions/operator-site-projection.spw`](../../.spw/conventions/operator-site-projection.spw) |
| [`spw-privacy-engineering`](./spw-privacy-engineering/SKILL.md) | `audit` | PWA / Storage | `npm run check:pwa` | [`.spw/conventions/site-semantics.spw`](../../.spw/conventions/site-semantics.spw) |
| [`spw-research-rigor`](./spw-research-rigor/SKILL.md) | `cache` | Research notes | `npm run wonder && npm run wonder:measures` | `.agents/plans/model-guided-refinement/` |
| [`spw-math-algorithm-radar`](./spw-math-algorithm-radar/SKILL.md) | `prime` | Curriculum / Labs | Zero-JS static rendering test | `topics/software/` |
