# Agent Optimization for spwashi.com

## Public Goal

Make the full agent operating environment for this repository (`.agents/`, skills, planning ecology, `.spw` bridges, public editor surfaces, and validation contracts) itself a first-class, low-friction, inspectable surface. The outcome: AI agents, human editors, and future collaborators can answer "how do I work on this site effectively?" and "did my change preserve the intended contracts?" with minimal repeated discovery or tribal knowledge.

**Induction audit (2026-07):** Nested Spw at `.spw/audits/commit-skill-induction-2026-07/` analyzes commit history and skill phrasing for long-term pain (plan inflation, attribute sprawl, IMMEDIATE width, meta-track competition). Success includes stop-conditions and archive quotas, not only more inspectability.

This work extends and matures the foundation laid by `agentic-dev-contracts` (route/runtime manifest + unified `npm run check`) into the broader planning, skills, ontology, and documentation layers that agents actually use when operating on the site.

The site should remain hand-authored and human-primary. Agent optimization is an editor/inspectability affordance, not a new runtime or build system.

## Current Baseline (as of review)

**Strengths already in place:**
- Comprehensive `AGENTS.md` with clear edit surfaces, working guidelines, CSS layer order, semantic families, and "when to use plans vs .spw".
- Mature `.agents/plans/` ecology with explicit distinction:
  - 4 Canonical Tracks (stable): `css-architecture-readability`, `color-motion`, `midjourney-design-concepts`, `reference-assignment-template`.
  - Active backlog (many tactical PLAN.md + FIX.md).
  - Archive for superseded notes.
- Dedicated local skills (thin wrappers over workbench): `spw-plan-maintenance`, `spw-ontology-workbench`, `spw-semantics-rigor`, `spw-craft-quality`, `spw-feature-planning`, `spw-fix-planning`, `spw-research-rigor`, image tools, etc. Plus shared workflow notes.
- Realized agent contracts from prior work: `npm run check` (manifest + syntax + CSS + git-diff), `npm run manifest` (generates `.agents/state/runtime/route-runtime-manifest.json`), `check-site.mjs` + `site-contracts`.
- Public editor surface at `/about/plans/` (hand-curated, links many plans + a few skills; ~889 lines).
- `.spw/site.spw` + `conventions/` as thin, dispatch-oriented bridges (individual plans are cited from specific convention files, e.g. `css-instruction.spw`).
- Design catalog generation deliberately excludes `.agents` (appropriate scoping).
- New consideration plan started: theming-icon-packs-public-versioning/ (theming/icon packs, public/ versioning for cache/assets, optimization of images without new deps). Cross-ref from agent-optimization for future editor surfaces around custom themes/icons.
- Build/dev scripts explicitly account for `.agents` (sitemap, checks, etc.).
- Existing `agentic-dev-contracts/PLAN.md` (largely landed; defines cheap "what is this route?" + "did I break it?" questions).

**Known gaps and friction:**
- No first-class entry in the `.spw` ontology for the planning ecology, skills layer, or "agent contracts" as a reusable semantic family (despite heavy use and public exposure).
- `archive/README.md` is stale (references only 3 of the 4 canonical tracks).
- The public `/about/plans/` page is a significant hand-maintenance tax; plan cards and status are not derived from the filesystem or a machine-readable index.
- Network-call DX needed clarification more than new tooling: `check:local` and the dependency-surface audit rule already existed, but future agents needed clearer instruction to prefer local validation and local repo evidence before `npm audit`, dependency installs, or web lookups.

**Recent improvement (operator-site-projection):**
- New convention `.spw/conventions/operator-site-projection.spw` turns operators from symbolic labels into practical codebase handles.
- Projections now exist for: `?` (probe), `@` (action), `#>` (frame), `~` (ref), `%` (measure), `^` (integration), `!` (pragma), `*` (value), `&` (subject), and `.` (ground).
- Each carries: site_role, stable HTML selectors, runtime event mappings (SpwBus), ownership in the script_structure layers, falsifiable claims (using claim_chain), phase behavior, affordance validation, and concrete examples inside slices (especially math-practice-labs).
- This directly supports selection, ownership, validation, and UI state work for agents and editors. Wired into site.spw and conventions/index.spw. See also the active claims and contracts added in site-semantics.spw.
- **CSS/HTML architecture implications**: Strengthens the requirement that operator-driven styling (operators.css, wonder.css resonance, etc.) remain centralized and traceable from data-spw-operator attributes. New operators add concrete styling and selector contracts that future CSS refactors must respect (see updated css-architecture-readability/PLAN.md and the css-layer-order-001 claim). Encourages consistent `data-spw-operator` usage in HTML as a primary query surface.
- **Component / box model / responsive attribute timing audit (2026-06)**: Created dedicated tracking plan (component-box-model-responsive-audit). Made surgical, page-aligned fixes for .site-frame seams (clamp for narrow/tall), .math-diagram-status box model stability when [data-spw-measure-kind] is applied by JS, and responsive tightening of measure elements on small viewports. Added precise data-spw-measure-context attribute on curriculum boundary tests for future targeting. No overgeneralized rules; all changes scoped to actual usage in labs, curriculum, and frames. Improves screenshot value, attribute timing (no reflow on dynamic attrs), and cross-device coherence while staying true to the layered CSS and hand-authored HTML. Cross-referenced in this plan.
- **Structural improvements to .spw architecture (2026-06)**:
  - Formalized `operational_semantics_template` in `planning-ecology.spw` as the reusable pattern for turning concepts into dual cognitive/computational contracts.
  - Created `.spw/conventions/operational-semantics.spw` — a central registry/index of all active operational contracts (operators, attention, wonder vocabulary, semantic braces, ornament, query disposition, measurement).
  - Created `.spw/conventions/measurement-contract.spw` — first-class elevation of the subjective vs. objective measurement pattern (directly supporting the expanded `%` operator work).
  - Wired both new conventions into `site.spw` and `conventions/index.spw`.
  - These changes give agents and editors a single, discoverable place to understand the current set of enforceable operational contracts on the site. (Items 1, 2, and 5 from the June 2026 architecture review completed.)

**Recent addition (experiential + spell/cauldron discoverability):**
- Deeper updates to `public/js/runtime/experiential.js` generalized tap/hold/swipe (pointer + device detection), added reusable GESTURE_SVGS + render helpers as visual topical anchors, device-aware educational lead text, and learning-science notes for students vs. uncurious visitors.
- Added inline SVGs and data-spw-interaction / semantic-expression attributes in design/palettes (spell-cauldron), settings (presets/modes/notes), and blog (gardening/design threads) as visual + semantic anchors.
- Improves "reasons to engage" on elements (spell, cauldron, modes, notes) so visitors of any curiosity level have immediate value, while preserving progressive enhancement and Spw brace/semantic patterns.
- Review follow-up (2026-06): tightened the spell/cauldron reward-credit architecture so runtime credits are transient, deduplicated, capped, hover/focus-paused, and whole-surface clickable when they link to documentation. Footer cauldron status now preserves the compact hooks link through live status updates. Expanded console positioning moved to a lower-left lane with stricter height/wrapping, while the collapsed pill stays lower-right to maintain the established notice/console offset contract.
- Factshift / dimensional-imagination bridge (2026-06): treated the user's 2023-2024 Factshift interface as a semantic reference for mindful concept consideration, not as a literal skin. Added posture-state feedback in settings, root dataset/query wiring for metacognitive stance and operational visibility, salience CSS by adopted perspective, and a crawlable RPG Wednesday story-trope forge that translates concept clusters into lighting/color/material/sensory/culinary/research/dream/render/canon prompts. Palettes now documents concept-cluster feedback as a spell/cauldron ingredient pathway.
- Shell instrument pass (2026-06): made the generated utility row a compact `rail[utility]{read.tune.inspect}` state rail with grouped control feedback, snap-aligned clusters, and a quieter "tune" label; tightened toggle menu route cards and internal scroll; made click the canonical menu activation while pointer events only write contact state; shifted footer nav toward an archival route-index column layout. Homepage route CSS now uses explicit hero note classes and a codebase-native lens row grid.
- Recorded here as it directly improves the editor/learner operating environment (discoverability of interaction semantics and learning progressions). See related broad UX plan notes and the culinary-expertise plan for overlapping social-kitchen grammar work.

**Recent contribution (palette/theme/motif composability + JS instrumentation for agents/editors):**
- Central `PEDAGOGICAL_FLAVOR_TO_COMPONENT_MOTIF` + `normalizeComponentMotif` in `public/js/kernel/shared.js` (with export) makes the artistic posture → visual motif mapping a first-class, queryable, single-source contract. Used by site-settings for early data-spw-component-motif + active-motif snapshot.
- Enhanced applySiteSettings with explicit early timing (pre-paint from localStorage), `data-spw-active-motif`, and real `bus.emit('spw:palette-state', ...)` + settings:changed carrying the full combo (flavor/motif/theme/colorMode). Reactive surfaces (ornament, tuning, future measures) can now listen without full re-apply.
- CSS (core.css): explicit dark+auto motif rules + "Motif + Lighting Balance (color + mind context)" comment block ensure curriculum/lab/artifact intent survives all theme packs × lighting while composing with developmental climate ("mind") and measure-kind.
- Updated `palette_theme_composability_contract` in `.spw/conventions/site-semantics.spw` with refined timing, combinatoric species examples (operator + measure-kind + motif + climate + theme + lighting trees), and cross-refs. Extended component-box-model-responsive-audit/PLAN.md and the palette plan with audit of tuning widgets (vibe-widget, tuning-strip) confirming no new box/timing issues and automatic enrichment under the new tokens.
- Directly improves agent operating environment: the full artistic + cognitive selection is now inspectable in one const + data attrs + events + .spw contract + design catalog. Agents can reason about "what will this curriculum subjective measure look like in ritual-vellum dark weave climate?" from the contracts without grepping implementations. Cross-wired here per agent-optimization track. See also the palette-theme-composability-instrumentability and component-box-model-responsive-audit plans.

