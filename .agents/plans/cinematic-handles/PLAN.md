# Plan: cinematic-handles

Develop a vocabulary of named timing and motion handles — transition shapes and quality constants that give the site's reveals, pivots, and responses a cinematic sensibility grounded in its own semantic grammar.

## Goal

The desired end state is a motion system where every transition has a name derived from the site's own vocabulary, every reveal has a quality that matches its semantic role, and every motion has a reduced-motion safe contract. Instead of anonymous milliseconds and bezier curves, transitions carry names like "boon-settle," "pivot-arc," or "threshold-cross" — names that connect motion to meaning and make timing decisions auditable, not incidental. The wider aim includes layers and lighting as an attention model: depth should feel like depth (not just z-index), and surfaces should carry ambient lighting states that shift as attention moves. Together these give the site a cinematic quality — the sense that spatial and temporal transitions are authored rather than defaulted. The taste note is **earned motion + semantic depth**: every animation should be the right animation for that semantic state, authored from the site's own grammar rather than borrowed from a design trend.

## Scope

- **In scope**: timing token vocabulary derived from Spw semantics; transition shape taxonomy (settle, reveal, threshold-cross, pivot-arc, charge-release, discharge, return, project); layers as visual depth model; lighting tokens as attention and liminality signal; reduced-motion contracts for every named motion; CSS custom property conventions.
- **Out of scope**: a full animation framework, JavaScript-driven particle or physics systems, video, WebGL/canvas rendering, or real-time lighting computation.

## Files

[NEW] .agents/plans/cinematic-handles/PLAN.md
[NEW] .agents/plans/cinematic-handles/wip.spw
[NEW] .agents/plans/cinematic-handles/cinematic-handles.spw
[MOD?] .spw/conventions/site-semantics.spw — extend with timing vocabulary, layer model, and lighting/attention semantics
[MOD?] .spw/conventions/style-development.spw — log timing vocabulary as a deliberate style development record
[MOD?] public/css/style.css → public/css/tokens.css — timing and layer tokens migrate into the token layer (depends on css-progressive-ornaments split)
[MOD?] public/css/style.css — replace anonymous durations and curves with named token references
[NEW?] public/css/motion.css — named transition shapes, easing vocabulary, and reduced-motion overrides
[NEW?] public/css/layers.css — depth vocabulary, ambient/active/dormant layer states, lighting tokens

Craft guard:
- Every named timing token must have a reduced-motion override at the token level, not as a per-rule exception.
- Timing token names come from the Spw vocabulary first; generic duration names (fast, slow) are a fallback, not a default.
- Layers should feel like genuine visual depth — ambient, settled, active, and projected states should be distinguishable.
- Cinematic handles are semantic, not decorative — each named motion should make a state more legible, not more impressive.
- The motion system must be finite and enumerable; do not accumulate anonymous transition overrides.
- Lighting tokens follow the attention/liminality model: a deeper liminality state should feel differently lit, not just differently colored.

## Commits

1. `#[motion] — capture cinematic handles plan and timing/layer/lighting vocabulary`
2. `.[semantics] — formalize timing token vocabulary, transition taxonomy, and layer/lighting semantics`
3. `&[tokens] — introduce named timing and depth tokens into the CSS token layer`
4. `&[motion] — replace anonymous durations with named tokens across existing transitions`
5. `![motion] — verify reduced-motion safety, token completeness, and semantic alignment`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=cinematic-handles`
- Stabilize loop: `fuzz:stabilize --target=cinematic-handles`
- Ship gate: `fuzz:ship --target=cinematic-handles`

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, after the CSS token layer lands (depends on css-progressive-ornaments), before merge
- Hygiene split: none

## Dependencies

- `css-progressive-ornaments` — timing and layer tokens should migrate into the token layer during the CSS split.
- `mobile-runtime-foundation` — interaction timing (pivot arc, charge decay, brace settle) must be named here so implementation can use semantic rather than arbitrary values.
- `svg-surface-integration` — SVG widget transitions should use named timing tokens rather than bespoke animation values.
- `screenshot-semantics` — motion handles define how screenshottable states transition in and out; both plans share timing vocabulary.

## Failure Modes

- **Hard**: timing tokens are named generically (--duration-fast) rather than semantically (--pivot-arc-duration), so the vocabulary doesn't connect to Spw grammar or auditable meaning.
- **Hard**: reduced-motion contracts are implemented per-rule rather than per-token, making them incomplete and hard to audit.
- **Soft**: layer semantics remain as z-index numbers without semantic names, so depth decisions stay arbitrary.
- **Soft**: the lighting model is implemented as opacity only, losing the attentional and liminality signal.
- **Non-negotiable**: no motion is required for legibility or navigation; all cinematic handles are enhancement layers, never structural dependencies.

## Validation

- **Hypotheses**: named timing tokens will make motion decisions auditable and consistent; token-level reduced-motion overrides will produce more complete safety than per-rule approaches; layer depth vocabulary will make z-stacking decisions semantically legible.
- **Negative controls**: all interactions remain fully functional without motion; static screenshots are informationally equivalent to animated states.
- **Demo sequence**: trigger a brace pivot, a frame reveal, and a charge discharge — compare before/after timing token naming; disable motion and verify each transition remains semantically understandable; check that ambient, settled, and active layers are distinguishable without color alone.

## Spw Artifact

`.agents/plans/cinematic-handles/cinematic-handles.spw`
