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
