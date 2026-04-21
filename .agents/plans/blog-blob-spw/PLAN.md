# Plan: blog-blob-spw

Define a `blog blob` concept for `spwashi.com`: a durable, inspectable Spw-adjacent content unit that sits between raw input and a published post.

## Goal

The desired end state is a publishing model where not every meaningful writing artifact has to become either "raw note" or "finished article." A blog blob should hold live material that has already accumulated enough shape to be worth naming, reviewing, translating, or routing, but has not yet earned full post status. The blog interpreter can emit toward a blob; localization can later translate from blob-aware copy units; published blog routes can distill or project a blob without erasing the intermediate semantic layer. The taste note is **coherent mass + inspectable transition**: the blob is not a dump, and it is not a miniature post. It is a charged writing body that still admits revision, re-lensing, and selective projection.

## Working Definition

A **blog blob** is a bounded writing object with enough structure to be addressable, but enough looseness to remain metabolically active.

It should be able to hold:
- a title or provisional title
- one or more active lenses
- summary or claim fragments
- unresolved questions
- source fragments or excerpts
- operator hints or Spw scaffolding
- relationship to possible future posts, domains, or routes

It should not require:
- final chronology
- polished prose
- stable permalink-ready rhetoric
- complete metadata parity with a published post

## Scope

- **In scope**: semantic definition of a blob; lifecycle position between interpreter output and post; how a blob differs from note, seed, draft, and post; candidate Spw shape; how localization and translation should treat blobs; whether blobs become private authoring files, public route elements, or both.
- **Out of scope**: implementing blob storage, a blob editor, automatic post generation, database persistence, or turning all blog content into blobs immediately.

## Files

[NEW] .agents/plans/blog-blob-spw/PLAN.md
[NEW] .agents/plans/blog-blob-spw/blog-blob-spw.spw
[MOD?] .agents/plans/blog-input-interpreter/PLAN.md — reference blob as the next durable state after local interpretation
[MOD?] blog/index.html — add visible blob framing only when the public blog route needs it
[MOD?] public/js/spw-blog-interpreter.js — optional future output mode that emits a blob scaffold instead of only a seed
[MOD?] .spw/conventions/copy-localization.spw — if blobs become translation-facing source objects for multilingual editorial work
[MOD?] .spw/site.spw — if blob semantics become part of the durable site bridge rather than only a plan artifact

Craft guard:
- A blob must be a meaningful editorial unit, not a trash pile for leftovers.
- A blob must preserve unresolvedness without becoming vague; it should expose what is active, missing, and potentially publishable.
- Blob semantics should help routing and translation, not block hand-authored posts.
- The blob should be inspectable in Spw without requiring Spw to be the rendered public format.
- A published post may descend from one blob, several blobs, or no blob at all; the model should not become mandatory bureaucracy.

## Relationship To Existing Models

- **raw note**: unbounded capture, not yet stable enough to address semantically
- **interpreter output**: immediate local reading of raw input
- **draft seed**: compact transport object for the next move
- **blog blob**: durable intermediate body with identity, charge, and revision room
- **post**: public route artifact with stable rhetorical shape

The key distinction is that a seed points forward, while a blob can be revisited as its own object.

## Candidate Semantics

1. **Blob as charged body**
   The blob is a writing mass with internal gradients: claim, question, evidence, metaphor, operator scaffolding, and possible projections.

2. **Blob as editorial staging object**
   The blob is where you decide whether material becomes:
   - a blog post
   - a topic-page insertion
   - a lore-domain fragment
   - a translation source for another locale
   - a dead end worth keeping only as thought residue

3. **Blob as translation seam**
   For multilingual work, the blob may be a better source object than a finished English post because it can preserve unresolved terms, glosses, and alternate framings before rhetoric hardens.

## Proposed Spw Shape

The blob should likely be expressed as a named object with a stable id and a small set of durable facets:

- identity
- current lens or lenses
- active claim fragments
- open questions
- source shards
- relation edges
- projection candidates
- status

This should stay inspectable and portable. It does not need to be executable.

## Lifecycle

1. Raw input is pasted or gathered.
2. The interpreter identifies title, summary, questions, tags, tone, and lens.
3. A draft seed is emitted for immediate movement.
4. If the material remains live after first review, promote it into a blog blob.
5. Revisit the blob as understanding sharpens.
6. Project the blob into one or more posts, route sections, or translations when ready.

## Localization Relevance

Blob planning matters for localization because translation should not always wait for the final post. A blob can carry:
- alternative phrasings
- operator glosses
- locale-sensitive metaphors
- unresolved vocabulary choices
- public-facing versus literal restatements

That makes it a plausible source object for future Spw-informed translation work, especially on concept-heavy routes.

## Validation

- `git diff --check`
- semantic read-through against `.agents/plans/blog-input-interpreter/PLAN.md`
- semantic read-through against `.spw/conventions/copy-localization.spw`
- confirm the distinctions between note, seed, blob, and post are crisp enough to use in later implementation

## Failure Modes

- **Hard**: blob collapses into a synonym for draft, adding vocabulary without adding a real semantic distinction.
- **Hard**: blob becomes a storage bucket for everything unresolved, making it useless as an editorial object.
- **Soft**: blob semantics are so formal that they slow down writing instead of helping route live material.
- **Soft**: blob is described only in Spw terms and never made legible to plain-language authoring decisions.
- **Non-negotiable**: blobs remain optional. Writers must still be able to move directly from note to post when that is the right shape.

## Recommendation

Treat the blog blob as an optional intermediate object between interpreter seed and post: stable enough to inspect, loose enough to evolve, and rich enough to carry future translation seams. Build the concept first in `.spw` and planning notes before deciding whether it becomes a public route affordance, an author-only file shape, or both.
