# Mounted Skills

These skills are installed into this repository as local wrappers.

Each wrapper points to the canonical workbench skill under
`.spw/_workbench/.agents/skills/<skill>/`.

The goal is discoverability, not duplication:

- local `.agents/skills/*/SKILL.md` makes the skill visible from this repo
- mounted workbench files remain the source of truth
- commands should be translated through `.spw/_workbench` when the workbench
  expects its own scripts or package.json
