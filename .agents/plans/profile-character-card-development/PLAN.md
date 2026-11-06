# Plan: profile-character-card-development

**Status 2026-11-06.** The substrate and slots landed: `renderProfileCard` in `public/js/modules/profile/builder.js` emits the `data-spw-slot` contract (53e21f01, 2026-06-01). Since 2026-10-10 this plan also owns the RPG Wednesday route, whose direction was the Inktober table (0814de8e). October has now closed, and the frame still invites October drawing (`index.spw#wonder_profile_character_card_development_after_october`). Since 2026-10-10 only cross-cutting commits touched these paths (b5171318, df32c50f). The cast lens and the author handoff have not started, and `/play/rpg-wednesday/cast/` has no cards. Next slice: one cast card promoted from one session note, gated on the creator picking the figure and the session. Found on re-read: the card's "develop style in Midjourney" action left `/tools/character-sheet/` in the shell migration (a46d9041, 2026-07-26), while `/tools/midjourney/` still reads `?style-packet=` (slice 2).

**Related:** [skill-folio-operating-system](../archive/skill-folio-operating-system/PLAN.md) (archived). **Absorbed 2026-10-06:** [rpg-character-hub](../archive/rpg-character-hub/PLAN.md) · [rpg-session-notes](../archive/rpg-session-notes/PLAN.md). **Absorbed 2026-10-10:** [rpg-portal-fantasy](../archive/rpg-portal-fantasy/PLAN.md) (route ownership).

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

The seams, when a slice needs them: `tools/profile/index.html` and `tools/character-sheet/index.html` (route copy for lenses), `play/rpg-wednesday/cast/index.html` (cast cards), `public/js/modules/profile/builder.js` and `tool.js` (lens, development state, family), and `public/css/components/cards/profile-card.css` (state and family variables). The source objects are [blog-blob-spw](../blog-blob-spw/PLAN.md) and the archived [rpg-session-notes](../archive/rpg-session-notes/PLAN.md).

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
- `public/js/modules/profile/builder.js` and `public/js/modules/profile/tool.js` provide one shared data and rendering path.
- `public/css/components/cards/profile-card.css` already carries development-state semantics such as depth, completeness, focus, and card charge.
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

## Landed passes

- **Self-imagination tranche (2026-06-01, 53e21f01).** The character sheet builder became the place where a creator practises the personality, theme and developmental posture of the self that will later commission, or be commissioned: "Map the character arc → fund the capacity → commission the work that fits the person you practiced becoming." It came with optional seeds and lens cycling, and no change to the renderer. The detail is in the archived [expressive-layout-tropes-fidget-manuscript](../archive/expressive-layout-tropes-fidget-manuscript/PLAN.md) and [funding-proof-cards](../archive/funding-proof-cards/PLAN.md).
- **Slots and composition (same commit).** Rendered cards emit `data-spw-slot` (header, meta, body, footer). The character sheet says its panels are compositional slots (`tools/character-sheet/index.html`, "The panels below are compositional slots"). `/design/components/` links the live cards to `/design/slots/`, and `profile-card.css` separates primary from secondary badge clusters with a flex-wrap that holds on a phone.
- **Card to Midjourney, half left.** The same commit added a "develop style in Midjourney" action on the character sheet's preview, which built a style packet and sent it as `?style-packet=`. The shell migration (a46d9041) dropped that producer from `tools/character-sheet/index.html`. The consumer in `tools/midjourney/index.html` (its inline script, `style-packet-from-card`) and the drop/paste zone remain.

## Next slices

1. **The first cast card.** One recurring figure, promoted from one session note (`play/rpg-wednesday/sessions/2026-05-13/` is the only one), authored as static markup with the slot contract in `play/rpg-wednesday/cast/index.html`, so that it reads with JavaScript off. Gate: the creator picks the figure and the session (`index.spw#wonder_profile_character_card_development_first_cast`). Verify: `rg -c "profile-card" play/rpg-wednesday/cast/index.html` reads 1, and the card holds the figure's story, not its players.
2. **The style packet's other half.** Restore one action on the character sheet's preview, retire the consumer on `/tools/midjourney/`, or point the packet at a scan instead of a render. Since 2026-11-05 the creator has wanted their own art first and Midjourney only where it belongs, which makes this a choice, not a repair (`index.spw#wonder_profile_character_card_development_style_packet`). Verify: `rg -n "style-packet" tools/` shows either both halves or neither.
3. **After October.** `#inktober-31` on `/play/rpg-wednesday/` still opens "October is a good month to draw with the table". What the frame becomes is the creator's call (`index.spw#wonder_profile_character_card_development_after_october`); the table shelf below it, where "new table art lands … mine first", is where the creator's own art would open the route (midjourney-design-concepts, slice 4).

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
- semantic read-through against `.agents/plans/archive/rpg-session-notes/PLAN.md`
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

## Absorbed 2026-10-10 — rpg-portal-fantasy (RPG Wednesday route)

Source: [rpg-portal-fantasy](../archive/rpg-portal-fantasy/PLAN.md). Its patches 001–012 landed by 2026-05-27; Patch 012's home consequence block left `index.html` in a7cacb5d, and its Kernel Codex station never started. It is not carried here. This plan now answers for `/play/rpg-wednesday/`.
- Current direction (0814de8e, creator 2026-09-28): the table is joined on your own time (make a character, bring a doodle, keep a sheet). `#inktober-31` offers a piece a day or a batch scanned by the 31st. Its closes `*ink[13]{A}`, `*ink[26]{B}`, `*ink[31]{C}` light through `public/js/modules/rpg-wednesday/morale-closes.js`, stay in the reader's browser, and read as plain milestones with JS off.
- Keep: no invitation to live sessions, and no copy that assumes a fixed group. The legal name stays off the name-cadence easter egg. The fantasy is a projection layer that never replaces the home's identity, and portal language must feel earned rather than bolted on.
