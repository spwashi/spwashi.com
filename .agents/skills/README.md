# Mounted Agent Skills

Local skills for autonomous agents, pair programmers, and human editors working on `spwashi.com`. Each `SKILL.md` is an executable, bounded instruction set grounded by an adjacent measurement surface under [`.spw/skills/`](file:///Users/spwashi/air/spwashi.com/.spw/skills).

---

## The Spw Invocation Protocol

A skill invocation is an ordered operational sequence that measures before it acts and leaves an inspectable precipitate when it finishes:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         SPW INVOCATION LIFECYCLE                         │
├────────────────────────────────────┬─────────────────────────────────────┤
│ 1. SENSE (Pre-flight Measurement)  │ 2. OPERATION & FIXITY               │
│ • Read-only probe before acting    │ • cache | audit | align | prime     │
│ • Validates premise against ground │ • contract | archive                │
│   truth (e.g. `spw:integrity`)     │ • fixed | stable | tending | vol    │
├────────────────────────────────────┼─────────────────────────────────────┤
│ 3. SPELL / ACTION (Surgical Patch) │ 4. PROBE & PRECIPITATE              │
│ • Minimal honest surface patch     │ • Falsification check proving diff  │
│ • HTML → shared CSS → JS modules   │ • Crystallizes finding into .spw /  │
│ • Tunable parameters & posture     │   caches for future sessions        │
└────────────────────────────────────┴─────────────────────────────────────┘
```

### The Four Agent Disciplines in Spw Context

* ⚡ **Grok (Anti-Bloat & Signal):** Strip away ceremonial preambles. Enforce hard stop-conditions and minimum-edit boundaries.
* 🛡️ **Claude (Constitutional Rigor):** Enforce strict negative constraints, WCAG AA accessibility, semantic HTML, and reading-path calm.
* 📐 **Codex (Contract Exactness):** Verify CSS layer cascades, exact TypeScript-to-JS compilation paths, and deterministic validation outputs.
* 🌌 **Antigravity (Progressive Mastery):** Leverage mounted CLI tools (`spw:census`, `spw:lattice`, `css:payload`), subagents, and layered progressive enhancement.

---

## Skill Dispatch Index

| Skill | Default Operation | Primary Surface | Sense Instrument | Adjacent Surface |
| :--- | :--- | :--- | :--- | :--- |
| [`spw-craft-quality`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-craft-quality/SKILL.md) | `align` | CSS / HTML / JS | `npm run css:payload` | [`.spw/skills/craft-quality.spw`](file:///Users/spwashi/air/spwashi.com/.spw/skills/craft-quality.spw) |
| [`spw-ui-containment-audit`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-ui-containment-audit/SKILL.md) | `audit` | Layout / Components | `node scripts/normalize-breakpoints.mjs` | [`.spw/skills/ui-containment.spw`](file:///Users/spwashi/air/spwashi.com/.spw/skills/ui-containment.spw) |
| [`spw-semantics-rigor`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-semantics-rigor/SKILL.md) | `align` | Data attrs / .spw | `npm run spw:integrity && npm run spw:lattice` | [`.spw/skills/semantics-rigor.spw`](file:///Users/spwashi/air/spwashi.com/.spw/skills/semantics-rigor.spw) |
| [`spw-feature-planning`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-feature-planning/SKILL.md) | `prime` | `.agents/plans/` | `npm run reasons` | `.agents/plans/<slug>/PLAN.md` |
| [`spw-fix-planning`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-fix-planning/SKILL.md) | `audit` | `.agents/plans/` | Browser repro + route check | `.agents/plans/<slug>/FIX.md` |
| [`spw-interactive-medium`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-interactive-medium/SKILL.md) | `contract` | Play / Scenes / JS | `npm run check:runtime` | [`.spw/conventions/interaction-microstates.spw`](file:///Users/spwashi/air/spwashi.com/.spw/conventions/interaction-microstates.spw) |
| [`spw-typescript-affordances`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-typescript-affordances/SKILL.md) | `contract` | `scripts/ts/`, `public/ts/` | `npm run typecheck` | `tsconfig.*.json` |
| [`spw-plan-maintenance`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-plan-maintenance/SKILL.md) | `archive` | `.agents/plans/` | `npm run spw:plan:check --` | [`.spw/conventions/planning-ecology.spw`](file:///Users/spwashi/air/spwashi.com/.spw/conventions/planning-ecology.spw) |
| [`patch-consolidator`](file:///Users/spwashi/air/spwashi.com/.agents/skills/patch-consolidator/SKILL.md) | `align` | Git staging | `git status --short` | Git working tree |
| [`spw-css-dom-lab`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-css-dom-lab/SKILL.md) | `cache` | Route HTML / CSS | Route visual preview | `public/css/routes/` |
| [`image-optimize`](file:///Users/spwashi/air/spwashi.com/.agents/skills/image-optimize/SKILL.md) | `contract` | `public/images/` | `npm run images:manifest` | `public/images/` |
| [`image-naming-magic`](file:///Users/spwashi/air/spwashi.com/.agents/skills/image-naming-magic/SKILL.md) | `align` | Assets / Alt text | Visual inspection + HTML audit | `public/images/` |
| [`spw-ontology-workbench`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-ontology-workbench/SKILL.md) | `contract` | `.spw/` surfaces | `npm run spw:doctor && npm run spw:roots` | [`.spw/index.spw`](file:///Users/spwashi/air/spwashi.com/.spw/index.spw) |
| [`spw-operator-lattice`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-operator-lattice/SKILL.md) | `audit` | Operators / Chips | `npm run spw:lattice && npm run spw:analyze` | [`.spw/conventions/operator-site-projection.spw`](file:///Users/spwashi/air/spwashi.com/.spw/conventions/operator-site-projection.spw) |
| [`spw-privacy-engineering`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-privacy-engineering/SKILL.md) | `audit` | PWA / Storage | `npm run check:pwa` | [`.spw/conventions/site-semantics.spw`](file:///Users/spwashi/air/spwashi.com/.spw/conventions/site-semantics.spw) |
| [`spw-research-rigor`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-research-rigor/SKILL.md) | `cache` | Research notes | `npm run wonder && npm run wonder:measures` | `.agents/plans/model-guided-refinement/` |
| [`spw-math-algorithm-radar`](file:///Users/spwashi/air/spwashi.com/.agents/skills/spw-math-algorithm-radar/SKILL.md) | `prime` | Curriculum / Labs | Zero-JS static rendering test | `topics/software/` |

---

## Tunability & Runtime Postures

The site's runtime is fully tunable across multiple semantic registers via `public/js/kernel/site-settings.js`:

* **`enhancementLevel`** (`subtle` | `balanced` | `rich` | `theatrical`): Modulates motion amplitude, notice verbosity, and decorative field weight.
* **`authorMode`** (`reader` | `tender` | `cartographer` | `architect`): Changes disclosure depth and inspectable handles.
* **`baseMetamaterial`** (`glass` | `matte` | `paper` | `canvas`): Global physical rendering substrate (matte provides clear contrast safeguards).
* **`physicsReason`** (`string`): Modulates spring damping, attentional echoes, and gesture dynamics across interactive cards.

---

## Core Invariants

* 🚫 **No Runtime Frameworks:** Vanilla ES modules and hand-authored HTML only.
* 🚫 **CSS Layer Integrity:** `reset → tokens → shell → typography → grammar → components → systems → routes → handles → effects → ornament`.
* 🚫 **No Arbitrary Attributes:** Ground all attributes in existing semantic families or mark volatile.
* 🚫 **Archive What You Supersede:** Balance additions by archiving stale plans into `.agents/plans/archive/`.