**Recent contribution (brace + operator topology and behavior enhancements):**
- Enhanced brace pivots (`brace-pivots.js`) to emit `markLayoutTrope(..., 'brace-pivot')` on semanticDensity / operatorSaturation changes. Brace axis manipulations (objective shared structure vs subjective situated meaning) are now first-class, instrumented expressive phases/tropes with full payload — observable in the same system as author/climate/measurement/layout changes.
- Added explicit topology signals in `brace-gestures.js` (`data-spw-brace-nesting`, `data-spw-brace-contains-operator`) during classification. Enables precise CSS/JS targeting for nested brace+operator+measure clusters.
- CSS gestalt polish in operators.css for `[data-spw-form="brace"]` + `[data-spw-measure-kind]` under gesture states (shared tint, animation participation, wrapping guards). Strengthens proximity and common fate without layout surprises.
- Documented full set of topology/behavior opportunities (fidget-tunable charge, manuscript layering via brace forms, richer nesting, integration with semantic expressions) in the expressive-layout-tropes-fidget-manuscript plan, with cross-refs to brace physics in site-semantics.spw and operator projections. Directly supports the "1000 fidget toys" and "magic manuscript layers of intent" vision for senior SEs and authors.
- All surgical, contract-aligned, and immediately useful for inspection (spwCompose, state inspector, design catalog). Cross-wired here because richer brace/operator semantics measurably improves the agent/editor model of the site's core grammar. See the dedicated section in expressive-layout-tropes-fidget-manuscript/PLAN.md and the component layout/interactivity audit.

**Recent contribution (cognitive containers, inline settings, meaning attributes, memory resonance):**
- .site-frame and related containers elevated as "cognitive vessels": memory-managed + annotation-scope states now produce inline visual affordances (reduces dead space), meaning-depth + design-interpretation attributes for screenshot/interpretive depth, and tighter context-aware typography/alignment/overflow rules.
- Instrumentation contract extended with the new meaning attrs + query parsing (URL-driven inline customization of meaning for experiments, screenshots, and active wonder).
- Annotation-layer now propagates state to nearest cognitive container, creating observable "observational resonance" that encourages engagement and annotation.
- All changes are performance-minded (scoped, reuse existing patterns and attribute timing), cathartic (resonant, projective containers that feel alive), and aligned with attentional science (charge, resonance, tropes, allocation).
- Documented comprehensively in expressive-layout-tropes-fidget-manuscript/PLAN.md with ties to taste/genre wonder, active wonder medium, and inline interaction goals. Cross-wired here as this significantly improves the site's power as an inspectable, resonant, authorable medium for sophisticated participants.

**Recent contribution (expressive layout tropes + deliberate shifts as design language):**
- New `SPW_LAYOUT_TROPES` (phase-transition, ruleset-settle, gestalt-rebalance, manuscript-reveal, fidget-parameter) + `markLayoutTrope` helper + `normalizeLayoutTrope` in `public/js/kernel/instrumentation.js`, exposed on the `SPW_INSTRUMENTATION_CONTRACT` and on `window.spwCompose`.
- Wired a live demonstration in `applySiteSettings`: when authorMode or developmentalClimate (the core "magic manuscript" layering controls) change, a `phase-transition` trope is marked. This produces rich `data-spw-layout-trope`, reflow instrumentation, logger entries (with REFLOW relationship), and bus events — fully inspectable by senior SEs.
- Created dedicated plan `.agents/plans/expressive-layout-tropes-fidget-manuscript/PLAN.md` capturing the full vision (game-dev fidget toys for future office work + author magic manuscript with layers of intent), author complaints addressed, principles (deliberate shifts as trope, visual gestalts, explicit layering, flow/balance), and the existing strong foundation (layout-shift-audit with "intentional" path, reflow reasons, author workflow + climate in settings, brace forms, measurement, etc.).
- This directly advances agent/editor power: the site's own layout and state changes become first-class, nameable, tunable phenomena instead of opaque side effects. A sophisticated visitor can now twiddle the manuscript controls in settings, watch a named expressive phase transition occur, inspect its full payload in console/state-inspector, and immediately prototype their own 1000 variants. Cross-referenced here because it measurably improves the operating environment for the target audience (experienced software engineers + authors who need precise semantic control and observability). See the new plan for the broader roadmap.

