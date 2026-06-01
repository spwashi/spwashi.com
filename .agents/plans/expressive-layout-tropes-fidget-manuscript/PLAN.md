# Plan: Expressive Layout Tropes, Fidget Toys, and Magic Manuscript Layering

## Public Goal (verbatim intent)
Make this site interactive enough for game developers to imagine **1000 fidget toys** for the next generation of office work (tactile, tunable, generative, physics-y micro-interactions that feel like adjusting parameters on a living object), and readable enough for authors to imagine a **magic manuscript** that reaches varied audiences while letting them express layers of semantic intent with precision and joy.

Mind the classic author complaints with other editing software:
- Loss of direct semantic control and provenance (formats that hide or fight intent).
- Rigid or invisible layering (structure vs. presentation vs. rhetorical vs. audience-specific vs. developmental state).
- Friction for "what if" experimentation and non-linear / associative thinking.
- Poor support for multi-audience documents (skimmer vs. deep implementer vs. critic vs. future self).
- Inability to treat the document as a living, instrumentable, tunable system rather than a static artifact.

Primary audience for this evolution: **other software engineers with years of experience**. They think in state machines, events, layers, instrumentation, composability, observability, and mental models. The site should feel like a powerful, humane DSL / live coding environment for thought, not a toy or a dumbed-down WYSIWYG.

## Core Design Principles Emerging from the Vision
- **Deliberate layout shifts as a "trope" of design**: Some reflows and spatial reorganizations are not bugs (CLS) but *expressive gestures*. When a ruleset (author mode + climate + density + motif + physics preset) is applied, a controlled, describable, instrumented shift or re-gestalting occurs that *informs the activity* of the module and signals a phase change. This makes the runtime more tunable and the effects more describable (game devs see the mechanics; authors feel the "magic" of the manuscript responding).
- **Instrumentation and describability first**: Every meaningful effect (layout trope, phase transition, gesture outcome, measure application, ornament response) should be queryable, loggable, snapshotable, and tunable via the existing bus + logger + dataset + query disposition system (see `SPW_REFLOW_REASONS`, `layout-shift-audit`, `instrumentation.js`, `spw:layout-shift` events).
- **Visual gestalts and layering**: Use proximity, similarity, continuity, common fate, figure/ground, and closure deliberately in operator clusters, measure displays, frames, tuning widgets, and ornament. Explicit layering (CSS layer order + z + material + depth tokens + semantic expression layers from `.spw` + brace anatomy + data-spw-* families) should be visible and authorable.
- **Logic of layout for flow and balance**: Page variants (reading/wide/atlas/split + gutter rail), density, attention architecture, brace pivots, and manuscript rhythm (typography + spacing tokens) should support both calm deep reading and playful generative interaction. Shifts and rebalancings can be part of the "story" a surface tells.
- **Fidget-toy surfaces for game devs / future office work**: Tuning widgets, math practice labs, pretext physics, cauldron/priming gestures, wonder memory, rpg elements, canvas accents, and live playgrounds should feel like physical parameters you can twiddle — with immediate, reversible, observable consequences. Senior SEs should be able to imagine extracting the underlying model into their own 1000 productivity/focus toys.
- **Magic manuscript for authors**: Settings (author workflow modes + developmental climate + meaning/physics presets + recipes), brace forms (objective/subjective), operators + % measures (subjective/objective), .spw inspection surfaces, design catalog, and content pages (curriculum as deep ontology + boundary tests + proof artifacts, blog, about) should let authors express *layers* of intent (for different readers, different times, different stances) without fighting the medium. The document should feel versionable, provenance-rich, and multi-audience by default.

## Alignment with Existing Architecture (strengths to build on)
- Mature `public/js/runtime/layout-shift-audit.js`: PerformanceObserver + rich `data-spwLayoutShift*` dataset + `spw:layout-shift` bus events + "intentional" outcome category + 5s debug mutation/module-mount observers + snapshot API. Already distinguishes input-caused shifts.
- Powerful instrumentation contract in `public/js/kernel/instrumentation.js`: `SPW_REFLOW_REASONS` (LAYOUT, INTERACTION, MEASURE, THEME, DENSITY...), `markReflowReason`, query presets (including layout debug), `createSpwLogger` with REFLOW/GESTURE/MEASURE relationships, physics/meaning presets, composition console (`window.spwCompose`), snapshotting.
- Authoring control surface in `settings/index.html`: Separate "Author workflow" (draft/revise/polish/publish/archive) + "developmental climate" + reader/builder/inspector/lab views + writing recipes + live tuning playground. Already thinks in layers (task vs. attention posture).
- Semantic layering already present: brace anatomy, objective/subjective walls and forms, operator projections + measurement-contract in `.spw`, `data-spw-*` families everywhere, design catalog, attention architecture, ornament/wonder effects, page transition phases, spirit-phase, etc.
- Layout system in `public/css/shell/layout.css` + tokens: explicit `data-spw-layout` variants, density, gutter rails, generic authored-feeling panels/figures, responsive, reduced-motion.
- Playful/interactive seeds: math-diagrams with `setMeasuredValue` + objective/subjective, vibe-widget tuning clusters, pretext labs, rpg elements, cauldron/priming, canvas accents, boonhonk, ingredient lab.

## High-Value Surgical Entry Points (do these first)
1. **Elevate "layout trope / deliberate phase transition" as first-class instrumented concept** (core for both fidget mechanics and manuscript responsiveness).
   - Extend `SPW_REFLOW_REASONS` or add `SPW_LAYOUT_TROPES` (e.g. `phase-transition`, `ruleset-application`, `gestalt-rebalance`, `manuscript-reveal`).
   - Enhance layout-shift-audit + instrumentation to treat opted-in shifts (via new `data-spw-layout-trope` or enriched `markReflowReason` with trope) as richly described "intentional expressive events".
   - Emit enriched `spw:layout-trope` or augment existing events with trope/phase payload so console, state inspector, and future modules can react/tune.
   - Wire 1-2 real examples: authorMode or climate change, or density change, or a tuning widget "apply ruleset" produces a small, pleasant, logged, dataset-marked spatial rebalancing (e.g. subtle gap or emphasis shift in a cluster) that feels like the manuscript "responding" or the toy "settling into a new configuration".

2. **Strengthen visual gestalts and explicit layering in key clusters** (operators + measures + tuning widgets + frames).
   - Small CSS tokens or scoped rules that increase proximity/similarity/common-fate when elements share phase/motif/climate/mode (e.g., tighter grouping, shared wash, synchronized micro-transitions).
   - Make figure-ground and layering more legible in frames vs. ornament vs. content (already good; polish one or two surfaces).

3. **Fidget-toy polish on existing surfaces** (1-2 high-leverage places).
   - Enhance the live tuning playground or a math lab / pretext surface with one more "physical parameter" feel (reversible micro-shift + full instrumentation so the effect is describable and extractable in principle).
   - Ensure game-dev visitors looking at the inspector/console see clear cause → effect → measurement loops they can imagine productizing.

4. **Magic manuscript author experience** (address complaints directly).
   - In settings author workflow + recipes + climate: make the *layering of intent* more visible and toggleable (e.g., quick "show intent layers for skimmer vs implementer vs critic" affordance, or stronger visual differentiation when author-mode + climate are combined).
   - On one deep content surface (curriculum or a blog post): demonstrate multi-audience / multi-layer expression using existing tools (operators, % measures, brace forms, climate, density, spec pills, etc.) so authors can see the pattern.

