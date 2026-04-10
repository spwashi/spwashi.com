---
name: spw-feature-planning
description: Plan a feature before writing any code. Predict files, draft commits, write a PLAN.md and wip.spw in .agents/plans/<slug>/. Use when starting a new agent task, refactor, or audit response.
---

# Mounted Skill: spw-feature-planning

Canonical skill:
`.spw/_workbench/.agents/skills/spw-feature-planning/SKILL.md`

This repo mounts the workbench planning discipline instead of copying it.
Read the canonical skill first, then create site-local planning artifacts under
`.agents/plans/<slug>/` in this repository.

Mounted workflow references:
- `.spw/_workbench/.agents/workflows/worktree-task.md`
- `.spw/_workbench/.agents/plans/_schema/`

When the canonical skill references workbench npm tooling, translate through:
`npm --prefix .spw/_workbench run <script>`
