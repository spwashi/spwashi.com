# Plan: minimal-brace-disclosure

Make the default runtime quieter, collapse shell chrome on small screens, and turn brace edges plus diagnostic surfaces into explicit, reversible controls instead of passive ornament.

## Goal

The site should begin from a minimalist baseline: lighter semantic density, less always-on chrome, and clearer separation between primary reading flow and optional diagnostics. Mobile navigation should disclose intentionally through a hamburger control instead of wrapping the full header list into a noisy block. Brace edges and diagnostic surfaces should read as actionable thresholds with visible entry, projection, dismissal, and return paths.

Taste note: improve containment, clarity, and expressiveness without adding a second interaction model.

## Scope

- **In scope**: default setting tuning, mobile shell disclosure, inline-statement container treatment, brace click affordances, collapsible state/diagnostic surfaces, dismiss/reopen behavior for popups.
- **Out of scope**: redesigning page copy, changing route structure, replacing the navigator/console systems, or adding new backend/storage behavior.

## Files

[NEW] .agents/plans/minimal-brace-disclosure/wip.spw
[NEW] public/js/spw-shell-disclosure.js
[NEW] public/js/spw-brace-actions.js
[MOD] public/js/site.js — wire new shell/brace behavior into the shared bootstrap
[MOD] public/js/site-settings.js — shift defaults toward the calmer baseline
[MOD] public/js/spw-state-inspector.js — make diagnostic blocks collapsible/dismissable
[MOD] public/js/spw-console.js — ensure console disclosure stays compact and dismissable
[MOD] public/css/spw-shell.css — add hamburger shell styling and compact mobile navigation states
[MOD] public/css/spw-grammar.css — make framed containers feel more like inline Spw statements
[MOD] public/css/spw-components.css — collapsed/dismissable state block styling and brace control affordances
[MOD] public/css/spw-surfaces.css — inline/collapsed diagnostic panel behavior where needed

Craft guard:
- `public/js/site.js` already has multiple responsibilities; keep new shell/brace logic in dedicated modules.
- `public/css/spw-components.css` and `public/css/spw-surfaces.css` are large; keep edits localized to existing sections and avoid broad re-theming.

## Commits

1. &[defaults, shell] — quiet the default runtime and add mobile shell disclosure
2. &[brace, disclosure] — turn brace edges and diagnostics into reversible controls
3. ![shell, brace] — verify syntax, containment, and disclosure behavior

## Agentic Hygiene

- Rebase target: `main@1d48d4e`
- Rebase cadence: before commit 1 and before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: hamburger control hides primary navigation without a working reopen path.
- **Soft**: brace affordances become visually busy or interfere with existing hold/drag gesture semantics.
- **Soft**: dismissing diagnostics leaves no obvious recovery affordance.
- **Non-negotiable**: existing frame activation, mode switching, and local settings persistence must continue to work.

## Validation

- **Hypotheses**: the default view feels quieter, the mobile header reads as one compact control surface, and diagnostics no longer dominate reading flow.
- **Negative controls**: existing console history, state inspector field cycling, and brace hold/pin gestures remain functional.
- **Demo sequence**: load `/settings/` on a narrow viewport, open/close the menu, activate a braced frame, click brace affordances, collapse/dismiss diagnostics, and recover them.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
