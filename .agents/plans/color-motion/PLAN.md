# Color And Microinteraction Timing Improvement Plan

**Status 2026-11-06.** Landed: Patch 4, the timing bands (f721879d, 2026-09-08; reduced motion shrinks the base durations), and Patch 5's control and settings consumers (55ef2737); the bands have since gained `--spw-time-travel` and `--spw-spring-*` (cbcf7045). 0206fb41 gave three operators a dark colour outside Patch 3. Patches 1–3 and 6–9 have not started. Since 2026-10-25, the files this plan owns have changed only in 2739db05 (the copy-motif strip in `components/cards.css`) and b8339b22 (unused tokens removed from `tokens/core.css`), and neither touches timing or operator colour. `effects/material.css` still names `--duration-*` on 4 lines, or 17 with its `--material-duration-*` and `--material-local-duration-*` aliases. Neither it nor `components/cards.css` (2 lines) names a band. Next: the slices below, the badge first (no gate). Every other slice ends at a browser demo. Commit series and landing notes: [HISTORY.md](./HISTORY.md).

## Next slices (2026-11-06)

**2026-11-10:** slices 1 and 2 landed. The badge band reads `--spw-time-control` with its easing kept. The card block and the card lift now multiply durations alone: `.math-lens-card` computed `transition: all 0s` on the live site and now has its six transitions, read in a browser at desktop width. Slice 2 changes how cards feel, so it wants the creator's look at phone width.

Sources: the harmony readings in `.spw/caches/chrome-ecology-2026-11.spw#harmony` (2026-11-05), re-measured in the tree today. Radius and the three undefined shape tokens (`--shape-small`, `--shape-panel`, `--shape-medium`) belong to `component-region-personality` ("One role, many shapes"), not here.

Interpolation is narration, read from lore.land's PLAN.D on 2026-11-08 ([lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw)). A typed number that glides tells the change. A discrete beat stays a step. `--charge` and `--spw-valence` are already registered numbers in `public/css/tokens/core.css`, and each inherits false. Slice 2 is the local case: a card `transition` multiplies a duration-and-easing token, and the whole transition drops. Paint worklets stay imagined. Information stays in the DOM. The badge band stays the next ungated slice. Shape tokens stay with component-region-personality.

1. **Badge band** (Patch 5 leftover; ungated). In `handles/operators/sigils-and-chips.css`, `.spw-expression-badge` (`:832`) times four transitions with `var(--duration-fast, 140ms) ease` (`:847-850`). Name `--spw-time-control` and keep `ease`, so 140ms stays 140ms and nothing a reader sees moves; switching to `--spw-ease-control` (`--ease-precise`) is a feel change and joins slice 4's demo. Verify: `rg -n 'duration-fast' public/css/handles/operators/sigils-and-chips.css` no longer lists the badge; `npm run check:css`; rebuild the core bundle in the same commit.
2. **Card motion repair** (a look). The card block in `components/cards.css` (the `:where(.spw-card, … [data-spw-card])` rule, `:321-323`) multiplies `--component-transition-base` by `--spw-physics-mass` inside `calc()`. That token resolves through `--spw-control-transition-base` (`tokens/core.css:553`) to a duration *and* an easing, so the declaration is invalid at computed-value time and the whole `transition` drops: `.spw-card`, `.math-lens-card` and `.spw-principle-card` lift and tilt without motion. Change: multiply `--spw-time-surface` alone and name `--spw-ease-surface`, keeping mass as the weight. Fixing it turns on motion that has never shipped, so it ends at a demo on `/design/cards/` and `/about/plans/`, judged live (see Patch 6 validation).
3. **One focus ring** (a look). Measured outside `bundles/` on 2026-11-06: of 342 `:focus-visible` rules, 71 set `outline: none` (39 files) and 40 draw a 2px outline. Two rings coexist: the outline from `--focus-ring-color` (`reset/base.css:344`) and the box-shadow `--focus-ring` (`tokens/core.css:989`, dark `:2213`), which 7 files read. The cache's "read in one file" undercounts. A ring drawn only in box-shadow vanishes under `forced-colors: active`, and only `ornament/ornament.css` answers that query. Change: the creator picks the ring (`index.spw#wonder_color_motion_focus_ring`), then one family per commit, chips first. Gate: a demo plus a keyboard pass; the Motion Accessibility Contract below holds.
4. **Role, not element** (opens Patch 6). In the ornament layer, `ornament/whimsy.css:124-130` gives `:where(.spw-chip, button, input[type=button|submit])` the 5px paper corner and a colour-only `--spw-fold-duration` transition, and `:98-103` gives `.plan-card`, `.frame-card` and `.media-focus-card` the same colour-only fold transition. Ornament outranks `effects/material.css` and `handles/`, so a `<button class="spw-chip">` renders by its element and the chip's own radius and timing never show. Change: key the corner and fold timing to role classes, after the card-timing owner is chosen (`index.spw#wonder_color_motion_card_timing_owner`). Order: after `css-cascade-stratification` Phase 1. Rebuild bundles in the same commit. The demo is judged live.
5. **Operator pairs** (opens Patch 3; reading, then a look). For each pair in Patch 3's check matrix, record contrast against `--surface` and the dark ground in light, dark, high contrast and the six packs of Patch 8, here as rows. 0206fb41 already lifted `$`, `%` and pragma at night. Tuning waits on `index.spw#wonder_color_motion_first_color_change`. Stills serve here (`npm run visual:checks` on `/design/palettes/`), because colour holds still in one frame and motion does not.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — topics.card_timing, topics.first_color, seams.cards_css.

