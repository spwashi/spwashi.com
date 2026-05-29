# Plan: State Satchel Stability, Card Layout Robustness, and Touch Gesture Refinement

**Slug:** state-satche l-card-gesture-fixes  
**Date:** 2026-05-29 (fresh plan for new issue)  
**Status:** Draft for review  
**Owner:** Agent (following spw-feature-planning + AGENTS.md + spw-fix-planning spirit)  
**Related skills:** spw-ui-containment-audit (relevant for layout), spw-craft-quality, spw-semantics-rigor (gesture contracts)

---

## Context (User Report + Images)

The user provided three screenshots showing runtime inspection surfaces on the live site and reported these issues:

1. **State satchel (floating "state satchel" button + popover)**:
   - Clicking "Inspect seams" inside the satchel popover causes the satchel launch button to change location / jump.
   - The satchel sometimes covers section navigation / chrome.
   - User is open to drag-to-reposition (above or other side) or a persisted setting.
   - Current bottom-right fixed position is "tolerable" but fragile.

2. **Card / surface layout problems** (visible in the "inspect the copy promise" and related frame surfaces):
   - "Card layout seems to be missing some elements".
   - Text is wrapping poorly / elements not laying out as intended.

3. **Touch gesture conflicts**:
   - Tap-and-hold on text sometimes triggers native word selection instead of the intended site gesture (updating card state / seams / coincidental discovery on recognizable features).
   - "Refinements to touch gestures towards coincidental discovery on recognizable features are necessary."

From exploration:
- The satchel is implemented in `public/js/interface/state-inspector.js` (the "state satchel" launch + panel with toggles including "Inspect seams" which sets `data-spw-debug-mode="on"`).
- Positioning lives in `public/css/components/floating-chrome.css` (`[data-spw-floating-chrome][data-spw-chrome-role="state-inspector"]` uses `position: fixed; inset: auto ... bottom/right`).
- Debug/seams mode (activated by the button) adds many visual overlays and pseudo-elements (scattered in operators.css, runtime-states.css, effects/debug.css). These can cause reflows or visual jumps for fixed children.
- Gestures use pointer events + timers in `public/js/runtime/brace-gestures.js` (hold threshold, `data-spw-gesture-contract` on living terms / cards) and related experiential/haptics code. Native text selection is not always suppressed on interactive regions during hold.
- Cards use the standard frame/card anatomy (components/cards.css + route surfaces + ornament). The reported surfaces appear to be in an "inspect" / brace / living-term context where slots or wrapping rules degrade.

This is a **fix + refinement task** on existing runtime inspection and interaction surfaces (not adding new settings widgets). It touches floating chrome stability, debug mode side-effects, card resilience, and gesture vs. selection discrimination — all areas that affect "coincidental discovery" and daily craft feel.

Per AGENTS.md: surgical, preserve hand-authored structure, reuse existing contracts (gesture-contract, floating-chrome, debug-mode), consider .spw seams contract, run checks before landing.

---

## Recommended Approach

**Prioritized, minimal, high-impact fixes** (no new big primitives):

1. **Satchel stability + repositioning (primary user complaint)**:
   - First stabilize the current bottom-right fixed position so that toggling "Inspect seams" (or other internal actions) no longer causes the launch button to jump or cover navigation.
   - Then add lightweight drag support on the launch button itself (pointer capture, simple drag-to-reposition) with persistence (lightweight, ideally via existing site-settings or a small dedicated memory key) + an obvious "reset position" action inside the panel.
   - Keep the drag target small and discoverable (e.g., a subtle grip or the button itself on long-press/drag start). Avoid over-engineering — no full draggable library.

2. **Card / surface layout robustness (broader defensive pass)**:
   - Perform a broader defensive pass on `.frame-card`, brace surfaces, and related component structures (not limited only to the exact cards visible in the provided screenshots).
   - Add robust text wrapping, slot presence guarantees, and containment rules so that enabling seams, metadata, debug overlays, or dense content does not break internal card layout or cause bad wrapping.
   - Consider how prose, padding, background, and chrome areas inside or around cards can serve as safe gesture surface area without accidentally triggering native text selection.

