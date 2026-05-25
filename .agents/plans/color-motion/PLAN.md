# Color And Microinteraction Timing Improvement Plan

## Public Goal

Improve the site's color coherence and interaction feel without flattening its character. The work should make the palette more intentional, make operator colors easier to distinguish, and make hover/focus/charge/reveal timing feel precise instead of randomly animated.

This is not a redesign. The goal is to tune the existing Spw visual language through tokens, semantic aliases, and targeted interaction contracts.

## Current Baseline

Primary source of truth:

- `public/css/tokens/core.css` owns primitive colors, operator colors, material aliases, timing durations, easing curves, dark mode, theme packs, contrast, and reduced-motion tokens.
- `public/css/effects/material.css` owns material lift, hover/focus/active depth, and component surface transitions.
- `public/css/effects/wonder.css` owns delight, charge, resonance, and ambient semantic effects.
- `public/css/handles/operators.css` owns operator chips, sigils, compact handles, pressed states, and graspable affordances.
- `public/css/ornament/ornament.css` owns decorative/semi-semantic rails, seams, ribbons, and staged ornament.
- Route files such as `home.css` and `settings.css` bias local identity and should consume shared tokens rather than redefine interaction systems.

Existing timing scale:

```css
--duration-instant: 50ms;
--duration-snap: 90ms;
--duration-fast: 140ms;
--duration-base: 220ms;
--duration-deliberate: 360ms;
--duration-slow: 480ms;
--duration-ceremonial: 720ms;
```

Existing motion aliases:

```css
--spw-motion-quick: var(--duration-fast) var(--ease-mechanical);
--spw-motion-settle: var(--duration-base) var(--ease-settle);
--spw-motion-expressive: var(--duration-deliberate) var(--ease-paper);
```

Known issue pattern:

- Many components choose their own duration/ease combinations directly.
- Color math often appears inside component rules instead of being named locally.
- Operator colors are semantically rich, but some adjacent hues can blur together in dense UI.
- Dark mode and theme packs override many values, but interaction contrast needs systematic checking.
- Reduced motion exists, but not every interaction maps cleanly to motion intensity tiers.

## Success Criteria

- Operator colors remain recognizable in light, dark, and high-contrast modes.
- Interactive states have clear timing bands: acknowledgement, settle, reveal, ambient, ceremonial.
- Hover/focus/pressed/active transitions feel consistent across cards, chips, mode switches, and settings controls.
- Delight and resonance effects feel intentional, not noisy.
- Colors used in components are mostly named local tokens, not repeated raw color math.
- Reduced-motion mode keeps state legible while removing nonessential movement.
- `npm run check:css`, `npm run check`, and `git diff --check` pass after each patch.

## Out Of Scope

- Do not replace the palette wholesale.
- Do not introduce a design token build system.
- Do not add JS just to animate colors or timing.
- Do not remove the operator color model.
- Do not make dark mode the default visual direction.
- Do not tune every route in one patch.
- Do not use animation for information that must remain accessible without motion.

## Token Hierarchy

1. Primitive tokens: raw colors, durations, easings.
2. Role tokens: semantic palette and timing aliases.
3. Component-local tokens: card/control/operator-specific usage.
4. State tokens: hover, focus, active, selected, disabled, resonant.

Keep semantic aliases layered on top of primitives rather than replacing the primitive scale:

```css
/* Primitive */
--duration-fast: 140ms;

/* Semantic */
--spw-time-control: var(--duration-fast);
```

## Motion Accessibility Contract

- Reduced motion may still change color, border, opacity, and shadow.
- Reduced motion should remove pulse, orbit, scale, drift, and repeated animation.
- Focus-visible must remain obvious without transform.
- State changes must not depend on animation timing to be understood.

## Token Efficiency

- Use the fewest tokens that still preserve semantic meaning.
- Keep primitives stable; add aliases for reuse rather than cloning new primitives.
- Prefer one semantic alias per interaction family instead of separate durations for each component.
- When two components feel the same, they should usually share a timing alias.
- When one color math expression repeats, lift it into a role or component-local token before tuning the hue.
- Do not create palette tokens for values that appear only once unless they establish an important route or operator distinction.

