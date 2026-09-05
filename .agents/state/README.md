# Agent State

This directory holds repo-local agent runtime state when mounted workbench
skills write snapshots against `SPW_REPO_ROOT_OVERRIDE`.

Source of truth for state conventions:
`.spw/_workbench/.agents/state/register-conventions.spw`

Persistent docs may live here later. Generated runtime snapshots should stay in
`.agents/state/runtime/` and remain untracked.

`agent-preference.spw` is a hand-appended introspection ledger (lean / gap / reach / avoid).
It is not generated. Ritual: `.spw/conventions/skill-invocation.spw#introspection`.