**Related:** [microinteraction-motion-lifecycle](../archive/microinteraction-motion-lifecycle/PLAN.md) (archived) · [css-state-legibility](../archive/css-state-legibility/PLAN.md) (archived). **Absorbed 2026-10-06:** [settings-theme-packs](../archive/settings-theme-packs/PLAN.md).

## Public Goal

Improve the site's color coherence, interaction feel, and recognizable behavior without flattening its character. The work should make the palette more intentional, make operator colors easier to distinguish, and make hover/focus/charge/reveal timing communicate behavior clearly instead of feeling randomly animated.

This is not a redesign. The goal is to tune the existing Spw visual language through tokens, semantic aliases, targeted interaction contracts, and a personality audit of the site's most repeated behaviors.

## Current Baseline

Primary source of truth:

- `public/css/tokens/core.css` owns primitive colors, operator colors, material aliases, timing durations, easing curves, dark mode, theme packs, contrast, and reduced-motion tokens.
- `public/css/effects/material.css` owns material lift, hover/focus/active depth, and component surface transitions.
- `public/css/effects/wonder.css` owns delight, charge, resonance, and ambient semantic effects. It now idle-loads with the flourish pack; tokens stay in `flourish-defaults.css`.
- `public/css/handles/operators/` owns operator chips, sigils, compact handles, pressed states, and graspable affordances.
- `public/css/ornament/ornament.css` owns decorative/semi-semantic rails, seams, ribbons, and staged ornament. Same delivery: atmosphere after first paint. Sibling/child combinators are the readable grammar.
- Route files such as `home.css` and `settings.css` bias local identity and should consume shared tokens rather than redefine interaction systems.
- SVG hosts (`public/css/systems/svg-surfaces.css`) should lift with `--material-shadow-lift` and `--duration-base`, not a one-off 10px/28px diagram shadow. Reduced motion may keep the inset and drop the tilt transform.

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