## Navigability Contract

- Name palette and timing aliases so their purpose is obvious from the identifier alone.
- Prefer identifiers that map cleanly from CSS to JS/TS, such as `--spw-time-control`, `--spw-time-surface`, or `--spw-color-accent-primary`.
- Use the same semantic noun across token, data attribute, and runtime helper names when the concept is shared.
- Keep role aliases searchable enough that a model can trace a value from `core.css` to its consumers without guessing.
- Avoid parallel synonyms for the same concept unless the codebase already distinguishes them for a reason.

## Patch 1 - Color And Motion Audit

Goal: produce a concrete map of where colors and timings are currently defined and overused.

Files to inspect:

- `public/css/tokens/core.css`
- `public/css/effects/material.css`
- `public/css/effects/wonder.css`
- `public/css/handles/operators.css`
- `public/css/components/cards.css`
- `public/css/components/foundation.css`
- `public/css/ornament/ornament.css`
- `public/css/routes/surfaces/home.css`
- `public/css/routes/surfaces/settings.css`

Queries:

```sh
rg -n "color-mix\\(|hsl\\(|hsla\\(|rgba\\(|linear-gradient\\(" public/css
rg -n "transition:|animation:|@keyframes|duration|ease" public/css
rg -n "prefers-reduced-motion|data-spw-reduce-motion" public/css
rg -n "--duration-|--ease-|--spw-motion-|--touch-|--charge-" public/css
rg -n "--op-[a-z-]+-color|--active-op-color|--wonder|--delight" public/css
```

Deliverable:

- Add a short audit section to this plan or a follow-up `.agents/plans/color-motion/PLAN.md`.
- Identify the top 10 repeated raw color expressions.
- Identify the top 10 direct transition duration/ease combinations outside `core.css`.
- Identify which interactions should be tuned first.
- Prioritize operator distinction before surface warmth because operator colors carry semantic meaning; surface warmth is atmospheric.
- Record whether each candidate change should be a primitive adjustment, a role alias, or a component-local override.

Validation:

- No code changes required for this patch unless adding documentation.

## Patch 1A - Color Inventory

Goal: inventory the repeated color expressions before touching timing.

Files:

- `public/css/tokens/core.css`
- `public/css/effects/material.css`
- `public/css/effects/wonder.css`
- `public/css/handles/operators.css`

Changes:

- Count repeated color math and operator color collisions.
- Decide which values are primitive, role, or component-local.

Validation:

- `rg -n "color-mix\\(|hsl\\(|hsla\\(|rgba\\(" public/css`

## Patch 1B - Timing Inventory

Goal: inventory repeated timing/easing combinations before aliasing.

Files:

- `public/css/tokens/core.css`
- `public/css/effects/material.css`
- `public/css/effects/wonder.css`
- `public/css/components/cards.css`
- `public/css/handles/operators.css`

Changes:

- Count direct duration/ease combinations.
- Identify which interactions should share an alias.

Validation:

- `rg -n "transition:|animation:|duration|ease" public/css`

## Patch 2 - Palette Role Tokens

Goal: clarify color roles without changing every selector.

Primary file:

- `public/css/tokens/core.css`

Secondary consumers:

- `public/css/effects/material.css`
- `public/css/handles/operators.css`
- `public/css/components/cards.css`
- `public/css/effects/wonder.css`

Add or rationalize role tokens:

```css
--spw-color-ink-primary
--spw-color-ink-secondary
--spw-color-ink-muted
--spw-color-surface-base
--spw-color-surface-raised
--spw-color-surface-muted
--spw-color-line-subtle
--spw-color-line-active
--spw-color-accent-primary
--spw-color-accent-warm
--spw-color-accent-cool
--spw-color-accent-alert
--spw-color-accent-success
```

Rules:

- Alias these to existing tokens first; do not replace established names immediately.
- Keep existing `--ink`, `--surface`, `--line`, `--teal`, `--amber`, and operator tokens intact.
- Use role tokens as bridge vocabulary for new component-local tokens.
- Add dark-mode values only where aliases need different behavior from existing tokens.

