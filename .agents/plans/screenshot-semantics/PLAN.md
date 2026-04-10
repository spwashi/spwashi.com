# Plan: screenshot-semantics

Extend selection and priming semantics so screenshots capture meaningful cognitive states — turning the site into a useful capture tool for artists who value the visual record of a developing idea.

## Goal

The desired end state is a site where a screenshot at any moment captures something worth keeping: current address, liminality phase, operator grammar engaged, and the journey fragment that led here. This requires selection and priming semantics that survive without runtime context — visual markers legible in a still image, not just in an interactive session. The artist use case drives this: someone who screenshots a good idea, marks a moment of developed thinking, or collects a token from an interesting journey through a cognitive surface. A well-primed screenshot should communicate what kind of surface this is, what is being examined, and how deeply the visit has gone. The taste note is **legible capture + journey memory**: every meaningful state should be screenshot-worthy, and the screenshot should be able to suggest how the state was reached.

## Scope

- **In scope**: priming semantics (how pre-selection attention is visualized without hover), selection state visual persistence (what carries meaning in a still image), journey token design (what a captured state communicates about its path), data attributes and CSS that carry state legibly without JavaScript, screenshottable state taxonomy, and visual markers for liminality, selection, and operator engagement.
- **Out of scope**: screenshot automation, social sharing infrastructure, server-side rendering, persistent screenshot storage, or URL-encoded state reconstruction beyond what simple hashes already support.

## Files

[NEW] .agents/plans/screenshot-semantics/PLAN.md
[NEW] .agents/plans/screenshot-semantics/wip.spw
[NEW] .agents/plans/screenshot-semantics/screenshot-semantics.spw
[MOD?] .spw/conventions/site-semantics.spw — extend selection and priming axes with screenshottability rules
[MOD?] .spw/conventions/style-development.spw — add journey token vocabulary as a style development record
[MOD?] public/css/style.css — ensure selection, priming, and liminality state survive as visible CSS without hover/focus
[MOD?] public/js/spw-component-semantics.js — write priming and address state into data attributes at interaction time
[MOD?] public/js/spw-shared.js — helpers for persisting address and journey state into markup attributes
[MOD?] index.html — add screenshottable state hooks to primary frames
[MOD?] topics/software/index.html — ensure operator grammar states are legibly captured
[MOD?] topics/software/spw/index.html — operator atlas pages should be maximally screenshot-legible

Craft guard:
- Priming and selection state must be readable in a static screenshot without JavaScript, hover, or focus context.
- Every screenshottable state must be reachable through keyboard, touch, and pointer equally.
- Journey tokens should be sparse and semantically rich — earned marks, not labels on every element.
- Visual markers for address and liminality should use existing operator color tokens, not new arbitrary colors.
- Nothing added for screenshot legibility should clutter the calm default state.

## Commits

1. `#[screenshot] — capture screenshot semantics plan and priming/selection vocabulary`
2. `.[semantics] — formalize screenshottable state taxonomy, priming rules, and journey token grammar`
3. `&[css] — ensure selection and liminality states persist visually without JavaScript`
4. `&[runtime] — write priming and address state into data attributes at interaction time`
5. `![screenshot] — verify screenshottable states across routes, interactions, and static load`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=screenshot-semantics`
- Stabilize loop: `fuzz:stabilize --target=screenshot-semantics`
- Ship gate: `fuzz:ship --target=screenshot-semantics`

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

- `mobile-runtime-foundation` — priming semantics must be mobile-first and coarse-pointer aware; selection and address state lives in shared registers.
- `css-progressive-ornaments` — screenshot-safe visual state lives in the enhancement and component layers, not in ornaments.
- `cognitive-navigation` — liminality position and breadcrumb trail are prime screenshot content; both plans share vocabulary.

## Failure Modes

- **Hard**: priming state only exists as hover or JavaScript class — every screenshot shows the ambient default with no record of what was being addressed.
- **Hard**: selection state is visually indistinguishable from focus state, so screenshots cannot tell the difference between passing through and deliberate examination.
- **Soft**: journey token markers add visual noise to the default state instead of emerging quietly under attention.
- **Non-negotiable**: all visual markers for screenshot state must be accessible, reduced-motion safe, and legible without color as the only channel.

## Validation

- **Hypotheses**: persistent data attributes and CSS-driven selection states will make screenshots legible without runtime context; priming states will be achievable through all input modes; journey tokens will feel like earned marks rather than tracking labels.
- **Negative controls**: calm default state remains undisturbed; no new JavaScript required for basic state legibility.
- **Demo sequence**: navigate to a named frame via keyboard, screenshot; address an operator card via touch, screenshot; reach a nested liminality state on the software page, screenshot — compare all three for information density and legibility without explanatory text.

## Spw Artifact

`.agents/plans/screenshot-semantics/screenshot-semantics.spw`
