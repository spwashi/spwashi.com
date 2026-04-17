# Plan: spellbook-utility

Turn the spellbook from a readable trace ledger into a small set of replayable, outcome-bearing actions that help a visitor resume work rather than merely inspect what already happened.

## Goal

The desired end state is a spell surface that earns its metaphor by doing useful work. Right now the spell board and header dock serialize grounded tokens into a readable snippet, but they mostly act as documentation of prior interaction. The next step is not more serialization depth; it is executable value. The spellbook should become the inspectable catalog of a few proven interaction macros: things that restore a saved cognitive state, reopen a pinned working set, or otherwise reduce the cost of returning to an in-progress line of thought. The taste note is **earned fluency + working memory recovery**: spells should feel like learned reflexes that help a person resume, compare, and continue, not like ritual language layered on top of ordinary navigation.

## Scope

- **In scope**: narrowing the spell system to a few replayable actions; spellboard copy and structure that foreground outcomes over notation; checkpoint listing and restore; pinned-frame working-set replay; metadata that makes saved spells legible (what they restore, when they were saved, what page/frames they concern); clear reversibility and reset paths.
- **Out of scope**: arbitrary browser-side Spw execution; freeform spell composition; command-palette-style incantation entry; account sync or cloud persistence; opening many tabs as a default replay action; making core navigation depend on spells.

## First Two Spells

1. `! restore_checkpoint("<name>")`
   Restore a previously saved grounded registry and coupling state. This is the strongest low-friction win because `public/js/spw-haptics.js` already saves checkpoints and already exposes `restoreCheckpoint(name)`, but the current spell surface never lets a visitor browse or restore those saved states.

2. `@ resume_pins`
   Turn the existing pinned-frame registry into a replayable working set. This should not mean "open everything in tabs"; it should mean "resume the bookmarked set as a navigable sequence" with obvious links and a current-step affordance. The runtime already stores pins in `spw-pins`; the spell layer needs to project them as a working-memory tool rather than a static preformatted block.

## Files

[NEW] `.agents/plans/spellbook-utility/PLAN.md`
[NEW] `.agents/plans/spellbook-utility/wip.spw`
[MOD?] `public/js/spw-spells.js` - pivot from passive serialization to executable spell catalog, recent spells, and outcome-focused board rendering
[MOD?] `public/js/spw-haptics.js` - expose checkpoint enumeration and restore metadata in a stable helper the spell UI can call
[MOD?] `public/js/spw-experiential.js` - expose bookmark registry data in a way the spell runtime can reuse for working-set replay
[MOD?] `settings/index.html` - restructure the spell board into useful sections: current trace, saved checkpoints, pinned working set
[MOD?] `public/css/spw-handles.css` - spell-board interaction states, checkpoint rows, working-set controls
[MOD?] `public/css/spw-surfaces.css` - board-level layout for spell actions and utility-oriented summaries
[MOD?] `public/js/spw-console.js` - optional lightweight reporting for spell restore/cast outcomes
[MOD?] `public/js/spw-shared.js` - shared spell action helpers only if action wiring would otherwise duplicate logic

Craft guard:
- A spell must have a concrete payoff visible within one interaction.
- The spellbook remains optional; all routes and content stay fully usable without it.
- Discovery must come from nearby affordances and observed outcomes, not hidden vocabulary.
- Replay actions must be reversible and low-risk; no default behavior should fan out into multiple tabs or destructive resets.
- Serialization remains as inspection support, not the primary value proposition.
- "Spell" language should remain grounded in working-memory utility; if a control behaves like a bookmark restore, say so.

## Commits

1. `#[spells] — capture useful spellbook plan and narrow the first executable spells`
2. `&[checkpoints] — add restoreable checkpoint registry to the spell board`
3. `&[pins] — project pinned frames as a resumable working set`
4. `.[spellbook] — reshape spell surfaces around outcomes, summaries, and reset paths`
5. `![spells] — verify replay value, discoverability, and reversibility`

Fuzz strategy:
- Explore loop: inspect how often the current spellbook helps a repeat visitor recover state versus merely describing it.
- Stabilize loop: syntax-check changed JS modules and verify localStorage-backed spell surfaces under empty, sparse, and dense state.
- Ship gate: `git diff --check` plus manual demo of both first spells from `/settings/`.

## Agentic Hygiene

- Rebase target: `main@07f027c`
- Rebase cadence: before implementation starts, before merge
- Hygiene split: none; this plan is derived from already-landed wonder/settings/guide-badge work and should treat those surfaces as the current baseline.

## Dependencies

- `cognitive-navigation` — this plan is the utility-focused continuation of the earlier spell foundation; it narrows the concept into replayable outcomes.
- `interaction-grammar` — spells remain the fluency tier of the interaction system, but this pass reduces them to actions that can be inferred from ordinary use.
- `runtime-settings` — the settings route is the current home of the spell board and remains the right place for explicit restore/replay controls.

## Failure Modes

- **Hard**: the spell board remains a serialization display with prettier language but no faster way to resume work.
- **Hard**: checkpoint restore exists but is buried behind naming friction or hidden UI, so visitors still cannot recover prior state.
- **Hard**: pinned-frame replay defaults to noisy multi-tab behavior instead of a controlled working-set sequence.
- **Soft**: the spell metaphor becomes louder while the utility remains thin, making the feature feel theatrical rather than helpful.
- **Soft**: restore actions happen without enough preview context, so users do not know what state they are about to re-enter.
- **Non-negotiable**: the site must remain fully navigable and content-complete without using spells, checkpoints, or pins.

## Validation

- **Hypotheses**: a utility-first spellboard will make repeat visits more valuable; checkpoint restore will become the first spell people actually use; pinned working-set replay will make the bookmark registry feel alive instead of archival.
- **Negative controls**: empty-state spell surfaces remain calm and legible; users who never save checkpoints or pins still encounter a complete site; normal route navigation continues without spell knowledge.
- **Demo sequence**:
  1. Ground several links or concepts, save a checkpoint, reset haptics, restore the checkpoint from the spell board, and verify grounded state returns.
  2. Pin several frames, visit `/settings/#bookmarks` and `/settings/#spell-board`, trigger `resume_pins`, and verify the working set becomes a guided sequence rather than a dead listing.
  3. Confirm reset and back-out paths remain obvious after each spell.

## Spw Artifact

`.agents/plans/spellbook-utility/wip.spw`