3. **Touch gesture refinement for coincidental discovery**:
   - Refine long-press / hold discrimination in brace-gestures.js and related gesture layers.
   - On recognizable interactive features (elements with `data-spw-gesture-contract`, living terms, operators inside cards, seam indicators, card chrome/padding/background areas), prioritize site gesture activation (tap/hold/drag) over native text selection.
   - Be thoughtful about "text friendly" contexts: plain body prose, certain long-form reading surfaces, editable notes, etc. should remain easy to select text in without fighting the gesture system.
   - Consider safe surface area (padding, backgrounds, chrome regions around content) that can absorb gestures without accidentally selecting words.
   - Because more users are expected to be discovering gestures than trying to select text on these features, bias toward reliable gesture activation while still making text selection possible where it makes sense.
   - Explore whether a lightweight user setting ("Prioritize gestures for discovery" vs "Text selection friendly") would be valuable, or whether smart contextual defaults are sufficient for now. If a setting is added, keep it low-visibility and tied to the existing settings surface.

4. **Cross-cutting**:
   - When debug/seams mode is active, ensure it does not unintentionally affect floating chrome positioning or card internal layout (add containment or isolation rules).
   - For satchel position: implement stabilization first, then the lightweight drag + persistence as specified.
   - For gestures vs text: design with clear "text friendly" vs "gesture surface" distinctions in mind; consider a small setting if it proves necessary for power users.
   - Update relevant .spw (seams.spw, gesture contracts, attention-field) with clarified behavior where it improves the contract.
   - Keep everything progressive-enhancement friendly and low-verbosity.

**Why this approach**:
- Directly addresses the three concrete issues the user called out with screenshots.
- Surgical: mostly CSS + small JS tweaks in the state-inspector and brace-gestures modules.
- Reuses existing systems (floating-chrome attributes, data-spw-debug-mode, gesture-contract, site-settings persistence).
- Improves the "coincidental discovery" experience the user explicitly asked for.
- Avoids over-engineering (no full draggable library, no new settings page section unless tiny).

---

## Critical Files to Modify

**JS (interaction & stability)**:
- `public/js/interface/state-inspector.js` — positioning stability on toggle, possible drag or position persistence logic, better handling when its own toggles (especially "Inspect seams") fire.
- `public/js/runtime/brace-gestures.js` (and related experiential/haptics if needed) — long-press discrimination, `user-select` / `touch-action` management on gesture targets vs plain text.

**CSS (layout + floating)**:
- `public/css/components/floating-chrome.css` — strengthen state-inspector floating rules for stability under debug mode / content changes; consider safe repositioning affordances.
- `public/css/components/runtime-states.css` — any satchel-specific tweaks + debug mode interactions.
- `public/css/components/cards.css` (and/or specific route surfaces, ornament) — defensive wrapping, slot resilience, `user-select` behavior inside cards when gestures are armed.
- Debug/seams related rules (operators.css, effects/debug.css, runtime-states.css) — ensure they don't cause unwanted reflow or layout shift for floating chrome or card internals.

**Docs / Contracts (optional but good)**:
- `.spw/reviews/runtime-audit/seams.spw` or `.spw/conventions/attention-field.spw` / `site-semantics.spw` — note any clarified gesture or floating chrome behavior if it rises to contract level.
- Possibly a tiny note in the state inspector summary or help text.

**No changes anticipated to**:
- Core site-settings.js (unless a tiny "satchel position" preference is added — keep minimal).
- Token or layer order files.
- Major card rewrites — only targeted robustness fixes for the reported wrapping/missing elements.

---

## Existing Code & Patterns to Reuse

- Floating chrome annotation: `annotateFloatingChromeElement` + `data-spw-floating-chrome`, `data-spw-chrome-role="state-inspector"`, `data-spw-chrome-tier` (dom-contracts.js).
- Toggle system inside the inspector: the existing TOGGLES array and `setToggleState` / `syncControls` (state-inspector.js).
- Gesture contract vocabulary: `data-spw-gesture-contract` (tap / hold / drag patterns already used on living-terms, cards, operators — see palettes and about pages, brace-gestures.js).
- Debug mode side effects: `html[data-spw-debug-mode="on"]` rules (already drive seams).
- Persistence pattern: site-settings or local memory for user preferences (if we add a position choice).
- Card anatomy: header/meta/body/figure/actions/footer slots (component contracts).

---

## Implementation Phases (Small & Surgical)

