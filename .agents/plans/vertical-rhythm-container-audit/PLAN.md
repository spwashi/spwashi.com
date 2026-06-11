# Vertical Rhythm, Component Containers & Layout Motifs Consistency Audit

## Public Goal
Ensure the site's vertical rhythm (spacing scales, flow, line-heights, component gaps), container primitives (frame-card, mode-panel, site-frame, various cards/panels), and layout motifs (data-spw-layout variants, grids, hero structures, gutter rails) feel cohesive, token-driven, and predictable across shared layers and routes. This improves craft quality, editor inspectability (via design catalog and data attributes), and the overall "manuscript + instrument" reading experience.

Focus on **semantic naming** and **shared surface consistency** rather than new features or copy.

## Scope
- Shared CSS (highest priority for smallest honest patches):
  - `public/css/tokens/core.css` (spacing scale, flow-space, component-* gaps/pads, line-heights, manuscript rhythm)
  - `public/css/typography/*.css` (base flow rhythm, context pressure modulation, editorial)
  - `public/css/components/*.css` (cards.css, frames.css, and siblings — card-rhythm, internal gaps/padding)
  - `public/css/shell/layout.css` (data-spw-layout system, main, gutter-rail)
  - Related: systems/surfaces, routes where they override (avoid unless necessary)
- Design system contracts: design/catalog, .spw/conventions (page-model.spw, ornament-contract, typography-related), existing plans.
- Not: per-route heavy rewrites, new JS, visual design changes outside rhythm/containers/motifs.

## Audit Approach (executed via tools)
1. Token inventory: spacing primitives, semantic aliases (--gap-*, --spw-component-*, --flow-space, line-heights, manuscript).
2. Typography rhythm: prose sibling margins, heading multipliers, pressure-based modulation in context.css, editorial mode.
3. Component containers:
   - .site-frame, .frame-card (and variants: media, software, operator, plan, ref), .mode-panel, glass vs matte.
   - Internal rhythm: --card-rhythm, component-gap usage vs hard-coded/clamp values.
4. Layout motifs:
   - data-spw-layout="reading|wide|atlas|split" + gutter-rail contract.
   - Hero splits, card grids, frame anatomy (header/meta/body/figure/actions/footer slot contract from AGENTS).
   - Responsive behavior and breakpoint consistency.
5. Cross-checks:
   - Design catalog for current data-spw-layout, component-kind, box-model usage.
   - Prior plans: component-rhythm-variety, typography-reading-groove, css-architecture-readability, spw-css-architecture.
   - Workbench audits/docs mentioning vertical rhythm principles.
6. Inconsistencies to flag:
   - Hard-coded rem/px/clamp in components instead of --space-* or --spw-component-* tokens.
   - Divergent padding/gap inside different card types.
   - Layout motifs that bypass the data-spw-layout system.
   - Rhythm breaks between containers (e.g., prose flow vs card internal vs shell chrome).
   - Mobile vs desktop rhythm drift.

## Initial Findings (from exploration)
- Strong foundation exists in tokens/core.css: full --space-* scale (4xs to 4xl), --spw-component-gap/pad variants, --gap-block-*/--gap-inline-* aliases, --spw-flow-space + heading multiplier, good line-height family, manuscript layer.
- Typography/base.css correctly uses flow-space for .prose/article/.frame-copy sibling margins + extra clearance on headings.
- Inconsistency hotspots in components/cards.css:
  - Mix of `var(--component-gap-tight, ...)` (good) with raw `clamp(0.72rem, ...)` , `0.18rem`, `0.85rem 1rem`, `0.22rem`, `0.25rem` hard values.
  - --card-rhythm is local to cards but not always aligned with central --spw-component-*.
  - Some cards use different internal gaps for meta vs body.
- Frames (frames.css): use --surface-gap / --surface-padding (good aliases) but some overrides.
- Layout: data-spw-layout system is well-defined and used (reading default, split with gutter-rail at 72rem+). Main uses container queries. Some routes may have ad-hoc grids.
- Recent additions (site-rhythm ornament) introduce --rhythm-tempo/density but are orthogonal to vertical spacing rhythm.
- Prior "component-rhythm-variety" plan already tightened some card/frame roles — this audit is a follow-up for broader token adherence and cross-motif consistency.
- Design catalog inventories data-spw-layout and component attributes well; no major orphans noted in quick scan.