5. **.spw / contract / catalog wiring**.
   - If new reusable families emerge (e.g. `layout-trope` contract, `expressive-phase` semantics), add to operational-semantics or site-semantics and wire to design catalog.
   - Document the "deliberate shift as trope" and "fidget mechanics via instrumentation" patterns so agents and senior SE authors can extend them.

## Scope and Constraints (AGENTS.md)
- Surgical, page-aligned, minimal honest surfaces first (prefer shared kernel/instrumentation + one or two real surfaces over broad rewrites).
- Preserve hand-authored HTML, layered CSS (tokens → ... → ornament), progressive enhancement, no client frameworks.
- All new contracts or semantic families go through `.spw` when they should remain legible beyond one patch.
- Update relevant plans + cross-ref in agent-optimization when this improves the editor/agent environment (it does: better instrumentation + describable effects = more powerful operating surface for sophisticated users).
- Validation: git diff --check, node --check on JS, targeted rg, manual sanity on settings + curriculum + a lab + design surfaces.

## Success Signals
- A senior SE can open settings + inspector/console, twiddle author mode + climate + a tuning parameter, see a deliberate, named, measurable layout trope/phase happen, inspect its full payload (sources, cost, intent), and immediately imagine 3 fidget toys or a better manuscript authoring tool they could build.
- An author can look at a "magic manuscript" page (or the settings surface itself) and clearly see/express multiple layers of intent for different audiences/states without the medium fighting them.
- Layout shifts that *are* expressive are celebrated and tunable in the runtime model instead of only being audited as problems.
- Visual gestalts feel intentional and the layering (visual + semantic) is legible in both calm reading and generative play modes.

## Next Concrete Patches (this session / immediate follow-ups)
- [ ] Create this plan + cross-reference from agent-optimization and instrumentation-legibility.
- [ ] Extend instrumentation + layout-shift-audit with first-class support for deliberate "layout trope" / phase transitions (new reason or attr family + enriched events + logger).
- [ ] Wire one real example (e.g. author workflow change or a density/climate application in settings) to produce and surface a describable intentional shift.
- [ ] Small gestalt/layering polish in operators/tuning or frames.
- [ ] Light author-layer visibility improvement in settings or one content page.
- [ ] Validate + update any touched .spw contracts.

This direction is a natural evolution of the living learning surface, operational semantics, measurement contract, palette composability, and attention architecture work. It makes the site's existing strengths (rich observability, semantic layering, tunable state) even more legible and generative for its most sophisticated users.

**Status**: Active vision + planning artifact. Execution is intentionally incremental and contract-honoring.

## Spw Semantics for Modes & Profiles + Metacognition (Current Directive)
This tranche advances "improve Spw semantics for modes and profiles" with the explicit goal of encouraging metacognitive skill development.

- Formalized new first-class profiles in site-settings: `metacognitiveStance` (witness, composer, explorer, integrator, overflow), `processAttention` (breath, trace, harvest, return), `overflowMode` (contained, generous, abundant).
- Added these to DEFAULTS, SETTING_OPTIONS, and dataset writing so they become observable data-spw-* attributes site-wide (`spwMetacognitiveStance`, etc.).
- Introduced a dedicated "Metacognition" cluster in the settings workbench with clear explanatory copy that frames these as instruments for noticing one's own reading/wonder stance.
- Placed example semantics on key surfaces (settings + representative content pages) so readers encounter "current stance" language in context.
- These profiles are designed to work alongside existing author modes, developmental climates, meaning modes, and physics presets — creating richer combinatorial "profiles" that support expert-level mindfulness without overwhelm (the "overflow" concept).
- Directly supports the request for handles for play, relationship to process, reward for initial curiosity, structures that increase explanation while decreasing noise, and component ergonomics that treat design with engineering rigor.

The new semantics make the site itself a better teacher of metacognition: readers can explicitly name and shift their stance while moving through computational and culinary material, turning passive consumption into active, reflective practice. This is ambitious design-as-engineering: measurable states, instrumentable via the existing trope and data channel system, and directly in service of developed taste, wonder, and imaginative skill.

## Audit: Lists/CTAs, Badges, Wonder Channels, Cauldron Locality, Overlays & Flow (Current Directive)
This tranche performed a focused audit and delivered surgical improvements across:

- **Lists and calls to action**: Improved visual hierarchy and contextual weight in settings presets, vibe-widget actions, and meta strips. Treated CTAs more explicitly as "ingredients" (data-spw-ingredient-type) for better cauldron discoverability and operator resonance.

- **Badge settings and unique value**: Added data typing to spec-pills (data-spw-badge-type) so they carry clearer semantic roles (state, workflow, climate, observatory, etc.). This strengthens their contribution to wonder development and taste signaling rather than generic decoration.

- **Data types and channels for wonder development**: Strengthened use of data-spw-* channels between settings, cauldron, vocabulary terms, and wonder memory. Introduced more explicit ingredient typing so components, operators, and settings bundles feel like first-class primable material.

- **Alignment, visual hierarchy, contextual weight, visitor interaction state**: Tightened spacing and interaction states in cauldron ingredients and settings clusters. Made hover/focus/primed states more resonant with the overall wonder and trope systems.

- **Local and configurable cycles for natural state reset**: Added CSS support for cauldron locality inside cognitive containers (data-spw-cognitive-container). This enables more natural, section- or container-scoped gathering and reset cycles instead of purely global state.

- **Behavior and styles of overlays / meta-controls**: Enhanced floating chrome (section handle) resonance with vocabulary and wonder states in prior tranche; this audit reinforced consistent treatment of meta elements (badges, pills, handles) as part of the same attentional field.

- **Cauldron locality + discoverability of interactions/components as ingredients**: Made cauldron ingredients feel and behave more like true ingredients (grab cursor, prime affordance, data typing, locality scoping). Components and settings clusters now carry clearer signals that they can become cauldron material.

- **Reasons to explore design hubs and stubs + improved site flow**: Added clear, ingredient-framed tangent from the live tuning playground directly into the design hub. This creates a low-friction "why explore design?" reason while the user is already in a tuning mindset.

All changes remain surgical, respect the layered CSS architecture, build on existing cognitive container, vocabulary resonance, and trope patterns, and reinforce the site as a resonant cognitive machine/tool for imagination, taste, and wonder development through computational and culinary play.

The net effect is higher learnability, denser but clearer discoverability, better local natural cycles, and stronger reasons to explore tangents (especially into design) without increasing cognitive load.

## Settings as Cognitive Workbench, Spell/Cauldron Chainability, Theming & Dense Discoverability (Current Directive)
This tranche directly addresses making the settings surface (and the site as a whole) feel like an **informative cognitive machine and tool**:

- **Enhanced learnability & discoverability of settings clusters**: Added explicit vocabulary terms, "primable as spell" signals, and stronger narrative framing that connects every cluster to imagination development, taste, wonder, and the computational/culinary play north star. Presets, author workflow, climate, and live tuning now surface their value as chainable instruments rather than isolated toggles.

- **Spell and cauldron semantics + chainability**: Settings changes now emit richer `spell:primed` and `cauldron:offer` events with structured expressions (e.g. `settings[balanced]{draft+orient}`). This makes any coherent bundle of preferences directly usable as a replayable spell or primable cauldron ingredient — true chainability across the cognitive surface.

- **Value of theming and communicated state**: Settings UI now carries live visual vocabulary (data-spw-vocabulary-term on key concepts) and explicit "this ripples as tropes" language. State changes are framed as resonant, observable events that affect the entire imaginative field (consistent with existing trope, wonder-memory, and resonance systems).

- **Dense discoverability + tangents**: The settings surface itself becomes a place to explore tangents — "primable as spell" hints, live tuning playground responses, and cross-links to computation/culinary examples all encourage non-linear wandering while staying grounded in a powerful tool.

