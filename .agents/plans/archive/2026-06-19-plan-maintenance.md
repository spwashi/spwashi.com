# Plan Maintenance Sweep - 2026-06-19

Operation: archive, consolidate, update.

Scope:

- `.agents/plans/` active and archived planning surfaces
- `.agents/plans/README.md`
- `.agents/plans/archive/README.md`
- `.agents/plans/agent-optimization/PLAN.md`
- `.spw/conventions/planning-ecology.spw`

Inventory note:

- The sweep found a large active ecology of `PLAN.md` and `FIX.md` files rather than a small four-track plan set.
- The index should classify plans by role before physically moving anything.
- Completed-reference plans should remain addressable until all direct references are updated.

## Archive Decisions

These are archived by index note, not by physical directory move:

- `state-satchel-card-gesture-fixes/PLAN.md` - Implementation and validation are recorded as complete. Keep the file in place as a completed reference until a future ref-safe archival pass rewrites any direct links.
- `card-anatomy-interactions/PLAN.md` - Planning and audit work is complete, and later RPG portal work cites it as prior art. Keep it in place as a historical predecessor/reference.

These are stabilized foundations, not archive moves:

- `dev-hot-reload/PLAN.md` - Vite primary dev flow and legacy fallback are established, but the file remains a useful operational decision record.

## Active Consolidation Buckets

Use these buckets when selecting the next plan owner:

- Canonical tracks: `css-architecture-readability`, `color-motion`, `midjourney-design-concepts`, `reference-assignment-template`.
- Semantic rails: `model-guided-refinement`, `daily-kernel-development`, `spw-surface-normalization`, `modular-experience-slices`, `relational-attention-media`, `agent-optimization`.
- Runtime and architecture: `runtime-bootstrap-performance`, `runtime-load-instrumentation`, `runtime-module-fluency`, `js-surface-ecology`, `js-taxonomy-cleanup`, `site-source-layout`, `typescript-integration`, `floating-chrome-stack`.
- CSS, layout, and interaction: `css-maintainability-refactor`, `component-box-model-responsive-audit`, `vertical-rhythm-container-audit`, `card-grid-density-audit`, `card-anatomy-interactions`, `state-satchel-card-gesture-fixes`.
- Public/editor projections: `/about/plans/`, `.spw/site.spw`, `.spw/conventions/planning-ecology.spw`, generated design catalog.

## Follow-Up

- Do a ref-safe physical archive pass only when references can be updated in the same patch.
- Refresh `/about/plans/` from the new taxonomy in a separate public-surface pass; this sweep updates source planning surfaces first.
- Keep new cross-layer or agent-operating concepts wired through `.spw/conventions/planning-ecology.spw`.
