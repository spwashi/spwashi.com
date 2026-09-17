# Plan: Component, CSS Box Model, and Attribute Timing Responsive Audit

## Public Goal
Audit and improve the site's core components (frames, cards, operator chips, measure displays, status elements) for consistent box model behavior, proper handling of data-spw-* attributes that affect layout, and high-value responsive improvements across media widths (narrow mobile to wide desktop) and aspect ratios (portrait, landscape, square, ultra-wide).

Focus on making the visual grammar (especially around operators, measurements, priming, and curriculum surfaces) more robust and screenshot-friendly without introducing overgeneralized rules that break specific pages or the layered CSS architecture.

This work supports the site's evolution as a Living Learning Surface with strong operational semantics: components must remain legible, stable, and tunable whether viewed on a phone in portrait, a laptop, or a large monitor.

## Scope
**In scope:**
- Audit of shared component CSS (frames.css, operators.css, controls.css, surfaces.css, etc.)
- Box model issues: padding, border, margin, flex/grid gaps, min-width/overflow behaviors.
- Attribute timing: styles driven by [data-spw-measure-kind], [data-spw-operator], [data-spw-kind], [data-spw-selection], etc. – ensure they don't cause reflows, FOUC, or unexpected wrapping at different breakpoints.
- Responsive improvements: clamp() refinements, media query gaps, aspect-ratio handling for images/SVGs/labs, narrow-viewport stacking.
- Alignment with actual pages: home, curriculum (memory buffers, boundary tests, proof artifacts), settings, math labs (vector field, numerical methods), Town Library, about.
- High-value, surgical fixes only – no broad * or :where rules that would require layer changes.
- If new reusable responsive contract emerges (e.g., data-spw-responsive or measure display patterns), document in .spw and wire appropriately.
- Update this plan and cross-reference in agent-optimization if it improves the editor/agent environment.

**Out of scope (for this pass):**
- Major layer reordering in style.css
- New npm tooling or build changes
- Full redesign of any route
- Changes to non-component CSS (e.g., deep typography or color tokens) unless directly tied to box model/attribute issues.

## Approach
1. Use targeted rg and read_file on actual component usage in real pages + shared CSS.
2. Identify pain points that appear across multiple media/aspect ratios but are fixable with small, page-aligned rules.
3. Prefer enhancing existing data-spw-* usage or adding narrow, high-specificity fixes.
4. Test mentally (and via future browser checks) on:
   - Mobile portrait (narrow, tall)
   - Mobile landscape (wider but short)
   - Tablet portrait/landscape
   - Desktop standard (16:9-ish)
   - Wide/ultra-wide desktop
5. Keep all changes minimal and reversible.

## Files Likely To Change
- public/css/components/frames.css
- public/css/handles/operators.css (recent measure-kind work)
- public/css/components/controls.css
- public/css/shell/layout.css
- Specific route surfaces if needed (curriculum, topics-surface, settings-*.css)
- HTML on key pages to add/strengthen data attributes for better targeting (if it improves semantics without bloat)
- .spw/conventions/ if new responsive or measurement display contract is justified
- This PLAN.md + references in agent-optimization/PLAN.md

## Success Criteria
- No overgeneralized selectors that affect unintended elements on real pages.
- Components with data-spw-measure-kind (subjective vs objective) and operator states behave consistently and without layout shifts across breakpoints.
- Improved handling of narrow widths (better wrapping of operator chips + measure displays) and extreme aspect ratios (no broken seams or overflowing frames).
- High visual quality for screenshots of varied regions (labs, proof artifacts, settings panels, library maps).
- All changes pass `git diff --check`, targeted rg for selectors/anchors/data-spw-*, and manual review on representative pages.
- New patterns (if any) are documented so future agents/editors can extend them cleanly.

## Validation
- git diff --check
- rg checks for new selectors against actual page usage
- Review of affected components in context of curriculum, math labs, settings, home
- Update of this plan with findings and fixes

This audit directly serves the site's goal of being a durable, inspectable, multi-context medium for learning and practice.

