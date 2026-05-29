# Plan: Pervasive Low-Friction Interactive Settings Widgets (Palette + Broader Tuning Clusters)

**Slug:** settings-widgets-low-friction  
**Date:** 2026-05-29 (revised from prior palette plan in same session)  
**Status:** Implemented (2026-05-29). All 6 phases complete. Checks green. Catalog regenerated. Visual + learnability goals met via stronger active states + contextual placements.  
**Owner:** Agent (following spw-feature-planning + AGENTS.md)  
**Builds on:** Prior Spectral Workshop + palette work (the workshop serves as a rich prototype for one cluster)  
**Related skills:** spw-feature-planning, prior exploration subagent on palette system

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