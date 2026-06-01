# Plan: profile-character-card-development

Refine the shared concept behind the existing profile builder, character sheet builder, and future cast references so they read as one development model instead of adjacent tools with overlapping language, and so their editorial utility is explicit rather than incidental.

## Goal

The desired end state is a card model that can describe a person, a role, a character, or a recurring campaign figure without pretending those are the same thing. The site already has one shared renderer and visual system for profile cards, but the surrounding concept is still split: `/tools/profile/` frames the card as a professional identity artifact, `/tools/character-sheet/` frames it as a translation device from character grammar into mentorship-facing engineering language, and `/play/rpg-wednesday/cast/` hints at future character references without yet sharing the card doctrine explicitly. The refinement should clarify that there is one **card substrate** with multiple **lenses** and multiple **promotion paths**, and that cards are also compact editorial instruments: they help routes summarize a figure, help writers keep recurring identity legible, help longer prose stay anchored in a stable local model, and eventually give hired authors a reliable briefing surface for writing in alignment with the site's voice and semantics. The taste note is **identity under lens, not identity collapse**: a card can project different aspects of a person or character without flattening them into one static summary.

## Working Definition

A **profile / character card** is a compact, revisitable identity surface with enough structure to travel between contexts.

It should be able to hold:
- identity markers
- stance or operator/sigil
- badges or clusters
- sectional claims or traits
- current status
- relational links
- development state
- editorial hooks such as summary lines, route relevance, or recurring narrative pressure
- author-facing briefing cues such as voice, constraints, or what must not be flattened

It should not require:
- one fixed audience
- one fixed domain such as "professional" or "fictional"
- a single final wording for all contexts
- a collapsed distinction between public proof, self-description, and campaign memory
- a requirement that every useful identity surface must expand into full prose before it becomes reusable

## Scope

- **In scope**: conceptual relationship between profile card, character sheet card, and future cast/character cards; how lenses differ from underlying card structure; development-state semantics; editorial utility for route copy, summaries, recurring references, and future author handoff; promotion paths from notes or session memory into cards; route and runtime implications for shared JS/CSS.
- **Out of scope**: redesigning the live UI, changing the renderer contract immediately, implementing cast cards, or introducing a full authoring database.

## Files

[NEW] .agents/plans/profile-character-card-development/PLAN.md
[NEW] .agents/plans/profile-character-card-development/profile-character-card-development.spw
[MOD?] tools/profile/index.html — if the route copy should explicitly describe lensing rather than a single professional use case
[MOD?] tools/character-sheet/index.html — if the route copy should explicitly describe shared substrate plus translation lens
[MOD?] play/rpg-wednesday/cast/index.html — if future cast entries should be framed as character-card promotions rather than generic references
[MOD?] public/js/spw-profile-builder.js — if the data model should expose lens, development state, or card family more explicitly
[MOD?] public/js/spw-profile-tool.js — if presets should become named lenses instead of route-specific presets only
[MOD?] public/css/profile-card.css — if development-state and family semantics need clearer variable contracts
[MOD?] .agents/plans/blog-blob-spw/PLAN.md — if blobs become a source object for some profile/character cards
[MOD?] .agents/plans/rpg-session-notes/PLAN.md — if session notes become a source object for cast-card promotion

Craft guard:
- The card substrate must stay shared enough to feel like one family.
- Lenses must clarify projection context, not erase distinctions between person, character, and campaign reference.
- A professional profile card should not feel like a disguised RPG joke.
- A character card should not feel like a thin résumé reskin.
- Cast entries should earn their own cards through recurrence and narrative weight rather than appearing automatically from first mention.
- Development state should show maturity and change without implying gamified completion.
- Editorial utility should stay concrete: a card should make summaries, route intros, repeated references, or crosslinks easier to write.
- Author handoff should stay precise: a hired writer should be able to use the card to write accurately without mistaking it for a complete creative brief.

## Existing Surface Read

Current repo shape:
- `/tools/profile/` uses the shared card system as a local-only professional profile builder.
- `/tools/character-sheet/` already proves that the same substrate can support a character-to-application translation lens.
- `public/js/spw-profile-builder.js` and `public/js/spw-profile-tool.js` provide one shared data and rendering path.
- `public/css/profile-card.css` already carries development-state semantics such as depth, completeness, focus, and card charge.
- `/play/rpg-wednesday/cast/` currently has no card implementation, but its eventual recurring-character references fit the same family.

The concept gap is not renderer capability. The gap is doctrine: what kind of thing this card is, when it should be used, and how its lenses relate.

## Recommended Concept

1. **One substrate**
   The shared card substrate is a compact identity surface. It is not inherently professional, fictional, or campaign-specific.

2. **Lens over substrate**
   The route decides the active lens:
   - `profile lens` for public/professional articulation
   - `character lens` for fictional or worldbuilding articulation
   - `translation lens` for moving between imaginative and professional language
   - `cast lens` for recurring campaign references

## 2026 Self-Imagination + Funding/Services Tranche (Cross-Ref)
This tranche (detailed in expressive-layout-tropes-fidget-manuscript/PLAN.md "Funding, Services..." section and funding-proof-cards/PLAN.md) makes the character/profile card system an explicit instrument for **self-imagination as funding and capacity development**:

- Character Sheet Builder is reframed (in copy + optional flows) as the place where a creator practices the personality, theme, and developmental posture of the self/work that will later commission or be commissioned.
- Optional process flows (playful random seeds, wonder-primed generation, lens cycling, priming pressures to cauldron) reduce friction while inviting depth. The card becomes a living record of "who I am becoming in order to do the next work."
- Microinteractions + grounding (trope marks on preset/random/field changes, vocabulary resonance, richer cauldron ingredients with character-origin) create the literacy and trace channels powerusers expect.
- Direct tie to budgeting tool and services register: "Map the character arc → fund the capacity → commission the work that fits the person you practiced becoming."
- Metacognitive profiles (from prior tranche) can gently surface inside the builder as developmental climate suggestions (never required).
- Strengthens the "lenses not collapse" doctrine: the translation map and multi-lens presets already embody this; the tranche makes the *why* (self-imagination for clearer, more personal asks) even more legible.

No change to the shared renderer or core data model unless a future patch requires it. This work keeps the card substrate honest as a portable, multi-lens identity instrument while giving it a clear role in the funding/self-prep ecology.

See also:
- expressive-layout-tropes-fidget-manuscript/PLAN.md (primary coordination + execution log)
- funding-proof-cards/PLAN.md (funding surface evolution)

### Clarity of Semantic Layers, Option/Subitem Flow/Wrapping/Hierarchy, Component Composition (Current Pass)
This pass directly addressed "clarity of semantic layers, option or subitem flow/wrapping/hierarchy; component composition":

- **Rendered cards now emit the canonical slot contract**: Updated `profile-builder.js` renderProfileCard to add `data-spw-slot="header"`, `data-spw-slot="meta"`, `data-spw-slot="body"`, `data-spw-slot="footer"` on the major regions of the live `.profile-card`. This makes every published character/profile card a first-class, inspectable specimen of the universal slots anatomy documented in `/design/slots/`.
- **Improved clarity in live builders**: Added explicit guidance in the character-sheet builder navigation area explaining that the panels are compositional slots with clear hierarchy (primary/secondary/tertiary from the taxonomy). On narrow screens they stack cleanly; the preview is the composed result.
- **Hierarchy + wrapping enhancements**: Strengthened visual distinction for badge clusters (primary/approach/role vs. secondary/context/domain) in `profile-card.css` with better opacity/weight and explicit flex-wrap behavior that holds up on mobile without breaking composition.
- **Design surface wiring**: Added a direct call-out in `/design/components/` linking the live rendered cards (now with proper slots) back to the glossary and `/design/slots/`. This closes the "edit → render → inspect composition" loop for producers, designers, and powerusers.
- **Semantic layer consistency**: The change reinforces that the same slot grammar (header → meta → body → figure → actions → footer) applies across frames, cards, and the visual canon tools (Midjourney packets, etc.).

These are minimal, high-leverage patches that make the semantic model more legible without altering visual design or adding bloat. The rendered card is now both a practical output *and* a teaching specimen for component composition.

All changes pass git diff --check + node --check. Plans and live surfaces are now better aligned on slots, hierarchy, and composition.
This tranche directly improved the *value and discoverability of the rendered .profile-card / character cards* as first-class inputs to visual style work:
- One-click "develop style in Midjourney" action from the live rendered preview that constructs a portable style/identity packet, copies it, and navigates with `?style-packet=...` query combinatorics.
- Producer/director copy added in Midjourney bench and design/slots explicitly explaining how to use rendered cards + slots + palettes + Midjourney packets to develop and maintain a coherent visual style across a project.
- Local image mounting/pasting UX enhanced with an explicit drop/paste zone on the Midjourney bench that participates in image-metaphysics + prompt memory (associates studies with packets for recall).
- Slots (design/slots + builder panels) wired as the ergonomic tuning grammar between card rendering and image canon.
- Edit/read/preview modes in the builder benefit from the stronger "rendered output as contract" emphasis and the preview panel now surfaces the style handoff affordance.
- Runtime instrumentability: bus events (`rendered-card-to-style-packet`, `style-packet-from-card`), query param consumption, and data attrs for the flows.
- Consolidation: packet concept (vision seed, style packet, character tropes) now flows more cleanly between cauldron → character builder → Midjourney.

All changes surgical, build on existing Spw semantics (data-spw-slot, operators on cards, promptability), respect AGENTS.md, and make the "rendered card" a high-value, discoverable artifact for both personal imagination development and professional visual production.

3. **Family over template clones**
   These are not separate widgets. They are one family of cards with shared anatomy and different projection rules.

4. **Development over snapshot**
   The card should be understood as a development surface, not only a final export artifact. Maturity, depth, revision, and focus are part of the concept.

5. **Promotion path**
   Cards should be promotable from different source objects:
   - direct authoring in the tool
   - blog blobs for reflective/professional articulation
   - RPG session notes for cast-card emergence
   - future profile notes or private residue