Existing motion aliases (`tokens/core.css:1271-1273`; each is a duration *and* an easing, so it cannot sit inside `calc()`, which is slice 2's defect):

```css
--spw-motion-quick: calc(var(--duration-fast) * var(--spw-motion-scale, 1)) var(--ease-mechanical);
--spw-motion-settle: calc(var(--duration-base) * var(--spw-motion-scale, 1)) var(--ease-settle);
--spw-motion-expressive: calc(var(--duration-deliberate) * var(--spw-motion-scale, 1)) var(--ease-paper);
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
- Repeated behaviors communicate a stable personality: tactile, inspectable, precise, and authored.
- Interaction states can be described in plain language before implementation: acknowledge, settle, reveal, invite, warn, or resonate.
- `npm run check:css`, `npm run check:local`, and `git diff --check` pass after each patch.

## Out Of Scope

- Do not replace the palette wholesale.
- Do not introduce a design token build system.
- Do not add JS just to animate colors or timing.
- Do not remove the operator color model.
- Do not make dark mode the default visual direction.
- Do not tune every route in one patch.
- Do not use animation for information that must remain accessible without motion.
- Do not treat `@layer` as a load schedule. Motion spend that can arrive late belongs in flourish delivery, not a later cascade layer.

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

## Behavior And Personality Audit

Audit interactions as repeated site behaviors, not isolated effects.

Behavior vocabulary:

- `acknowledge`: a fast response that confirms input.
- `settle`: a short return to rest after movement or state change.
- `reveal`: a deliberate appearance of hidden structure.
- `invite`: a hover or focus state that suggests the next action.
- `warn`: a contrast or timing change that protects the user from accidental action.
- `resonate`: a semantic echo between related operators or concepts.

Usual behavior contract:

- Each repeated component should have a named default behavior and a small set of named state changes.
- A call or handoff can refer to a behavior by name, such as `operator-chip invite` or `frame-card settle`, and the relevant CSS should be findable by that name or nearby selector.
- Component development sessions should tune behavior where it is visible first, then decide whether the pattern deserves a shared token.

Audit questions:

- Does the same behavior use the same timing band across chips, cards, controls, and mode switches?
- Does the color state communicate meaning before animation is noticed?
- Does reduced motion preserve the same personality through color, border, shadow, and opacity?
- Does the behavior feel authored here, or does it feel like generic UI chrome?
- Can the next editor find the token or selector by searching the behavior word?
- Does the component's CSS document the HTML state that produces the visible behavior?

## Color Seed References

Use color seeds as reference material for palette roles, not as direct token replacements.

## Theme Pack Depth Axes

Evaluate existing theme packs with the same axes used for new color seeds.

Axis vocabulary:

- `field`: page atmosphere and route background.
- `surface`: readable card, panel, and specimen material.
- `signal`: focus, active line, route glint, or resonance cue.
- `marker`: small selected, pinned, collected, or warning state.
- `depth`: shadow, lower register, history, or inspectable layering.
- `behavior`: the usual state the pack should clarify first.
- `light`: the staging logic that makes behavior legible.
- `spell`: the replayable move the color or timing should make easier to repeat.
- `cauldron`: the gathered ingredients a learner can collect before forming a prompt or component change.

Current pack readings:

- `neutral-paper`: quiet field, readable surface, teal structure, amber light marker, shallow depth, `settle` behavior.
- `oxide-ledger`: cool ledger field, pale surface, oxide emphasis, teal line, record-like depth, `reveal` behavior.
- `electric-studio`: blue-white field, crisp surface, cyan signal, violet/blue marker, diagnostic depth, `resonate` behavior.
- `ritual-vellum`: warm vellum field, cream surface, amber signal, violet marker, ceremonial depth, `reveal` behavior.
- `copper-brace`: forged warm field, tactile paper surface, copper marker, teal structure, constrained depth, `warn` behavior.
- `glass-console`: cool field, transparent surface, teal/blue signal, glass layer marker, inspectable depth, `invite` behavior.

Lighting readings:

- `side light`: reveal texture, fiber, seam, and edge without changing layout.
- `footlight`: mark the active or current object with a low warm signal.
- `backlight`: separate stacked surfaces without increasing border noise.
- `blackout`: remove nonessential motion and glow in reduced-motion or dense contexts.
- `table light`: focus a route on one shared object while preserving surrounding notes and links.

Spell and cauldron readings:

- `spell`: use color and timing to make a repeated action recognizable on return.
- `cauldron`: use small markers, collected states, and material roles to show ingredients gathering without implying completion.
- `ground`: give any generative metaphor one route, component, or HTML owner where the next move becomes concrete.

Use constraints:

- Keep theme packs as global family choices; use color seeds for smaller route or component experiments.
- Do not let a pack erase operator color distinction.
- Check every pack in light, dark, and auto mode before promoting new shared aliases.
- Let a component session prove the behavior before changing pack-wide token values.
- Treat lighting as contrast and state first; avoid adding atmosphere that weakens reading.

### Seed - Woven Signal Stack

Reference: layered teal paper blocks, cream fiber slab, rusted copper squares, amber signal line, and a flowing ochre/russet fiber stream.

Extracted roles:

- `field`: muted green-gray background for calm route atmosphere.
- `deep-surface`: blue-black teal for stacked panels, code surfaces, and inspectable depth.
- `paper-surface`: warm cream for readable foreground cards and editorial surfaces.
- `signal`: amber-gold for thin lines, focus traces, and active route glints.
- `oxide`: rust/copper for warning, artifact, or grounded material accents.
- `fiber`: ochre/russet gradient for motion, resonance, or carried attention.

Use constraints:

- Use the seed to test contrast and relationship, not to recolor the entire site.
- Prioritize operator distinction before adopting the atmospheric field colors.
- Treat `signal` as a line/accent role; avoid turning it into a broad background.
- Treat `oxide` as a grounded accent; avoid using it for generic destructive/error states unless the semantic fit is clear.
- Keep paper and deep-surface roles paired so the palette does not collapse into a one-note dark theme.

Intern assignment candidate:

- Title: `design-palette-woven-signal`
- Work type: `experiment`
- Reference set: this seed image, `/design/`, `/design/palettes/`, `public/css/tokens/core.css`, and one card-heavy route.
- UX question: can the design route gain a clearer inspectable material hierarchy using field, paper, deep-surface, signal, and oxide roles?
- Expected change: route-local CSS or component-local tokens first; promote to shared role tokens only after comparison.
- Validation: light/dark contrast, keyboard focus visibility, narrow viewport, and no operator color collisions.

### Seed - Folded Amber Register

Reference: layered handmade paper rectangles, teal structural mass, translucent amber panes, oxide-red depth, small copper pins, and a soft gray-green wall.

Extracted roles:

- `ambient-wall`: pale green-gray for calm page fields and low-contrast route backdrops.
- `register-teal`: deep muted teal for primary structural cards, catalog panels, and inspectable component blocks.
- `paper-lit`: warm cream for foreground reading slabs and specimen surfaces.
- `amber-pane`: translucent amber for overlays, glows, active panes, and warm affordance hints.
- `oxide-depth`: red-brown/rust for lower-layer depth, historical artifacts, and grounded emphasis.
- `pin-copper`: small copper accent for selected, pinned, or collected states.

Use constraints:

- Keep `amber-pane` translucent or line-like; avoid flooding controls with orange.
- Use `pin-copper` for tiny state markers, not whole-button backgrounds.
- Let `register-teal` carry structure while `paper-lit` carries reading comfort.
- Treat `oxide-depth` as depth and memory, not generic warning.
- Compare with Woven Signal Stack before promoting shared palette aliases.

Intern assignment candidate:

- Title: `component-register-folded-amber`
- Work type: `experiment`
- Reference set: this seed image, `/design/components/`, `public/css/components/cards.css`, `public/css/effects/material.css`, and one settings/control component.
- UX question: can a component communicate selected or pinned state with small copper/amber markers while keeping the reading surface calm?
- Expected change: one component-local experiment on card or control state, documented by selector names that match the HTML state.
- Validation: keyboard focus, selected/pressed distinction, reduced-motion state, and narrow card layout.

### Seed - RPG Wednesday Veil Table

Reference: teal story field, map paper, gold writing, floating globes, warm table cube, and dim collaborative figures around a tabletop scene.

Extracted roles:

- `story-field`: deep teal-green atmosphere for RPG and campaign surfaces.
- `map-paper`: worn cream for readable maps, notes, and session artifacts.
- `lantern-core`: warm amber for the central active object or current turn focus.
- `scribe-gold`: thin gold for annotations, route traces, and quiet metadata.
- `veil-globe`: soft cyan for floating hints, memory bubbles, and optional guide marks.
- `table-shadow`: dark green-brown for grounding dense play surfaces.

Use constraints:

- Keep the glow centered on the active object or chosen state.
- Use gold as trace writing or fine lines, not broad text color.
- Preserve readable map-paper surfaces; do not let atmosphere overpower copy.
- Treat globes as optional hints or memory markers, not required navigation.

Intern assignment candidate:

- Title: `rpg-veil-table-resonance`
- Work type: `experiment`
- Reference set: this seed image, `/play/rpg-wednesday/`, `/design/palettes/`, and one card or capture-frame component.
- UX question: can an RPG route feel more collaborative and charged while keeping maps, notes, and actions readable?
- Expected change: route-local palette or ornament test first; no global RPG palette until the behavior works on a real route.
- Validation: mobile readability, link focus, map/note contrast, and no loss of static HTML comprehension.

### Seed - Rice Paper Vellum Fold

Reference: thick translucent cream paper, fibrous edge texture, warm brown fold lines, soft blue-gray background, and a curled card-like foreground surface.

Extracted roles:

- `vellum-surface`: cream-white translucent foreground for cards, panels, and specimen sheets.
- `fiber-edge`: warm brown edge tone for fold lines, active seams, and tactile boundaries.
- `paper-glow`: soft internal light for reveal and focus states.
- `cool-ground`: blue-gray background restraint that keeps warm paper readable.
- `fold-shadow`: low, warm shadow for depth without glassiness.

Use constraints:

- Treat translucency as a foreground material, not a full-page wash.
- Keep fibers and edge marks subtle enough that text stays primary.
- Use folds to explain card state or surface depth, not as decorative texture everywhere.
- Test on a single component family before adding shared material tokens.

Intern assignment candidate:

- Title: `component-vellum-fold-surface`
- Work type: `experiment`
- Reference set: this material seed, `/design/components/`, `/design/palettes/`, `public/css/effects/material.css`, and one `.frame-card` specimen.
- UX question: can a foreground card reveal depth and tactility while CSS still documents the HTML slots and states?
- Expected change: component-local material test on one card family, with selectors grouped by default, focus, reveal, and reduced motion.
- Validation: text contrast, focus outline, reduced-motion behavior, compact viewport, and no layout shift.

## Patch 1 - Color And Motion Audit

Goal: produce a concrete map of where colors and timings are currently defined and overused.

Files to inspect:

- `public/css/tokens/core.css`
- `public/css/effects/material.css`
- `public/css/effects/wonder.css`
- `public/css/handles/operators/`
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

- Add the audit as rows in this plan.
- Identify the top 10 repeated raw color expressions.
- Identify the top 10 direct transition duration/ease combinations outside `core.css`.
- Identify which interactions should be tuned first.
- Prioritize operator distinction before surface warmth because operator colors carry semantic meaning; surface warmth is atmospheric.
- Record whether each candidate change should be a primitive adjustment, a role alias, or a component-local override.

Validation:

- No code changes required for this patch unless adding documentation.

Slices (one commit each, documentation only): **1A colour** counts repeated colour math and operator collisions and marks each value primitive, role or component-local; **1B timing** counts direct duration and easing pairs outside `core.css` and names which interactions should share a band. Slice 5 above starts 1A on the operator pairs.

## Patch 2 - Palette Role Tokens

Goal: clarify color roles without changing every selector.

Primary file:

- `public/css/tokens/core.css`

Secondary consumers:

- `public/css/effects/material.css`
- `public/css/handles/operators/`
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

Slices: **2A** adds the smallest alias set to `tokens/core.css` with no consumer; nothing renders differently, so it is ungated. **2B** moves `effects/material.css`, `components/cards.css` and `handles/operators/` onto the aliases one file per commit, wherever an alias reads better than the primitive it replaces. `css-architecture-readability` Patch 3 (component tokens) now lands here.

## Patch 3 - Operator Color Distinction Pass

Goal: make operator hues distinguishable in dense UI while preserving the semantic palette.

This is the first visible color-tuning priority. Operator colors are semantic handles, so they should be clarified before broader atmospheric warmth changes.

2026-10-25 note: 0206fb41 (2026-10-13) gave `$`, `%` and pragma (`--op-meta-color`, `--op-normalize-color`, `--op-pragma-color`) a dark value in `tokens/core.css`, lifting them from 2.3–3.2:1 to 7.7–9.4:1 on the dark ground. It is operator-hue work that landed outside this plan, so the first-color wonder (`index.spw#wonder_color_motion_first_color_change`) reads against it.

Primary file:

- `public/css/tokens/core.css`

Consumers:

- `public/css/handles/operators/`
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

Slices: **3A** tunes only the colliding hues in `tokens/core.css`, after slice 5's rows, and is checked in dark and high contrast in the browser. **3B** then carries borders, soft backgrounds and emphasis into `handles/operators/`, `grammar/syntax.css`, `effects/wonder.css` and `ornament/ornament.css`. Chip paint goes through `--operator-chip-*-intent` on the surface, never a direct paint.

Creative proposal (feel; ends at a demo): let the matrix teach as it is checked. A `/design/palettes/` specimen could set each close pair side by side as two chips with their sigils. Each pair would be captioned with the `interaction` lines from `public/js/kernel/operator-detection.js` that tell the two apart. For `&` and `=`, those are "name the subject or binding focus of a relation" and "name, pin, or categorize a local value". A reader learns the distinction the hue has to carry, and the creator judges it on the same plate.

## Patch 4 - Interaction Timing Bands

Landed: f721879d (2026-09-08). Six `--spw-time-*` bands (ack, control, surface, reveal, ambient, ritual) and five `--spw-ease-*` bands alias the primitives in `tokens/core.css:1280-1291`, so reduced motion reaches every consumer through them; `--spw-time-travel` (`:1303`) and the springs came with cbcf7045. First consumers: `handles/operators/tokens.css` and `systems/svg-surfaces.css`. Operator chips set the tactile baseline; cards, mode switches, settings controls and ornament harmonize with chip timing instead of starting their own. The rules still hold for every later family: migrate one family per commit, and leave keyframe durations alone until ordinary transitions agree. The family order (cards and surfaces, then wonder and ornament) is `^"next"` in `.spw/caches/timing-bands-handoff-2026-09.spw`.

Validation for any migration: `rg -n "var\\(--duration-|var\\(--ease-" public/css/effects public/css/handles public/css/components` shrinks; `npm run check:css`.

## Patch 5 - Control And Handle Microinteraction Pass

Landed: 55ef2737 (2026-09-08), `handles/phase-controls.css` and `routes/surfaces/settings-forms.css` ride ack for hover and focus colour, control for pressed border and transform, surface for category settle; `components/controls.css` had no primitives to alias. Left: the expression badge (slice 1 above). The feel these bands aim at, and the words a demo is judged by:

```text
hover/focus: immediate recognition, no drama
pressed/selected: firm, slightly slower settle
disabled: no movement, clear color desaturation
metadata reveal: delayed enough to avoid flicker, fast enough to feel inspectable
```

`aria-pressed="true"` stays visibly stronger than hover. Layout-affecting dimensions do not animate where opacity, colour, transform or shadow can carry the change.

## Patch 6 - Card And Surface Timing Pass

Goal: make cards and material panels respond with a shared surface timing grammar.

Order: after `css-cascade-stratification` Phase 1. `material.css` sits in the effects layer, and Phase 1 changes whether route rules outrank effects and ornament, so card timing reviewed before the flip could change after it.

Files:

- `public/css/ornament/whimsy.css:98-103` and `:124-130` (co-target; slice 4). In the ornament layer it sets `.plan-card`, `.frame-card` and `.media-focus-card` border and background transitions with `--spw-fold-duration`, and chip and button corners and transitions by element, which outranks `material.css` by layer. Decide which sheet owns card timing before migrating it (`index.spw#wonder_color_motion_card_timing_owner`).
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

- Visual check on homepage cards, `/about/plans/`, `/topics/`, `/settings/`.
- Reduced-motion check.
- Judged live or from a recording, never from stills: a still is one frame, so timing and motion are judged live. `npm run visual:checks` also pins `data-spw-capture-mode="screenshot"`, which hides floating chrome, the section handle and the state inspector (`public/css/modes/capture.css:7-35`) and pauses animated SVG flows (`:40`).

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
- Then check `/`, `/about/website/`, `/design/`, and one content-heavy route.

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
- `npm run check:local`

## Validation Loop

Always run:

```sh
npm run check:css
git diff --check
```

Run for token, mode, or broad interaction changes:

```sh
npm run check:local
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
- `/about/website/`
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