- **Informative cognitive machine feel**: Every control cluster is now explicitly positioned as part of a larger "cognitive workbench" where you tune the site's own attention, memory, and expressive capacity. This directly serves the goal of the site as a medium for developing taste, wonder, and imaginative skill through play.

All changes are surgical, build on existing instrumentation/trope/vocabulary resonance patterns, and increase the site's value as both a personal tool and a reference for how to build resonant, chainable, learnable creative interfaces.

This work makes the settings page (and by extension the whole runtime) feel more alive, more chainable, and more obviously useful as an instrument for the primary mission: imagination development at the intersection of computation and culinary proficiency.

## Interactive Vocabulary, Page-Specific Tropes, Variable Layout, Audits, Wonder Priming & Brand/Character Development (Current Directive)
This tranche responds to the need for:
- More interactive copy that develops Spw/operator/brace/measure vocabulary while creating resonance (wonder, memory, charge).
- Relevant JS/CSS updates to support that interactivity and resonance.
- Page-specific tropes that make content lead CSS appreciation and create attentional rhythm (extending typographical aerodynamics and expressive phases).
- Greater use of variable layout (data-spw-layout variants) inside components, driven by content.
- Fresh region/media query/cascade audit with stronger context-sensitivity.
- Mechanics for priming wonder (easier activation of resonance/memory/annotation on vocabulary and content) and playful "easter egg" discovery that feels poetic/game-like.
- Attention to learnability (for other creators/brands), CSS layers, lighting (climate/modes/palette), modern features (pseudoselectors, :has(), container queries, etc.).
- Long-term value of the codebase as reference/teaching material.
- Overall tuning toward Spwashi brand/character (imaginative computational-culinary artist-engineer-poet), readability, reference-document quality, game/poetry-style discoverability, and the joy of collaborative art/science wonder.

All work remains surgical, respects the CSS layer contract, prioritizes hand-authored surfaces, and serves the primary north star of imagination development through computational + culinary play (with prompt engineering as natural byproduct).

### Planned/Executed Surgical Moves
- Interactive vocabulary: Add data-spw-vocabulary-term + resonance hooks on operator/Spw language in key pages (fermentation, math, design). Wire to wonder-memory, annotation, and charge for "resonance on hover/prime".
- Page-specific tropes: Extend SPW_LAYOUT_TROPES with content-led examples (e.g. 'fermentation-rhythm', 'math-visual-aerodynamics', 'recipe-composition-flow'). Wire from page JS or data attrs so content itself triggers rhythm/trope states.
- Variable layout in components: Increase use of data-spw-layout inside frames/cards/panels on content-heavy pages; make some components respond to their own content density for alignment.
- Audits: Run fresh passes on regions (attention + [data-spw-*] sections), media (narrow/tall + container queries), cascade (specificity in operators/frames, layer discipline). Fix context-sensitivity gaps surgically.
- Wonder priming + easter eggs: Enhance priming mechanics (easier activation of field-wonder/resonance on vocabulary and frames). Add small, discoverable playful states (easter-egg-like) that reward attention without breaking learnability.
- Modern CSS & learnability: Audit and gently expand use of :has(), container queries, logical properties where they improve context-sensitivity and brand as "modern reference". Document patterns for other creators.
- Brand/character: Strengthen Spwashi voice in interactive copy as someone who builds software *and* makes art, using computation and cooking as parallel imaginative grammars. Make the site itself feel like collaborative poetry/game/reference that invites wonder about materials and co-creation.

Cross-referenced with all prior cognitive containers, trope wiring, image prompt memory, and imagination-north-star work. This tranche makes the site more *alive* as a vocabulary-development + wonder-priming object while increasing its long-term value as a teaching codebase for other imaginative brands.

## Refined North Star (Imagination Development + Computation + Culinary Proficiency via Play)
This site exists **primarily** to support the development of imagination, taste, and wonder through grounded, experiential practice at the intersection of computation and culinary proficiency.

- **Primary purpose**: Imagination development. The site is a medium for expanding creativity, developing refined taste (sensory + structural + computational), and cultivating sustained wonder.
- **Grounded domains**: 
  - **Computation** as imaginative material (Spw as living grammar, operators as moves, math visualization, SVG as expressive medium, parsers, memory systems, etc.).
  - **Culinary proficiency** as imaginative material (recipes as composition, fermentation as slow emergence and living culture, mise-en-place as attentional practice, reduction as refinement, flavor as multi-sensory grammar).
- **Method**: Play as the ongoing excuse and practice. Serious skill and awareness emerge from playful engagement rather than direct instruction.
- **Useful byproduct**: The site naturally becomes excellent for prompt engineering — because treating computation and cooking as imaginative, promptable systems (with subjective/objective measures, operator moves, memory/resonance, SVG controls, typographic aerodynamics, etc.) trains precisely the kind of precise, layered, creative prompting that modern imaginative tooling rewards.
- **Experience goals**: Developed taste and wonder, expanded creativity, reasons to explore modern features of imaginative tooling (image generation, SVG, interactive diagrams, local memory, etc.), and the joy of continuing because play makes the practice sustainable and pleasurable.

This refines and supersedes earlier formulations while remaining compatible with them. The "fidget toys for future office work" and "magic manuscript" metaphors remain useful, but they now serve the deeper purpose of imagination development through computational + culinary play.

All future work (new surfaces, enhancements to operators/braces/measures/tropes/memory/SVG/typography, container design, etc.) should be evaluated against this north star: Does this make imagination development more grounded, more playful, and more connected to real computational and culinary skill? Does it give people better reasons to keep playing?

## Theme Tuning, Palette Refinement, Spacing Tunability, Content-Based Alignment, Richer Tropes, Typographical Aerodynamics, Image Memory, SVG Attributes + CSS/Runtime Performance Considerations (Current Query)

This section captures the latest directive to enhance:
- Theme tuning and palette refinement (building on existing packs, resonance, motifs, color modes).
- Spacing tunability with content-based alignment and variant selection (density, gaps, layout variants responsive to content like measures, images, code density).
- Richer trope wiring (extend the expressive layout/phase/trope model to theme, spacing, typography changes).
- Typographical aerodynamics study: variable flow, encouraged pausing ("breath" in rhythm), content/climate/mode-sensitive typography for cathartic reading and active wonder.
- Local image memory for prompts (extend wonder-memory / image-metaphysics for prompt associations, tying to resonance and annotation).
- SVG integration and attribute development (expand data-spw-* on SVGs for tropes, memory, operators, measures, alignment; integrate with tunability).
- Along the way: necessary enhancements or redistribution in CSS architecture (respect layer order in style.css) and runtime loops, with strong attention to performance (reflow, attribute timing, efficient loops).

### Alignment with Vision and Prior Work
- Directly supports "cathartic, not mundane", "attentional computational science to guide allocation/interaction/discharge", "encourage development of taste and genre wonder", "prepare a medium for modern participants in active wonder".
- Builds on recent cognitive containers, meaning attrs, memory resonance, brace/operator topology, layout tropes, measurement phases, instrumentation.
- CSS: Edits stay within layers (tokens, components, etc.). Consider small redistributions (e.g., moving tunable spacing or aero tokens to more central places) only if they improve maintainability without violating AGENTS.md.
- Runtime: Mind interaction-loop, prepaint-state, site.js mounting for performance when adding wiring or image memory.

