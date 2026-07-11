---
name: spw-feature-planning
description: Plan multi-route or shared-layer work before coding. Skip for single-route copy and one-file fixes.
---

# Spw Feature Planning for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

Plans were created because large work kept scattering. The ecology then grew
faster than the features. A plan is a map for **ambiguous multi-surface work**,
not a ritual for every idea.

## When to use

- Multiple routes or a shared CSS/JS layer
- Public pages **and** durable `.spw` contracts in the same effort
- User asks for architecture before implementation
- Entertainment/scene systems that touch catalog + tokens + HTML together

## When not to use

- Single-file or single-route copy/layout
- A known regression with a clear owner file → `spw-fix-planning` or just fix
- “Document the idea” with no implementation soon → short insight cache, not PLAN.md

## Workflow

1. State the **public** outcome in one sentence (reader/player/client).
2. State **non-goals** and metaphors **not** to invent.
3. Only then pick a rail if needed:
   - model-guided — focus dimension + fixity
   - daily-kernel — one short cross-discipline session
   - experience slice — durable multi-layer ownership
4. List the **minimal** files (HTML / CSS layer / JS module / optional `.spw`).
5. Catalog posture if JS behavior: layer + **mount when** (default non-immediate) + features gate.
6. Write `.agents/plans/<slug>/PLAN.md` with validation and out-of-scope.
7. Add `wip.spw` only if inspection helps mid-flight—not by default.

## Runtime checklist (behavior features)

- [ ] `MODULE_LAYERS` + `MOUNT_WHEN` (prefer visible/idle/interaction)
- [ ] `features:` aligned with CSS `BEHAVIOR_SCOPES` if optional
- [ ] No duplicate viewport detection (use shell / interactive-medium)
- [ ] Cleanup on unmount
- [ ] Reduced-motion / coarse pointer considered when interaction is the point

## Plan checklist

- public goal
- files likely to change
- non-goals
- seams (semantic / runtime / CSS layer)
- validation (`check:local`, `check:runtime`, smoke)
- out of scope


Agent-environment-only work → `agent-optimization/`. Do not open a feature plan
for every skill or index tweak.
