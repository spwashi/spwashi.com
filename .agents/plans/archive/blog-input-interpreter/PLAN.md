# Plan: blog-input-interpreter

Build a blog surface that starts as an input interpreter and can grow into a publishing system for Spw, wonder, and readable language.

## Goal

Create a framework-free `/blog/` route that is useful before there is a full archive. The first version lets a visitor paste draft text, Spw fragments, or wonder notes and receive a local interpretation: title suggestion, summary, tags, questions, outline, stats, and a copyable Spw-style draft seed. Taste note: the blog should feel like an editorial workbench and a permission structure for noticing, not a generic feed or an AI demo.

The deeper goal is to establish the blog as the public writing pipeline for the site:

- Raw input becomes a structured draft.
- Spw operators can act as temporary scaffolds for thought without replacing prose.
- Wonder stays present as a serious input, not decoration.
- Some interpreted drafts should mature into durable blog blobs before they become posts.
- Structured drafts can later become hand-written static posts.
- The interpreter explains what it inferred instead of pretending to know.
- The privacy boundary stays obvious: local interpretation first, no network dependency by default.

## North Star

The blog exists to make occasional synthesis easier: sometimes a note begins as syntax, sometimes as curiosity, sometimes as a half-formed claim. The page should give those starts a small amount of shape so they can become language.

Definition:

- **Wonder** is sustained attention to something not yet resolved.
- **Spw** is the scaffold that names shape, relation, operator, and frame.
- **Language** is the public artifact: prose a reader can follow without needing the private spark that produced it.

Counterexample:

- A dashboard that extracts tags from text but gives no reason to write.
- A mystic surface that gestures at wonder but does not help a sentence become clearer.
- A syntax demo that keeps the piece inside Spw instead of translating it outward.

## Product Shape

The `/blog/` page should answer four reader/writer questions in order:

1. What can I do here right now?
2. What did the interpreter understand from my input?
3. What wonder, Spw shape, or language move could carry this forward?
4. How could this become a publishable post later?

The first screen should be the tool, not a landing page. The page can still contain explanatory sections below the tool, but the textarea and interpretation output are the primary experience.

## Interpretation Model

Version 1 is deterministic and local. It should not imply remote AI or semantic certainty.

Inputs:

- Plain paragraphs.
- Rough notes.
- Markdown-ish headings.
- Question lists.
- Spw-ish text fragments.
- Wonder fragments: observations, curiosities, metaphors, or "why does this feel alive?" notes.

Outputs:

- Suggested title: heading if present, otherwise a keyword or first-sentence title.
- Summary: first useful sentence pair, clipped for readability.
- Tags: domain tags plus repeated local keywords.
- Questions: explicit question sentences plus generated editorial prompts.
- Outline: headings when present, otherwise paragraph-first-sentence sections.
- Metrics: word count, estimated read time, detected tone.
- Spw seed: a portable `#>blog_note` block with lens, summary, tags, and questions.

Interpretive lenses:

- `wonder_to_language`: default lens for fragments that feel exploratory or unresolved.
- `spw_to_language`: when operators, sigils, frames, or syntax terms are present.
- `draft_to_post`: when the input already reads like prose.

The lens should be visible in the seed so future posts can remember how the draft began.

Non-goals for v1:

- No correctness claims.
- No hidden persistence.
- No automatic publish action.
- No remote model calls.
- No markdown parser dependency unless future posts justify it.

## Blog Content Model

The route should make room for a future static archive without committing to a CMS.

Potential post shape:

- `blog/YYYY-MM-DD-slug/index.html` for published posts.
- Optional adjacent `post.spw` for source metadata.
- `#>post_frame` sigil for stable anchoring.
- Summary, tags, related surfaces, and source references near the top.
- Manual authoring remains the source of truth.

Draft lifecycle:

1. Paste raw input.
2. Interpret locally.
3. Notice the inferred lens: wonder, Spw scaffold, or draft.
4. Review the suggested title, summary, tags, questions, and outline.
5. Copy the Spw seed into a planning or draft surface.
6. If the material remains alive after first review, promote it into a blog blob as the durable intermediate object.
7. Revisit the blob as language, structure, and translation seams sharpen.
8. Manually create a post route when the text is ready.
9. Let only some drafts become posts; the route is allowed to be occasional.

Intermediate object rule:

- The seed is a compact next-step transport object.
- The blog blob is a revisitable editorial body with identity, active lenses, unresolved questions, and possible projections.
- A finished post is a public route artifact, not the only meaningful writing state.

## UX Requirements