### Executed and Planned Surgical Enhancements
- **Instrumentation (richer tropes)**: Extended SPW_LAYOUT_TROPES with 'theme-shift', 'spacing-tune', 'typography-flow', 'image-memory', 'svg-integration'. Enhanced markLayoutTrope calls from site-settings for theme/spacing. (See edits below.)
- **Site settings apply**: Wired theme pack and spacing/density changes to trope marking for describability and "fidget" tunability.
- **Tokens/Core.css refinements**:
  - Palette: Added comments for refinement opportunities (e.g., more granular per-component overrides, content-aware boosts).
  - Spacing: New tunable tokens and content-based hooks (e.g., --spacing-content-density multiplier).
  - Typography aerodynamics: New section/study with tokens like --text-aerodynamic-flow, --text-pause-breath, --text-flow-variable for variable rhythm that encourages pausing, sensitive to climate, density, content (images, long measures, operators).
- **Image memory for prompts**: Enhanced image-metaphysics.js with local prompt association memory (dataset + localStorage pattern similar to visited surfaces), tied to resonance and prompts (for creative tools).
- **SVG**: Added support in svg-tunability for new data-spw-trope, data-spw-memory, content-alignment attrs; example wiring for trope emission on SVG interactions.
- **CSS architecture / performance note**: No layer reordering. Small refactors within components/frames for content-based alignment (e.g., when frame contains dense SVG or image content, auto-adjust variant hints via JS data attr). Runtime loops: Ensure new memory/trope calls are debounced or early-return when no change (performance).
- **Content-based alignment/variant selection**: In layout/frames, added logic hooks for content detection (e.g., presence of [data-spw-svg-host] or long text) to influence recommended layout or alignment classes.

These keep the system instrumentable, cathartic, and wonder-supporting while minding performance (no unnecessary reflows, efficient attribute writes).

**Next steps in this workstream (surgical)**: 
- More content detectors in runtime for automatic variant suggestion.
- Typo aero study documented in a small design note or .spw if it becomes a reusable contract.
- Full integration of image prompt memory with cauldron/annotation for "prompt resonance".
- Performance audit pass on new wirings (use layout-shift-audit + console timing).

Cross-referenced with previous cognitive containers and brace enhancements. This continues the evolution toward a highly tunable, resonant, professional-yet-wondrous medium.

## Cognitive Containers, Inline Settings, Meaning Attributes, Memory Resonance & Attentional Architecture (2026-06 tranche)
This tranche directly responds to the directive to mind containers, inline settings customization, attributes for meaning/design depth (screenshots + interpretation), cognitive memory architecture for observational resonance + encouraged engagement/annotation, typography/alignment/overflow/performance contexts, cathartic (not mundane) experience, attentional computational science for allocation/interaction/discharge, taste/genre wonder, active wonder medium, reduced dead space, inline interaction, and opportunistic CSS refactors.

### Core Principles Applied
- **Containers as cognitive vessels**: .site-frame (and related cards/brace panels) are treated as rich semantic containers that carry memory, annotation, and meaning state. They become active participants rather than passive boxes.
- **Inline everything possible**: Light customization, memory status, and annotation affordances move closer to content (inside frames) to reduce dead space and create immediate, cathartic interaction.
- **Interpretable attributes for depth**: New portable attrs (`data-spw-meaning-depth`, `data-spw-design-interpretation`, memory/annotation scope on containers) make the site's "design and semantic intent" legible to humans, screenshots, the design catalog, and computational observers.
- **Cognitive memory + observational resonance**: Wonder-memory and annotation-layer now propagate to nearest cognitive containers, creating visible resonance fields that encourage annotation and engagement.
- **Attentional computational science**: Leverages existing charge, resonance probe, field-wonder, allocation, and the layout-trope system. Container state changes can be marked as tropes for guided allocation, interaction, and discharge.
- **Cathartic over mundane**: Resonant containers that "remember," "invite annotation," breathe with gesture/phase, and reveal layered meaning feel alive and projective rather than utilitarian.
- **Taste & genre wonder**: Works through existing developmental climate, author modes, semantic density, operator saturation, and palette resonance — now surfaced more immediately inside the content containers themselves.
- **Typography, alignment, overflow, performance**: Context-aware tightening only inside resonant/memory-bearing containers. Uses existing attribute timing patterns and avoids new forced reflows.
- **Active wonder medium**: Prepares the site for "modern participants in active wonder" — people who want to observe, annotate, tune, and feel the system's response in real time.

### Executed Surgical Work (this tranche)
- **public/css/components/frames.css**:
  - Cognitive container rules: memory-managed and annotation-scope states on .site-frame produce subtle tinting, inline affordance dots in headers (reduces dead space), and visual "aliveness."
  - New meaning attributes: `data-spw-meaning-depth` (light/rich) and `data-spw-design-interpretation` receive explicit styling hooks for screenshots and interpretive depth.
  - Typography/alignment/overflow hygiene: Slightly tighter rhythm + max-inline-size + overflow-wrap only inside resonant containers (performance-minded, context-specific).
  - Gesture/phase coordination with memory + annotation states.

- **public/js/kernel/instrumentation.js**:
  - Registered new attributes in `SPW_INSTRUMENTATION_CONTRACT` and query aliases.
  - Added query disposition parsing for `meaning-depth` and `design-interpretation` (URL-driven inline customization, e.g. `?meaning-depth=rich&design-interpretation=manuscript-layer`).
  - These become first-class, screenshot-optimizable, catalog-discoverable signals.

- **public/js/runtime/annotation-layer.js**:
  - Cognitive container propagation: When a region is annotated, the nearest `.site-frame` / `.frame-card` / brace container also receives `spwAnnotation*` state. Creates observable resonance across container topology.
  - Added `COGNITIVE_CONTAINER_SELECTOR` for future expansion.

### Alignment with Prior Work
- Builds directly on layout tropes / `markLayoutTrope`, brace topology signals (`data-spw-brace-nesting`), measurement phases, wonder-memory, attention-architecture (resonance probe), and the instrumentation contract.
- Frames now participate in the same "expressive phase / trope" model as pivots, climate changes, and measurement updates.
- Strengthens the "magic manuscript" (layered intent via meaning attrs + memory) and "fidget toy" (inline tunable resonant containers) visions.

### Recommended Future Surgical Steps (non-blocking)
- Propagate wonder-memory states to containers similarly to annotation (observational resonance symmetry).
- Small inline memory controls (clear/pin) rendered inside frames when `data-spw-memory-managed` is present (further reduce dead space).
- Mark container memory/annotation state changes as `layout-trope` or new `cognitive-resonance` tropes when they produce visual shift.
- Expand `data-spw-design-interpretation` vocabulary in .spw (e.g., "manuscript-layer", "fidget-parameter", "wonder-trap").
- Opportunistic CSS refactor: Extract common "resonant-container" and "meaning-bearing" utility patterns into a dedicated small layer (still below ornament) if duplication grows.
- Performance review: Ensure :has() usage on containers remains scoped; consider attribute-based fallbacks for very old browsers if needed (currently fine).

This tranche keeps the site feeling like a living, attentional, cathartic medium rather than a collection of static pages. Containers now remember, resonate, reveal meaning, and invite immediate engagement — exactly the kind of environment that develops taste and sustains active wonder.

## Brace and Operator Topology + Behavior Enhancements
Braces (`data-spw-form="brace"`, objective/subjective walls, `data-spw-brace-*`) and operators form the core structural and gestural grammar of the site. This subsection treats them as first-class for the "fidget toys" (playful, tunable structural interactions) and "magic manuscript" (expressive layering of intent via brace perspective/axis) goals.