Example:

```css
:root {
  --spw-color-ink-primary: var(--ink-strong);
  --spw-color-ink-secondary: var(--ink);
  --spw-color-ink-muted: var(--ink-soft);
  --spw-color-surface-base: var(--surface);
  --spw-color-surface-raised: var(--surface-strong);
  --spw-color-line-subtle: var(--line);
  --spw-color-line-active: var(--line-strong);
}
```

Risks:

- Too many aliases can obscure meaning. Only add tokens that will be consumed by at least two layers.
- Avoid renaming existing canonical tokens in this patch.

Validation:

- `npm run check:css`
- Manual color spot check in light and dark.

## Patch 2A - Role Alias Layer

Goal: add role aliases without changing canonical primitives.

Files:

- `public/css/tokens/core.css`

Changes:

- Add the smallest useful alias set.
- Keep aliases searchable and traceable.

Validation:

- `npm run check:css`

## Patch 2B - Consumer Migration

Goal: move a few shared consumers onto the new role aliases.

Files:

- `public/css/effects/material.css`
- `public/css/components/cards.css`
- `public/css/handles/operators.css`

Changes:

- Replace repeated direct primitives where the alias improves readability.

Validation:

- `npm run check:css`

## Patch 3 - Operator Color Distinction Pass

Goal: make operator hues distinguishable in dense UI while preserving the semantic palette.

This is the first visible color-tuning priority. Operator colors are semantic handles, so they should be clarified before broader atmospheric warmth changes.

Primary file:

- `public/css/tokens/core.css`

Consumers:

- `public/css/handles/operators.css`
- `public/css/grammar/syntax.css`
- `public/css/effects/wonder.css`
- `public/css/ornament/ornament.css`

Targets:

- `--op-frame-color`
- `--op-topic-color`
- `--op-object-color`
- `--op-ref-color`
- `--op-probe-color`
- `--op-action-color`
- `--op-stream-color`
- `--op-merge-color`
- `--op-binding-color`
- `--op-meta-color`
- `--op-surface-color`

Changes:

- Audit contrast against `--surface`, `--surface-strong`, `--bg`, and dark-mode surfaces.
- Nudge only the hues/lightness/chroma that collide visually.
- Keep each operator's border and soft background derived from the operator color.
- Prefer `color-mix(...)` derived backgrounds over hardcoded pastel RGB values where practical.
- Add comments for operator pairs that are intentionally close but semantically distinct.

Useful check matrix:

```text
frame vs surface
topic vs merge
object vs binding
probe vs meta
action vs frame
stream vs normalize
```

Risks:

- Operator colors are semantically meaningful; large shifts can break recognition.
- Soft backgrounds can pass aesthetically but fail contrast in dark mode.

Validation:

- Browser check pages with dense operator chips.
- Check `html[data-spw-high-contrast="on"]`.
- Check dark mode and auto dark mode.

## Patch 3A - Operator Hues

Goal: tune the operator colors themselves before consuming them elsewhere.

Files:

- `public/css/tokens/core.css`

Changes:

- Adjust only the operator hues that collide or read too similarly.

Validation:

- Dark and high-contrast browser checks.

## Patch 3B - Operator Consumers

Goal: propagate the operator palette changes into chips, grammar, and ornament.

Files:

- `public/css/handles/operators.css`
- `public/css/grammar/syntax.css`
- `public/css/effects/wonder.css`
- `public/css/ornament/ornament.css`

Changes:

- Update borders, soft backgrounds, and emphasis states.

Validation:

- `npm run check:css`

## Patch 4 - Interaction Timing Bands

Goal: replace ad hoc durations with named interaction timing bands.

Operator chips define the tactile baseline for the site. Cards, mode switches, settings controls, and ornament should harmonize with chip timing rather than establishing separate timing languages.

Primary file:

- `public/css/tokens/core.css`

Consumers:

- `public/css/effects/material.css`
- `public/css/handles/operators.css`
- `public/css/components/cards.css`
- `public/css/components/controls.css`
- `public/css/effects/wonder.css`
- `public/css/ornament/ornament.css`