**Wonder hub evolution on /design/ (gesture + component anatomy learnability):**
- Transformed the design hub into a gentler "local wonder hub" for passive curiosity: added explicit low-friction entry language ("wander in, tap to test, hold to inspect anatomy/state, easy path back via spell path/sample dock").
- Enhanced component anatomy / culinary instruction sections with gesture learnability hints, data-spw- attributes for anatomy/interaction, and visual SVG anchors tying tap/hold/swipe directly to readable component slots and Spw semantics.
- Strengthened runtime state evaluation affordances (links to settings with "test instantly / hold to inspect live state").
- Aligns with (and consumes) the recent experiential gesture helpers. Makes the hub a primary on-ramp for learning gestures, component anatomy, and Spw without requiring prior commitment. Passive visitors now have clear "why engage here" reasons on more elements.
- `runtime-bootstrap-performance/PLAN.md` (new active backlog item) tracks concrete reductions in serial loading, immediate layer width (especially the heavy `site-settings` kernel), and observer fragmentation in the shared runtime. These changes improve editor tooling snappiness and visitor perceived performance while the existing `spw:*` Performance + logger + module-spell surfaces remain the measurement and debug contract.
- `.spw/reviews/workbench-alignment-audit.spw` (2026-04, updated) audits the relationship between the site's .spw surfaces and the spw-workbench. Per current direction, the experience-slices + volleyball collaboration model is kept intentionally local/downstream to this repository for human developer conversation and long-term work on slices of the site. The audit now treats the separation as by design and focuses recommendations on strengthening repo-internal handoff tooling rather than upstream promotion.
- `modular-experience-slices/PLAN.md` now names `math-practice-labs` as the first concrete practice-bed pilot, adds `attention-resonance-field` as the next slice contract candidate, and introduces `.agents/plans/modular-experience-slices/templates/tending-note.spw` as the first lightweight handoff artifact.
- `.agents/plans/spw-surface-normalization/PLAN.md` + `.spw/reviews/spw-surface-normalization.spw` (new) establish lightweight but workbench-aligned conventions for headers, ^"section" structure, @references, sedimentation notes, and explicit dimensional declarations (practice_depth, temporal_rhythm, semantic_layer, collaboration_phase) across the site's .spw surfaces. This directly reduces re-learning friction for returning humans and future slice tenders and is a prerequisite for scaling the earthy-rhythms + experience-slices collaboration model. It lives strictly local to this repo.
- `spw-plan-maintenance` now has initial references from skills, `.spw`, `AGENTS.md`, and the public plans register, but routine usage cadence still needs proof through future sweeps.
- Skills have only a minimal collective README; no generated index, no `.spw` model, and inconsistent cross-linking.
- **Theming depth, CSS token semantic utility, matte clear-contrast, design hub experimentation surface (landed)**: Cross-cutting pass on core tokens (semantic ink/surface families, --ink-on-matte* / --text-on-matte* / --semantic-accent-on-matte utility + strong clear variants), material contrast projection (making "matte = clear opaque contrast safeguard" reliable across light/dark/packs for dense text/inspection; body[data-spw-base-metamaterial] page treatment), global baseMetamaterial + prepaint wiring for early paint, and major UX/surface-area + JS architecture enhancements on /design/ (enlarged material-contrast-bench with more real specimens (ops/code/prose/forms) + global apply buttons + token readouts, discoverability circuits, improved design-experiments console API (applyClearMatteContrast, inspectSemanticTokens, getCurrentContrastState)). Updates to surface_material_contract in .spw, settings labels, and agent-optimization tracking. All checks + catalog green. Improves editor inspectability of the full style system and turns the design hub into a stronger instrument panel. Tracked here per agent-optimization mandate; spw-plan-maintenance sweep performed (plan hygiene + .spw dispatch cross-ref + catalog regen). Coordinates with "another agent" exploration via this plan. See dedicated plan notes under the active work.
- **Improve settings wiring (landed as follow-up to matte/shell feature)**: Made shell utilities (clear-matte cluster with sigil/argument, font scale), design bench global apply (compound data attr), attention pinch, and related reactive surfaces (discovery notices, prepaint, satchel capture of appearance slice) robust by adding explicit setters (setBaseMetamaterial, setHighContrast, setFontSizeScale, setClearContrastMatte) in kernel/site-settings.js that delegate to canonical save/apply/bus path. Improved parseSettingTriggers + applySettingTrigger for compound "k:v;k2:v2" in data-site-setting-set (supports the bench "apply matte clear globally" button). Shell handler, design-experiments, attention now prefer setters (with safe fallback). All appearance changes (matte as clear opaque safeguard, highContrast synergy) now uniformly: validate, normalize, persist, apply (datasets + CSS), mark deviations, emit settings:changed. No bypasses in forms/satchel. Updated surface_material_contract dispatch + this plan. Surgical; preserves contracts. spw-plan-maintenance hygiene performed post-close (plan note + .spw bridge).
- **Page architecture vocabulary, granular data attrs, component locality, flexible interaction physics reason (this pass)**: Amplified existing data-spw-locality / data-spw-physics / data-spw-density / data-spw-module-evaluates / semantic clusters (already in catalog + frames) with .spw#page_architecture_vocabulary contract explicitly covering intern research tool (business-compelling high-density/precise vs experiential calm/relationship reading), designer delegation (edit attrs + .spw to learn runtime without deep JS), semantic density practical (Drupalcon reflection), component locality on settings/menus/pattern-locks/satchel, and fun flexible "physics reason" string that can be updated (via new physicsReason setting + data-site-setting-set chips in design context stack + query) and described to modulate gamified navigability (menu spring, collection, attention echo, motion across site). Surgical HTML additions (shell utility clusters now declare locality+component-locality+physics-reason; settings fieldsets; design controls), CSS granular selectors in foundation, kernel/prepaint support for early dataset, density page research note. Enables visitors to develop vocabulary by inspecting the driving data structures rather than taking visuals for granted. All via minimal surfaces + full validation gates. Tracked here; spw-plan-maintenance note added.
- **Color audit + design page immediate tuning abstractions + minimalist motifs + font/layout UX (this pass)**: Audited color defs (grep/read tokens/core for centralized --ink-on-matte-strong/--text-on-matte*/--material-ink-matte* contrast families + material aliases; components/foundation/cards/content/frames for local mixes, --ink-soft, opacity on text/rails that risk contrast on glass/matte/dark). Improved by adding material-aware --component-ink/surface overrides in foundation.css using semantic aliases when [data-spw-metamaterial] (plus high-contrast boost); audit comment on reducing dup, better legibility, support for motifs/material. Design page: added live "immediate appearance" abstraction cluster (chips calling new setImmediateAppearance in design-experiments for accent/contrastBoost/motif/fontScale/layout via root data+style.setProperty for instant preview; reset fn; exposed in modify section after physics tuner; composes w/ material bench, bundles, query for tuning color/contrast/material/font/layout immediately). Minimalist motifs: added 'minimal' to tokens/core.css (low --pigment-context-boost, neutral op-color for pure material/ink play, no ornament distraction; CSS rule for data-spw-component-motif=minimal; usable via design immediate or attr for playful exp w/ material props; doc in .spw). Font norm (scale*preset in getRootFontSize + prepaint/apply) + layout sel UX: immediate buttons demo large/atlas/font+layout live, added norm note in settings typography (w/ link to design preview); layoutTuner/data-spw-layout now previewable immediately. All surgical per AGENTS (layers, no inline except JS dyn, root-rel, preserve). Updated .spw (motif note), PLAN. Gates + catalog. Ties prior (enhancement, motif map, material, physics-reason, immediate in bench).
- **Working tree code quality review (CSS cascade/runtime, JS composition/pipelines, semantic abstractions for principal engineers + storytellers)**: Reviewed full accumulated changes (tokens/core, foundation, material/effects, chrome/shell, design-surface, ornament, cards, svg-surfaces, site-settings, shell-disclosure, prepaint, etc.). CSS: layer order respected (style.css imports correct; no !important outside ornament); good runtime alignment (data attrs from settings/prepaint/shell written early, consumed in :root[data-spw-*] and [data-spw-component-locality] selectors); cascade value improved by redistributing --material-* semantic aliases (ink/surface/text-on-matte/shadow) from effects/material.css into tokens/core.css (earlier layer, per core's own "semantic aliases in tokens" guidance, broader availability without effects dep). JS: strong data builders (buildDatasetEntries extracted as pure fn for composition/pipeline clarity in apply: normalize->modifiers->build datasets/styles->effects->bus; matches "data builders and function composition"); normalize/validate/sanitize/derive* are composable; shell has explicit state machine + snapshot pipeline (MODES/PHASES -> build -> sync); opportunities noted for future reclustering (e.g. more per-action maps) but no broad renames to avoid churn. Semantic: synthesized "tunable material surface" (baseMetamaterial + physicsReason + density + tokens as live "narrative material" for cross-disciplinary complex productions – engineers + niche storytellers share vocab like "playful physics-reason for whimsical beat"); "gravitational down" (vertical block/scroll as gravity on reading mass; lift/translateY against it); "cognitive lines/planes" (2s in utility sigil+arg clusters as lines/binary, 3s/triads in groups/anatomy as planes; documented in new .spw frames #tunable_material_narrative_surface + #cognitive_gravity_planes extending page_architecture_vocabulary). Added comments in CSS/JS/.spw. No large redistribution beyond the alias move (preserves hand-authored structure). All surgical, validated, catalog-aware. Relevant for creative principals exploring media production pipelines (the runtime itself is the tunable pipeline abstraction).
- **Site utility + state satchel mind cognitive/attentional physics + material (this pass)**: Per request, made .spw-shell-utility-row (and its clusters for clear-matte/material-contrast, open-satchel) and state satchel (inspector root/panel/launch + drag) explicitly mind the models: read/write/sync data-spw-attention, spwWonderState, spwFieldResonance, spwPhysicsReason, spwSemanticDensity, spwMetamaterial (from global baseMetamaterial via settings/prepaint/root); react via settings:changed + bus + MutationObserver (like discovery notices); declare on elements for CSS/inspect/catalog consistency. Audit of material defs: global via body[data-spw-base-metamaterial] + prepaint + settings form (baseMetamaterial radios); local via data-spw-metamaterial on design specimens/frames (glass/matte/contrast/paper/field overrides), now also on utility row + satchel chrome/panel/launch (surgical propagation in sync/create + reapply on changes + CSS rules in material for .spw-*-utility/satchel when attr present). Tap/hold/drag: satchel drag already positional (now sets spwGesture=drag + spwAttention=sustained during, clears on up for field decay); utilities use tap for direct (e.g. clear-matte toggle), titles/gestures mention hold for inspect of physics/material (tie to experiential anchors); satchel summary updated. Added #utility_satchel_physics_material_contract to .spw (extends attention-field operational, page_architecture_vocabulary, tunable_material); updates to shell-disclosure + state-inspector with comments explaining role in models. Keeps chrome as participant in attentional field and tunable material surface (not external UI). PLAN hygiene + catalog will reflect. All minimal, preserves structure.
- **RPG Wednesday (l'n'd'r Bjrknptpf clay/golem + "speech bubble metaphysical expertise") as recurring quality + research driver (this pass)**: The character (name jumble like bushy-mustached bar patron affirmation) and magic provide the public goal and cross-disciplinary lens for the long list of considerations: card design for explicit spacing (interactive / descriptively-absent / truly null via data-spw-spacing on frame-card/panel + CSS rhythm rules + foundation salience); component state + machinability (data-spw-card-state, data-spw-machinability, data-spw-state-contract + steps); regional semantics clarifying hubs from path pages (data-spw-region="hub|path" + role on design/rpg-main vs character/sessions + CSS distinction); generalizable charge/discharge + ease of variability/steps through states (data-spw-charge 0-3/artifact, modulated by physics-reason, visible on cards/badges + transient feedback); combinatoric behavior selection + component relationships as "artifacts" + exploration of layouts + behavior semantics for Spw symmetry/higher-order markup (design nook cycles + satchel snapshot + rpg artifact cards); prefix/postfix + concept labels (sigil/arg already, extended .spw-prefix/postfix/concept-label in cards + note tying to linguistic speech acts); perspective + mode switches + reasons to collect notes for cauldron (data-spw-perspective, data-spw-badge-mode skim/select/activate, data-spw-cauldron* + guide-badge unique copy + collect emit); page-specific nav enhancements + topical navigability/stub thoroughness (regional + operator nav on rpg/design + hub vs path cards); buttons side-by-side in shaded nook embedded (new .spw-nook + data-spw-region-role=nook + component-locality in design + inline data-site-setting-set toggles + demo actions); badge interactions/tunability/unique copy (guide-badge extended for mode + buildUniqueCopyText + transient toast on collect); modes for selection/activation/skimming (badge-mode + card-state + selection attrs + handlers); small disappearing toasts/chips (spw-toast--transient + spw-disappear-chip + emit in badge + CSS auto-fade + floating tier); page regions + dragging floating chrome + snap/fluid options + fluid semantics (existing drag + new data-spw-snap/corner/edges + chrome-fluid + physics-reason timing in floating-chrome + state-inspector); scroll/swipe competition contexts (gesture marking + pointer-events late fade); text interaction semantic enhancement + reasons to use layouts + developing component ecology (concept labels, prefix/postfix, nook, regional, charge on texty cards, design specimens); RPG Wednesday as reason to develop quality product encouraging wonder about PWAs + curiosity about cultural development/community/art/software/math/physics/writing/production/gardening/storytelling (copy in design nook + rpg character card + .spw driver frame); inline settings toggles (in nook); disappearing toasts/chips + state traversability (everywhere). Surgical: reused/extended catalogued data-spw-* families (no one-offs), added CSS in cards/foundation/chrome (components layer), small JS in guide-badge + design-experiments (no new deps), HTML markers + one illustrative artifact card on rpg character path + nook cluster on design hub. Updated .spw with 10+ new frames (#rpg_wednesday_linguistic_metaphysics_driver + spacing + charge + regional + nook + toast + symmetry + cauldron + ecology + nav + inline). Appended entry here + plan hygiene note. Ties directly to prior material/physics/cognitive/grammar work: speech bubbles = operators as metaphysical speech acts; materials (cards/tokens/surfaces) as paint (tunable like pigment/brush/ground); real physics (charge quanta, snap inertia, damping via reason) inclusive for accuracy/fantasy. Full gates + catalog. Design hub + satchel + catalog now even stronger "research instrument" for interns/designers/principal engineers/storytellers collaborating on complex productions.
  **spw-plan-maintenance hygiene (post-landing, this pass)**: Per skill, swept .agents/plans/ (this entry added to agent-optimization/PLAN.md as cross-cutting semantics + research instrument + RPG driver work improves editor/inspector surfaces and contracts). .spw updated (new frames in site-semantics.spw for card spacing explicit, charge generalized, regional hub/path, nook, disappearing toast, Spw symmetry/prefix-postfix, cauldron notes, component ecology, linguistic metaphysics driver, nav/inline; these are reusable semantic families so dispatch via conventions/site-semantics + site.spw should reference if not already auto-scanned). Catalog re-ran (727 attrs now surfaces the new values/usage on cards, chrome, badges, rpg HTML, design nook). No new plan slug needed (fits agent-optimization track per "improves agent/editor operating environment" + prior material/physics entries); no archive move. Cross-refs in new .spw frames to cards.css, foundation, guide-badge, design-experiments, floating-chrome, rpg character path, design hub. Validation: git diff --check clean, node --check on guide-badge + design-experiments passed, npm run check (audit+builds+site contracts) [check] passed, npm run catalog success. Commit will include this note. Future: if public /about/plans/ or skills README drift, a dedicated sweep will catch; skills discoverability still per baseline gaps.
- ~50+ active backlog plans create signal-to-noise risk; no lightweight status markers (canonical/active/dormant) usable by tools or the public page.
- **Utility menu layout, footer cauldron layout, learnability + configurable feedback, ephemeral chrome architecture, visible console + satchel resonance/ergonomics (this pass)**: Focused shell/ephemeral chrome improvements per request. Public goal: make quick controls (utility clusters with sigil/arg), memory garden (cauldron at footer/card bottoms), floating ephemeral (satchel/console/toasts/handles), and visible console more ergonomic, learnable, consistent in layout/material/feedback while preserving progressive hand-authored nature and resonance across chrome (satchel and console feel related for state+diagnostics; utility as "lines/planes" of controls). Configurable feedback/learnability via enhancement-level (affects idle, density of notices/history, cue strength) for subtle vs rich.
  Surgical: CSS in shell/chrome.css (utility row/clusters/buttons baseline/gaps/align for menu layout + learnability; footer cauldron flex/align-self for status+ingredients+actions, button bottom align in chips/footers, integrate spw-cauldron-footer); floating-chrome.css (shared --chrome-pad/gap/font + material + enhancement-level for ephemeral arch, ergonomics comments); operators.css (console layout resonance: grid, pad, baseline, idle var, collapsed ergonomics echoing satchel); JS: console.js (set floating-chrome attrs + material sync + applyFeedback from enhancement-level for configurable verbosity/idle/feedback richness; mode buttons now operator-chip for satchel resonance); no HTML template changes (use existing).
  .spw: extended site-semantics with frames #utility_menu_layout, #footer_cauldron_layout, #configurable_feedback_learnability, #ephemeral_chrome_architecture, #visible_console_satchel_resonance (contracts for data attrs, shared vars, resonance, feedback via enhancement-level).
  PLAN: this entry + hygiene (cross-ref floating_chrome_contract, shell utility prior, cauldron from RPG pass).
  Learnability: better targeting/gaps/aligns, aria preserved, feedback level modulates presence (rich=more cues/history). Ephemeral arch: tier/role + vars centralize layout policy. Console/satchel: shared positioning, chips, material, summary/feedback text, collapse/launch patterns for ergonomics.
  Validation gates, catalog. Ties prior (shell utility material/locality/physics, cauldron from RPG/previous, floating from RPG snap, material tokens, enhancement-level, operator sigil/arg distinction, satchel drag/gesture).
  Out of scope: full re-arch of all chrome, new settings UI page changes, heavy console features.
- **Design catalog improvements + spell/cauldron/settings + vocab discovery wiring + topic wonder audit + MDN links + venue/recipes aspiration + copy arcs/readability + liminality/materials/attentional + semantic density magic (perf-minded) + AI wonder culture + media tropes + design-eng hire path + pragmatic perspectives + RPG character/worldbuild prep (this pass)**: Broad cross request treated as model-guided refinement of discovery, arcs, semantics, and editorial surfaces. User-facing: spell+cauldron as enhanced, satisfying tangential control + discovery (wired to settings like physics-reason/semantic-density for "ease" and "richness"; vocab from wonder-vocabulary surfaced); design catalog now audits "unique spwashi wonder connections" (Spw grammar across domains, material metaphysics as attentional, rpg+recipes as venue prototype, liminal hospitality, cauldron as control); more surface area/scroll reasons/bumbling interactive links via enhanced experiential/navigation-spells + nooks + operators in design/rpg/topics; copy clustered/phrased for mature book-like readability, professional relationship encouragement, visual variety for narrational flow + topical salience (surgical in about, design, topics/software, rpg, recipes); prepare RPG for iterative character design/worldbuild (more semantic on character/world pages, tie l'n'd'r speech-bubble to venue restaurant scenes); venue aspiration (own entertainment+restaurant with compelling recipes/fantastic service) tied explicitly to recipes/ + rpg + about "Restaurant horizon" + settings culinary; liminality + materials science + attentional flow wondered in .spw + frames (extends prior); MDN links added where web platform (e.g. more topics); Obsidian links kept positive (intentional application noted in copy) with pragmatic math rephrased per "it's possible to apply attention to other structures of necessary problem-solving" (interviews, tech rels, exp design pace, personality frames, abstractions teaching respecting longitudinal/short-term motivations of perspective frames — surfaced in .spw + about + topics); removal of automerge links in the knowledge refs adjustment); culture of wonder + iterative AI synthesis across social/experiences, tropes/media legacy, compelling FE/design eng, pave hire design-eng who explores copy with wonder, semantic density for magic (add data-spw-* in HTML for spells/cauldron/liminal/material but mind perf via existing enhancement-level/semantic-density + notes); encouraging different info structures exploration.
  Per spw-feature-planning (read SKILL + shared workflow): public goal = richer wonder/arcs/discovery/control via spells+cauldron+semantics as site "magic" while pragmatic about engineering realities + personal venue horizon as narrative throughline. Predicted minimal: route HTML (about, design, play/rpg-wednesday/* (world/character/cast), recipes/*, topics/index + software/*, services); shared JS (spells.js + navigation-spells + experiential + guide-badge + topic-discovery + design-experiments for wiring/settings/vocab/surface); shared CSS (light for arcs if needed, but reuse); .spw (site-semantics + wonder-vocabulary + new frames); catalog gen script (improvements for topic audit + wonder connections); agent-optimization/PLAN + hygiene. Chose agent-optimization rail (cross agent/editor + semantics + discovery). Cross-discipline: engineer (pragmatic interviews/abstractions/perspectives) + artist/designer (copy wonder, tropes, visual flow, design-eng hire) + musician/culinary (recipes/venue/rpg scenes) + storyteller (arcs, worldbuild, media legacy). Files changed listed in commit. Semantic seams: extend data-spw-spell/cauldron/liminality/wonder + new for density-magic, venue-arc; runtime seams: spells now consult site-settings for modulation + emit vocab events; catalog now produces wonder-topic section.
  Surgical execution: Obsidian kept positive/intentional (about restored links + note on apply/math/other structures per clarification; removed automerge); add MDN (topics/software/spw, design); enhance spells (settings integration: physicsReason for spell cast "feel"/ease, semanticDensity for vocab discovery richness; cauldron as control surface); catalog script (add unique wonder connections audit + spell/cauldron/liminality grouping + perf note for semantic density); .spw frames (new: spell_cauldron_wonder_vocabulary, liminality_materials_attentional_flow, venue_entertainment_recipes, semantic_density_magic_performance, media_tropes_legacy_ai_wonder, design_engineer_hire_copy, pragmatic_engineering_perspectives, topic_wonder_connections, rpg_character_worldbuild_prep); copy/arcs (surgical phrasing clusters in about "Restaurant horizon" expanded with recipes/service + rpg tie + liminal materials, design culinary, rpg world, topics for book-flow/visual variety/professional rels/AI wonder/pragmatic; add bumbling interactive + scroll reasons via existing + data- + nooks); venue (recipes links + copy in about/rpg/settings); RPG prep (character/world HTML + semantic for iterative design, tie speech-bubble/venue restaurant); liminality/materials (extend wonder-vocab + site-semantics + frames with attentional flow notes); topic audit (via catalog + .spw, identify unique: Spw as unifying grammar, material as attentional paint, cauldron/spell discovery control, rpg+recipes as physical venue prototype, liminal hospitality across nutrition/mental/craft).
  All per AGENTS: smallest surfaces, preserve unless change required for readability/arcs (here required), root-rel, progressive, no new deps, validation, .spw for families, agent-optimization for this (improves editor surfaces + contracts for hire/designer delegation + wonder culture). Ties prior (RPG l'n'd'r speech-bubble, material/physics, cognitive gravity, declarative tuning rigs, spells/cauldron from experiential/ornament, semantic density).
  Validation + hygiene at end. Out of scope: full copy rewrite, new routes, heavy new JS for "AI wonder engine" (use existing bus/data- + .spw), Obsidian removal beyond de-emp.
- **Cauldron hook (jump/highlight interactables + categories) + visual mode toggle/settings for differential cauldron/spell candidate visibility + token/cascade + card/region variant enhancements (this pass)**: Per query. Public goal: make cauldron bidirectional (not just collect, but hook back to source items on page for interaction), with visual modes that make candidates (primed/charged things) vs collected differentially salient via toggle wired to settings (learnability/feedback configurable), while polishing tokens (new wash/highlight/region props in core for cascade) and card/region variants (cauldron-target, jump highlight, candidate styling).
  Predicted files (spw-feature-planning style): composition.js (hook + find fn + category), site-settings.js (new cauldronCandidateVisibility option + dataset + labels + defaults + sync), shell-disclosure.js (new utility cluster toggle + handler + sync for vis), tokens/core.css ( @property --cauldron-candidate-wash etc + --region-jump-target), shell/chrome.css + cards.css + foundation.css (visibility rules using data attr + tokens, highlight anim, variant=cauldron-candidate / region=cauldron-target), .spw/site-semantics + PLAN.
  Surgical: added setting + toggle (reuses save/apply/bus/enhancement synergy like prior), CSS rules after material (cascade ok), JS fn for hook (expression + category match on living/brace/op, scroll + temp class + data-cat), no new deps, preserve contracts.
  .spw: new frames #cauldron_hook_jump_highlight, #visual_mode_cauldron_spell_visibility, #cauldron_spell_token_cascade_card_region_enhance.
  PLAN hygiene note appended. Ties prior (cauldron from composition/RPG, enhancementLevel, floating/visibility, utility, cards gesture/state, tokens material, re-gather scroll).
  Validation: check passed.
- **Offline-first agent validation clarification (2026-06)**: The repo already had the core mechanism (`npm run check:local`) and the dependency-surface rule for `npm audit`. This pass made the intended usage explicit in `AGENTS.md`, the shared site workflow, and the skills README: use local repo evidence first; use `check:local` for ordinary non-dependency patches; reserve `npm run check`, `npm run audit`, package installs, and external web searches for dependency-sensitive work, explicitly current external facts, or cases where local context cannot answer. No new script was added because the tooling was already present; the improvement is discoverability and future-agent decision quality.
- **CSS/JS ownership contract hardening (2026-06)**: Tightened the executable architecture checks instead of moving files. `scripts/ts/css-contracts.mts` now rejects cascade-layer drift by requiring each `public/css/<layer>/...` import in `style.css` to use the matching layer, and keeps root CSS limited to `style.css` / `compose.css`. `scripts/ts/runtime-contracts.mts` now names the allowed top-level JS owner folders and rejects accidental new module families unless the runtime contract changes with them. Public CSS/JS READMEs and `.spw/conventions/model-guided-refinement.spw` now carry the corresponding ownership claim. Validation path: `npm run check:css`, `npm run check:runtime`, `npm run check:local`.
- Limited agent memory/state beyond the route manifest (one SVG memo, poll history).
- Cross-surface citations exist in spots but are not systematic (plans cite plans; .spw cites some plans; public page cites GitHub; skills are isolated).
- No routine cadence or lightweight automation for plan hygiene, archive sweeps, or syncing editor surfaces.

## Success Criteria

- An agent (or human) can start from `.agents/README.md` or `.spw/site.spw`, follow one short dispatch, and reach the current canonical tracks, active high-signal work, relevant skills, and validation contracts without guessing or grepping the whole tree.
- The planning ecology, skills, and "editor inspectability contracts" are modeled as inspectable concepts in `.spw` (entities, relations, invariants) so they survive beyond any single patch or person's memory.
- Quick wins (stale docs, basic bridges) land in small patches. Larger improvements (public page data-driving, richer manifest, skill catalog) follow a clear, reviewable sequence.
- `spw-plan-maintenance` becomes a routine, cited tool rather than a dormant definition.
- The public `/about/plans/` page (and any future editor surfaces) can be refreshed with lower manual effort while staying semantically rich.
- `npm run check` (and related commands) continue to be the cheap verification entrypoint; agent surfaces do not regress existing contracts.
- New reusable semantic families or attributes introduced by this work are wired into `.spw` and (where appropriate) the design catalog or route metadata.

## Out Of Scope (for this track)

- Rewriting the entire public plans page in one go or introducing heavy client-side dynamism.
- Moving canonical planning authority into the workbench (site-local plans and the thin `.agents/` layer stay the source of truth for this repo).
- Adding new runtime JS or browser features for "agent mode".
- Comprehensive auto-generation of every plan card; prefer small, honest improvements that preserve hand-authored voice where it matters.
- Changes to the core design catalog scope (it correctly excludes `.agents`).

## Semantic and Runtime Seams

- **Planning ecology** lives primarily in `.agents/plans/` + its READMEs + the public `/about/plans/` surface. It is an *editor/inspectability* layer, not a publishing surface.
- **Skills** are discoverability wrappers (local SKILL.md + mounted workbench sources). They are tooling affordances.
- **Agent contracts** (manifests, checks, validation rules) live in scripts + `.agents/state/runtime/` + AGENTS.md. They are the executable truth for "did I break it?"
- **Ontology** for these concepts belongs in `.spw/` (thin site bridge) so agents and editors can traverse them the same way they traverse operators, frames, or attention fields.
- Public exposure (GitHub links, `/about/plans/`) is a convenience projection, not the contract.

When a new concept (e.g., "planning surface", "agent contract", "editor seam") deserves to remain legible beyond one implementation patch, it gets a `.spw` note *and* a plan entry if the work spans layers.

## Patch Sequence (Suggested)

**Phase 0 — Orientation & Plan (this document)**
- Create `.agents/plans/agent-optimization/PLAN.md`.
- Add initial cross-references from existing agentic work and key skills.

**Phase 1 — Quick Hygiene Wins (smallest honest surfaces)**
- Fix `.agents/plans/archive/README.md` (bring canonical list current; note the fourth track).
- Add minimal `@agents` / `@planning_ecology` dispatch entries in `.spw/site.spw` and `conventions/index.spw` (with citations to this plan, `agentic-dev-contracts`, and the plan-maintenance skill).
- Update `.agents/skills/README.md` with a short "Key Skills for Site Work" table or grouping (plan maintenance, ontology, semantics rigor, craft quality, etc.).
- Add a pointer in `AGENTS.md` (under Build pipeline or Working Guidelines) to the new plan as the tracking document for agent-environment improvements.
- **Skill hardening pass** (executed immediately after plan creation): improved `spw-plan-maintenance`, `spw-ontology-workbench`, `spw-feature-planning`, `spw-fix-planning`, `spw-craft-quality`, `spw-semantics-rigor`, and the shared workflow notes with explicit ties to this plan and the new agent dispatch surfaces.

Validation: `git diff --check`, spot-read of changed .spw and READMEs, `npm run check`.

Phase 1 status: initial hygiene has landed in the plans indexes, skill README, `AGENTS.md`, `.spw/site.spw`, `conventions/planning-ecology.spw`, and the public `/about/plans/` register. Later passes should focus on reducing manual maintenance cost rather than adding more prose.

**Phase 2 — Make the Planning Layer Inspectable**
- Model core concepts in a new or extended `.spw` file (e.g., `conventions/planning-ecology.spw` or additions to `site-semantics.spw`):
  - Canonical vs backlog vs archive as first-class distinctions.
  - Relation between plans, skills, .spw bridges, and public editor pages.
  - Status markers and maintenance invariants.
- Wire the model into `.spw/site.spw` dispatch and the public plans page where helpful.
- Update `spw-plan-maintenance/SKILL.md` (and its `_shared` notes) with concrete examples of recent sweeps.

**Phase 3 — Reduce Maintenance Tax on Public Surfaces**
- Explore lightweight machine-readable index (e.g., `.agents/state/plans-index.json` or extension of the route manifest) that the `/about/plans/` page and future tools can consume.
- Add status/priority metadata to high-signal plans (or a small `index.spw` under plans) usable by generators.
- Optionally: small generator script or enhancement to existing manifest tooling that emits a stable plans summary (keep it optional and opt-in).

**Phase 4 — Skill & State Discoverability**
- Improve skill surface (better README, optional `.spw` model or dispatch, more systematic citation from plans and the public plans page).
- Expand `.agents/state/runtime/` or add lightweight agent memory surfaces (e.g., recent plan activity, open seams) only where they provide clear value without adding noise.
- Document a lightweight maintenance cadence (e.g., "run spw-plan-maintenance after any multi-plan landing or before a release sweep").

**Phase 5 — Documentation & Closure**
- Harden cross-citations (plans ↔ .spw ↔ AGENTS.md ↔ public pages ↔ skills).
- Update this plan with results, retired sub-items, and any new reusable contracts introduced.
- Consider whether "agent contracts" or "editor seams" deserve a small dedicated convention or surface in the design system.

## Validation Loop

For every patch:
- `git diff --check`
- `npm run check` (or the narrower `check:css` / syntax subsets as appropriate)
- Manual review of `.spw` dispatch and any new models for balance and thinness
- Spot-check that `/about/plans/` and key READMEs remain coherent (no broken conceptual links)

For changes touching public editor surfaces:
- `npm run catalog` (to ensure no unintended design-catalog side effects)
- Browser sanity on `/about/plans/`

When introducing new semantic families or data attributes:
- Wire into relevant `.spw` (site.spw, conventions, or a new dedicated file)
- Update AGENTS.md if the family is broadly reusable
- Consider a short entry in the public plans page or design notes

## Combined Roadmap Position

This plan sits alongside (and feeds) the existing design-system and craft tracks:
- It is the "meta" layer that makes the canonical tracks (`css-architecture-readability`, `color-motion`, etc.), the skills, and the agent contracts cheaper to use over time.
- It directly supports the "editor inspectability" and "literate code" goals stated throughout AGENTS.md and the canonical plans.
- Successful outcomes should reduce friction in future reference assignments and component sessions.

## Review & Maintenance Notes

- Revisit this plan after any significant landing in the canonical tracks or after a deliberate plan-maintenance sweep.
- Archive or split sub-tracks (e.g., "public-plans-page-maintenance") into their own focused plans once they have clear independent scope.
- Prefer citing this plan (or `agentic-dev-contracts`) from new `.spw` notes about editor surfaces rather than duplicating prose.

## Initial References & Citations

- `agentic-dev-contracts/PLAN.md` (foundation for executable contracts)
- `spw-plan-maintenance/SKILL.md` + `_shared/` notes
- `spw-ontology-workbench/SKILL.md`
- `.agents/README.md` and `.agents/plans/README.md` (the documents under review that triggered this work)
- `.spw/site.spw` and `conventions/` (current thin bridges)
- `AGENTS.md` (especially sections on plans, .spw, and "when a concept should stay inspectable")
- `/about/plans/index.html` (public projection surface)
- `scripts/ts/check-site.mts` + `site-contracts/` (current verification seam)

## Skill Improvements (Executed as Part of This Track)

As immediate follow-up to the creation of this plan, the following skills received targeted improvements for better support of agent optimization and planning ecology work:

- `spw-plan-maintenance` — Expanded workflow with explicit steps for the new `.spw` `@agents` dispatch, skills README, public plans surface, and cross-plan wiring. Added "Current Focus Areas" section tied to this plan.
- `spw-ontology-workbench` — Added "agent contracts", "planning ecology", and "editor inspectability surfaces" as explicit domain examples. New good output type for agent-layer models.
- `spw-feature-planning` + `spw-fix-planning` — Added guidance: when the work *is about* the agent/planning layer, route the plan/FIX under `agent-optimization/` and invoke plan-maintenance.
- `spw-craft-quality` + `spw-semantics-rigor` — Light pointers to the active agent-optimization modeling work.
- `_shared/site-workflow.md` + top-level `skills/README.md` — Made agent surfaces and the new plan more discoverable.

These changes are small, follow the "thin wrapper + site-first" contract, and make the skills more effective exactly for the work this plan exists to track. Future sweeps using `spw-plan-maintenance` should keep these skills current.

This plan exists so that future agent-driven or agent-assisted work on the site has a stable, reviewable home for improvements to the environment itself.
spw-plan-maintenance hygiene invoked post-commit: reviewed staged source changes for the color/ tuning / motif / UX / physics-material pass; .spw frames added (minimalist_motif, utility_satchel contract); PLAN entries include detailed synthesis + future hints; catalog regenerated (gitignored); no new skills/renames needed. Core improvements landed cleanly.

**update copy to make better use of these features; update markup for component diversity, image diversity; audit button layout for semantic emphasis; consider subvocalization and attentional architecture refinements, resonance with spells and cauldron (this pass)**: Per explicit request. Public goal: now that cauldron hook/visual modes/tokens/card-region/variant + utility/cauldron/console polish + all prior (charge/regional/badge/nook/toast/physics/material/enhancement/spells resonance) are live, make the site copy actively demonstrate and invite use of them (weave into arcs for venue/RPG prep, book-like readability, AI wonder/iterative, semantic density magic+perf, unique connections); update HTML markup with component variants/regions for diversity + inspect; audit buttons (nooks/utility/cauldron actions use operator-chip for sigil/arg semantic emphasis + clustering/alignment); refine subvocal (speech-bubble = inner speech/anticipation) + attentional (handle/probe + cauldron priming/jump/gesture/discharge bidirectional) for "magic" feel and learnability.
  Surgical (AGENTS): route HTML (topics/index, topics/software/spw, about, recipes, design, play/rpg-wednesday/index + character) for copy clusters/phrasing + data-spw-component-variant/region/artifact on cards/frames/nooks/sections + image alt/srcset diversity notes; cards.css + chrome.css comments for button audit (operator emphasis, nook side-by-side, bottom flex, no generic buttons where op taxonomy fits); attention-architecture.js (new SUBVOCAL_REHEARSAL_ATTR/CAULDRON_RESONANCE_ATTR + hasCauldronResonance logic in updateSectionHandleState + bus nudge on cauldron:ingredient-inspected + contract exposure) + composition.js (set data-spw-attention=rehearsal on jump targets + cleanup); .spw/site-semantics.spw (two new frames #subvocal_attentional_resonance_refinements + #component_image_diversity_semantic_emphasis capturing the request verbatim + surfaces/contracts).
  .spw dispatch auto via site-semantics (no site.spw edit needed). PLAN entry here (agent-optimization track, improves editor/inspector + delegation surfaces + RPG/venue prototype arcs). No new deps, preserve existing copy/links/structure unless for arcs/readability/venue/RPG.
  Validation: git diff --check (clean), node --check on attention-architecture + composition (pass), npm run check (full audit+builds+contracts), npm run catalog (attrs growth for new data- + frames), spw-plan-maintenance skill for hygiene (plan + .spw + dispatch + public surfaces). Commit message will quote request + hints for CSS philosophy (declarative materials via data-spw-* + tokens) / component arch (tuning rigs with variants/regions + immediate play in design nook) towards intuitive tuning for materials research + storytelling ergonomics (RPG l'n'd'r speech bubble as cross-domain driver, venue recipes/service as physical prototype).
  Cross-refs: prior cauldron frames, utility_satchel, RPG linguistic metaphysics, liminality_materials_attentional_flow, venue_entertainment_recipes, design_engineer_hire_copy, semantic_density_magic_performance. Future: more rpg world scenes or services copy if needed; catalog will surface new attrs for interns/designers.
  spw-plan-maintenance hygiene to be invoked post this commit (sweep plans/.spw/catalog/public about/plans for the new frames + copy surfaces).

**Palettes & Spectral Families review pass (component alignment/overflow/reflow, handles/labels, semantic hierarchy, space usage, link/icon aesthetics, screenshot value + visual poetry, component identity vs compositional esteem, design as mathematics for physical/AR-VR experiences, page arch as material basis for dense interactive semantics + tunable hooks, learning science + combinatoric salience/clustering/timing/locality/flow for scannability and spell behavior, inspiration/diversity to minimize redundancy) [Image #1 reference]**:
  The provided screenshot + overlaid dense review brief drove focused surgical work on /design/palettes/ (the live "color grammar" and "spectral workshop" instrument).
  - HTML: removed/replaced dozens of inline styles (theme-handle-test, spectral swatches backgrounds/figcaptions, projection image-studies flex/grid, seed composer form grid, operator demo flex, output pre) with classed elements + data-spw-component-identity / data-spw-compositional-esteem on swatches, panels, studies, and role maps (directly names the distinction called out in the brief); added data-spw-locality/component-locality/semantics to controls and clusters for handles + inspectability; enriched spectral-grid, projection, workshop, and role-map sections with the review language (AR/VR segue via material semantics, mathematics of physical dimension via combinatorics, component identity/esteem, page as tunable material, dense hooks for learning/integrated design, inspiration value + anti-redundancy via seeds, combinatoric impacts for scannability + spell enhancement).
  - CSS: extracted structural + alignment rules to routes/design-surface.css (scoped) and a touch to tuning.css (swatch palettes align-content for stable grid rows); added rules for new classed containers, projection grid, seed output, spectral data-driven bgs, theme-handle-test variants — improves reflow when resonance/theme changes live, consistent space, no per-element style drift, better narrow-view scannability.
  - Copy + semantics: the two hero cards, role map intro, spectral workshop description, material theatre, projection registry, and role entries now explicitly surface the review criteria as the page's own pedagogy. The "live instrument" and "projection" sections position palettes as the material/math foundation for spatial/AR experiences.
  - .spw: new frame #component_identity_vs_compositional_esteem in site-semantics (with usage tying the brief's exact phrasing); the prior #component_image_diversity... already covered related diversity work.
  - Validation: git diff --check clean; npm run catalog (735 attrs, surfaces the new identity/esteem attrs + palettes specimens); the page remains the prompt cabinet / reference assignment surface with stronger demonstration of the full stack (material, attentional, spell/cauldron hooks already present + now explicitly combinatorial + physical/AR-VR).
  Cross-refs agent-optimization (this improves the primary design "tuning rig" and editor inspect surface), prior cauldron/spell/attentional/material passes, and the review brief verbatim in the image. No new deps; kept hand-authored, progressive, root-rel. Future sweeps can use the new frame for delegation on "when does a seed earn esteem vs keep its identity".
  spw-plan-maintenance hygiene note: new .spw frame + attrs will be picked up in next full sweep of dispatch/catalog/public plans surface.

**learnability/reward improvements with similar architecture (credits/ephemeral floating chrome), enhance spell/cauldron state UX; + "link to instructions where relevant, compact; improve footer discoverability, state reflection" (this pass)**:
  Extended the credits / film-credits ephemeral floating chrome architecture (just added for module/settings application + preload after hook scan/measure) to spell/cauldron for learnability + reward.
  - JS: added rewardSpellCauldronAction helper in composition (computes live state via getCauldron/computeCauldronPhase for count/phase/primed reflection in credit text). Dispatches 'spw:discovery-reward' with presentation:'credits' on key actions: hook-jump (the state traversal UX), mix-cast, plant (persistence), nourish, prune (tending), re-gather from spell. Similar dispatch on spell cast in spells.js.
  - discovery-notices: enhanced root selection and show to support presentation=credits (routes to credits layer, uses --credits class). The existing handleDiscoveryReward + showSpw... now produce credits-style rewards when asked. Exposed showApplicationCredit on window for general use.
  - This makes spell/cauldron interactions produce learnable, rewarding ephemeral credits (teaches the contract: gather/prime → mix/emerge → plant/persist → follow hook back; reflects state in the summary text). Similar architecture = same floating credits layer, annotate, material adoption, timed linger, touch, responsiveness as the application credits.
  - Footer discoverability + state reflection: added compact instruction link in .site-footer__cauldron-status ("hooks & learnability" pointing to palettes/#spell-cauldron-hooks which has the interaction-contract, primed demo, learn text). CSS: phase reflection on .site-footer__cauldron[data-spw-cauldron-phase] (resonant gets glow, mature border, empty subtle), primed glow on .cauldron-ingredient[data-spw-ingredient-primed] using active-op token. The sync already sets the phase data; now visually reflected for better state UX without clutter.
  - Links to instructions (the hooks section for contract/gestures/learnability) are compact and placed where relevant (footer status, credit ctas).
  - .spw: new #learnability_reward_credits_spell_cauldron_state frame documenting the architecture reuse, state reflection, compact links, reward on actions.
  - PLAN entry here.
  Improves learnability (rewards + teaching text on every meaningful cauldron/spell use) and state UX (ephemeral credits + footer phase/primed visuals make the "current garden" feel observable and tended). Ties to prior (cauldron hook/jump/primed/ gestureHistory from earlier passes, credits for application, enhancement feedback, material for notices, the palettes hooks section itself).
  Compact, surgical (added helper + few dispatches + CSS + one link in partial). No bloat on every render; only on user actions + the jump (key for state traversal).
  Validation will include check + full run.

**Ephemeral floating chrome for module/settings application (film-credits style) + preload queue after hook scan + layout measure; fix stacked promo modal on /design/ (translucent/tall/overlap with console per Image #1); improve colorful interactive for readability/materials, device resp/touch, palette tunability, copy to surface tokens/ranges (this pass)**:
  The image showed /design/ with DAILY PROMO modal (glass, low opacity letting content bleed, too tall, lower-right notice + console creating stacked-chrome collision). Terminal note planned shared shell chrome tune for stronger material, spacing, compact sizing, safer offsets.
  - CSS (shell/chrome.css): .spw-discovery-notice-modal now has explicit high z (1200), max-height + overflow hidden for "not too tall for role", stronger bg mix (less translucent, focal brief), tighter --modal padding/gap for better internal spacing. .spw-discovery-notice--modal dark/light updated. Stack gets safer calc bottom ( +2.65rem desktop / +3.1rem mobile) to clear console pill + safe-area; added z 1100. New .spw-discovery-notice--credits block (bottom-center "credits roll", --credits-linger, subtle mono credits aesthetic, matte support, touch-friendly cta min-heights, console clearance) for the "configurable ephemeral floating chrome like film credits after opening sequence".
  - JS (discovery-notices.js): added 'credits' to PRESENTATIONS, ensureCreditsRoot (annotated floating layer), routing in mount, and exported showApplicationCredit(summary, {linger}) helper that creates the --credits div, auto-dismiss, clickable. Listens/adopts material. This is the surface for "module application or settings application".
  - Demo + copy on design/index.html (the page in the image): added colorful interactive cluster (4 live accent buttons for warm/cool/math/site "materials experiments" + readability impact). Added p.note surfacing exact tokens (--active-op-color, --spw-palette-probe-1..4) + ranges (craft|software|math|route) + impact. Small preload script: on load + rAF (simulates "scanning mount hooks/handles [data-spw-*] + measuring layout rect") "queues" a module apply (demo dataset) and calls showApplicationCredit with hook count + token info. Clicks on the colorful buttons trigger post-"measure" credit. Also listens settings:changed for visual keys to surface credits. This gives the "preloading phases that queue modules that are applied and impact styling or layout after..." + "ephemeral floating chrome" + "improve colorful interactive... palette color tunability" + "update copy and impact to surface design tokens and ranges of options".
  - The CSS fixes directly improve the live promo modal (stronger material so less bleed, compact height, better spacing) and lower-right stack (safer offsets so no sit under console), plus touch (larger targets in credits, safe areas). Device resp via existing media + new calc offsets.
  - .spw: new #ephemeral_credits_floating_chrome frame (with usage tying the request text + image issues + preload simulation + credits helper + token copy).
  - Also ties prior (floating-chrome annotate, material propagation to notices, enhancement-level feedback, palettes resonance, design immediate, bus settings:changed, the 260ms verify from previous).
  Validation: git diff --check clean, node --check on discovery-notices, full npm run check passed (will run again before commit). Catalog if needed for new demo attrs.
  When done: include working tree changes in commit (per note).
  spw-plan-maintenance hygiene: the new frame + the credits as reusable family for "application as credits" will be swept.

**Improve query string wiring, discoverability; visual feedback on settings application, mind UX, favor communicability; timing of interaction as "premium" verify feature (tied to palettes review image + follow-up)**:
  Expanded QUERY_SETTING_ALIASES (physics<->physicsReason, palette<->paletteResonance, material/baseMetamaterial, density, enhancement, cauldron visibility, motif, and common shorthands) so ?layout= / ?palette=craft / ?physics=puppet links (already used in design/index and runtime labs) and direct visits parse reliably — improves wiring and discoverability without breaking existing recipes.
  Exported buildQueryString + parseSettingsFromSearch for pages to build/capture "current aesthetic state" queries.
  On /design/palettes/ (the surface in the reference image): added "copy this look as query" button next to the resonance dials + current pack status. It reads live dataset values for the visual tuners, builds a minimal ?themePack=...&paletteResonance=...&colorMode=... (plus layout only if non-default), copies the full path via the existing copy helper (with "✓ look captured" label), and shows a short status. This makes the live instrument states shareable and round-trippable.
  Premium timed visual feedback: on 'settings:changed' for visual keys, the status lines and hero panels with component-identity get a 260ms [data-spw-setting-just-verified] cue (CSS transition on shadow/border that feels deliberate and confirmatory). The timing window itself is the feature — long enough for the brain to register "the benefit just landed" (e.g. warmer operators because craft-led), short enough to stay premium/responsive, not janky or noisy. Scoped to the aesthetics page for now; the pattern (bus + temp attr + crafted ms transition + communicable status) is reusable.
  Copy feedback + verify cue together "mind UX" and favor communicability: the visitor doesn't just see an instant swap; they get verification + a way to name and return to the exact material personality they just proved to themselves.
  .spw: new frame #interaction_timing_as_premium_verify documenting the concept, surfaces, and usage (verbatim request phrasing in the note).
  Validation: git diff --check, node --check on site-settings, catalog re-run (new attrs surfaced), full npm run check passed. Ties directly to the palettes review (image showed the dials and global contexts cards that now have the copy + verify), prior enhancement-level/feedback work, and the "premium feel to verify and communicate feature application and styling benefits".
  spw-plan-maintenance will pick the new frame on next sweep.

## Plan Maintenance Sweep - 2026-06-19

Invoked `spw-plan-maintenance` for active plan maintenance, completed-plan archival, consolidation, and source-surface updates.

- Swept `.agents/plans/` as a large active ecology rather than treating the original four canonical tracks as the full current model.
- Added `archive/2026-06-19-plan-maintenance.md` as the dated maintenance record.
- Updated `.agents/plans/README.md` with active buckets for semantic rails, runtime/architecture, CSS/layout/interaction, and route/content/RPG systems.
- Updated `.agents/plans/archive/README.md` with completed-reference policy.
- Marked `state-satchel-card-gesture-fixes/PLAN.md` and `card-anatomy-interactions/PLAN.md` as completed/superseded references by index note, not physical moves, to avoid breaking direct citations.
- Kept `dev-hot-reload/PLAN.md` in place as a stabilized operational foundation rather than an archive candidate.
- Updated `.spw/conventions/planning-ecology.spw` so future agents can discover the maintenance sweep and ref-safe archive policy.

Next pass: update `/about/plans/` from this taxonomy if the public editor surface should expose the new buckets.

## Conversation Audit Redistribution - 2026-06-19

Redistributed the current conversation's broad audit requests into existing owner plans instead of creating new parallel tracks.

- Added `archive/2026-06-19-conversation-audit-redistribution.md` as the archived source bundle.
- Routed page/card layout work to `component-box-model-responsive-audit` and `card-grid-density-audit`.
- Routed HTML normalization to `semantic-html-normalization`.
- Routed CSS microinteraction state and HTML alignment to `css-state-legibility`, with selector ownership in `css-maintainability-refactor`.
- Routed Spw and `.spw` file audit work to `spw-surface-normalization` and planning ecology.
- Routed broader architecture work to `site-source-layout`, `runtime-module-fluency`, and `css-maintainability-refactor`.

This keeps conversation-driven audit language visible while making the next patch choose a precise owner surface.

## Plan Maintenance Sweep - 2026-06-21

Refreshed the planning ecology before the next feature implementation commit, with focus on folder structure, archive policy, recursive optimization, and `.spw` tree benefits.

- Ran a folder census: 170 active top-level plan folders plus `archive/`, 50 active `wip.spw` files, 11 `FIX.md`-only tracks, and a small set of nonstandard folders requiring explicit classification.
- Added `archive/2026-06-21-planning-ecology-recursive-maintenance.md` as the dated maintenance record.
- Updated `.agents/plans/README.md` with virtual buckets so the active tree can be perused by owner surface rather than raw directory listing.
- Revived `style-image-cohesion/` with a compact `PLAN.md` and made its WIP references repo-relative and local-skill-aware.
- Left `recent-plan-templates/` as intentional template tooling and documented `mobile-density-operator-semantics/` as an empty local overgrowth candidate.
- Refined `spw-plan-maintenance` with recursive optimization rules: WIP-only cleanup, template-only classification, fix-only queue semantics, virtual buckets before physical moves, and oversized artifact handling.
- Updated `.spw/conventions/planning-ecology.spw` with the new sweep reference and a `tree_optimization` facet.

Next pass: project the bucket taxonomy onto `/about/plans/` when that public editor surface next changes, and split or cold-archive oversized plan artifacts only in a focused ref-safe cleanup pass.

## Runtime Cache And Metamaterial Alignment - 2026-06-21

Refined existing runtime/performance plans so the next implementation patch can optimize for both technical speed and the site's distinctive metacognitive utility.

- Updated `runtime-bootstrap-performance/PLAN.md` with a cache-strata model: transport, runtime module, semantic, interaction, and cognitive cache.
- Added warm-return/cache posture considerations to `runtime-load-instrumentation/PLAN.md` so future timing work can distinguish cold boot, warm return, restored posture, restored checkpoint, and debug/audit mode.
- Extended `runtime-module-fluency/PLAN.md` with metacognitive utility criteria: what a module noticed, what it changed/deferred/remembered, and how to return.
- Added `hypermedia_metamaterial_utility` to `.spw/conventions/semantic-capacity.spw` so metamaterial language has required owner layer, material property, cache posture, reader/editor utility, and validation.
- Added a cache/performance trail to `.spw/conventions/codebase-perusal.spw` for maintainers forming opinions without a coding agent.

Next implementation pass should name the cache stratum it improves and preserve a reset or inspection path for any remembered state.

## Agentic Development Cache Alignment - 2026-06-21

Clarified the intended caching target after the user specified agentic development caching and optimization.

- Extended `agentic-dev-contracts/PLAN.md` with an explicit agentic development cache contract.
- Defined cache families for route/runtime manifests, plan census/owner maps, skill availability, validation posture memos, semantic dispatch, and patch boundary notes.
- Set guardrails: cache repo-derived facts with invalidation paths, not model opinions or stale check results.
- Named future candidate artifacts under `.agents/state/`: `plans-index.json`, `skills-index.json`, and `checks/last-local-check.json`.
- Kept the runtime/cache additions as adjacent but secondary, useful for the site's public hypermedia surface rather than the main agentic development cache.

Next implementation pass should prefer a small generated plan census or agent fast-start summary only if repeated manual audits continue to cost more than the artifact would maintain.

## Leaflet Precipitation And Weekly Microbiome Model - 2026-06-21

Integrated the user's precipitation model as a lightweight semantic-capacity practice for recording byproducts of development, weekly production, and community connection.

- Added `leaflet_precipitation` to `.spw/conventions/semantic-capacity.spw` with trigger, shape, promotion rule, decay rule, and microbiome metaphor.
- Added `weekly_microbiome_practice` to `.spw/conventions/daily-kernel.spw` so conversations with growers, food systems, gardens, hospitality, and collaborators can become bounded kernels or leaflets before becoming doctrine.
- Added `recent-plan-templates/leaflet-precipitation.template.spw` as the smallest repeatable artifact for small precipitates.
- Updated the plan index so `recent-plan-templates/` is recognized as a source for leaflets rather than stale backlog.

Next use: when a conversation, bug, route read, or social production rhythm leaves a useful residue, record a leaflet with evidence, nutrient, organism, byproduct, merge target, and decay rule.

## Mobile Chrome Session Efficiency - 2026-06-24

Captured the operational lessons from the mobile floating chrome / navigation overlay / route blur session so future visual-debug passes do not repeat the same alignment cost.

- Separate runtime state from visual cascade state before editing. In this session, `data-spw-menu="open"` was a stale diagnostic-looking signal, while the real expanded drawer state was `data-spw-menu-overlay="active"` plus `aria-expanded="true"`. The blur still visible after that fix came from section ornament and text glow, not the menu scrim.
- Rebuild generated CSS before browser verification. The local dev server serves bundled CSS for this route; source CSS edits are not enough evidence until `npm run build:css` refreshes `public/css/bundles/core.css`.
- Probe computed styles in the browser at the target viewport before broadening selectors. Useful checks: active route, viewport width, header dataset, toggle `aria-expanded`, scrim selector match, pseudo-element `opacity/filter/mix-blend-mode`, and text `text-shadow/opacity/color`.
- Respect the layer owner. Shell CSS should own navigation structure, overlay state, and drawer affordance; ornament CSS should own last-layer visual corrections when later effects make a correct shell/runtime state still read incorrectly.
- Prefer state-specific selectors over broad visual suppression. The final path was a generalizable mobile/topics clarity rule plus the stricter menu overlay state, rather than a one-off route hack or blanket blur removal.

Next pass: if this pattern recurs, add a small generated or authored agent fast-start note under `.agents/state/` that records the route URL, CSS bundle freshness, target viewport, and current overlay/ornament computed-style probes.

## Site Starter And Component Kit - 2026-06-30

Captured the user's direction that this codebase should be useful for spawning new sites and designing new components.

- Added `site-starter-component-kit/PLAN.md` as the owner plan for portable starter boundaries and component promotion.
- Added `.spw/conventions/site-starter-component-kit.spw` so the portable compose layer, component lab, and site-specific boundaries are discoverable from the `.spw` dispatch.
- Added `scripts/starter-inventory.mjs` plus `npm run starter:inventory` as a zero-dependency inventory and validation command for `compose.css`, `compose.js`, component CSS, and design docs.
- Updated CSS and JS READMEs to route future starter work through the inventory instead of copying the full shell.
- Wired the expressive-registers convention through `.spw` dispatch and added a small `/design/composition/` sample so the global `systems/registers.css` module has an authored proving surface.

Next pass: use the inventory on a real small starter or component recipe before adding any scaffold generator.

## Plan Maintenance Sweep - 2026-06-30

Refreshed the active planning architecture after the starter component kit work, while leaving concurrent runtime JS work untouched.

- Ran a fresh census: 173 active top-level plan folders, 160 active `PLAN.md` files, 50 `wip.spw` files, 13 total `FIX.md` files, and 11 true `FIX.md`-only tactical queues.
- Added `archive/2026-06-30-plan-maintenance.md` as the dated record for this sweep.
- Updated `.agents/plans/README.md` so virtual buckets, active examples, completed references, and archive notes match the current tree.
- Marked `overlay-layer-ownership`, `menu-containment-navigation`, `mobile-image-effects`, and `runtime-route-css-regressions` as completed or superseded references retained in place, not high-signal active work.
- Updated `.agents/plans/archive/README.md` with the new sweep and completed-reference decisions.
- Updated `.spw/conventions/planning-ecology.spw` so the semantic dispatch and tree posture point to the current maintenance record.
- Projected plan buckets onto `/about/plans/` so the public editor surface mirrors the active owner architecture instead of only listing selected cards.

Next pass: decide whether `mobile-density-operator-semantics/` should be revived, merged, or removed, and split oversized plan artifacts only in a focused ref-safe cleanup.

## Working Tree Analysis Helper - 2026-07-01

Closed a small agent-surface loop exposed by `patch-consolidator`: the skill referenced `./scripts/analyze-changes.sh`, but the helper was absent.

- Added `scripts/analyze-changes.sh` as a read-only `git status --short` grouper by patch concern.
- Buckets include route HTML, source CSS, generated CSS bundles, runtime JS, `.spw`, plans, agent skills, scripts, partials, images, and other.
- The helper is intentionally advisory: it does not stage, revert, or mutate files.

Next use: run it at the start of broad cleanup or commit-splitting passes, then restate the resulting buckets in plain language before editing.

## Bounded Runtime Hygiene Feedback - 2026-07-10

Enhanced the proposed agent/runtime pass without adding another index or cache.

- Reused the typed mount/layer constants in `runtime-contracts.mts` instead of
  maintaining a second closed vocabulary.
- Replaced per-module recommendation flooding with one mount-hygiene census;
  specific warnings remain for ungated and broad-effect immediate modules.
- Moved feature-discovery CSS out of the core bundle and made its runtime share
  the same explicit behavior gate.
- Reclassified spatial gravity to visible and palette treats to idle, reducing
  immediate definitions from 63 to 61 in the current audit census.
- Extended the existing interaction-microstates convention and
  deep-link-feature-discovery plan instead of creating a new convention index.

Next pass: use the aggregate census to choose one measured immediate-width
slice; do not convert the remaining backlog into dozens of repetitive notes.

## Future-Prep Testing - 2026-07-12

Made the existing validation surfaces cumulative rather than aspirational:

- `check:local` now includes the engagement unit suite after its typed runtime
  outputs are built; `test:engagement` remains runnable on its own.
- Added pull-request validation with a Node 20 contract job and a Node 22
  Chrome smoke job across home, settings, and a representative topical route.
- Hardened the zero-dependency CDP tools so successful runs await teardown and
  cancel their navigation timeout instead of leaving Chrome/dev-server processes
  or delayed event-loop timers behind. Chrome candidate resolution now reaches
  Chromium fallbacks instead of returning the first bare executable name.

This is a bounded foundation: static contracts and deterministic unit behavior
are merge gates; browser smoke verifies a small route set. Visual baselines,
full accessibility automation, and performance budgets remain opt-in future
work until a concrete regression justifies their maintenance cost.

## Reviewed Plan Reference Integrity - 2026-07-12

Repaired the reviewed plan graph without regenerating authored indexes:

- Corrected sibling plan references to resolve from each owner directory and
  corrected FIX-only owner fallbacks to point at `FIX.md`.
- Made `plans:index:check` resolve local references in reviewed plan indexes and
  report missing targets in deterministic file/line order before generation is skipped.
- Kept `--force-generated` as the explicit destructive rebuild boundary.
- Aligned `.agents/plans/README.md` and `/about/plans/` with the July 12 review
  ledger so merged, implemented, and split references no longer read as active owners.

Next pass: treat a clean `plans:index:check` as the ref-safety gate before adding
new cross-plan links; do not grow another generated plan census for this check.

## Build Loop And Runtime Bootstrap Closure - 2026-07-13

Closed two measured operating-loop seams without adding another plan or index:

- Composite build/check flows now typecheck each TypeScript project once while
  keeping the explicit no-emit `typecheck` command exhaustive.
- The publish design catalog now indexes source line starts once per file and
  excludes generated Vite and CSS-bundle copies; a 290.92-second baseline fell
  to a 5.724-second linear full-tree control, then a 1.897-second median across
  three authored-source runs after the exclusions were applied.
- The complete publish leaf produced 1,019 files in 5.253 seconds internally
  (5.911 seconds end to end), versus the prior 281.75-second audit sample.
- A full non-overlapping benchmark run finished in 16.391 seconds; the earlier
  audit's comparable stage samples sum to about 306.62 seconds. Both are
  directional local measurements rather than budgets.
- Runtime resource discovery uses one bounded CacheStorage-probe pool, and the
  event-only settings-momentum enhancement moved from immediate to idle; home,
  settings, and topics/software all reached runtime stage `ready` in headless smoke.
- Reused `runtime-bootstrap-performance/PLAN.md` and the existing build/runtime
  audit; no `.spw` dispatch, public plans route, or new census artifact was needed.

Next pass: harden the browser performance harness target/settle lifecycle before
treating route timing samples as budgets; keep the remaining settings-engine and
observer-federation work in their existing owner plans.