### Current Topology
- Braces expose a 1D→2D opening (objective = shared structure / constraint / evidence; subjective = situated meaning / resonance / interpretation).
- `data-spw-form` + `data-spw-form-options` for lens vs block variants.
- Semantic expressions via `semantic-braces.js` (root[variant]{behavior}<lens>).
- Walls as pivots (semanticDensity on objective, operatorSaturation on subjective) with `brace:pivoted` bus events.
- Gesture states (`data-spw-gesture="charging|active|armed|sustained|projecting"`) written by `brace-gestures.js`, with charge levels and implementation-mutation resolved attrs.
- Actions (brace-actions.js) for activation, mode cycling, form cycling on `[data-spw-form="brace"]` elements.
- Deep CSS in operators.css for gesture visuals, sustain breath, projecting drag transforms, cauldron tethering via `:has()`.

### Current Behavior Strengths
- Rich pointer/keyboard physics (hold-to-arm, drag projection, double-click inspect/prime).
- Integration with cauldron/priming, field hormones (CSS vars for wonder types), attention.
- Pivots already change global state with visual labels and persist via site-settings.
- Strong visual feedback tied to operator colors.

### Opportunities for Enhancement (considered + partially executed)
1. **Explicit Topology Data** (surgical):
   - Added `data-spw-brace-nesting` ("root" | "nested") and `data-spw-brace-contains-operator` (and extensible for measures) in `brace-gestures.js` classifyTarget. Enables precise CSS gestalts and JS queries for nested brace+operator+measure clusters.
   - Future: `data-spw-brace-topology`, `data-spw-brace-perspective-axis`, nesting level counter for deeper trees.

2. **Brace State Changes as First-Class Layout/Phase Tropes** (executed):
   - Wired `brace-pivots.js` (the objective/subjective wall controls) to `markLayoutTrope(..., 'brace-pivot')` with tuning payload. Pivot actions (which change density/saturation — core "face" of the manuscript) are now deliberate, instrumented expressive events. They participate in the same system as author/climate/measurement phases and layout shifts.
   - This makes brace axis manipulation a tunable "fidget" parameter whose structural effect is observable (via layout-shift-audit, spwCompose, console) and describable for senior SEs and authors.

3. **Gestalt + Wrapping + Phase Coordination with Measurements** (executed):
   - Added rules in operators.css for `[data-spw-form="brace"][data-spw-gesture]:has([data-spw-measure-kind])` and contained measures: stronger border tinting, participation in sustain-breath animation. Prevents disconnected feel and awkward wrapping when long subjective measures live inside gesturing braces during phases.
   - Ties brace gesture states to measurement elements for unified "common fate" during expressive phases.

4. **Fidget + Manuscript Behavior Ideas** (documented for future surgical patches):
   - Expose brace "charge" / tension as tunable CSS vars or data attrs from gestures/pivots, allowing subtle layout breathing or expansion as controlled tropes (game devs can imagine 1000 variants: resistance toys, focus "lenses", collaborative annotation surfaces).
   - Brace forms as explicit multi-audience layers: cycling `data-spw-form` on a brace container could visually/semanticly shift emphasis between objective evidence and subjective resonance for different readers.
   - Better nesting topology visualization (e.g., subtle rail or seam reinforcement for nested braces) and instrumentation snapshots that include full brace expression + contained operators/measures.
   - Integration with layout variants and attention: a "focused" brace in split/atlas layout could auto-influence rail content or gutter behavior.

5. **.spw / Contract Alignment**:
   - These changes strengthen the existing `brace_perspective_axis`, `semantic_brace_annotation`, and operator-site-projection contracts.
   - Recommended: when pattern stabilizes, add a small `brace_topology_contract` facet to site-semantics.spw or operational-semantics.spw describing the new data attrs, trope wiring, and gestalt expectations.

### Executed Changes (this pass)
- [public/js/runtime/brace-pivots.js](/Users/spwashi/air/spwashi.com/public/js/runtime/brace-pivots.js): Import + call to `markLayoutTrope` on every pivot (with rich scope/tuning). Brace axis changes are now first-class expressive phases.
- [public/js/runtime/brace-gestures.js](/Users/spwashi/air/spwashi.com/public/js/runtime/brace-gestures.js): During target classification, write `data-spw-brace-nesting` and `data-spw-brace-contains-operator` for explicit topology.
- [public/css/handles/operators.css](/Users/spwashi/air/spwashi.com/public/css/handles/operators.css): Scoped gestalt rules for brace + measure combinations under gesture states (tint inheritance, animation participation, wrapping safety). No broad selectors.

All changes are minimal, respect existing contracts, and directly advance the vision of braces/operators as tunable structural instruments for both playful interaction and deep semantic authoring.

Cross-referenced with component layout/interactivity audit and the measurement phases work. This area is now positioned for evolutionary enhancement (new brace behaviors or topology facets become natural extensions of the trope + instrumentation model).

## Funding, Services, Budgeting & Character Card UX — Self-Imagination, Optional Processes, Grounding & Storytelling (Current Directive)

**Verbatim user request (this tranche):**  
"improve funding and services copy and component architecture, improve budgeting and character card UX for self-imagination and encouraged flow through optional processes; an aim is reduced friction to allow playful depth and consideration of context for personality, theme, and character development; an aim is literacy development via interactive dimension and microinteraction; there should be learnable structures that enable powerusers to look forward to new features without feeling patronized by redundancy; there should be grounding channels to inspect changes or atmosphere to trace changes and wonder about variants; improve storytelling capacity; refactor CSS or JS where redundancy/footguns/bloat obscure communicability; pages should not encourage unnecessary rules, though context-/content-sensitive components may improve perceived value"

### Public Goal & North Star Alignment
- Position the funding/services surface and its satellite tools (budgeting "Savings Regimen", character-sheet builder) as **cathartic, resonant instruments for self-imagination** — not transactional ledgers or résumé forms.
- Creator identity first: "I'm Spwashi. I build software and make art." Budgeting and character work are framed as **funding and developing the version of the self that can do the next work** — personality, thematic posture, developmental arcs become first-class context that travels with the ask.
- Directly serves the north star: imagination development + grounded invitation to computational + culinary proficiency, developed taste/wonder, prompt engineering as emergent skill from play, practice with play as excuse to continue. The "optional processes" (prime a savings insight or character pressure to cauldron, mix with a metacognitive stance, plant as spell) are exactly the low-friction, high-depth gestures that let visitors rehearse imaginative capacity before (or instead of) commissioning.
- Learnable poweruser structures (existing lenses/presets, data-spw-* grammar in configurator, trope/instrumentation traces, numericity quantifiers, gestureHistory in cauldron) mean senior visitors see natural extension points ("of course I can add a new 'character arc' ingredient type or a 'funding-narrative' trope") rather than hand-holding UI.
- No unnecessary rules: every enhancement is optional, context-sensitive (tool-local fields, feature-gated microinteractions), progressive. Context-/content-sensitive components (e.g. motive note only in budgeting, stance-aware suggestions in character builder) increase perceived value without mandating behavior.

