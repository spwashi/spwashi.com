# Conversation Audit Redistribution - 2026-06-19

Operation: consolidate and redistribute.

Source prompts:

- page and card layout audit
- html normalization audit
- deeper audit on all fronts
- css microinteraction state and html alignment audit
- Spw normalization audit
- `.spw` file audit
- broader architectural refinement audit
- active plan maintenance, archive completed, consolidation, updates

## Redistribution

- Page and card layout audit now belongs to `component-box-model-responsive-audit/PLAN.md` and `card-grid-density-audit/PLAN.md`.
- HTML normalization audit now belongs to `semantic-html-normalization/PLAN.md`.
- CSS microinteraction state and HTML alignment audit now belongs to `css-state-legibility/PLAN.md`, with related structural cleanup under `css-maintainability-refactor/PLAN.md`.
- Spw normalization and `.spw` file audits now belong to `spw-surface-normalization/PLAN.md` and `.spw/conventions/planning-ecology.spw`.
- Broader architectural refinement belongs to `site-source-layout/PLAN.md`, `runtime-module-fluency/PLAN.md`, and `css-maintainability-refactor/PLAN.md`.
- Floating chrome state tasks stay under `floating-chrome-stack/FIX.md` rather than becoming another generic chrome plan.

## Archive Decision

The source prompts are archived as a redistributed audit bundle rather than retained as separate plan tracks. Future work should edit the owner plans above or create a focused `FIX.md` only when a concrete regression has a narrow owner.

## Next Owner Rule

When a future request says "audit all fronts," pick at most one owner from each lane:

- HTML: `semantic-html-normalization`
- CSS/component: `component-box-model-responsive-audit` or `css-state-legibility`
- `.spw`: `spw-surface-normalization`
- Runtime/architecture: `runtime-module-fluency` or `site-source-layout`
- Agent/editor ecology: `agent-optimization`
