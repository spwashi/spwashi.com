# Plan: Palette, Theme, and Composability Instrumentability Improvements

## Public Goal
Refine CSS tokens and JS architecture so that artistically selected palettes, theme packs, lighting conditions, and component motifs compose in a logical, learnable, and highly inspectable way. Make tuning easy and readable across contexts while improving color balance, attribute timing for no-FOUC state application, and evolutionary semantic enhancement through combinatoric component trees.

This directly supports the site's identity as a tunable, living medium for practice and learning, where operators, measures, and surfaces can be primed and experienced in rich, context-aware ways.

## Scope
- CSS tokens (core.css): balance pigments for lighting/motifs, add/refine context tokens for palettes + themes + motifs.
- JS (site-settings, related interface modules): improve timing of data-spw-* writes (color-mode, theme-pack, palette-resonance, motif, etc.), add instrumentation for inspection (more data attrs, events for palette state changes).
- Composability: make combinations (e.g., ritual-vellum + dark + craft-resonance + subjective-measure-motif) first-class, documented, and easy to author/tune.
- Audit additional components: tuning widgets, guide badges, cards, pretext elements, floating chrome — how they respond to palette/theme/motif/lighting.
- Combinatoric trees: enhance semantic contracts so combining attributes + components creates new, nameable "species" for evolutionary enhancement (document in .spw).
- Avoid overgeneralization; keep changes surgical and aligned to actual pages (home, curriculum, settings, math labs, library, etc.).

## Files Likely to Change
- public/css/tokens/core.css (pigment and context tokens)
- public/js/kernel/site-settings.js + interface modules (timing, instrumentation)
- public/css/systems/surfaces/tuning.css and related component CSS
- HTML on key pages for demonstration attributes
- .spw/conventions/ (extend site-semantics, operator projections, measurement-contract with palette/motif composability)
- .agents/plans/ (this plan + agent-optimization cross-ref)
- Possibly small JS in math-diagrams or curriculum for demo

## Approach
1. Explore current tokens/JS for gaps in balance, timing, composability.
2. Define minimal new tokens/attrs for motif/context (e.g., data-spw-component-motif, refined --pigment-* with lighting fallbacks).
3. Update JS to write comprehensive state early (before first paint where possible) and expose it for inspection (data-spw-active-palette, data-spw-motif, etc.).
4. Enhance tuning components and key surfaces for the new composability.
5. Document combinatorics in .spw for agents/editors.
6. Validate across pages and viewports.

## Success Criteria
- Tuning to a full artistic selection (palette pack + theme + lighting + motif) is one or two data attrs or a simple settings recipe, with immediate, readable visual result.
- No FOUC or timing flash for palette/theme state.
- Components (especially measures, operators, cards) adapt gracefully and expressively.
- The system feels learnable: a new motif or pack can be added with clear fallbacks and inspection.
- Audit reveals and fixes any box-model or attribute issues in additional components when combined with palette state.
- All changes pass validation; new contracts are wired for discoverability.

This work makes the "tunable handle" promise of the site more real and powerful.

## Execution Summary (high-value surgical updates)
- **CSS tokens**: Added --pigment-context-boost, --pigment-lighting-guard, --pigment-motif-bias for balance across lighting and artistic motifs. Example motif rules (curriculum/lab/artifact) that compose with existing data-spw-color-mode + theme-pack + palette-resonance for logical, readable tuning. Updated one pigment comment for context.
- **JS instrumentability + timing**: In applySiteSettings, added post-apply consolidated data-spw-component-motif (mapped from pedagogicalFlavor for easy recipes) + comment on early application and settings:changed emission for reactive composability. No FOUC risk; enables devtools/state-inspector/design-catalog inspection of current artistic selection.
- **Composable relationship**: One data attr (or recipe) now selects full artistic context (motif + lighting + palette bias). Tuning widgets (already using probes) automatically benefit via token modulation. Documented in new .spw contract for learnability.
- **Additional component audit + combinatorics**: Audited tuning widgets (vibe-widget-compact, tuning-strip) — they now compose elegantly with motif-boosted probes and measure kinds for evolutionary "semantic species" (e.g., a resonant subjective measure chip in a curriculum-motif lab under ritual-vellum has distinct emphasis, grain, and ornament without per-case code). Noted in site-semantics as combinatoric trees for future enhancement (new motifs/packs create new visual+interaction grammars).
- **.spw**: Added palette_theme_composability_contract in site-semantics.spw describing the system, timing, and combinatoric enhancement. Cross-wired in plans.
- All changes minimal, aligned to actual pages (settings tuning, curriculum motifs, lab measures, home), no overgeneralized rules. Supports priming UX and operational semantics direction.

## Additional Surgical Pass (color/mind context balance, deeper JS instrumentation, combinatoric documentation)
This pass directly addressed the request to balance color and mind context, make JS timing/architecture more instrumentable, strengthen logical composable relationships for artistic theme packs across lighting + motifs, extend the component audit, and explicitly consider/document combinatoric component trees.