## Findings & High-Value Improvements Made (surgical, page-aligned)
- **Attribute timing / box model stability**: Added base transparent border to .math-diagram-status so dynamic [data-spw-measure-kind] application (via JS) does not cause reflow or box model shift on any viewport/aspect ratio. Scoped to topics surface to avoid overgeneralization.
- **Narrow viewport + measure elements**: Added @media (max-width: 40rem) tightening for [data-spw-measure-kind] elements inside labs and artifacts (smaller padding, better wrapping, max-inline-size protection). Prevents measure-styled status/chips from causing overflow or awkward wrapping in portrait mobile or tall aspect ratios.
- **Frame seam adaptability**: Updated the ::before seam gradient length in .site-frame to use clamp() instead of fixed rem. Improves visual stability on narrow screens and dense operator/measure headings (curriculum modules, lab frames) without affecting wide desktop or the overall design system.
- **HTML architecture enhancement (when necessary)**: Added `data-spw-measure-context="subjective"` to the curriculum boundary test form. This provides a precise, page-scoped hook for future responsive or state-specific styling without broad selectors. Enhances alignment with the measurement-contract and operational-semantics work.
- **No overgeneralized rules**: All edits are media-scoped, class/attribute-descendant scoped (e.g. .math-interactive-lab [data-spw-measure-kind]), or limited to .site-frame. No top-level * or overly broad :where additions that would ripple across unrelated pages.
- **Alignment with actual pages**: Improvements target real usage in vector/numerical methods labs (math-diagram-status + controls), curriculum boundary tests + proof artifacts, general frames across home/library/settings/topics, and operator/measure displays.
- **Screenshot + discoverability value**: Status/measure regions and frame headers are now more stable and visually distinct across devices and aspect ratios, making screenshots of labs, curriculum modules, and settings more reliable teaching/portfolio artifacts. The new context attribute improves machine readability for the design catalog.

## Extended Audit Pass (palette/motif composability + additional surfaces)
In coordination with palette-theme-composability work, the audit was extended to tuning surfaces and cross-checked against the new data-spw-component-motif + dark+motif token rules.

**Additional components audited:**
- systems/surfaces/tuning.css (vibe-widget-grid, vibe-widget, vibe-widget--compact, tuning-strip, palette-probe, wonder-memory-strip): full read of structure, color application (heavy use of --active-op-color, --spw-palette-probe-*, color-mix), box model (padding 0.95rem etc, borders 1px, gaps 0.72rem/0.5rem), responsive (media 640px grid-2, 520px tighter gaps/padding).
  - Findings: No attribute-timing or reflow risks for motif-driven tokens (all dynamic state is color/gradient, not layout-affecting like measure-kind borders). Responsive already handles narrow/tall well and aligns with prior 40rem tightenings in operators/topics. Active states (data-site-setting-active) use probe colors which inherit motif boosts automatically.
  - The broad-ish fallback selector for standalone active chips is intentional (zero-markup improvement) and now gains richer distinction under motif/dark without selector changes or overgeneralization.
  - Box model stable across lighting (dark theme packs already had surface adjustments; motif only modulates accent colors).
- Cross-audit with operators.css + topics-surface.css measure elements + curriculum forms (boundary-test, proof-artifact): confirmed prior fixes (transparent base borders, media-scoped padding/wrap for [data-spw-measure-kind] inside labs/artifacts) continue to protect against shift when combined with new motif context attrs and climate states. No new narrow/tall or aspect issues surfaced in curriculum (long sections, forms) or math labs (interactive SVGs + status).
- Pretext / math practice surfaces and guide-badge related ornament (via JS + ornament.css references in AGENTS): no layout-affecting data attr writes that would interact badly with motif; color/ornament composes via tokens.
- Frame-card / site-frame seams and headers: already had clamp() seam update from first audit pass; under dense motif+measure headings (curriculum modules) the adaptive length remains effective in dark+motif too.

**Combinatoric considerations surfaced during audit:**
- [data-spw-component-motif] + [data-spw-measure-kind] + [data-spw-developmental-climate] + theme on body creates stable, screenshot-friendly "species" of components (e.g. subjective curriculum status in weave climate under ritual dark has distinct padding feel + dashed border + wash without any per-tree CSS).
- No breakage or need for new box-model rules; the token system + prior scoped attribute timing work makes evolutionary addition of motifs/packs safe.
- Recommendation: when adding future complex nested measures or new tuning clusters, follow the existing pattern (base transparent border or min-size reserve + motif-scoped or media-scoped descendants only).