Proposed timing bands:

```css
--spw-time-ack: var(--duration-snap);          /* immediate hover/focus acknowledgement */
--spw-time-control: var(--duration-fast);      /* button/chip/control state */
--spw-time-surface: var(--duration-base);      /* card/panel settle */
--spw-time-reveal: var(--duration-deliberate); /* disclosures, metadata, labels */
--spw-time-ambient: var(--duration-slow);      /* resonance, attention echo */
--spw-time-ritual: var(--duration-ceremonial); /* rare expressive moments */
```

Proposed easing bands:

```css
--spw-ease-ack: var(--ease-mechanical);
--spw-ease-control: var(--ease-precise);
--spw-ease-surface: var(--ease-settle);
--spw-ease-reveal: var(--ease-paper);
--spw-ease-ambient: var(--ease-orbit);
```

Rules:

- Add aliases first.
- Migrate one family at a time.
- Do not change keyframe durations until ordinary transitions are consistent.
- Map reduced-motion mode to these aliases so all consumers inherit the reduction.

Validation:

- `rg -n "var\\(--duration-|var\\(--ease-" public/css/effects public/css/handles public/css/components`
- `npm run check:css`

## Patch 5 - Control And Handle Microinteraction Pass

Goal: make chips, sigils, mode switches, and settings controls feel consistent.

Normalize `.operator-chip` first, then bring `.frame-sigil`, mode switches, and settings controls into alignment.

Files:

- `public/css/handles/operators.css`
- `public/css/handles/phase-controls.css`
- `public/css/components/controls.css`
- `public/css/routes/surfaces/settings-forms.css`

Targets:

- `.operator-chip`
- `.frame-sigil`
- `.frame-card-sigil`
- `.mode-switch`
- `.settings-preset-btn`
- settings range/select/radio controls

Changes:

- Use `--spw-time-ack` for hover/focus color acknowledgement.
- Use `--spw-time-control` for pressed/selected state.
- Use `--spw-ease-control` for transform and border changes.
- Keep hover lift small and consistent.
- Ensure `aria-pressed="true"` styles remain visually stronger than hover.
- Avoid animating layout-affecting dimensions where opacity, color, transform, or box-shadow can carry the change.

Interaction target feel:

```text
hover/focus: immediate recognition, no drama
pressed/selected: firm, slightly slower settle
disabled: no movement, clear color desaturation
metadata reveal: delayed enough to avoid flicker, fast enough to feel inspectable
```

Validation:

- Keyboard tab through nav, mode switches, cards, and settings controls.
- Check pointer hover on dense operator lists.
- `npm run check`

## Patch 6 - Card And Surface Timing Pass

Goal: make cards and material panels respond with a shared surface timing grammar.

Files:

- `public/css/effects/material.css`
- `public/css/components/cards.css`
- `public/css/components/foundation.css`
- `public/css/components/surfaces.css`
- `public/css/grammar/syntax.css`

Targets:

- `.site-frame`
- `.frame-card`
- `.frame-panel`
- `.mode-panel`
- `.media-card`
- `.operator-card`
- `.plan-card`

Changes:

- Use `--spw-time-surface` and `--spw-ease-surface` for background, border, and shadow transitions.
- Use `--spw-time-control` for small transforms.
- Keep surface lift consistent and subtle.
- Ensure focus-visible is faster and clearer than hover.
- Make active/selected surfaces settle visibly without overusing glow.

Validation:

- Visual check on homepage cards, `/plans/`, `/topics/`, `/settings/`.
- Reduced-motion check.

## Patch 7 - Wonder, Resonance, And Ornament Timing Pass

Goal: make expressive effects rarer, slower, and more semantically meaningful.

Files:

- `public/css/effects/wonder.css`
- `public/css/ornament/ornament.css`
- `public/css/ornament/canvas-accents.css`
- `public/css/effects/developmental-climate.css`

Targets:

- `spw-delight-burst`
- `data-spw-charge`
- `data-spw-wonder-state`
- resonance probe echoes
- ornament rails/seams
- canvas accent opacity changes

