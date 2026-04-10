---
name: spw-fix-planning
description: Plan a fix for failing tests or UI regressions before writing any code. Triage failures, classify root causes, predict ripple, draft fix commits, and write a FIX.md in .agents/plans/<slug>/. Use when responding to test failures, build regressions, or UI bug reports.
---

# Mounted Skill: spw-fix-planning

Canonical skill:
`.spw/_workbench/.agents/skills/spw-fix-planning/SKILL.md`

Use the mounted workbench skill as the planning canon. In this repo, direct the
resulting fix plan into local `.agents/plans/<slug>/` artifacts and interpret
verification steps relative to the site repo or the mounted workbench as needed.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `node --import tsx scripts/...` -> `node --import tsx .spw/_workbench/scripts/...`