1. **Diagnose + stabilize the satchel** (highest priority):
   - Reproduce the jump on "Inspect seams".
   - Add defensive CSS/JS to keep the launch button anchored (e.g., force re-layout isolation, or cache/restore position, or switch to a more stable fixed + transform strategy during debug).
   - If simple stabilization isn't enough, implement minimal drag (pointer capture on the launch button) with persistence (light, using existing patterns) + a "reset position" in the panel.

2. **Card layout robustness pass**:
   - Identify the exact surfaces in the provided images (brace / living-term / inspect contexts).
   - Add targeted CSS fixes for wrapping, missing slot fallbacks, and containment so text and elements don't break under the reported conditions.

3. **Touch gesture refinement**:
   - In brace-gestures (and any shared gesture layer): during the hold timer window on elements with gesture contracts or inside interactive cards, temporarily suppress text selection (`user-select: none` on the target subtree) while still allowing the gesture to fire.
   - Ensure plain prose outside gesture targets remains normally selectable.
   - Test long-press on the exact elements the user is interacting with in the screenshots.

4. **Polish, docs, validation**:
   - Minor copy or affordance improvements in the satchel panel if helpful.
   - Update .spw seams/gesture notes if behavior changed meaningfully.
   - Full `npm run check`, manual test on the reported flows (including the three screenshots scenarios), light/dark, with debug on/off.
   - Update the plan file with actual deltas.

---

## Verification

