# Triage: CSS Architecture + Spw Physics Ubiquity - 2026-07-02

Ranked execution slate for three directive clauses: improve CSS architecture, improve codebase architecture based on plans, extend Spw physics-model integration toward ubiquity. Builds on the 2026-06-30 maintenance sweep rather than re-running its census; the README index was verified fresh against all five commits since that sweep (a9794fb through eb95fdd).

## Findings that change plan status

- `public/css/style.css` is now a 43-line layer-order root delegating to 149 modular files under `public/css/`. This is the end state `spw-css-architecture/PLAN.md` describes ("smaller, clearer root stylesheet that delegates to focused modules"), and substantially what `css-semantic-modules/PLAN.md` targets. Both are verify-then-close candidates: confirm remaining unchecked items, add a dated status block, and stop treating them as active architecture work.
- The entire physics cluster is stale relative to the codebase. Newest physics plan activity is 2026-05-26 (`brace-cauldron-primed-collection`); most are 2026-04-10 through 2026-04-21. Roughly six weeks of runtime, floating-chrome, and interactive-medium work has landed since. Every physics plan needs a freshness pass against current sources before execution.
- `gesture-inspectability-metaphysics/PLAN.md` self-describes as the integrated physics plan written after "runtime-heavy development with limited browser verification." That verification debt has only grown. It is the correct umbrella for the ubiquity directive.

## Clause 1 - CSS architecture: ranked slate

1. `css-maintainability-refactor/` (touched 2026-06-29, live) - highest-leverage shared contracts; reduce reliance on inferred DOM shape and over-broad semantic selectors.
2. `css-state-legibility/` (touched 2026-06-29, live) - stable ownership boundaries over route-local cascade accidents. Natural pair with #1 in one session.
- Rubric, not task list: `css-architecture-readability/PLAN.md` stays the canonical standards document (naming, debug labels, literate clusters) governing how 1-2 are executed.
- Verify-then-close: `spw-css-architecture/`, `css-semantic-modules/` (see findings above).

## Clause 2 - codebase architecture: ranked slate

1. `js-runtime-composability/` (2026-06-29) - concrete, bounded: extract the page-state/attention lifecycle from `public/js/site.js` into a runtime module.
2. `runtime-bootstrap-performance/` (2026-06-28) - README high-signal; serial import and observer cost work.
3. `js-surface-ecology/` (2026-06-23) - the legibility map of `public/js`; cheap and de-risks 1-2 if run first or alongside.
- Owner decision required, do not fold into a broad directive: `site-source-layout/` (repo reshape to an explicit `site/` boundary) - large blast radius, touches every path assumption.
- Reconcile before executing either: `typescript-integration/` and `curricularize-codebase-typescript/` overlap heavily; pick one owner or merge.

## Clause 3 - Spw physics ubiquity: ranked slate

1. `gesture-inspectability-metaphysics/` (2026-05-22) - umbrella. First action is a freshness pass plus browser verification of the existing physics surfaces, not new extension.
2. `state-block-projections/` (2026-04-13) - the literal ubiquity plan: interactive Spw state blocks on components that already own mutable state. Best concrete extension vector once #1 confirms the substrate.
3. `shell-semantic-physics/` (2026-04-21) - extends physics into header trace and menu chrome; coordinate with the fresh `floating-chrome-stack/` work, which has moved since this plan was written.
- Gate on vocabulary: `interaction-grammar/` (2026-04-13) questions whether boon/bane physics vocabulary is cognitively accessible. Decide this before mass extension - propagating vocabulary that is about to change multiplies rework.
- Supporting/lore, not execution targets: `operator-semantics-refinement/`, `brace-cauldron-primed-collection/`, `spw-operator-pages/`.

## Suggested session order

1. CSS pair: `css-maintainability-refactor` + `css-state-legibility` under the `css-architecture-readability` rubric; close out `spw-css-architecture` and `css-semantic-modules` with dated status blocks in the same pass.
2. Physics umbrella: freshness pass + browser verification via `gesture-inspectability-metaphysics`.
3. Ubiquity extension: `state-block-projections` (or `shell-semantic-physics` if chrome coordination is preferred first).
4. Runtime: `js-runtime-composability`, then `runtime-bootstrap-performance`.
5. Owner decisions pending: `site-source-layout` yes/no; `interaction-grammar` vocabulary direction; TypeScript plan reconciliation.

No plan folders were moved and no PLAN.md files were edited in this triage; status-block updates belong to the executing sessions above.
