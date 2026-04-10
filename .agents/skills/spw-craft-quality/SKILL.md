---
name: spw-craft-quality
description: Improve craft quality of this codebase (naming, layering, types, tests, UX polish, performance). Use for craft passes, refactors for clarity, and raising the quality bar.
---

# Mounted Skill: spw-craft-quality

Canonical skill:
`.spw/_workbench/.agents/skills/spw-craft-quality/SKILL.md`

Read and follow the mounted workbench skill. In this repo, do not fork the
workflow; adapt commands through `.spw/_workbench` and use judgment when a step
clearly assumes workbench-only structure such as `src/` or a root `package.json`.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `node --import tsx scripts/...` -> `node --import tsx .spw/_workbench/scripts/...`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

References and helper scripts remain mounted at:
`.spw/_workbench/.agents/skills/spw-craft-quality/`
