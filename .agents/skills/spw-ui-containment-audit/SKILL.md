---
name: spw-ui-containment-audit
description: Audit and fix UI containment/sizing/scroll issues (grid/flex sizing, overflow, positioning, container queries). Use for layout bugs like "not containing", "overflowing", "scroll broken", and panel sizing problems.
---

# Mounted Skill: spw-ui-containment-audit

Canonical skill:
`.spw/_workbench/.agents/skills/spw-ui-containment-audit/SKILL.md`

Use the mounted workbench skill as canon. In this repo, apply it directly to
the site's HTML/CSS/JS surfaces, but run helper commands through the mounted
workbench tooling when a script expects shared Spw audit infrastructure.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

Mounted references:
`.spw/_workbench/.agents/skills/spw-ui-containment-audit/references/`
