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

## Multi-model adapters

Root adapters emphasize one focus. They do not replace `AGENTS.md`. Shared sentence: *This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.*

- **`GROK.md`** — anti-bloat (declare operation, one named slice, stop)
- **`CLAUDE.md`** — constitutional rigor (a11y, no new `data-spw-*` families)
- **`GPT.md`** — contract exactness + computer-use verify-first
- **`GEMINI.md`** — tool mastery (`visual:checks`, wonder, lattice, no polling)
- Editor stubs: `.cursorrules`, `.github/copilot-instructions.md`
- Prove with `npm run check:agents` (adapters must be git-tracked)

Introspection ledger: `.agents/state/agent-preference.spw` (`skill-invocation.spw#introspection`).

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

## Plans

Canonical tracks and the active backlog live under `.agents/plans/`. Index: `.agents/plans/README.md`. Archive: `.agents/plans/archive/`. Agent/editor environment track: `agent-optimization/PLAN.md`. Commit grammar: `history-reflow/PLAN.md`.