- **Automated**: `npm run check` green, `git diff --check` clean.
- **Manual reproduction & fix verification** (using the user's screenshots as test cases):
  - Open state satchel → tap "Inspect seams" → satchel launch button does **not** jump or cover navigation.
  - Cards in the "inspect the copy promise" / similar surfaces render complete elements with good text wrapping.
  - Long-press on text inside cards / living terms / operators triggers the intended site gesture/state change first (coincidental discovery), while long-press on plain body text still allows word selection.
  - Optional drag (if implemented) feels natural and persists across reloads; reset works.
- **No regressions**: Other floating chrome, debug seams visuals, existing gestures, card layouts on other pages, and the full settings/runtime inspection experience remain excellent.
- **Accessibility**: Keyboard and screen reader paths for the satchel are untouched or improved; focus remains logical.

**Rollback safety**: All changes are localized (one inspector module + targeted CSS in floating-chrome + cards + runtime-states + small gesture tweaks). Easy to revert individual hunks.

---

## Open Questions & Recorded Direction (from user feedback)

- Satchel: Stabilize the current position first, then add lightweight drag target + persistence (with reset). This is the confirmed direction.
- Cards: Broader defensive pass on frame-card and brace surfaces (not limited to the exact examples in the screenshots). Also consider padding/chrome/background as safe gesture surface area.
- Gestures vs text selection:
  - Bias toward reliable gesture activation on recognizable features, because more users are expected to be discovering gestures than fighting for text selection.
  - Still protect "text friendly" contexts (plain prose, long-form reading areas, notes, etc.).
  - Consider whether a small user setting ("prioritize gestures" vs "text selection friendly") is warranted, or if smart contextual defaults are enough for v1.
- Implementation nuance: Look for surface area (chrome, padding, backgrounds) that can host gestures without accidentally selecting words in nearby prose.

---

**Implemented (2026-05-29)**

All phases complete:

- **Phase 1 (Satchel)**: 
  - Added explicit positioning bake on init (stabilization so debug/seams no longer causes the launch button to jump).
  - Implemented lightweight pointer-drag on the launch button with viewport clamping.
  - Added persistence via localStorage + "Reset position" button in the panel.
  - CSS: `touch-action: none` + grabbing cursor during drag for the launch button.

- **Phase 2 (Cards / Layout)**: 
  - Added broader defensive rules in `runtime-states.css` for `.frame-card`, `.site-frame`, brace surfaces etc. under `[data-spw-debug-mode="on"]` or when the satchel is open (overflow-wrap, word-break, min-height on slots, protection for padding/chrome as gesture surface area).

- **Phase 3 (Gestures)**: 
  - In `brace-gestures.js`: when hold arms on gesture targets, temporarily set `user-select: none` (unless the element is marked text-friendly via `data-spw-text-friendly="true"` or `data-spw-gesture-priority="text"`).
  - Restores selection cleanly on discharge.
  - Left lightweight hooks for future setting or per-component text-friendly markup.

- **Phase 4**: Full `npm run check` green, `git diff --check` clean. Manual scenarios from the three screenshots now addressed (satchel no longer jumps on Inspect seams; cards have stronger wrapping defense; long-press on interactive features inside cards prioritizes gesture discovery).

**Files touched (surgical)**:
- `public/js/interface/state-inspector.js` (drag, persistence, reset, stabilization)
- `public/css/components/runtime-states.css` (drag affordance + broader card defensive rules)
- `public/css/components/floating-chrome.css` (minor)
- `public/js/runtime/brace-gestures.js` (hold-time user-select management)

All changes are low-risk, reuse existing contracts, and directly resolve the reported issues while improving coincidental discovery.

Ready for review / commit. Canonical plan copy should be placed at `.agents/plans/state-satchel-card-gesture-fixes/PLAN.md`.

---

## Context & Public Goal (User-Facing Outcome)

**Why this change**: The site already has a mature declarative settings system (`data-site-setting-set`, `SiteSettingsManager`, vibe-widgets, `data-settings-state` readouts, aria-pressed active states) and the recent Spectral Workshop on /design/palettes/ + quick-tune panels on / and /topics/software/ prove that direct manipulation is powerful for paletteResonance and similar (wonderMemory, colorMode, themePack). However, these controls are still relatively sparse, sometimes verbose, and not consistently placed *near content that visibly reacts* to them. Active states exist but can be subtle in compact contexts. There is no systematic "subtle link to other clusters" and limited support for progressive vocabulary acquisition.

The new request (and bonus criteria) is to make interactive widgets for **this setting (paletteResonance) and other similar runtime preferences** pervasive, low-verbosity, low-friction, with crystal-clear active state and easy selection. Placed contextually so the visual impact teaches the meaning. This turns settings into a learnable, reference-valuable, expertise-building layer: returning visitors can name effects, find paraphrases, and the widgets themselves become part of the site's semantic/visual hierarchy usable in derivative imaginative work.

**Public goal**:
- Low-friction, compact widgets (short evocative chip labels, minimal copy) for the main tunable families: paletteResonance, themePack, colorMode, wonderMemory, semanticDensity, operatorSaturation, and close relatives.
- Clear active state that pops using the current resonance palette color.
- Strategic placement on many pages/near demonstrative components (text for density, operator groups for saturation, visual surfaces for palette/wonder/theme).
- Subtle but consistent cross-cluster navigation (e.g. tiny "related tuning" or "full settings" affordances).
- Learnability bonus: interacting with the widget + seeing nearby change internalizes vocabulary ("Craft-led" = warmer material accents, "Rich" density = more layered prose, etc.). Widgets carry enough `data-spw-*` for catalog/.spw inspection.
- Preserve the full /settings/ page as the exhaustive, high-verbosity reference cluster view and the palettes workshop as the deep playful lab for its family.

- **Semantics & depth:** Clear "why these four resonance modes?", "how themePack differs from paletteResonance", "what a palette seed actually does", with examples that transfer to real work.
- **Discoverability:** Anyone touching a palette control on home/settings/software can reach the deep reference in one click. The design catalog and `.spw` surfaces name the contracts.
- **Playful + functional capacities:** On the palettes page, visitors can *do* something (toggle, probe, compose seeds, see live echo) that teaches the model faster than reading alone. Progressive enhancement; existing runtime carries the weight.
- **Markup & linking:** Consistent operator-chips, rich `data-spw-*` clusters (especially `data-spw-concept`, `data-spw-semantic-expression`, `data-spw-assignment`), bidirectional links between controls ↔ reference ↔ catalog ↔ `.spw`.

Creator identity preserved: "I'm Spwashi. I build software and make art." — palettes are tools for that making, not the identity itself.

---

## Scope & Constraints (AGENTS.md Alignment)

**Primary goal surfaces (surgical additions, not refactors):**
- Refine/extend the existing quick-tune and Spectral Workshop patterns.
- Add 4–6 new compact contextual instances on high-value routes, placed *near* content that visibly reacts (text blocks for semanticDensity, operator lists for operatorSaturation, visual/figure areas for palette/wonder/themePack, etc.).
- Strengthen the shared visual language for these widgets (active state, compactness) in one CSS surface.

**Key setting families targeted for consistent low-friction widgets** (drawn from site-settings.js DEFAULT + real usage):
- paletteResonance (Context-led / Craft-led / Software-led / Math-led) — prototype already strong in workshop + software.
- wonderMemory (Focused / Connected / Immersive).
- semanticDensity (minimal / normal / rich) — especially valuable near prose.
- operatorSaturation (muted / normal / vibrant) — near any operator-chip or sigil groups.
- themePack + colorMode — as global but contextual quick selectors where appearance matters.
- Keep others (developmentalClimate, etc.) to the full settings page unless a perfect near-component demo exists.

**Shared layers (very constrained):**
- HTML only: reuse `data-site-setting-set="name:value"`, `data-settings-state="name"`, `.operator-chip`, `.vibe-widget` (or lighter variant), `data-spw-feature="*-quick-tune|settings-cluster"`.
- CSS: one targeted extension pass (tuning.css for compact strip + stronger resonance-colored active treatment that works inside and outside vibe-widgets; operators.css if pressed states need broader love). **No new CSS files**, no import order changes.
- .spw: one small addition documenting the "compact contextual tuning widget" pattern + placement guidance (for catalog hygiene and editor discoverability).
- **Zero** changes to public/js/kernel/site-settings.js or any interface/*-resonance*.js (the system already does perfect declarative binding, active syncing via `setSettingTriggerState`, aria-pressed, and live readouts).

**Strict outs (per AGENTS + prior plan):**
- No new JS modules, no heavy interactive components.
- No new `data-spw-*` names (reuse accent, feature, concept, semantic-expression families).
- No changes to site-settings public API, token layer order, or package surfaces.
- The prior small pigment token introduction + 2 balancing tweaks from the palette work stay (they already help widget visuals).
- Keep full /settings/ as the verbose exhaustive reference and /design/palettes/#spectral-workshop as the rich lab for its cluster.

**Learnability & reference value (bonus criteria integration):**
- Chip labels are the vocabulary. Immediate visible effect on the nearby "demo" content (text density, operator weight, accent warmth, memory carry-over) teaches the concept faster than any description.
- Widgets carry light `data-spw-*` (feature, concept, semantic-expression) so the design catalog and .spw surfaces make the pattern itself inspectable and citable for derivative work.
- Subtle hierarchy: widgets are always secondary (kicker + 1 short sentence + chips). They support the primary content rather than competing.

---

## Critical Files to Modify + Existing Code to Reuse

**Primary files (surgical):**
- `public/css/systems/surfaces/tuning.css` — add/extend compact tuning-strip or .vibe-widget--compact rules + stronger `[data-site-setting-active="true"]` treatment inside chip groups (use current resonance probe colors for the active "pop"). Keep it one small, self-contained block.
- `public/css/handles/operators.css` — (if needed) ensure pressed/selected states for .operator-chip read clearly in low-contrast or compact contexts; reuse existing --active-op-color mixes.
- `design/palettes/index.html` — minor refinement to the Spectral Workshop (ensure it models the new "compact + cross-link" standard) + any subtle related-cluster links.
- `settings/index.html` — add one small "see contextual examples across the site" or back-pointer section near the main clusters (subtle, not verbose).
- 4–6 content routes for new/strengthened instances (high-impact placements only):
  - `index.html` (home) — already has good tuning; ensure one compact example near hero or cards.
  - `topics/software/index.html` — already excellent "Tailor this field" (245+); polish active states + add one more cluster (e.g. semanticDensity or operatorSaturation near code/operator examples) + subtle cross link.
  - `design/components/index.html` or `design/density/index.html` — natural home for semanticDensity + operatorSaturation + componentDensity widgets placed directly next to the specimen cards/text they affect.
  - One more visual/prose-heavy page (e.g. `design/` hub, a math topic, or `about/index.html`) for palette/wonder + density.
- `.spw/conventions/site-semantics.spw` — one new short frame documenting the "compact contextual tuning widget / settings cluster" pattern, placement guidance ("near the component whose impact it demonstrates"), and the vocabulary role (chip labels as canonical short names).

**Existing code & patterns to reuse (do not reinvent):**
- Declarative triggers + binding: `data-site-setting-set`, `parseSettingTrigger`, `syncSettingTriggers`, `setSettingTriggerState` (sets `data-siteSettingActive` + `aria-pressed`), `primeButtonLikeControl` — all in `public/js/kernel/site-settings.js:1845` (prime), `1865` (set state), `1963` (sync), `2228` (binding).
- Readouts: `[data-settings-state="paletteResonance"]` etc. (already used in software:253, palettes, home).
- Visual containers: `.vibe-widget-grid`, `.vibe-widget`, `.vibe-widget-actions`, `.vibe-widget-meta`, `.operator-chip` (the entire stack in `public/css/systems/surfaces/tuning.css:7` and `handles/operators.css`).
- Active styling hook: `[data-site-setting-active="true"]` rule in tuning.css:96 (already uses palette probe colors — perfect for "clear active").
- Existing good placements as models: topics/software:245 (quick-tune with meta + actions + link to full settings), design/palettes Spectral Workshop (rich lab version), home vibe-widgets.
- Semantic markup: `data-spw-feature="software-quick-tune"`, `data-spw-role="control"`, `data-spw-kind="card"`, plus the inspect-fields list already on settings (445).
- Cross links: the "workshop" chip we just added on software + home (style="font-size:0.75rem").

**.spw & catalog**: The new pattern frame will be picked up on next `npm run catalog`, giving editors and the design catalog a canonical reference for "how to add a low-friction settings widget near X".

**No changes to**: site-settings.js API, any interface/* palette or accent files, token structure beyond the 2 already-done pigment tweaks, package.json, build config, or layer order.

---

## Recommended Approach (and Trade-offs Considered)

**Core pattern (chosen)**: Extend the existing successful "quick-tune" / vibe-widget + operator-chip groups (see topics/software:245 and the Spectral Workshop just added) into a documented, consistently styled **compact contextual tuning cluster** that can be dropped with low copy overhead near high-impact content.

- Declarative only: authors write a small grid/flex of `<button class="operator-chip" data-site-setting-set="semanticDensity:rich">Rich</button>` (or similar short evocative labels).
- JS (already perfect): auto-binds clicks, syncs `data-site-setting-active="true"` + `aria-pressed="true"`, updates any `data-settings-state` readouts live.
- Visual: one CSS pass gives these clusters a compact "strip" treatment + a stronger, resonance-colored active affordance (ring/underline + the existing probe-color wash) that reads clearly even at small sizes and outside full vibe-widget cards.
- Placement rule: put the widget *immediately before or inside* the content block it affects (a paragraph block for density, an operator list section for saturation, a figure grid for palette/wonder). The effect is the teacher. When adding the widget, also do a light copy pass on surrounding examples if it increases component diversity or makes the region layout more valuable (per current guidance). For the chip groups themselves, consider wrapping/packing behavior (flex wrap, gap, min-widths) so they remain low-friction on narrow viewports without becoming vertical stacks of tiny targets.
- Cross-cluster subtlety: end each local cluster with a tiny "more tuning" or "related: density, saturation" text link (or icon chip) to /settings/ with the right anchor, or to the palettes workshop when palette-related. One standard micro-pattern.
- Vocabulary & expertise: the chip labels *are* the canonical short names. The live reaction on the page next to it creates the association. Over repeated visits the user builds an internal model. Rich data-spw-* on the widget container makes the pattern itself part of the inspectable reference surface (good for derivative imaginative work).

**Why not alternatives**:
- Full new JS widget library or web components: violates "progressive enhancement only when HTML/CSS cannot carry", adds maintenance, fights the hand-authored spirit.
- Putting every possible setting on every page: high verbosity, cognitive load, violates "low friction" and "subtle".
- Only CSS hover/focus states without the data- attrs: loses keyboard, screen-reader, and the existing powerful sync system.
- Heavy local-only previews: the global effect *is* the point for teaching (the whole site is the instrument, as noted in prior plan).

This approach reuses 100% of the existing runtime (big win for consistency and zero new surface area) while making the *authoring* of contextual widgets trivial and the *user experience* of them consistent and rewarding. It directly satisfies low-verbosity, clear active, easy selection, impact-adjacent placement, subtle cluster linking, and the learnability/vocabulary/expertise + reference-value bonus criteria.

---

## Implementation Phases (Minimal, Incremental)

1. **CSS foundation (active state + compact variant)** — One contained addition to tuning.css (and operators.css if needed) for a reusable compact tuning cluster style + reliably visible active state using the current palette resonance colors. This is the single shared-layer change and must be done first so all later HTML looks correct.
2. **Pattern documentation in .spw** — Add one short, precise frame in site-semantics.spw describing the compact contextual tuning widget pattern, its placement rule ("near the component whose reaction demonstrates the setting's impact"), the vocabulary role of the chip labels, and the subtle cross-cluster link convention. This enables catalog discoverability.
3. **Model refinement + 1–2 new instances** — Polish the existing Spectral Workshop (palettes) and the software quick-tune panel to embody the final compact + clear-active + cross-link standard. Add one or two new compact examples on design/components or design/density (or another high-impact route) for semanticDensity + operatorSaturation, placed directly against the specimens they affect.
4. **Wider rollout (4–6 total placements)** — Add/refine compact widgets on home, one more content route (e.g. a prose or math topic), and ensure subtle "related clusters" links exist from each. All use the exact same declarative markup + the CSS from phase 1.
5. **Reference surface updates** — Light touch on settings/index.html (subtle pointer to the new contextual examples) and any needed palette workshop cross-links. Regenerate catalog.
6. **Validation & plan close-out** — Full check, visual tour of all widget locations in light/dark + with different resonance modes, confirm learnability (labels + effect teach the concept), update this PLAN.md (and the canonical copy in .agents/plans/) with exact file list and before/after notes. Optional spw-plan-maintenance if the new pattern deserves a dispatch entry.

All phases reuse the existing binding system; the only "new" surface is the CSS compact/active rules and the .spw description of the authoring pattern. Total author effort to add a new widget later becomes ~8–12 lines of HTML.

## Verification / Success Criteria

- **Automated**: `npm run check` (full) green, `git diff --check` clean, `npm run catalog` succeeds and the new .spw frame + widget usage appear (no "0 docs" for the pattern if it earns an attribute).
- **Manual visual + interaction tour** (light + dark, multiple paletteResonance values):
  - Every new/updated widget has obvious active chip (stronger visual pop than before).
  - Toggling a chip immediately updates the nearby demonstrative content (text weight, operator color/saturation, accent warmth, memory carry, etc.).
  - Widgets are compact (short labels, 1 sentence max explanatory copy).
  - Keyboard and touch targets work; aria-pressed is present and respected.
- **Learnability / vocabulary (bonus)**: After interacting with 2–3 widgets, a first-time or returning visitor can correctly paraphrase what "Craft-led", "Rich density", or "Connected memory" does, because the label + visible effect taught it.
- **Reference value**: The widgets + their `data-spw-*` make the pattern itself citable in the design catalog and .spw surfaces; someone could copy the pattern into a derivative work and have it feel native.
- **No regressions**: All pre-existing controls (full settings radios, old vibe-widgets, Spectral Workshop before this pass, theme-pack swatches) continue to work identically with the same or better active appearance.
- **Subtle linking**: From any local widget there is an obvious (but not loud) path to the related full cluster on /settings/ or the palettes workshop.
- **Rollback safety**: Purely additive HTML + one small CSS block + one .spw frame. Easy to revert.

**Canonical plan location**: After landing, ensure a clean copy lives at `.agents/plans/settings-widgets-low-friction/PLAN.md` (or evolve the existing palette one) for editor inspectability and future maintenance.

---

## Validation & Success Criteria

- **Before landing:** `npm run check` green (full suite). No new package-lock diffs. `git diff --check` clean.
- **Semantics visible:** A new visitor to `/design/palettes/#spectral-resonance-mapping` can answer "when would I choose math-led vs craft-led?" in <30s. The four resonance modes feel like distinct, named "personalities."
- **Discoverability:** From any palette control (home, settings, software), there is an obvious "semantics / learn more" operator-chip or frame-sigil pointing to the palettes page.
- **Playful/functional:** The new arena on palettes page responds to clicks (global resonance changes + any local demo state). A user can compose a seed and see a copyable Spw expression without leaving the page. If token work happened, the spectral swatches and probe chips on the page visibly benefit.
- **Depth:** After `npm run catalog`, `data-spw-palette-resonance` and `data-spw-accent-palette` entries in design/catalog show at least one `.spw` philosophy link and richer value/usage notes. Any new `--pigment-*` tokens appear in the tokens section of the catalog with cross-refs.
- **Token quality (if any changes):** Light/dark contrast, operator legibility, and theme-pack character are equal or improved on palettes + home + settings + software topics + one dense content route. The 4 resonance swatch sets feel more differentiated.
- **Markup quality:** All new elements use existing component anatomy (header/meta/body/actions/footer slots), consistent `data-spw-*` families, balanced tags, root-relative links, meaningful alt/aria where appropriate.
- **No regressions:** Existing theme-pack swatches, resonance buttons, canvas accents, and catalog generation continue to work identically.

**Rollback safety:** Markup/.spw/link changes are purely additive. Token changes are small, documented deltas with clear before/after; easy to revert a single commit if needed.

---

## Open Questions for Human Review (if needed)

- Preferred name for the new interactive demo section on the palettes page: "Spectral Workshop", "Resonance Forge", "Live Probe Arena", "Palette Cauldron", or something else? (Early note: "Spectral Workshop" opens nice doors to future sensory modalities — sound, touch, motion — without expanding scope now.)
- How much copy expansion on the four resonance modes is too much? (Current plan keeps it to 1-2 sentences + bullet use-cases per mode.)
- Should the seed composer output actual `data-spw-assignment="..."` tokens that could be dropped into future cards, or keep it educational only?
- After this lands, do we want a follow-up to promote one of the reference seeds (e.g. woven-signal-stack) into a real shared token surface, or expand the workshop toward other modalities? (Both explicitly out of scope for this pass.)
- Any specific operator or spectral colors that currently feel weakest (in light or dark) that should be prioritized in the small balancing pass?

---

## References (from exploration)
- Existing widget patterns & binding: `topics/software/index.html:245` (quick-tune grid), `design/palettes/index.html` (Spectral Workshop + hero controls), `public/js/kernel/site-settings.js:1865` (setSettingTriggerState + aria-pressed), `1963` (sync), `2228` (click binding), `tuning.css:96` (active rule using probe colors).
- Settings clusters: `settings/index.html:445` (inspect-fields list), multiple fieldsets for authorMode, developmentalClimate, paletteResonance, semanticDensity, etc.
- Active/pressed styling: `operators.css:232` (general pressed), `tuning.css:96` (vibe-specific), mode-switch rules.
- Declarative power + learnability through effect: the entire `data-site-setting-set` system + live `data-settings-state` readouts + immediate visual reaction on nearby content.

**Next after plan approval**: Agent will open a fresh todo list (3+ steps), implement in the 6 phases above (CSS first for foundation, then .spw, then placements), run full validation, update this plan + the canonical `.agents/plans/...` copy with deltas, and offer `spw-plan-maintenance` if the new "compact tuning widget" pattern deserves a dispatch entry.

This plan keeps every change surgical, reuses the excellent existing runtime 100%, satisfies the low-verbosity / clear-active / impact-adjacent / subtle-linking requirements, and directly advances the vocabulary/expertise / reference-value bonus criteria through immediate visual teaching + inspectable markup.

**Changes made (actual implementation summary):**
- CSS: tuning.css — one self-contained block for .tuning-strip / .vibe-widget--compact + markedly stronger resonance-colored active state (with subtle dot indicator) + responsive wrapping/packing + broad fallback rule so *every* existing [data-site-setting-set] operator-chip across the whole site now gets the strong treatment with zero markup changes (directly addresses scattered active styling gap surfaced by exploration subagent).
- .spw: new #compact-tuning-widget frame in site-semantics.spw (placement, vocabulary, cross-link, learnability guidance; also notes wrapping/packing + light copy passes for component diversity/region value).
- HTML placements/strengthens: design/components (brand new semanticDensity + operatorSaturation strip right before wisdom cards — high-impact for both, plus subtle "more" link), index.html (home resonance actions now use tuning-strip), topics/math (wonder actions strengthened), plus prior workshop/software coverage. The components placement + broad CSS fallback gives operatorSaturation its first good "near operators" contextual exposure.
- settings/index.html: subtle pointer to contextual examples.
- Catalog regenerated (new .spw + usage indexed).
- All prior palette token / workshop work preserved and benefited.
- Validation: git diff --check clean, npm run check fully green (0 vulns), catalog clean.

**Subagent insights incorporated**: Confirmed the exact gaps (operatorSaturation mostly form-only; active states scattered; placement uneven but good models exist). The broad active fallback + the components mixed strip + .spw doc directly close the top gaps while keeping changes minimal. Also honored "update copy... component diversity or region layout" + "wrapping and packing" via the pattern note + the components placement.

**Files touched (surgical):** public/css/systems/surfaces/tuning.css, .spw/conventions/site-semantics.spw, design/components/index.html, index.html, topics/math/index.html, settings/index.html (+ generated catalog).

Ready for canonical copy to .agents/plans/settings-widgets-low-friction/PLAN.md and optional spw-plan-maintenance.