### Audit Findings (Surgical Scope)
- **services/index.html + sub-routes (creator/systems/ecosystem/care)**: Solid Spw semantics and operator navigation. Copy is clear but can more explicitly invite self-prep via the tools ("before you ask, try mapping the character of the work or your own capacity"). Configurator already has excellent learnable data grammar (svc-state, dimensions, charge) — prime candidate for trope wiring and vocabulary resonance.
- **tools/budgeting/index.html + tool-budgeting.js + tools-budgeting-surface.css**: Strong local-only model, tier unlocking, time-as-numericity with cauldron priming. Friction points: hard confirm on reset (patronizing rule), functional but thin storytelling in messages, limited "context for personality/theme" (entries are bare), missed grounding (no markLayoutTrope or rich bus snapshots on milestone crosses, weak trace back to "why I saved this"), parallel money/time code is readable but repetitive. Tier cards good but can carry more microinteraction and optional depth.
- **tools/character-sheet/index.html + profile-tool.js + profile-builder.js + profile-card.css**: Already excellent substrate (shared with /tools/profile/), translation map, notebook loop, multi-lens presets (character/translation/application/boonhonk), taxonomy for tropes that can be "played, drawn, rehearsed, implemented". Opportunity: stronger explicit tie to "self-imagination as the root funding decision", optional process flows (e.g. "seed from wonder", "carry to budgeting"), microinteractions on field/random/preset that surface vocabulary and offer to cauldron, integration of recent metacognitiveStance/processAttention as non-forcing developmental context.
- **Cauldron (composition.js + chrome.css + footer + site-settings)**: Already rich grounding (origin, gesture-trace, age, primed, numericity quantifiers, wonder meta). Layout/UX can be further tightened for tools contexts (locality, density of meta on narrow, discoverability of traces without clutter). Perfect "optional process hub" — budget entries and character pressures should arrive with richer narrative payload so visitors can later "wonder about variants" when the spell resurfaces in a creative session.
- **Cross-cutting**: Missed opportunities for instrumentation (funding-narrative and character-development tropes), vocabulary-term on key imaginative concepts, explicit links between budgeting/character/services as a "self-prep loop" for clearer, more personal commissioning. No broad redundancies found that fight communicability; small opportunities in parallel ledger logic and cauldron ingredient density.

