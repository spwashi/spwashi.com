# Plan: cognitive-navigation

Extend liminality navigation semantics, develop Spw breadcrumbs and the spell system foundation, integrate components for representing state and filetypes, and establish accessibility as a first-class cognitive legibility concern — together making the site feel like a place you can get better at inhabiting.

## Goal

The desired end state is a site that can be navigated as a cognitive space: you know where you are in the liminality sequence, you can trace the path that brought you here, there are legible components for different kinds of content (states, registers, filetypes), and the interactions you've learned can be named and repeated as spells. The wider purpose is a cognitive tool for artists and practitioners — someone who uses this space to develop ideas should be able to orient, deepen, and return, and the tools they've developed should be inspectable and shareable. Spw provides the spatial grammar for this kind of navigation: liminality is not a decoration axis but a depth axis you can traverse and return from; breadcrumbs are not browser history but cognitive path through conceptual space; spells are not scripts but named sequences of attention that feel like learned reflexes when mastered. Accessibility is foundational here: the semantic HTML and ARIA tree should be the canonical cognitive map of each page, not a compliance layer layered on top. The taste note is **cognitive cartography + earned fluency**: the site should feel like a place that deepens with familiarity while remaining fully legible to someone arriving for the first time.

## Scope

- **In scope**: liminality as navigation (entry→threshold→settled→nested→projected→deep as a traversable and reversible path); Spw breadcrumbs (semantic trail of current cognitive path, distinct from browser URL history); spell system foundation (named operator sequences that can be triggered, recognized, and described from the surface); filetype/state component taxonomy (how different content kinds present their handle and liminality); accessibility as cognitive legibility (ARIA landmarks as canonical cognitive map).
- **Out of scope**: executing Spw spells in a browser parser, persistent cross-session breadcrumbs in a database, user accounts, file system metaphors, or full spell composition from arbitrary operator sequences.

## Files

[NEW] .agents/plans/cognitive-navigation/PLAN.md
[NEW] .agents/plans/cognitive-navigation/wip.spw
[NEW] .agents/plans/cognitive-navigation/cognitive-navigation.spw
[MOD?] .spw/conventions/site-semantics.spw — extend liminality model with navigation semantics, breadcrumb trail, and spell foundation
[MOD?] .spw/conventions/style-development.spw — add cognitive navigation vocabulary as a style development record
[MOD?] public/js/frame-navigator.js — add liminality-aware navigation, depth traversal, and breadcrumb projection
[MOD?] public/js/spw-shared.js — shared helpers for liminality position, breadcrumb trail, and spell state
[MOD?] public/js/spw-component-semantics.js — filetype and state component taxonomy
[MOD?] public/js/spw-console.js — project breadcrumb trail and liminality position into the console surface
[NEW?] public/js/spw-breadcrumb-runtime.js — breadcrumb trail management and cognitive path projection
[NEW?] public/js/spw-spell-runtime.js — spell recognition, naming, and trigger foundation
[MOD?] public/css/style.css — liminality depth cues, breadcrumb component, spell affordance markers
[MOD?] index.html — accessibility landmark structure as the canonical cognitive map
[MOD?] about/index.html — accessibility landmark structure as the canonical cognitive map
[MOD?] topics/software/index.html — liminality navigation, spell affordances, and depth traversal on the grammar surface

Craft guard:
- Breadcrumbs show cognitive path through a liminality sequence, not just visited URLs; they should be understandable without the URL bar.
- Spells must be discoverable from observation before they are typed; the first exposure should be enough to infer the shape of what a spell does.
- Every liminality transition must be reversible; no depth state should trap the user.
- Accessibility landmark structure must match the cognitive map — if a region is navigable by keyboard, it must be findable by semantic structure.
- Filetype/state components must degrade to legible plain content when JavaScript is absent.
- Spell affordances must not clutter the default calm state — they should emerge as depth grows, not be advertised from the entry level.

## Commits

1. `#[nav] — capture cognitive navigation plan and liminality/breadcrumb/spell foundations`
2. `.[semantics] — formalize liminality as navigation, breadcrumb trail rules, spell recognition grammar, and filetype taxonomy`
3. `&[nav] — add liminality-aware navigation and breadcrumb trail to the frame navigator`
4. `&[spells] — implement spell recognition, naming, and trigger foundation`
5. `![nav] — verify liminality reversibility, breadcrumb legibility, spell discoverability, and accessibility map alignment`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=cognitive-navigation`
- Stabilize loop: `fuzz:stabilize --target=cognitive-navigation`
- Ship gate: `fuzz:ship --target=cognitive-navigation`

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

- `mobile-runtime-foundation` — liminality navigation, register-backed breadcrumbs, and spell triggers all live in the shared runtime semantics; page-region ownership is a prerequisite.
- `screenshot-semantics` — breadcrumb trail and liminality position are prime screenshot content; both plans share vocabulary and depend on persistent state in data attributes.
- `interaction-grammar` — spells are the fluency tier of interactive circuits; the two plans should be developed in coordination so spell discovery follows the circuit familiarity ladder.
- `cinematic-handles` — depth traversal and liminality transitions need named timing tokens for cinematic quality.

## Failure Modes

- **Hard**: breadcrumbs become a URL-based navigation list instead of a cognitive path through liminality depth — they would duplicate browser history without adding cognitive value.
- **Hard**: spells are not discoverable from observation, so they remain a hidden expert feature rather than a learnable part of the surface grammar.
- **Hard**: liminality transitions are not reversible — the user can get trapped in nested or projected phases with no clear return path.
- **Soft**: the accessibility landmark structure is added in parallel to the cognitive map rather than being treated as the canonical form of it.
- **Soft**: filetype components become visually complex rather than semantically dense — they should communicate quickly, not overwhelm.
- **Non-negotiable**: the site must remain fully navigable and content-complete without breadcrumbs, spells, or deep liminality knowledge — these are depth affordances, not required paths.

## Validation

- **Hypotheses**: liminality-aware navigation will make cognitive depth legible; Spw breadcrumbs will capture path quality rather than just page history; spell recognition will make expert patterns inductively discoverable.
- **Negative controls**: all routes and content remain accessible without engaging breadcrumbs, spells, or deep liminality navigation; landmark structure is navigable independently.
- **Demo sequence**: navigate from entry to projected liminality on the software page and observe the breadcrumb trail; trigger a spell through observed pattern; navigate back through the liminality sequence; verify the accessibility landmark map matches the cognitive map at each phase.

## Spw Artifact

`.agents/plans/cognitive-navigation/cognitive-navigation.spw`