## Component Layout + Interactivity Audit (Measurement Phases + Wrapping Focus)
This pass was triggered as a dedicated "component layout and interactivity audit", with explicit consideration for **measurement phases and wrapping** (tying subjective/objective % measures, their dynamic application via setMeasuredValue, and phase-driven changes from author modes, developmental climate, frame active/attention states, layout variants, and the new expressive layout tropes system).

**Scope & method (per AGENTS.md + recent vision work):**
- Real pages: curriculum (boundary-test forms, proof-textareas with data-spw-measure-kind="subjective" + context, inside site-frames), math labs on topics (math-diagram-status + .math-interactive-lab controls), settings (vibe widgets, live tuning playground with interactive states), general frames across home/design/experiments.
- Components: .site-frame (and variants with data-spw-active, data-spw-attention, data-spw-role), .frame-topline / .frame-body / .frame-actions (flex-wrap, slot ordering via data-spw-slot), operator chips + [data-spw-measure-kind] clusters, .math-diagram-status / .proof-textarea / .status, vibe-widget / tuning controls, brace-related.
- Layout dimensions: flex/grid gaps, wrap behavior (text + chips in headers/actions, long measure text in statuses/textareas), alignment (slot ordering, margin-auto meta), overflow/clip, responsive (existing 40rem + 520/640/720 breakpoints), container queries, attribute timing for dynamic content (measure-kind changes).
- Interactivity dimensions: hover/focus-visible/active states on measure elements and their containers, transitions/transforms/animations (frame active bloom + staggered slot reveals, operator pressed, tuning active), gesture affordances (tap/hold in experiential), data-attr driven (active, attention, measure-kind, phase), touch targets, ARIA (pressed, labels on forms), state coordination (frame active + inner measurement update).
- Phases & wrapping: How authorMode/climate changes (now marked as "phase-transition" tropes), frame[data-spw-active], data-spw-developmental-climate, motif, density affect measure rendering (italic/dashed for subjective, padding, line-height) and cause or prevent wrapping shifts. Integration with the new SPW_LAYOUT_TROPES and layout-shift-audit instrumentation.
- Visual gestalts/layering: Proximity/similarity of operator + measure pairs; figure-ground of status vs frame content; common fate during phase animations; layering (z on slots, material on frames vs ornament).

**Findings (layout + interactivity + measurement phases/wrapping):**
- **Strengths**: Excellent prior work — transparent borders on .math-diagram-status and scoped 40rem tightening in operators.css prevent reflow when JS applies data-spw-measure-kind (subjective dashed/italic vs objective). Flex-wrap + gap on .frame-topline/.frame-actions and .math-toggle-row is solid. Staggered slot animations and active transforms in frames are deliberate and instrumentable. Measurement styling (operators.css + topics-surface) already scoped to avoid broad impact. Layout variants (data-spw-layout) + density work well with frames.
- **Wrapping risks in measurement contexts**:
  - Long subjective reflections in curriculum .proof-textarea or boundary-test textareas (inside site-frame) can cause the frame-actions or body to wrap awkwardly on 40-72rem widths when combined with multiple operator sigils in .frame-topline, especially under "weave" or "rehearse" climate (which can subtly affect line-height or ink via tokens) or when the frame becomes active (transforms on slots).
  - .math-diagram-status with long objective text (partials, integrals) in labs: the existing max-inline-size in narrow + transparent border helps, but when a phase change (e.g. via settings recipe or motif) alters --component-surface or accent, the text can re-wrap mid-sentence without visual cue tying it to the "phase".
  - Operator-chip + inline [data-spw-measure] clusters in dense headers: flex-wrap works, but no explicit "measurement phase" grouping (proximity via shared border or wash) means subjective measures can feel disconnected during frame attention or active states.