### Planned / Executed Surgical Work (this tranche)
- **Copy & storytelling (services/*, budgeting hero + tiers + messages, character hero + translation + notebook + taxonomy)**: Refresh language to lead with self-imagination and creator capacity. "Budget the character arc you need next." "The profile you build here is the proof you can afford the work you actually want." Tie explicitly to services as "resting points after you have practiced the shape of the ask."
- **Budgeting UX (optional context, microint, grounding, no rules)**: Add small optional "motive / character context" field (appears only in this tool; travels with entry into cauldron ingredient as richer label + wonder). On tier unlock or significant net change: micro scale/pop + `markLayoutTrope(..., 'funding-narrative' or 'character-capacity-milestone')` + bus emission with full payload for trace/inspect. Soften or remove reset confirm; offer "prime current ledger to cauldron first" as optional gesture instead of gate. Expose thresholds as inspectable % measures or vocabulary where natural.
- **Character card UX (flow, microint, metacog integration, literacy)**: Strengthen optional "start playful / seed from current wonder" paths. On preset apply or random fill: tiny highlight + vocabulary resonance + cauldron offer of the generated pressure as ingredient. Surface current metacognitiveStance (from site-settings) as gentle, dismissible "developmental climate suggestion" inside the builder (not a required profile). Make the translation map itself more interactive (hover/focus on a mapping emits resonance or primes a mini-expression).
- **Cauldron layout/UX further (composition.js + chrome.css)**: Surgical density and trace visibility improvements (e.g. progressive disclosure of gestureHistory on focus, tighter meta-group in tool surfaces via existing cognitive-container or new data-spw-feature scoping). Ensure ingredients primed from budgeting/character carry "funding-for-X-character" or "self-imagination-pressure" origin/wonder signals so the garden becomes a visible record of personal development arcs. Small CSS for "recent-from-tool" affordance without new classes if possible.
- **Grounding channels & instrumentation**: Wire budget/character value changes and lens applications to existing `markLayoutTrope` + bus (spw:value-updated, funding-narrative, character-development). Add `data-spw-vocabulary-term` + operator coloring on key imaginative phrases inside the tools. These become the "inspect changes or atmosphere to trace variants" channels powerusers expect.
- **Services component architecture**: Light enhancements to payment/seed cards or configurator only where they participate in the new flows (e.g. "save this configuration as character context" affordance). No broad refactors; respect existing svc-* grammar as the learnable poweruser surface.
- **Targeted refactors only for communicability**: If parallel money/time entry logic in budgeting.js obscures the optional-context addition, a tiny shared helper (pure, no new surface) is acceptable. Otherwise leave. Same for cauldron render — only touch if a footgun (e.g. signature logic) fights the richer payload from tools.
- **Plans & .spw**: Update this central plan, funding-proof-cards/PLAN.md, and profile-character-card-development/PLAN.md with cross-refs. If a crisp reusable contract emerges (e.g. self_imagination_flow, funding_as_character_development, budgeting_narrative_contract), add a small facet to the appropriate .spw (operational-semantics or planning-ecology) and wire to design catalog later.

### Alignment & Constraints
- Builds on: recent metacognitive profiles (stances become developmental context inside character builder), cauldron locality + ingredient typing, layout tropes + instrumentation, profile/character card substrate plan (this work makes the "lenses" even more explicitly about self-imagination and funding capacity), measurement contract (budget tiers and character signals can emit subjective/objective % when useful), operator projections (priming from these tools is a live % subjective "felt capacity" + objective "saved dollars/hours").
- Respects AGENTS.md: surgical patches on real usage surfaces (budgeting + character tools + services register), root-relative assets, no new deps, git/node/rg validation, plans for cross-surface coordination, .spw only when contract should outlive the patch.
- Pages never encourage unnecessary rules: all new fields/gestures/ties are opt-in, tool-scoped, or progressive (JS enhances, HTML remains inviting).
- Poweruser forward + literacy: the same structures (data attrs, bus expressions, trope names, cauldron traces, lens presets, configurator dimensions) that let a senior SE imagine 1000 fidget toys also let a developing creator practice precise language about their own becoming.

### Files Expected in This Tranche (minimal honest surfaces)
- .agents/plans/expressive-layout-tropes-fidget-manuscript/PLAN.md (this section)
- .agents/plans/funding-proof-cards/PLAN.md (cross-ref)
- .agents/plans/profile-character-card-development/PLAN.md (cross-ref)
- tools/budgeting/index.html (copy + optional context field)
- public/js/modules/tool-budgeting.js (trope wiring, richer cauldron payload, optional flow)
- tools/character-sheet/index.html (copy + metacog suggestion + micro wiring)
- public/js/modules/profile-tool.js (or builder) (lens/preset enhancements)
- services/index.html + subpages (light copy + tool on-ramp links)
- public/css/routes/tools-budgeting-surface.css (micro states if needed)
- public/css/components/cards/profile-card.css (if micro states)
- public/js/interface/composition.js + public/css/shell/chrome.css (cauldron UX/layout further, richer tool-origin support)
- public/js/kernel/instrumentation.js (if new trope names need registration)
- Possible light .spw addition only if contract crystallizes

**Status**: Active tranche. Execution follows the established surgical, contract-honoring, plan-documented, validation-disciplined pattern of all prior work. Primary success signal: a visitor can move from "I have a vague creative urge" → playful character/budget practice with optional context → prime insight to cauldron → later recall as spell while commissioning or making — and feel the site itself helped them develop the self that can do the work, without ever being told they "must" do any step.

This tranche makes the funding/services layer a true "magic manuscript" entry point for self-directed imaginative and professional development.

## Higher-Order Dimension & Resource Modeling Scalability (Current Directive)

**Verbatim user request (this tranche):**  
"consider improving scalability into higher-order dimension and resource modeling capacity"

### Clarified Public Goal (in site + north-star context)
The site already possesses substantial modeling capacity:
- Budgeting as parallel resource ledger (money + time + rhythm cycles → service tiers, with the just-landed optional "motive/character context" carrying personality/theme/arc semantics into cauldron as 'character-capacity').
- Services configurator with explicit 4-dimension resolution (time/scope/depth/tenure), rich `data-svc-*` grammar for state/axis/charge/combinatorics="simple|layered|advanced", and preparation for "more advanced combinatorics".
- Character/profile cards as multi-dimensional identity substrates (sections with operators, badge clusters for stack/domain/approach/context/role, translation maps between imaginative and engineering dimensions, sigils).
- Cauldron as the compositional engine (ingredients tagged with wonder/origin/gestureHistory/numericity/primedBy, supporting mixing/planting of complex expressions).
- Math routes (combinatorics, complexity, scale-intuition, category theory, differential-lambda-calculus as resource-sensitive rewriting) providing the intellectual/playful substrate.
- Settings "dimensional resonance" + "dimensional breadcrumbs", instrumentation/tropes for phase observability, % measures (subjective/objective) from the measurement contract, and Spw expressions as the native language.

The request is to **improve scalability** of this capacity into *higher-order* territory: arbitrary or growing numbers of interacting dimensions, nested/compositional resources (e.g., "creative capital under personality axis X with constraint budget Y and wonder charge Z"), emergent higher-order models that visitors can define, extend, and trace playfully — without the surfaces feeling capped, without introducing rigid schemas or new rules, and while preserving (and amplifying) the inspectable, poweruser-forward, low-friction character that lets game devs imagine 1000 fidget toys and authors treat the site as a magic manuscript.

Directly builds on the just-completed funding/self-imagination tranche (the motive field and character-capacity wonder are perfect on-ramps for generalizing into named, multi-dimensional resource modeling).

North-star alignment: This is imagination development through computational + culinary play at the level of *systems thinking and prompt engineering as emergent skill*. Visitors practice modeling complex, higher-order realities (their own becoming, a story world, a product constraint space, a fermentation parameter manifold) using the same Spw grammar they use for everything else. Scalability here means the tools grow with the visitor's ambition rather than forcing simplification.

### Audit Snapshot (Strengths + Friction for Higher-Order Scalability)
- **Strengths**: Configurator already speaks "advanced combinatorics" and axis states; budgeting now carries rich narrative context alongside quantities and primes it; character cards are explicitly dimensional/translation devices; cauldron traces (gesture history, origin, wonder) provide grounding for compositional results; math routes teach the underlying concepts (combinatorics, scale, category, resource-sensitive rewriting); existing bus/instrumentation/trope system makes modeling phases observable.
- **Friction / opportunities for scalability**:
  - Budgeting resources are still mostly two parallel ledgers (money + time) + one free-text motive. Higher-order needs lightweight support for multiple *named* optional resource dimensions (e.g., attention, reputation, prompt-budget, narrative-weight) that compose into structured Spw expressions.
  - Configurator dimensions are fixed in prose/JS; the data grammar supports advanced states but the UI surface does not yet let visitors introduce or tag custom higher-order axes in a live, primable way.
  - Character/profile cards model identity dimensions well but do not yet treat "resources" (creative capital, attention budgets, developmental capacity) as first-class attachable, composable, cauldron-primable elements on the same card.
  - Cauldron handles rich ingredients beautifully but has no explicit "higher-order composition" or "nested dimension" affordances/visuals (e.g., an ingredient that is itself a small expression tree or multi-dim bundle).
  - No dedicated trope kinds or bus payload conventions yet for "higher-order-dimension-modeling" or "resource-composition" phases (though the infrastructure is ready).
- No overgeneralization risk: the existing patterns (optional fields, data-* grammars, Spw expression emission, vocabulary resonance, cauldron locality) are already the scalable substrate.

### Surgical Entry Points & Planned Work (build directly on recent tranche)
- **Primary on-ramp: budgeting tool** (leverages the motive/context field we just added for self-imagination). Generalize the single optional motive into a tiny, optional "resource dimensions" mechanism: visitors can enter simple named dimensions (e.g., "illustrator-weird + attention-13cycle + prompt-tokens-800") or use a small "add dimension" affordance. These become first-class in the ledger entry, render as multiple micro-labels with vocabulary/operator, and emit richer structured payloads to cauldron/bus (e.g., expressions or objects carrying dimension tags + quantities + wonder). This immediately demonstrates higher-order scalability in the exact surface we just made more personal.
- **Cauldron & instrumentation wiring**: Extend payloads and rendering (composition.js) to recognize and pretty-print higher-order / dimension-tagged / nested resources. Add or extend trope kinds ('higher-order-dimension', 'resource-composition', 'multi-axis-modeling') and emit them on relevant changes so the modeling activity itself becomes a legible, instrumentable expressive phase (markLayoutTrope + bus). Powerusers get trace/inspect/wonder channels for free.
- **Light configurator / character card touches** (only if they add immediate perceived scalability without bloat): e.g., document or lightly surface the existing "advanced combinatorics" state in copy; allow one more optional resource tag on character sections that primes as a higher-order ingredient. Prefer documentation + data-attr examples over new UI.
- **.spw / contract discipline**: If a clean reusable family crystallizes during the work (higher_order_dimension_contract, scalable_resource_modeling, dimension_composition_projection, or extension of the existing measurement-contract for higher-order % on resources), add a small facet to operational-semantics.spw (or planning-ecology) and cross-reference operator-site-projection + measurement-contract. Otherwise, keep the patterns documented in plans only — the site already has the grammar; we are making the *interactive capacity* scale.
- **Cross-plan updates**: Append to this central plan; light cross-refs in algorithm-scale-statistics-rpg-bridges/, calculus-trigonometry-field-guides/, profile-character-card-development/, funding-proof-cards/. Possibly a lightweight dedicated plan only if the work spans many new surfaces.
- **Constraints (strict)**: Everything optional and context-sensitive (tool-local or feature-gated). No new mandatory fields, no global schemas, no patronizing "you should model higher-order now" language. Poweruser structures (named dimensions as Spw-expressible, queryable via data-*, primable expressions, trope traces) are the primary vehicle for learnability and forward compatibility. Surgical patches only.

### Alignment with Prior Work & Architecture
- Reuses the exact mechanisms emphasized across the entire history: optional processes + microinteractions (funding tranche), metacognitive profiles as developmental context, cauldron as memory garden for compositions, layout tropes + instrumentation for observability, vocabulary resonance + operator coloring for literacy, subjective/objective % measures for felt vs. instrumented resource dimensions, brace/operator topology for structural composition, dimensional* settings and configurator combinatorics grammar as the existing scalable surface.
- Directly serves "1000 fidget toys" (game devs can extract the dimension-tagging + composition + trace model into their own resource simulators) and "magic manuscript" (authors can model arbitrarily complex character/resource/weird-commission manifolds in the same medium they use for everything else).
- No violation of AGENTS.md: builds on real usage (the surfaces we just touched), plans for coordination, validation gates, minimal honest surfaces.

### Expected Files (minimal)
- .agents/plans/expressive-layout-tropes-fidget-manuscript/PLAN.md (this section + cross-refs)
- tools/budgeting/index.html + public/js/modules/tool-budgeting.js (generalize motive into multi-dim resource support + richer emission)
- public/js/interface/composition.js + public/css/shell/chrome.css (higher-order ingredient recognition + visuals, cauldron UX further)
- public/js/kernel/instrumentation.js (trope kind registration if new)
- Light copy/attr updates in services-configurator or character surfaces only where they immediately demonstrate scalability
- Possible tiny .spw facet only if contract emerges cleanly

**Status**: Active consideration → execution tranche. Start with plan append + 1-2 minimal patches on the budgeting motive/context we just shipped (the highest-leverage, lowest-friction place to prove higher-order scalability immediately). Success signal: a visitor can treat "weird-illustrator-commission under attention-13cycle with prompt-800 budget and character-arc-X" as a single coherent, primable, inspectable, higher-order resource model inside the same tool they use for simple savings — and the system (cauldron, bus, tropes, vocabulary) treats the added dimensions as first-class without any new rules or UI bloat.

This continues the evolution of the site as a cognitive instrument whose modeling capacity grows with the sophistication of the imagination using it.

## Interaction Semantics Audit: Memory Leaks, Floating Chrome Layout, Touch/Click/Keyboard Handlers (Current Directive)

**Audit performed across core interaction surfaces** (attention-architecture, brace-gestures, image-metaphysics, composition/cauldron, site-settings, budgeting/character builders, layout-shift-audit, shell-disclosure, etc.).

### Key Findings — Memory Leaks / Interaction Hygiene
- **Strong overall hygiene**: Most critical modules (attention-architecture section handle controller, reading groove, site-settings UX managers) return explicit cleanup functions that do `observer.disconnect()`, `removeEventListener`, `cancelAnimationFrame`, `clearTimeout`, and attribute/DOM cleanup. These are collected at the top-level init in attention-architecture and called appropriately.
- **Dynamic lists** (e.g. budgeting entries, cauldron ingredients, profile badges/links): Rely on `replaceChildren` / DOM replacement. Listeners attached to per-item elements are GC'd with the nodes. No retained closure leaks observed in the render paths.
- **Singleton / long-lived observers**: image-metaphysics uses one ResizeObserver + WeakMap (excellent). Multiple IntersectionObservers exist for different concerns (section visibility, region priming, etc.) — each created once per page load. Acceptable for this architecture (static + long session pages).
- **Timers**: Mostly short fire-and-forget for visual polish (e.g. "recently tended" classes in cauldron, travel settle in handle). Properly cleared in the few long-lived cases.
- **No systemic accumulation** found on repeated interactions or dynamic content (builders, tools). The main risk vector for future work is re-initializing modules without calling prior cleanups — current code largely avoids this via guards and single-init patterns.
- **Recommendation carried forward**: Continue the pattern of returning cleanup disposers from init* functions. For very dynamic future components (e.g. many live cards or labs), an optional lightweight `InteractionAbortRegistry` using AbortController could be added, but is not needed yet.

### Floating Chrome Layout (spw-section-handle + shell)
- The enhanced shell (toggle + step buttons + current link + progress + live region) is the primary floating chrome element for section navigation + vocabulary resonance.
- **Improvements made**:
  - Larger, more comfortable touch targets on all shell buttons/current link using existing `--touch-target-compact` token (min-height/width).
  - Stronger, modern focus-visible rings + subtle lift on hover/focus + scale on active for excellent keyboard + touch UX without layout shift.
  - Existing compact/expanded state + vocabulary resonance already provides good adaptive behavior.
- Layout is fixed bottom-center with safe-area insets and z-tier management in floating-chrome.css. No major reflow or stacking issues observed on mobile/desktop.
- Minor future consideration: when the shell is expanded on very narrow viewports, the progress text can ellipsis gracefully (already has overflow handling).

### Touch / Click / Keyboard Handler Architecture
- **Unified where it matters**: Brace gestures use a single set of `pointer*` + `dblclick` + `keydown` listeners on `document.body` (capture) with `setPointerCapture`/`releasePointerCapture`. This is modern, unifies mouse/touch/pen/stylus, and is efficient.
- **Floating chrome**: Dedicated click + keydown on the shell + current link. Arrow keys, Home/End supported for travel. Good ARIA live region for announcements.
- **Other surfaces** (settings, builders, cauldron): Mix of direct element listeners and body capture. Cleanup is explicit in settings modules.
- **Inconsistencies noted (low severity)**: Some older direct `click` handlers on dynamic buttons vs. pointerdown in gesture systems. No broken behavior, but future code should prefer `pointerdown` + `pointerup` for custom gestures.
- **UX improvements made**: Stronger focus-visible and active states on the critical floating chrome shell. Vocabulary resonance already makes the handle "come alive" near interactive terms.
- **Accessibility**: Handles have proper aria-labels, roles, and live regions. No major gaps.

### Instrumentation & Debuggability
- Added `spw:chrome-interaction` bus emission on key floating chrome state changes (compact toggle) for console / state inspector / future tooling observability.
- Existing `markLayoutTrope` and bus patterns already cover many interaction phases (brace gestures, travel, etc.).
- All new or audited handlers are attribute-driven or emit events where they change visual or semantic state.

### Surgical Changes Executed
- `public/css/shell/chrome.css`: Added focused touch/keyboard UX rules for `.spw-section-handle-shell` buttons and current link (min targets, focus rings, active transform). No !important, respects layer order.
- `public/js/runtime/attention-architecture.js`: Added bus emission on shell compact toggle for runtime instrumentability/debuggability.

The interaction layer is in good health: memory-safe in practice, with clear ownership via returned cleanups, efficient unified pointer handling in the gesture core, and the floating chrome is now more pleasant and discoverable on touch and keyboard while staying semantically tied to the rest of the Spw surface (vocabulary, wonder, operators).

This audit directly supports the broader goals of a cathartic, instrumentable "magic manuscript + 1000 fidget toys" experience without hidden footguns.

### Executed in Follow-up Pass (Rendering Cleanup + Deeper Wiring + Query Macros)
- **JS rendering & cleanup** (tool-budgeting.js): Consolidated dimension rendering logic, added consistent `data-higherOrder` / `data-dimensionCount` dataset signals, extended full higher-order support (dimensions + rich emission) to the time capacity path for parity, removed structural duplication around prime buttons and dim containers, added progressive macro indicator UI.
- **Deeper wiring**:
  - `instrumentation.js`: Added first-class `higher-order-dimension`, `resource-composition`, and `budgeting-macro` to `SPW_LAYOUT_TROPES`.
  - `tool-budgeting.js`: On higher-order activity or macro load, emits enriched `spw:value-updated` (kind `higher-order-macro`) and attempts `markLayoutTrope` when the global is available. UpdateDashboard and add paths now participate in the trope system.
  - `composition.js`: Explicit rendering of `dimensions` arrays as `cauldron-dimension-chip` meta when present (plus `data-higher-order` attribute). Higher-order ingredients from budgeting macros are now beautifully visible and queryable in the cauldron.
  - `chrome.css`: Small scoped styles for the new dimension chips in cauldron (additive, reuses existing meta aesthetics).
- **Budgeting macros via query string** (major scalability win):
  - Full support for `?macro=weird-illustrator`, `?dimensions=attention+creative-capital+illustrator-weird`, `?dims=...&amount=850`, etc.
  - Early parsing on load (standard `URLSearchParams` pattern used everywhere else on the site).
  - Prefills the higher-order dimension field + amount input; optionally seeds visual state.
  - Emits dedicated bus events so the loaded model is immediately instrumentable / spell-primable.
  - Progressive indicator ("macro: ...") appears when a query macro is active.
  - Makes complex higher-order resource models directly shareable, bookmarkable, and reproducible — perfect for powerusers, collaboration, and "spell-like" usage of the budgeting surface.
- All changes are surgical, respect the just-landed self-imagination motive work, pass `git diff --check` + `node --check` on every edited module, and dramatically improve the scalability of dimension/resource modeling while keeping everything optional and learnable.

The combination of the motive → multi-dimension field + query macros + cauldron/instrumentation wiring now gives the budgeting tool (and by extension the whole higher-order modeling story) first-class support for arbitrarily complex, composable, inspectable resource models.