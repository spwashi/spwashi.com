# Plan: interaction-loop-contract

Extract the shared interaction-loop semantics that are currently duplicated across the state inspector and image metaphysics runtime. The end state is a small contract module that owns canonical loop states, refresh reasons, labels, and timing reads so future components can join the same activation/resolution model without inventing parallel local semantics. Taste note: improve layering and clarity by moving the process vocabulary into one truthful surface.

## Scope

- **In scope**: shared loop-state constants/helpers, image refresh reason constants, timing helpers, and reintegration of the current state inspector and image metaphysics consumers
- **Out of scope**: new page surfaces, new CSS ornament systems, broader bus/event renames, or extending the loop contract to unrelated runtimes in this pass

## Files

[NEW] public/js/spw-interaction-loop.js — canonical loop states, image refresh reasons, labels, and timing helpers  
[MOD] public/js/spw-state-inspector.js — consume shared contract instead of local loop/timing helpers  
[MOD] public/js/spw-image-metaphysics.js — emit canonical refresh reasons through shared helper  
[MOD] .agents/plans/interaction-loop-contract/wip.spw — running branch memory  
[DEL] (none)

### Craft guard

No file should exceed 600 lines after the refactor. `public/js/spw-state-inspector.js` is already the largest hot file and should shrink slightly by moving pure helpers out.

## Commits

1. .[interaction-loop] — capture the shared-loop refactor plan
2. &[interaction-loop] — extract shared interaction contract and rewire state inspector
3. &[interaction-loop] — rewire image metaphysics to shared refresh reasons and verify consumers

## Agentic Hygiene

- Rebase target: `main@9783be0`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: state blocks stop reflecting real downstream state because refresh reasons no longer line up
- **Soft**: loop labels fall back to generic values but the underlying state changes still work
- **Non-negotiable**: no second semantics path; the shared module must stay pure and remain a thin contract over existing runtime behavior

## Validation

- **Hypotheses**: extracting the loop contract reduces duplication without changing current behavior; image and inspector consumers still resolve through the same visible loop states
- **Negative controls**: existing operator/brace/mode/settings/image interactions continue to function; no new CSS edits are required
- **Demo sequence**: `/ -> home frame state block`, `/settings/ -> runtime preferences state block`, image-heavy route with hold-to-visit and effect cycling

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
