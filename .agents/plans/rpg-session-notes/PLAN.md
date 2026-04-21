# Plan: rpg-session-notes

Prepare an intermediate note model for `RPG Wednesday` session material so table notes can mature into session pages, world updates, cast memory, or arc records without collapsing everything into one published recap.

## Goal

The desired end state is a campaign memory model where private or semi-structured session material can be captured, revisited, and promoted deliberately. A session note should be able to hold what happened at the table, what changed in characters, what might become canon, and what pressure should carry forward, without requiring immediate publication as a polished session page. This should align with the local gameplay kit, the public `sessions/` route, and the new blog-blob thinking while staying distinct from them. The taste note is **play residue + durable memory seam**: session notes should preserve the energy of actual play while remaining structured enough to feed the campaign record later.

## Working Definition

An **RPG session note** is a bounded record of one play session or one immediate post-session recollection, rich enough to revisit and promote, but not yet equivalent to the public session page.

It should be able to hold:
- session date or provisional anchor
- recap fragments
- character beats
- canon candidates
- unresolved questions
- turning points
- next-session pressure
- optional links to cast, world, or arc surfaces

It should not require:
- public-ready prose
- complete crosslinking
- final canon decisions
- full route metadata parity with the published session page

## Scope

- **In scope**: semantic definition of an RPG session note; its relation to local gameplay seeds, public session pages, canon candidates, arcs, and campaign memory; candidate Spw shape; how session notes differ from blog blobs; how session notes could later support translation or public adaptation.
- **Out of scope**: implementing editors, storage beyond the existing local gameplay kit, auto-generating session routes, or redesigning the current RPG Wednesday pages.

## Files

[NEW] .agents/plans/rpg-session-notes/PLAN.md
[NEW] .agents/plans/rpg-session-notes/rpg-session-notes.spw
[MOD?] .agents/plans/rpg-local-gameplay/PLAN.md — if the gameplay kit should explicitly emit session-note scaffolds
[MOD?] play/rpg-wednesday/sessions/index.html — only when the public sessions route needs visible language about note promotion
[MOD?] public/js/rpg-wednesday.js — optional future output mode for exporting session-note scaffolds
[MOD?] .agents/plans/blog-blob-spw/PLAN.md — if cross-projection between blog blobs and session notes becomes important

Craft guard:
- Session notes must remain grounded in actual play rather than becoming lore essays in disguise.
- Session notes should preserve uncertainty where canon is not settled.
- The model should support promotion into public session pages, not force every note to become public.
- Session-note semantics should stay distinct from blog-blob semantics: campaign memory first, editorial prose second.
- Writers must be able to skip the intermediate note and publish a session page directly when the recap is already clear.

## Relationship To Existing Models

- **local gameplay seed**: immediate private capture during or right after play
- **RPG session note**: revisitable intermediate note for one session
- **public session page**: dated route artifact in `sessions/YYYY-MM-DD/`
- **canon candidate**: promotable fact that may graduate into world or cast memory
- **arc record**: cross-session pattern named only after repetition

The key distinction is that the public session page is the published ledger entry, while the session note is the working memory object that may feed several later surfaces.

## Candidate Semantics

1. **Session note as campaign residue**
   The note preserves table energy, quick chronology, turns, surprises, and aftermath before they flatten into summary prose.

2. **Session note as promotion seam**
   The note is where facts separate into:
   - recap material for the public session page
   - cast updates
   - world updates
   - arc evidence
   - private residue that should not become canon

3. **Session note as adaptation source**
   Some session material may later become blog writing, lore fragments, or translated summaries, but only after the campaign-memory role is satisfied.

## Proposed Spw Shape

The session note should likely be a named object with durable facets such as:

- identity
- recap fragments
- beats
- canon candidates
- pressures
- relations
- status

It should be inspectable and portable. It does not need runtime behavior.

## Lifecycle

1. Play happens.
2. The local gameplay kit captures scene state, notes, beats, canon candidates, and recap seeds.
3. A session note is formed as the durable intermediate object for that date.
4. The note is reviewed after play.
5. Material is promoted into:
   - a public session page
   - cast/world updates
   - arc evidence
   - retained private residue

## Relationship To Blog Blobs

- A **blog blob** is an editorial object that can later become public prose.
- An **RPG session note** is a campaign-memory object tied to a specific play event.
- A session note may eventually feed a blog blob when a session generates reflective writing, but the two objects should not be collapsed.

## Localization Relevance

Session notes may later support public adaptation or translation, especially if a session recap is rewritten for broader audiences. The note can preserve:
- literal table events
- player-facing shorthand
- names needing gloss
- alternative recap phrasings

That makes session notes a possible source seam for future public-facing retellings without making localization a requirement for campaign logging.

## Validation

- `git diff --check`
- semantic read-through against `.agents/plans/rpg-local-gameplay/PLAN.md`
- semantic read-through against `.agents/plans/blog-blob-spw/PLAN.md`
- confirm the distinctions between gameplay seed, session note, public session page, and arc record are crisp enough to use later

## Failure Modes

- **Hard**: session note becomes a synonym for the published session page and adds no new semantic role.
- **Hard**: session note captures too much unresolved material with no promotion logic, becoming an unusable pile.
- **Soft**: session notes drift into lore essays and stop reflecting the actual table event.
- **Soft**: the distinction from blog blobs becomes unclear, making cross-surface writing harder rather than easier.
- **Non-negotiable**: session notes remain optional. The public campaign ledger must still support direct entry creation when that is the simplest honest path.

## Recommendation

Treat the RPG session note as the campaign-memory sibling to the blog blob: tied to one play event, promotion-oriented, and grounded in actual table residue. Build the concept in planning and `.spw` first, then decide later whether the local gameplay kit, export flow, or public sessions route should expose it directly.
