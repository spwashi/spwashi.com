---
name: spw-plan-maintenance
description: After a real multi-surface landing, archive and re-link plans/skills. Success is a smaller next census—not more index.spw files.
---

# Spw Plan Maintenance for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

This skill was written to keep the planning ecology navigable. It also generated
a lot of `index.spw` and dispatch wiring. Maintenance that does not **archive**
is just compost without a pile limit.

**Success:** the next sweep has fewer hidden WIPs, fewer empty indexes, clearer
owners. **Failure:** another mechanical generation pass with no closures.

## When to use

- A landing moved plans, skills, or `.spw` dispatch for real
- Links are broken after renames
- A census shows empty folders, WIP-only sludge, or oversized generated artifacts

## When not to use

- After every small commit
- To “complete” indexes for folders with no PLAN.md
- As a substitute for archiving landed work

## Workflow

1. Census first: PLAN / FIX-only / WIP-only / template / empty / huge.
2. **Archive or close** at least as much as you re-link (quota mindset).
3. Update dispatch only for durable concepts (`site.spw`, conventions index).
4. Touch public `/about/plans/` only when human navigation actually broke.
5. Prefer virtual IA (indexes, archive notes) over mass directory moves.
6. Record the sweep briefly on `agent-optimization/PLAN.md` if meta-track.

## Overgrowth (take seriously)

- No new empty `index.spw` without an owner plan.
- FIX.md-only folders are queues—keep them narrow and closable.
- Template-only folders are tooling—label them, do not treat as backlog.
- If you keep re-running the same census, propose a small cache under
  `.agents/state/` (see agentic-dev-contracts)—do not hand-regenerate forever.
- Promote only durable rules into `planning-ecology.spw`.

## Tooling (mounted `spw` CLI)

```bash
npm --prefix .spw/_workbench run spw:plan:status --                   # cache/status for active or named plan
npm --prefix .spw/_workbench run spw:plan:check --                    # detect cache drift and stale plan surfaces
npm --prefix .spw/_workbench run spw -- tree .agents/plans --depth 2  # census: PLAN/FIX/WIP/empty at a glance
```

`plan:check` catches drift the census would otherwise be done by eye — run it
before hand-sweeping `.agents/plans/`.

## Validation

- `plan:check` above, then `git diff --check`
- `rg` for moved slugs and dispatch entries
- Skills README still makes sense
- Nonstandard folder list shrank or was consciously documented

## Related

Commit-skill-induction audit: plan ecology inflation is a measured failure mode.
Archive is a first-class semantic-capacity operation.