6. **Editorial utility**
   A card is not only a display object. It is a compact editorial reference that can support:
   - route ledes and short summaries
   - recurring cast or collaborator references
   - about-page and services-page identity blocks
   - anchor text for longer blog or campaign prose
   - stable local terminology when a person or character recurs across surfaces

7. **Author utility**
   A card can also function as a briefing surface for future collaborators or hired authors:
   - what this figure is
   - what lens the current route is using
   - what voice or pressure should remain legible
   - what evidence or canon boundaries matter
   - what simplifications would become distortions

## Distinctions

- **profile card**: public-facing articulation of a person's work, stance, and fit
- **character card**: imaginative identity surface emphasizing role, pressure, tradition, and world position
- **cast card**: campaign-memory reference for recurring RPG Wednesday figures
- **translation card**: temporary or comparative projection between two lenses

These should share structure while differing in:
- audience
- evidence expectations
- permissible rhetoric
- relation to canon
- editorial job

## Shared Anatomy

The underlying card family should keep one stable anatomy:

- header
- badges/clusters
- sections
- footer/links
- development state

Possible shared semantic fields:
- `family`
- `lens`
- `status`
- `development_state`
- `relation_edges`
- `editorial_role`
- `summary_line`
- `author_brief`
- `voice_guard`

## Development Model

Card development should be treated as a small lifecycle:

1. Residue or notes accumulate.
2. A stable identity pattern becomes visible.
3. A card is drafted under one lens.
4. The card is revised for clarity, proof, pressure, or translation.
5. The card becomes reusable in a route, export, or cast register.

The important shift is that the card is not just an export target. It is a durable middle object for identity articulation.

## Editorial Utility

Cards are useful because they compress recurring identity without forcing every route to restate everything from scratch.

Editorial jobs a card can serve:
- a concise route-facing summary of who a person or character is
- a stable reference when the same figure recurs across blog, about, services, play, or cast surfaces
- a source for short cards, sidebars, pull quotes, or related-surface links
- a pressure-preserving aid for longer writing, where the card keeps the figure's stance legible while prose changes around it

Editorial rule:
- The card should carry enough structure that a writer can quickly recover the figure's identity, current pressure, and relevance without reopening every prior note or session recap.

## Author Handoff

If the site eventually hires authors, cards can reduce briefing friction by giving collaborators a compact, inspectable local model before they write.

Author-facing jobs a card can serve:
- preserve the essential identity of a person, character, or recurring figure
- show which lens the current assignment should use
- mark what is proven, what is pressure, and what is still unresolved
- identify which terms, tones, or simplifications should be avoided

Author-handoff rule:
- A card should shorten onboarding without pretending to replace editorial judgment, route context, or a full assignment brief.

## Relationship To Other Intermediate Objects

- **blog blob** may feed a profile card when reflective writing sharpens a person's public articulation.
- **RPG session note** may feed a cast card when recurring character memory becomes durable enough to name.
- **public route** may host a polished card, but route publication is not the only meaningful state.

## Route Implications

- `/tools/profile/` can be framed more clearly as authoring a public-facing identity card under the profile lens.
- `/tools/character-sheet/` can be framed as authoring under the character and translation lenses, not as a separate card species.
- `/play/rpg-wednesday/cast/` can later use cast cards as recurring editorial references once characters earn promotion from session notes.
- Longer routes such as `/about/`, `/services/`, `/blog/`, or RPG session pages can eventually cite cards as local identity anchors instead of rewriting identity from zero each time.
- Future author workflows can use cards as pre-brief context packets before drafting route copy, recaps, collaborator bios, or reflective essays.

## Validation

- `git diff --check`
- semantic read-through against `tools/profile/index.html`
- semantic read-through against `tools/character-sheet/index.html`
- semantic read-through against `.agents/plans/blog-blob-spw/PLAN.md`
- semantic read-through against `.agents/plans/rpg-session-notes/PLAN.md`
- confirm the distinctions between profile card, character card, cast card, and translation lens are crisp enough to guide later implementation

## Failure Modes

- **Hard**: "profile" and "character" collapse into one vague card concept with no audience discipline.
- **Hard**: each route forks the shared renderer conceptually until the family becomes incoherent.
- **Soft**: development state becomes cosmetic rather than meaningfully tied to revision or maturity.
- **Soft**: cast cards inherit too much professional-profile rhetoric and stop feeling grounded in campaign memory.
- **Soft**: editorial utility stays vague, so cards remain nice-looking exports rather than durable writing tools.
- **Soft**: authors treat cards as sufficient briefs and miss route-specific goals, tone, or constraints.
- **Non-negotiable**: the shared substrate must remain legible and useful without requiring users to internalize a large doctrine before making a card.

## Recommendation

Treat the existing profile-card system as a shared identity-card substrate with explicit lenses rather than route-specific one-off concepts. Keep the renderer family unified, let routes choose projection rules, and let future blog blobs and RPG session notes serve as source seams for deeper card development. Editorially, treat cards as compact recurring reference objects that help prose stay anchored, not only as exportable artifacts. For future hired authors, treat cards as compact briefing surfaces that preserve identity, pressure, and terminology without replacing a fuller assignment brief.