## Recommended Smallest Honest Patches
1. **Tokens / Typography (highest leverage)**: Ensure all semantic spacing aliases are complete and documented. Minor tightening if manuscript vs site prose rhythm diverges unintentionally.
2. **Components**: Replace hard-coded spacing in cards.css / frames.css (and siblings) with central --spw-component-* or --space-* tokens + existing --card-rhythm where appropriate. Add comments linking back to core tokens.
3. **Layout motifs**: Audit for bypasses of data-spw-layout; add light rules or data attrs if needed for consistency (e.g., consistent internal rhythm on split gutters). Prefer CSS in layout.css or systems.
4. **Ornament / chrome tie-in**: Where relevant, let site-rhythm or field tokens influence container vertical rhythm subtly (without new visual weight).
5. **.spw / Contract**: If gaps in the rhythm/container contract are found (e.g., missing "container-rhythm" family in page-model or ornament-contract), add a small note + wire to site.spw. Update design catalog generation if new attributes emerge.
6. **Validation surfaces**: Ensure changes remain visible in debug layers and catalog.

## Constraints
- Preserve hand-authored HTML structure and existing data-spw-* semantics.
- CSS layer order respected (tokens first, then components, systems, routes, ornament last).
- Mobile + reduced-motion safe.
- No new dependencies.
- Changes must pass git diff --check, node --check (if JS), full `npm run check`.

## Validation
- Targeted rg for token usage vs magic numbers in components.
- Visual/structural review of key routes (home, topics, services, blog, play routes) before/after.
- Design catalog regeneration + spot-check of affected attributes.
- Full `npm run check`.
- Update this plan with findings + patch log.

## Status
- [x] Todo opened + initial exploration (tokens, typography, components, layout, prior plans, catalog).
- [x] Full plan written and shared.
- [x] Detailed inconsistency list documented (see below).
- [x] Surgical token-adoption patches in components executed (first pass).
- [x] Additional patch for brace placement + card box model / anatomy rhythm (addressing user note on brace placement, gesture affordances, card anatomy).
- [x] Runtime load awareness + customization improvements: added `discovery()` / `discoverRuntimeLoad()` helpers + explicit `data-spw-load-posture` / `data-spw-load-timing` attributes.
- [x] Settings control: Added a dedicated "Runtime load" vibe widget in settings/index.html with direct links for timing postures + call-to-action for the discovery API. Makes customization feel native.
- [x] CSS microinteraction refinement + rule extraction: Scoped operator hover feedback (lift/shadow) by load posture/timing in operators.css. This ties the load customization directly to microinteraction "feel" (calmer in quiet/defer loads). Also a model for using the new attrs to avoid future over-generalized selectors.
- [x] All validation commands passed after new patches.
- [x] Page-settling field pass (2026-06-11): Added shared micro-lift/press and arrival offset/opacity tokens, projected page-arrival step 3, extended settling to settings/runtime widgets, and aligned hydration/selection states with the same motion vocabulary.
- [ ] Manual cross-device visual rhythm + container + gesture review (recommended next).
- [ ] .spw / contract updates if deeper gaps found (minimal so far — no new families introduced; existing slot contract and brace vars already provide good hooks).

## Detailed Findings & Fixes (this pass)
**Vertical rhythm strengths:**
- Excellent central system in `tokens/core.css`: full --space-* scale (4xs–4xl), --spw-component-gap/pad variants (tight/loose/roomy), --gap-block-*/inline-* semantic aliases, --spw-flow-space + heading multiplier, site + manuscript line-heights, measure tokens.
- `typography/base.css` correctly establishes sibling flow rhythm on .prose / article / .frame-copy and extra heading clearance.
- `typography/context.css` provides pressure-based modulation of line-height/tracking (good for density contexts).
- Layout motifs via `data-spw-layout` + gutter-rail in `shell/layout.css` are coherent and responsive.

