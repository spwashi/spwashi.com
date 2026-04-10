---
name: spw-commit-review
description: Human-in-the-loop commit gate. Blocks agent-initiated commits until human authorizes. Surfaces layer violations, profile-based Spw syntax review, and golden snapshot risks. Use for all commit workflows.
---

# Mounted Skill: spw-commit-review

Canonical skill:
`.spw/_workbench/.agents/skills/spw-commit-review/SKILL.md`

Use the mounted workbench skill as the source of truth. In this repo, translate
paths through `.spw/_workbench` and keep this repo as the target surface.

Command substitutions:
- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `node --import tsx scripts/...` -> `node --import tsx .spw/_workbench/scripts/...`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

When running review scripts from this repo, export the repo/tool split:

```bash
SPW_REPO_ROOT_OVERRIDE="$PWD" \
SPW_TOOL_ROOT_OVERRIDE="$PWD/.spw/_workbench" \
bash .spw/_workbench/.agents/skills/spw-commit-review/scripts/poll-review.sh --scope=changed
```

Site-local commit workflow note:
`.agents/workflows/commit-review.md`
