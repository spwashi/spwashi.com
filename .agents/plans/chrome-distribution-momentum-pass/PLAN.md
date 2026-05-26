# Chrome Distribution + Momentum Pass

## Public Goal
Refine the site's primary navigation, footer, ornament application, linking surfaces, and spell-driven flow so the experience has clearer visual rhythm, better mobile ergonomics, consistent distribution of decorative and functional weight, and stronger "momentum" (the feeling that navigation, spells, and transitions carry the visitor forward naturally).

This is a craft-quality / polish pass following the recent runtime load instrumentation and site-rhythm ornament work. It prioritizes shared surfaces over per-route changes.

## Scope (smallest honest surfaces)
- **Nav menu layout + mobile responsiveness**: `public/css/shell/chrome.css` (`.site-header`, nav rules), `public/js/runtime/navigation-spells.js`, `public/js/runtime/attention-architecture.js` (section handle integration), possible tiny data-attr or class enhancements. Avoid rewriting header HTML structure.
- **Footer layout + mobile responsiveness**: `public/css/shell/chrome.css` (`.site-footer` grid and stacking), ensure semantic `<footer>` / `.site-footer` patterns remain consistent. Use existing safe-area and clamp tokens.
- **Ornament distribution**: `public/css/ornament/ornament.css` (and related relational-state, whimsy), integrate the new `.spw-site-rhythm` where it adds value on chrome elements without new visual noise. Prefer existing primitives (rails, meters, nodes, sequences).
- **Linking surface distribution**: Consistent visual weight and operator/ornament treatment on navigation links, page-index, frame-operators, card links, etc. (operators.css + chrome + ornament). Improve how links participate in rhythm/momentum.
- **Momentum through spells**: `public/js/runtime/spells.js`, `public/js/runtime/navigation-spells.js`, `public/js/runtime/experiential.js`, related haptics/bus feedback. Enhance perceived flow (better state transitions, visual grounding during navigation, spell affordance distribution) using CSS + existing progressive JS patterns. No new heavy modules.

Related files that may receive light touches only if they are the smallest carrier:
- `public/css/handles/operators.css`
- `.spw/conventions/ornament-contract.spw`, `cognitive-navigation.spw`, `interaction-grammar.spw`
- `public/js/runtime/frame-navigator.js` (only if nav momentum requires it)

**Explicitly out of scope for this pass** (to keep smallest):
- New routes or large content changes
- New JS runtime features or frameworks
- Per-route HTML rewrites (only semantic attribute or tiny structure tweaks if absolutely required for accessibility/responsiveness)
- New npm packages

## Background & Related Work
- Recent: runtime-load-instrumentation plan + site-rhythm ornament (`.spw-site-rhythm`, `--spw-site-rhythm-*` tokens) — this pass should distribute and consume that ornament on chrome surfaces.
- Existing plans: chrome-navigation-wonder/, shell-harmony-pass/, mobile-runtime-foundation/, menu-containment-navigation/, cognitive-navigation/, interaction-grammar/, spell-cognition-familiarity/, component-rhythm-variety/.
- Key systems: attention-architecture (mobile section handle + reading beats), navigation-spells (tokenization of links), spells + haptics (grounding + checkpoints), ornament layer (top of cascade), data-spw-* state on root/chrome.

## Design Principles for This Pass (per AGENTS + site model)
- Mobile-first, touch-friendly (adequate targets, no hover-only critical paths, safe-area insets).
- Rhythm & distribution: Ornaments and linking affordances should feel evenly "weighted" across surfaces. Use the new site-rhythm tokens + existing tempo/harmony fields.
- Momentum: Navigation and spells should feel continuous (clear active/grounded states, subtle transitions, replayable checkpoints). Spells are the primary mechanism for "carrying momentum" across visits.
- Semantic HTML preserved: header > nav, main, footer.
- Progressive enhancement: Core nav/footer/links work without JS; JS adds polish, spell state, and rhythm.
- Ornament only in the ornament layer; no layout ownership.
- Editor inspectability: New or refined states should be readable via data attrs and the existing console/inspection surfaces.

## Planned Minimal Patches (in priority order)
1. **Nav + mobile**:
   - Improve `.site-header` / nav stacking, touch targets, and scrolled states in chrome.css.
   - Better integration of nav links with attention section-handle and site-rhythm on mobile.
   - Minor enhancements to navigation-spells for clearer active-route or momentum state (data attrs only).

2. **Footer + mobile**:
   - Update `.site-footer__inner` grid → responsive (stack or refined two-column on narrow viewports) using existing clamp + media tokens.
   - Ensure ornament and linking elements inside footer participate in rhythm without crowding.

3. **Ornament distribution**:
   - Apply `.spw-site-rhythm` (or data-spw-ornament="site-rhythm") subtly on header/nav or footer chrome where it enhances "living" feel.
   - Refine existing ornament rules on linking surfaces and chrome for better density balance (use the new rhythm tokens + layer intensities).

4. **Linking surface distribution**:
   - Harmonize visual treatment (operator color weight, ornament nodes/rails, hover/grounded states) across shell nav, page-index, frame-operators, card links.
   - Make linking surfaces better consumers of site-rhythm and spell momentum states.

5. **Momentum through spells**:
   - Strengthen visual/transition feedback when spells are cast or navigation occurs (e.g., better grounding pulses, state on active links during transition).
   - Improve distribution of spell affordances (checkpoints, recent paths) in nav/footer chrome.
   - Small CSS + data-attr updates so the "flow" feels more continuous on desktop and mobile.

## Contracts & .spw Updates
- If refined states or new ornament usage on chrome emerge, document in `.spw/conventions/ornament-contract.spw` (extend site_rhythm_ornament or add chrome-specific notes) and reference from `site.spw` + page-model if needed.
- Note any new interaction-grammar or cognitive-navigation implications.

## Validation
- `git diff --check`
- `node --check` on any edited JS
- `npm run check` (full suite)
- Targeted rg for selectors, data-spw-* patterns, and new rhythm usage
- Manual review on desktop + narrow viewports (nav/footer stacking, touch targets, ornament subtlety, spell feedback during navigation)
- Preserve all existing copy, analytics, metadata, and semantic structure
- No behavior breakage for non-JS or reduced-motion users

## Status
- [ ] Plan created
- [ ] Exploration complete (nav, footer, ornament, linking, spells)
- [ ] Smallest surfaces identified and patches executed (CSS-primary)
- [ ] .spw contract updates (if any)
- [ ] Full validation passed
- [ ] Changes are minimal, surgical, and rhythm/momentum-aware

This pass builds directly on the load instrumentation + rhythm ornament foundation to make the entire chrome feel more cohesive and "alive" across devices.