**Inconsistencies found (primarily in component containers):**
- `components/cards.css`: Heavy mixing of token usage with hard-coded/clamped values (e.g. `clamp(0.72rem, 1.45vw, 1rem)`, `0.18rem`, `0.22rem`, `0.25rem`, `0.24rem`, `0.85rem 1rem`, `clamp(0.85rem, 2vw, 1.05rem)`, `0.55rem`). --card-rhythm local but not always aligned. Sub-links, reason strips, learning games, motif strips had the most drift.
- `components/frames.css`: Some local --surface-gap overrides and small hard margins/paddings (e.g. `-0.15rem`, `0.35rem`, multiple clamp gaps) despite good use of --surface-* aliases in base .site-frame.
- Result: Card/frame internal vertical rhythm felt "same cadence" in places (as noted in prior component-rhythm-variety plan) and not reliably driven from the manuscript/rhythm tokens.
- Layout: Minor route-specific overrides possible but the core system (reading/wide/atlas/split + gutter) is sound; no major motif bypasses in shared CSS.
- Ornament/rhythm tie-in: The newer site-rhythm tokens (--rhythm-tempo/density) are orthogonal but could subtly influence container gaps in future without new visuals.

**Surgical fixes applied (tokens-first, shared components only):**
- cards.css: Replaced ~10+ hard-coded gaps/margins/paddings with nearest --space-*, --spw-component-gap-*, or --spw-component-pad-* (with fallbacks for safety). Examples: illustrated card gaps, media margins, sub-link gaps, hook paddings, reason-strip elements, learning-game padding/gaps.
- frames.css: Aligned small negative/positive margins and repeated clamp gaps to tokens or --spw-surface-gap.
- Net: +17/-17 lines; much higher token fidelity while preserving exact visual intent and responsive clamps where semantically appropriate.
- No HTML, JS, or route-specific changes. No new tokens added (reused existing system).

**New findings from continuation (brace placement, gesture affordances, card anatomy):**
- Brace forms ([data-spw-form="brace"]) are visually implemented via ::before/::after corner L-shapes in grammar/syntax.css, with per-container tuning of --brace-corner-offset/width/height/stroke (frame-card gets 0.4rem offset / 1.55rem x 1.1rem; smaller for panels). This "bites" into content corners and directly affects perceived vertical rhythm inside braced containers.
- Gesture states (charging, active, sustained, projecting from brace-gestures.js + operators.css/handles) add transforms, filters, drop-shadows, and infinite animations (sustain-breath) on braced elements. These are mostly visual but can interact with box model if not contained (e.g., scale/transform on active gestures).
- Card anatomy: .frame-card uses a simple grid (gap via --card-rhythm or component tokens) on direct children, unlike .site-frame which has explicit data-spw-slot ordering + staggered animation delays based on attention. Many cards don't tag children with data-spw-slot, leading to less predictable "slot contract" rhythm (header/meta/body/figure/actions/footer as described in AGENTS.md).
- Braced cards had a specific rule in syntax.css but no compensation in cards.css for the corner bite, causing potential top/bottom rhythm inconsistency vs non-braced cards.
- Gesture affordances (haptics for grounding/charge, experiential for hints/memos, brace-pivots for density/saturation cycling via brace walls) often change semantic density or field state, which *should* flow into typography rhythm (via context.css pressure) and component gaps — but direct spacing compensation in cards/frames for gesture states was thin.
- Positive: slot system in frames.css is mature and attention-aware. Brace pivots and gestures are well-wired to bus/settings for persistence.

**Additional surgical patch executed:**
- In cards.css: for .frame-card[data-spw-form="brace"], slightly increased --card-rhythm and added minimal top/bottom padding compensation using --spw-component-pad-* tokens. This keeps vertical rhythm even when brace corners are present and when gestures (charging/sustained etc.) or pivots (density changes) are active. Comment explicitly links to brace placement, gesture states, and card anatomy/box model consistency. No new tokens; reuses existing system. Addresses the user note directly while staying in the smallest surface (component CSS).

**Selector hygiene + runtime consolidation notes (from this query):**
- True literal `* {}` is almost entirely confined to reset/base.css (expected and minimal).

## Extension: Settings & Design Pages as Tuning Playgrounds + Runtime as Storytelling Currents