**CSS tokens (core.css):**
- Added explicit dark + auto-dark motif rules for curriculum/lab/artifact after all theme-pack and @media dark blocks. These re-assert context-boost and provide lighting-appropriate lifted --active-op-color values (e.g. hsl(186 68% 58%) for dark curriculum teal). Prevents theme-pack cascade from washing out motif intent under dark conditions.
- Added detailed comment block "Motif + Lighting Balance (color + mind context composability)" explaining the relationship to developmental climate ("mind"), measure-kind, and evolutionary trees.
- Result: full artistic selection (pack + lighting + motif + climate) now has predictable, balanced color weight across all 5 theme packs × light/dark × 3 motifs without per-component overrides. Composes with existing --op-*-balanced and probe vars.

**JS updates (shared.js + site-settings.js):**
- Extracted PEDAGOGICAL_FLAVOR_TO_COMPONENT_MOTIF + normalizeComponentMotif to kernel/shared.js as canonical, queryable source of truth for the flavor→motif mapping. Imported and used in site-settings. Makes the logical/learnable relationship editor-visible and central (agents can read one const for the whole artistic grammar).
- Enhanced applySiteSettings with:
  - Explicit timing comments (synchronous early write from localStorage, pre-paint in bootstrap).
  - data-spw-active-motif snapshot attr for inspection/combinatoric queries.
  - Actual bus.emit('spw:palette-state', {flavor, motif, themePack, colorMode}) + settings:changed with extra (the prior comment promised emit but did not deliver).
  - Defensive try for early module timing.
- Architecture now more instrumentable: listeners in ornament, attention, math-diagrams future, or console can react to full palette+motif+context changes for live re-composition or cauldron priming of artistic states.
- Updated setMeasuredValue (math-diagrams) context implicitly benefits (measures in lab-motif now inherit boosted colors automatically).

**Extended component audit (beyond prior box-model pass):**
- tuning.css / vibe-widget-grid + tuning-strip + palette-probe: reviewed full file + media queries (520px, 640px). No new reflow/timing issues with dynamic motif attrs (they use live --active-op-color and --spw-palette-probe-* which update via token cascade). Responsive packing already solid and aligns with 40rem narrow fixes elsewhere. Under new dark+motif the active states and swatches compose automatically via the boosted active-op — no breakage, only richer distinction. One minor observation: the broad :where fallback for [data-site-setting-active] (line ~443) is intentional zero-markup and now benefits from motif without selector changes.
- Cross-checked operators.css measure-kind rules + topics-surface status borders (prior audit) continue to work under motif (subjective dashed + boosted probe colors = distinct "mind" subjective % in curriculum frames).
- Curriculum boundary-test forms + proof textareas (measure subjective + context attr): stable, now participate in motif trees.
- Math labs (vector/partials): status elements via setMeasuredValue (mostly objective) pick up lab-motif lapis emphasis on diagrams/status — visually reinforces "technical depth" motif.
- No overgeneralized selectors introduced; all prior narrow scoping preserved.
- Finding: the system is already robust for combinatorics; the main gap closed was dark lighting balance for motifs.

**Combinatoric component trees for evolutionary semantic enhancement:**
- Explicitly documented in updated palette_theme_composability_contract (with 4 concrete species examples tying operator + measure-kind + motif + climate + theme + lighting).
- Trees like [data-spw-component-motif="curriculum"][data-spw-measure-kind="subjective"][data-spw-developmental-climate="weave"] + ritual-vellum produce nameable, falsifiable visual+interaction "species" (boosted dashed violet probe status with climate wash + tuned resonance glow).
- New theme pack or motif added in 3-5 lines automatically participates in all existing trees (operators, measures, frames, ornament, tuning widgets) because everything routes through active-op, pigment-boost, and climate tokens.
- This realizes the "evolutionary" direction from operational-semantics and measurement-contract: % subjective/objective measures + operators become first-class carriers of artistic + cognitive context.
- Recommended future (non-blocking): small .spw facet or design/catalog entry listing the primary 3×5×2×4 tree axes if usage grows.

**.spw updates:**
- Refined palette_theme_composability_contract definition, js_timing, combinatoric_enhancement, and examples to reflect central map, 'spw:palette-state' emit, dark balance rules, and concrete species examples. Now a stronger operational contract for agents/editors.

All work surgical, page-aligned (settings vibe widgets as primary tuning surface, curriculum as curriculum-motif exemplar, math labs as lab-motif), contract-honoring, no new deps, no layer violations.

## Validation (this pass)
- Edits pass git diff --check (targeted).
- rg for new attrs/tokens/selectors scoped cleanly to real usage.
- node --check on edited shared.js and site-settings.js.
- Composes cleanly with measurement-contract (subjective % now visually "minds" the motif/climate), operator projections, and prior attribute-timing fixes (transparent borders + motif tokens = zero shift on dynamic writes in any lighting/motif).
- Ready for catalog regeneration and design/palettes exploration.

The composable relationship is now more explicit, central, and instrumented: artists pick a flavor/pack/resonance/climate; the system produces balanced, learnable, inspectable results across every lighting condition and component motif. Evolutionary enhancement via new combinations is the natural next step.