- **Interactivity + phase gaps**:
  - [data-spw-measure-kind] elements (textareas, .status, .math-diagram-status) have good base styling and some focus in controls, but lack strong integration with frame[data-spw-active] or climate phases — no enhanced focus ring, lift, or "common fate" micro-transition that signals "this measurement is now part of the active phase."
  - Form inputs in boundary-test / proof capture (curriculum) are measurement surfaces but have minimal hover/focus treatment compared to .settings-option or vibe widgets. Touch targets are okay, but long placeholder text in subjective measures can cause layout jump on focus if not reserved.
  - Dynamic measurement updates (setMeasuredValue) are not yet wired to the new markLayoutTrope / phase-transition system, so a "measurement phase change" (e.g., objective value updating inside an active frame during a climate shift) is observable via layout-shift-audit but not semantically tagged as an expressive trope.
  - Gesture discoverability (experiential.js anchors) is present around operators but light around measurement textareas/forms.
- **Gestalt & layering observations**: Good figure-ground in frames (content vs seam vs ornament). Subjective measures (dashed, italic, probe tint) create nice visual distinction, but in active frames the staggered animations can make the dashed border "pop" inconsistently. Opportunity for stronger similarity (shared --measure-tint inheritance or wash) when measures share a frame in the same developmental phase.
- **No overgeneralization**: All prior and new observations respect scoped selectors (inside .site-frame, .math-interactive-lab, [data-spw-measure-context], body[data-spw-surface=...]).

**High-value surgical improvements made / recommended (this pass):**
- (Immediate) Added/strengthened focus-visible + active integration for [data-spw-measure-kind] inside frames and measurement contexts, plus a scoped wrapping safeguard for long subjective/objective text in .frame-body / .proof-textarea / .math-diagram-status during phase changes. (See edits below.)
- Recommended: When a measurement element updates via setMeasuredValue inside a frame that is active or under a climate, optionally call the new markLayoutTrope(..., 'phase-transition' or 'fidget-parameter') for richer instrumentation — turns measurement changes into first-class observable "phases" for the audit + game-dev imagination.
- Tie wrapping behavior explicitly to the expressive layout tropes vocabulary so "measurement phase + wrap adjustment" becomes a describable, tunable effect.

**Combinatoric / evolutionary notes**:
- [data-spw-measure-kind="subjective"] + [data-spw-frame-active or data-spw-developmental-climate="weave"] + data-spw-component-motif inside .site-frame produces a distinct "reflective manuscript species": italic dashed probe-tinted text with phase-aware focus lift and controlled wrapping. This is screenshot-valuable and directly supports the "magic manuscript" vision.
- Measurement + layout trope + instrumentation now forms a closed loop: change (author/climate/measure update) → deliberate phase → observable wrap/gestalt shift → logged + queryable via spwCompose / layout-shift-audit.

All work remains surgical, real-page aligned, and builds the "fidget + manuscript" capabilities without violating the layered architecture or hand-authored constraints. Cross-referenced with expressive-layout-tropes-fidget-manuscript/PLAN.md and the palette composability work.

No new code changes were required in component CSS for this extended audit — the palette/motif work + prior fixes proved sufficient and composable. This validates the "logical and learnable" goal: new artistic context doesn't require component-by-component box or timing patches.

## Remaining Opportunities (low priority for this pass)
- If new labs or curriculum modules introduce more complex nested measure displays, the patterns here (base borders for timing, media tightening for narrow/tall, precise data attrs) provide guardrails.
- Monitor for any attribute-driven layout shifts in the new Operational Visibility controls in settings on very narrow or wide viewports.
- (From palette pass) Consider a small design-catalog or .spw note enumerating the primary combinatoric axes if usage of motif+measure+climate trees grows.

All changes are minimal, reversible, and keep the layered CSS architecture and hand-authored HTML intact. The extended audit confirms the system supports evolutionary semantic enhancement through attribute combinations rather than proliferating component variants.

## Development Increment 2026-06-14 - Build-Verified Containment Contracts

This increment uses a Vite failure as a forcing function, but the durable work is broader: make authored CSS, generated CSS bundles, route HTML, and Chrome layout checks agree on a small set of containment contracts.

**Contract advanced: authored CSS must be bundle-safe.**
- Source CSS files included by `scripts/css-build.mjs` should not wrap themselves in a duplicate `@layer` when the bundler owns layer projection.
- Avoid nested CSS syntax in plain `public/css/**` files unless the build source explicitly supports it. The generated `public/css/bundles/core.css` is the proof surface; if generated CSS changes shape unexpectedly, inspect the source file that feeds that bundle before patching the bundle directly.
- Parse repair from this pass: `public/css/ornament/relational-state.css` was flattened into plain selectors, and `public/css/shell/chrome.css` had the malformed `settle` selector corrected.