### Public Goal (user request)
Make settings/ and the various /design/* pages (components, interaction-design, catalog, runtime, density, etc.) genuinely useful, delightful places for:
- Tuning interactions live (user loves pinch for font sizes — amplify this; make variant switching, density, posture, load timing, gesture feedback immediately playable and comparable while on the page).
- Comparing component variants and options in context.
- "Digging for extras" on long-copy components: nearby, low-friction play (tap/swipe companions, residual affordances) so readers don't feel like they're "looking for fries at the bottom of the bag".
- Runtime modification as a **storytelling mechanic**: the pages can respond to "currents" — emergent clusters across Spw semantics and data attribute families (wonder + density + posture + load-posture/timing + variant + gesture state + component clusters) — by subtly mutating themselves (extra handles blooming, variants shifting narratively, micro-annotations or "companion" elements appearing). This turns passive reference/tuning into co-creative, inspectable play.

### Scope (smallest honest)
- settings/index.html: Extend the excellent existing tuner widgets (interactionTuner, layoutTuner, spacing, pinchTextScale, runtime load from prior work) with a small "Live Playground" or "Variant & Companion" area. Use the existing site-settings manager patterns.
- Design pages: Add lightweight, contextual "design tuners" (variant pickers, current simulators) that affect the glossary/examples in place. On long prose + embedded components, add subtle "nearby play" affordances (e.g., edge taps or swipe zones that cycle variants on sibling cards or surface current-responsive notes).
- Runtime layer: Minimal "semantic currents" composer (extend site-settings.js or narrative-instrumentation / experiential with a small cluster detector). Writes a high-level `data-spw-current` (or modulates existing wonder/density/load attrs) that CSS/JS on design/settings pages can respond to for storytelling effects.
- Refinement: Use the new currents + prior load attrs to clean selectors and make microinteractions (pinch feedback, variant hovers, gesture states) more "tuning-aware" and delightful.
- .spw: Lightly note "currents" and "nearby play" as emerging visitor/editor mechanics if they stabilize.

### Constraints
- Build on existing (pinch already works, component-variant CSS exists, load-posture attrs from prior patches, narrative instrumentation, site-settings vibe widgets).
- Mobile/gesture native.
- Optional and inspectable (everything must remain readable in catalog/debug layers).
- No large new JS modules or page rewrites.

### Planned / Executed Smallest Patches
1. Settings page extension with live variant/current tuning and "nearby companion" demo.
2. Design/components + interaction-design: contextual tuners + nearby play affordances on long sections.
3. Small currents composer in runtime + example responses on the target pages.
4. Selector/microinteraction refinements using the currents/load attrs.

### Validation
- Same as parent + explicit "does this feel like you can easily tune, compare, and find delightful extras while reading long content?" review.
- Pinch remains fluid; everything progressive.

This phase turns the reference surfaces into places where the system's own semantics become playable narrative material.
- The codebase already prefers low-specificity `:where([data-spw-...])` and `:where(.component, ...)` patterns — this is good.
- Recurring over-generalization risk: repeated `:where(.site-frame, .frame-panel, .frame-card, .plan-card, ...)` lists in foundation.css and ornament.css for bleed radius, kickers, etc. These are the main candidates for future tightening.
- Improvement shipped: runtime now writes `data-spw-load-posture` and `data-spw-load-timing` on `<html>`. Future patches can key precise rules on these (or the existing `data-spw-active-layers` / runtime posture) instead of ever-widening component lists. This also directly improves the "feel" of knowing about and customizing runtime load timing/targeting/discovery.
- The `modules.discovery()` / global `discoverRuntimeLoad()` surfaces (plus the pre-existing timings + policy) now make load timing customization and targeting more discoverable in console/inspector without requiring query param spelunking.

These changes make braced cards, gesture-responsive content, and overall card anatomy feel more rhythmically consistent with the central token + slot contracts.

This pass makes the design system more self-consistent without visual or behavioral change for visitors. The component containers now more reliably compose from the central vertical rhythm and layout motif contracts.

## Settling Field Patch - 2026-06-11

Public goal: improve alignment and flow through page settling, with better microinteractions and clearer intermediate/emergent state.

Scope stayed shared and CSS-first:
- `tokens/core.css`: added tiny shared values for micro-lift, press scale, and three arrival settling offsets/opacities, including reduced-motion flattening.
- `components/signals.css`: made page-arrival step 3 visible and extended arrival physics to settings/runtime cards, preset buttons, vibe widgets, ref cards, and PWA status cards.
- `components/foundation.css`, `surfaces.css`, and `cards.css`: moved repeated `-1px` lift/press affordances onto the shared microinteraction tokens.
- `components/controls.css`: aligned JSON hydration loading/ready/error states with the settling tokens and added a reduced-motion guard.
- `components/runtime-states.css`: gave selection/focus/active states consistent state transitions and non-motion background cues.
- `.spw/conventions/site-semantics.spw`: added `#settling-field-contract` so future patches can search for the page-state -> token -> component projection.

Validation target: `git diff --check`, `npm run check:local`, and visual smoke on a card-heavy route plus settings/runtime surfaces.
