---
name: spw-privacy-engineering
description: Do privacy-centric engineering reviews and implement mitigations (data inventory, threat modeling, logging/retention, access controls). Use for PII handling, enterprise privacy posture, and secure-by-default design.
---

# Mounted Skill: spw-privacy-engineering

Canonical skill:
`.spw/_workbench/.agents/skills/spw-privacy-engineering/SKILL.md`

Use the mounted workbench skill as the review method. For this repo, focus on
public-site risks, `.spw` artifact disclosure, and any installed-workbench
boundary where data or logs could leak across surfaces.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

Mounted references:
`.spw/_workbench/.agents/skills/spw-privacy-engineering/references/`