- The interpreter must be usable with keyboard only.
- The textarea needs a clear label and placeholder.
- Results should update only on explicit action in v1, so the writer controls when interpretation happens.
- Status text should use `aria-live`.
- Empty input should produce a clear prompt, not blank output.
- The no-JS state should still explain the local interpretation contract.
- The output should be scannable: title and summary first, then metrics, tags, questions, outline, seed.
- The copy should give the writer permission to use the page sometimes, especially when a thought is interesting but not yet article-shaped.

## Privacy And Trust

The blog interpreter should state the boundary in copy and behavior:

- Text stays in the browser.
- There is no account.
- There is no sync.
- There is no analytics event containing draft content.
- No `localStorage` persistence for draft text in v1.
- Future persistence, if added, must be opt-in and local-first.

## Files

[NEW] `blog/index.html` - blog route and interpreter UI.
[NEW] `public/js/blog-interpreter.js` - local heuristic interpretation for pasted text.
[MOD] `public/js/site.js` - optional feature loader for the blog interpreter.
[MOD] `public/css/style.css` - scoped blog/interpreter styles.
[MOD] `sw.js` - cache `/blog/` and the interpreter module for the PWA shell.
[MOD] `manifest.webmanifest` - add a Blog shortcut and bump version if cache changes.
[MOD] `*/index.html` - header navigation adds Blog; footer copyright moves to 2026.

Craft guard:

- Keep the interpreter module deterministic, readable, and under 300 lines if possible.
- Keep CSS feature-gated under `blog-interpreter`.
- Keep the route semantic and readable without JavaScript.
- Do not touch unrelated `.spw/conventions/*` changes.
- Avoid turning the blog into a dashboard; every output should help the next writing step.
- Preserve the translation direction: wonder and Spw enter, readable language leaves.
- Keep room for blobs to carry translation seams, glosses, and alternative framings before rhetoric hardens into final prose.

## Commit Plan

1. `.[plan] - detail blog interpreter publishing plan`
   - Expand PLAN.md, wip state, and the Spw contract before continuing implementation.
2. `#[blog] - add local input interpreter route`
   - Add `/blog/`, interpreter JS, optional loader, CSS, PWA cache entries, manifest shortcut, nav, and copyright updates.

Fuzz strategy:

- Explore: inspect header/footer patterns, optional feature loader, service worker cache, and settings route interactions.
- Stabilize: `node --check public/js/blog-interpreter.js`, `node --check public/js/site.js`, JSON parse for manifest, `git diff --check`.
- Ship gate: commit-review poll on changed files.

## Agentic Hygiene

- Base reference: `main@a2a9da074f4fa8437e422ef5174e3fbb07855b94`; `origin/main@8b1a63e0ccb4189bbb0d52d4a28752761fc37a0f`.
- Rebase cadence: before commit if this work is committed.
- Hygiene split: pre-existing `.spw/conventions/*` changes are unrelated and must remain untouched.

## Dependencies

- `.agents/plans/blog-blob-spw/PLAN.md` — defines the durable intermediate object between interpreter seed and post.
- `.agents/plans/copy-localization/PLAN.md` — defines how blobs and later posts can preserve translation seams for future locale work.

## Failure Modes

- Hard: JS syntax error prevents interpretation.
- Hard: service worker cache references a missing `/blog/` asset.
- Soft: interpretation feels too magical or too vague.
- Soft: the blog reads as a toy instead of a real publishing path.
- Soft: the blog becomes generic productivity tooling and loses the Spw/wonder synthesis reason.
- Soft: navigation gets crowded on narrow screens.
- Non-negotiable: no network dependency; pasted text stays in the browser.

## Validation

Hypotheses:

- A pasted draft produces a title, summary, tags, questions, outline, and draft seed.
- A pasted wonder note or Spw fragment produces prompts that help turn it into readable language.
- The route explains local-only behavior clearly enough that a visitor understands the privacy boundary.
- The blog nav addition remains usable on mobile.

Negative controls:

- Existing optional features still initialize.
- Static pages remain readable without the blog JS.
- Settings, navigator, console, RPG gameplay, Pretext, and media publishing loaders still work.

Demo sequence:

1. Open `/blog/`.
2. Paste text and click `@ interpret input`.
3. Confirm title, summary, metrics, tags, questions, outline, and Spw seed update.
4. Click `! clear`.
5. Reload offline after service worker update and confirm the route shell is cached.

## Open Questions

- Should future published posts be hand-authored HTML only, or should Spw seeds become the canonical source?
- Should the interpreter eventually emit a blog-blob scaffold in addition to the compact seed?
- Should draft text ever persist locally, or should v1 intentionally avoid storage?
- Should interpretation eventually support multiple lenses, such as `reader`, `editor`, `engineer`, and `publisher`?
- Which kinds of wonder belong here, and which should remain private notes?

## Spw Artifact

`blog-input-interpreter.spw` records the local interpretation contract and future publishing lifecycle.