Changes:

- Map ambient effects to `--spw-time-ambient`.
- Map rare expressive effects to `--spw-time-ritual`.
- Reduce competing glow sources when an element is both active and resonant.
- Keep charge states visually ordered:

```text
preview < arming < sustained < settled
```

- Ensure reduced motion preserves color/state differences while disabling pulse, scale, and orbit motion.

Validation:

- Trigger resonance probe by focusing/hovering operator chips.
- Check collected/grounded/pinned states if present on route.
- Check reduced motion through `html[data-spw-reduce-motion="on"]`.

## Patch 8 - Color Mode And Theme Pack QA

Goal: make palette changes reliable across light, dark, auto, high-contrast, and theme packs.

Files:

- `public/css/tokens/core.css`
- route files only if they define local mode overrides

Modes to test:

```html
<html data-spw-color-mode="light">
<html data-spw-color-mode="dark">
<html data-spw-color-mode="auto">
<html data-spw-high-contrast="on">
<html data-spw-theme-pack="neutral-paper">
<html data-spw-theme-pack="glass-console">
<html data-spw-theme-pack="ritual-vellum">
<html data-spw-theme-pack="oxide-ledger">
<html data-spw-theme-pack="electric-studio">
<html data-spw-theme-pack="copper-brace">
```

Changes:

- Make theme pack overrides adjust role tokens where possible.
- Keep operator colors readable on each surface.
- Avoid route-local mode overrides unless route identity truly needs them.
- Document any intentional theme-pack exceptions.

Validation:

- Browser check `/settings/` first because it exposes mode controls.
- Then check `/`, `/website/`, `/design/`, and one content-heavy route.

## Patch 9 - Documentation And Inspectability

Goal: make the color/timing system learnable for future edits.

Files:

- `public/css/README.md`
- optional `.spw/conventions/css-instruction.spw`
- optional `.spw/conventions/attention-field.spw` if resonance timing semantics change
- optional `.spw/conventions/ornament-contract.spw` if ornament timing semantics change

Document:

- Palette role tokens and when to use them.
- Operator color invariants.
- Microinteraction timing bands.
- Reduced-motion expectations.
- Which files own color versus motion decisions.

Validation:

- `rg -n "spw-time|spw-ease|palette|operator color|reduced motion" public/css/README.md .spw`
- `npm run check`

## Suggested Commit Series

1. `Audit color and motion token usage`
2. `Add interaction timing bands`
3. `Normalize operator chip microinteractions`
4. `Add palette role aliases`
5. `Tune operator color distinction`
6. `Normalize card surface timing`
7. `Tune wonder and ornament timing`
8. `Verify color modes and theme packs`
9. `Document color and timing contracts`

Preferred first implementation sequence:

```text
Audit color and motion token usage
Add interaction timing bands
Normalize operator chip microinteractions
```

## Combined Roadmap Position

This plan supplies steps 3-5 in the combined design-system track:

```text
3. Audit color and motion token usage
4. Add interaction timing bands
5. Normalize operator chip microinteractions
```

It should follow the first CSS debug/ownership improvements and precede broader component token extraction.

## Validation Loop

Always run:

```sh
npm run check:css
git diff --check
```

Run for token, mode, or broad interaction changes:

```sh
npm run check
```

Run after editing generated-source CSS:

```sh
npm run build:css
npm run check:generated
```

Manual routes:

- `/`
- `/settings/`
- `/design/`
- `/website/`
- one content-heavy route such as `/blog/` or `/recipes/`

Manual states:

- light mode
- dark mode
- auto mode on dark system preference
- high contrast
- reduced motion
- keyboard focus
- pointer hover
- pressed/selected mode switch
- resonant operator focus

## Review Questions Before Implementation

- Should the first visible color change prioritize operator distinction or surface warmth?
- Should timing aliases replace old duration names gradually, or should old names remain the canonical public API?
- Which interaction should define the feel of the site: operator chips, cards, or mode switches?
- Are delight/resonance effects currently too frequent, too slow, or too visually strong?
- Should theme packs be treated as product-facing modes or internal tuning presets?
