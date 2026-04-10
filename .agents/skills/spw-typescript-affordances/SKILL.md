---
name: spw-typescript-affordances
description: Apply TypeScript language and compiler affordances in this repo to improve safety and ergonomics (narrowing, unions, satisfies, generics, inference). Use for typing/design requests and "lean on TS" refactors.
---

# Mounted Skill: spw-typescript-affordances

Canonical skill:
`.spw/_workbench/.agents/skills/spw-typescript-affordances/SKILL.md`

This repo mounts the workbench TypeScript skill for discoverability. Use the
canonical workbench skill as the method, but only apply it where this repo
actually contains TypeScript-bearing surfaces or mounted workbench code.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

Mounted references:
`.spw/_workbench/.agents/skills/spw-typescript-affordances/references/`
