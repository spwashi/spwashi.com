---
name: spw-css-dom-lab
description: Design and run small, reversible UI experiments using modern CSS and DOM APIs in this repo. Use for "CSS as query language", runtime philosophy experiments, interaction prototypes, and instrumented UX hypotheses.
---

# Mounted Skill: spw-css-dom-lab

Canonical skill:
`.spw/_workbench/.agents/skills/spw-css-dom-lab/SKILL.md`

Use the mounted workbench skill as canon. For this repo, treat the site as the
experiment target and the workbench as the tool/provider surface.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `node --import tsx scripts/...` -> `node --import tsx .spw/_workbench/scripts/...`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

Mounted references:
`.spw/_workbench/.agents/skills/spw-css-dom-lab/references/`
