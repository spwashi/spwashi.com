# .agents

This repository mounts operational skills from the installed workbench at
`.spw/_workbench/.agents/`.

The local `.agents/skills/*/SKILL.md` files are thin wrappers so the skills
are discoverable from this repository without forking the workbench canon.

## Source of truth

- Skills: `.spw/_workbench/.agents/skills/*`
- Workflows: `.spw/_workbench/.agents/workflows/*`
- State conventions: `.spw/_workbench/.agents/state/*`
- Knowledge base: `.spw/_workbench/.agents/kb/*`

## Multi-Model Entrypoints

The repository provides targeted root-level adapters tailored for the four primary AI coding tools, backed by canonical `AGENTS.md`:

- **`CLAUDE.md`** — Claude Code CLI / Anthropic models (Constitutional Rigor)
- **`GROK.md`** — xAI Grok (Anti-Bloat & Signal)
- **`GEMINI.md`** — Google Gemini / Antigravity / Gemini Code Assist (Progressive Mastery)
- **`GPT.md`** — OpenAI Codex / ChatGPT / Cursor / Copilot (Contract Exactness)
- Editor rules: `.cursorrules`, `.github/copilot-instructions.md`
- Verification script: `npm run check:agents`

## Command translation

When a mounted skill assumes the workbench repo is the current project, use
these substitutions from the site root:

- `npm run <script>` -> `npm --prefix .spw/_workbench run <script>`
- `node --import tsx scripts/...` -> `node --import tsx .spw/_workbench/scripts/...`
- `bash .agents/skills/.../scripts/...` -> `bash .spw/_workbench/.agents/skills/.../scripts/...`

When a script distinguishes the repo being worked on from the workbench tool
root, export:

```bash
SPW_REPO_ROOT_OVERRIDE="$PWD"
SPW_TOOL_ROOT_OVERRIDE="$PWD/.spw/_workbench"
```

The existing local workflow note at `.agents/workflows/commit-review.md`
remains the site-specific commit-gate adapter.

## Active Plan Tracks

The current stable planning set lives under `.agents/plans/`:

- `css-architecture-readability/PLAN.md`
- `color-motion/PLAN.md`
- `midjourney-design-concepts/PLAN.md`
- `reference-assignment-template/PLAN.md`

For the directory index and handoff notes, see `.agents/plans/README.md`.
Historical notes that have been superseded live under `.agents/plans/archive/`.

Use these as the starting points for UX development through literate CSS, repeated site behaviors, color and motion tuning, Midjourney-inspired concept studies, and intern-sized reference assignments.
The plan index also separates the broader active backlog from archived notes so legacy workstreams stay visible without competing with the canonical tracks.