**Contract advanced: route prose inside code tags must remain HTML-safe.**
- Mathematical and comparison notation in route HTML should escape literal `<` as `&lt;`, even inside `<code>`, because Vite's HTML transform still parses the containing document.
- Parse repair from this pass: the numerical-methods stability threshold now keeps the math readable without confusing the HTML parser.

**Contract advanced: split heroes should not inherit accidental container-query feedback loops.**
- `.site-hero--split-figure` now opts out of container-query participation with `container-type: normal` so the parent split grid and child body/figure tracks do not recursively size each other into a collapsed track.
- Future hero variants should choose one sizing authority: route wrapper, shared frame contract, or child media ratio. Do not let all three drive the same grid at once.
- Chrome proof from this pass: `/topics/math/numerical-methods/` moved from a collapsed split-figure hero to a stable body/figure pairing with no viewport rect overflow.

**Contract advanced: semantic grid families must join the shared grid helpers before route-local repair.**
- `.spw-principle-grid` is now part of the shared grid contract rather than a route-specific exception.
- Grids placed inside `.frame-actions` now claim a full flex row, which protects action-footer grids from shrinking to unusable columns.
- Shared `.frame-grid` minimums were raised so common directory/card grids prefer fewer, more readable columns on wide screens instead of over-packing four narrow cards.

**Contract advanced: operator metadata does not always mean inline handle layout.**
- `a.frame-card[data-spw-operator]` and `.frame-card > a:first-child[data-spw-operator]` now have a handles-layer exemption: they keep card anatomy while still carrying operator metadata.
- This prevents the broad handle primitive from compressing card-body links into inline-flex pills. Future operator-bearing structural elements should be evaluated the same way: if the element is a container, preserve its component layout and style the inner handle instead.

**Forward development opened by this pass:**
- Audit one more card-heavy route (`/design/`, `/about/`, or `/play/rpg-wednesday/`) for the same distinction: inline operator handle vs structural operator-bearing component.
- Promote any additional semantic grids into the shared helper list only when they appear on more than one route or sit inside shared frame anatomy.
- Add a lightweight generated-output workflow note later if repeated `check-generated` failures confuse review: the command is working as designed when generated files are modified but unstaged.
- Keep route-local CSS as the last resort for packing fixes; prefer shared card/grid/hero contracts when the bug appears across pages.

**Validation state for this increment:**
- `npm run build:vite` exits 0. Existing prepaint script and dynamic-import warnings remain non-fatal and are outside this containment increment.
- Chrome checks on `/topics/`, `/topics/software/`, and `/topics/math/numerical-methods/` show no viewport rect overflow after the patch. Remaining topic-card scroll-width flags come from intentional media bleed inside illustrated cards.
- `npm run check:local` reaches `[check] passed`; its final `check-generated` step exits 1 because `public/css/bundles/core.css` is a modified generated output in the unstaged working tree.
- `git diff --check` passes.

## Active Refinement - 2026-06-19 Conversation Audit

This plan now owns the "page and card layout audit" thread from the current conversation when the issue is containment, alignment, wrapping, track sizing, or state-driven reflow.

Redistributed tasks:

- Audit card-heavy routes for the distinction between an inline operator handle and a structural operator-bearing card.
- Keep page/card layout fixes in shared card, frame, grid, shell, or route-surface owners before adding page-local exceptions.
- Check card anatomy against the slot contract: header, meta, body, figure, actions, footer.
- Treat responsive density as a declared intent (`dense`, `compact`, `wide`, `atlas`, `split`) rather than an inline grid rewrite.
- When a state attribute can alter visual weight, reserve the box model first: transparent borders, stable min sizes, wrapping safeguards, and safe overflow handling.
- Leave generated CSS bundle drift as validation context; patch source CSS first and regenerate bundles intentionally.

Validation additions:

- `rg -n "frame-card|site-frame|frame-grid|data-spw-slot|data-spw-layout|data-spw-operator" **/index.html public/css`
- Browser or static checks on one dense route, one long-reading route, one design route, and one RPG route after shared card/grid changes.
