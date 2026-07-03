# Modular Experience Slices & Earthy Rhythms of Participation

## Public Goal

Evolve the file tree and collaboration surfaces *of this repository* so that stable "experience slices" (operator grammar, attention/resonance field, cauldron/composition, musical/rhythmic projection, wonder/ornament, brace physics, region harmony, creative play surfaces, math practice labs, etc.) can be owned and iteratively tended by human developer teams over years — like layers of an abstract painting or beds in a long-lived garden — while preserving core Spw contracts and inspectability. The planning target stays local to this repository; the slice model should help humans coordinate work here, not become an upstream workbench proposal.

Support earthy, cyclical rhythms of participation and exchange: periods of focused tending on one or more slices, followed by natural sedimentation of contributions, weathering, and handoff artifacts that let other developers (or the same developers in a later season) continue the work without friction or erasure of prior layers.

**Scoping note (per current direction):** This pattern is intentionally local/downstream to this repository for developer conversation and coordination. It is not being positioned for updates to the spw-workbench at this time.

## Primary Artifact

The living specification lives in:
- `.spw/reviews/modular-experience-slices-volleyball.spw` (title still carries the old working name; content is being reframed toward earthy rhythms)
- `.spw/reviews/workbench-alignment-audit.spw` (2026-04, updated) — notes the local scope of these collaboration patterns.
- `.spw/reviews/fundamentals-practice-rhythms.spw` (2026-04) — proposes practice beds within slices as the primary structure for developers of varying skills to build relationship with fundamentals through the same earthy rhythms of tending and exchange.

These reviews and this plan together define:
- The candidate experience slices derived from the runtime ontology and workbench metaphysics.
- Bolder file tree proposals (with invariants) that give teams clearer long-term ownership of slices across CSS layers (and symmetrically in JS and .spw).
- Practical patterns for earthy rhythms of participation and exchange — periods of tending, sedimentation of contributions, and natural succession between developers — built on existing .agents/plans/, .spw reviews, runtime contracts, and maintenance skills. This includes explicit support for developers arriving with different relationships to the fundamentals.

## Why This Now

- The CSS architecture alignment review (css-architecture-alignment.spw) already identified the need for bolder redistribution.
- The runtime and workbench already chunk the world beautifully (MODULE_DEFS, data-spw-* routing, operator families, attention-field model, precipitates/projections).
- Long-term human collaboration on a living creative system benefits from explicit slice ownership and organic rhythms of participation/exchange (tending, sedimentation, succession) rather than ad-hoc tribal knowledge.
- Aligns with agent-optimization goals (lower friction for returning humans and future collaborators) and the "painting over years" / garden-like aesthetic already present in the site's philosophy and metaphors (precipitates, cauldron as garden, CSS layers as strata, spirit cycle, site rhythm).

## Scope

**In scope (bolder but principled):**
- Define and stabilize the major experience slices as first-class concepts (initially in .spw).
- Prototype bolder file tree structures (starting with CSS `slices/` parallel or embedded, with possible JS symmetry).
- Develop and document earthy participation rhythms (per-slice .spw contracts, sedimentation notes, seasonal or cyclical review practices, and natural handoff surfaces), especially for the first concrete pilots that already have nearby review surfaces.
- Pilot with 1-2 slices, starting with the concrete math-practice-labs work already emerging in a sibling worktree, then generalizing only what proves useful.
- Allow route visual redesign when the redesign clarifies semantic flow, exposes practice beds, improves accessibility, or makes the slice easier to inspect.
- Allow CSS layer-order changes only when a specific semantic-flow problem cannot be solved by file redistribution, import manifests, or clearer ownership inside the existing layers.

**Out of scope for initial work:**
- Full migration of every file in one go.
- Any change that breaks existing data-spw-* contracts or runtime module loading.
- New npm dependencies without accompanying plan + human review.

## Pilot Slices

**Pilot A — math-practice-labs**

This is the first concrete pilot because it already exists as uncommitted work in the Gemini worktree (`enhance-educational-semantic-structure`) and can be reviewed as a real practice-bed patch rather than a theory exercise. The current candidate files are:
- `public/js/modules/math/diagrams.js`
- `topics/math/vector-calculus/index.html`
- `topics/math/numerical-methods/index.html`

The slice goal is to turn math vocabulary into playable reading/observation/gesture surfaces: vector fields, divergence, curl, Euler stepping, stability, and approximation error become directly inspectable. This is a useful bridge between fundamentals practice and the site's broader operator/field/rhythm vocabulary.

Review posture before landing:
- Keep the patch focused on the two math routes and the shared math diagram module.
- Confirm generated SVG IDs are unique per lab instance before the work lands, especially marker IDs referenced with `url(#...)`.
- Run `node --check public/js/modules/math/diagrams.js`, `git diff --check`, and a browser smoke on both math routes.
- Add a tending note after review that records what the math labs taught about practice-bed structure.

**Pilot B — attention-resonance-field**

This remains the best second pilot because it crosses CSS, JS, runtime state, and editor inspectability. Candidate surfaces include `public/js/runtime/attention-architecture.js`, `public/css/effects/wonder.css`, `public/css/ornament/ornament.css`, `.spw/conventions/attention-field.spw`, and the design/runtime surfaces. The first useful patch should not restructure the whole field. It should create a slice contract that maps the existing authored HTML, data attributes, runtime events, and CSS selectors so a returning developer can understand where attention state is read, written, and projected.

## Practice Beds

Practice beds are the durable participation units inside each slice. They should be visible enough that a developer knows how to enter the slice, but light enough that they do not become a second curriculum system.

- `reading`: authored route HTML, `.spw` contracts, and design explanations.
- `observation`: runtime state, console diagnostics, performance marks, data attributes, and browser inspection.
- `gesture`: small reversible experiments, reference assignments, and route-local probes.
- `tending`: focused improvements that clarify a concept, reduce friction, or strengthen a contract.
- `sedimentation`: notes or code comments that record why a pattern now belongs to the stable ground.
- `succession`: handoff notes for the next contributor or a later season of work.

The initial template lives at `.agents/plans/modular-experience-slices/templates/tending-note.spw`. Slice-specific notes may later move under `.spw/slices/<slice>/tending-notes/` once `.spw/slices/` exists.

## Slice Composability And Discoverability

Slices should make the site easier to understand and change; they should not become a second file tree that hides the actual cascade or runtime.

Each slice contract should answer:

- **HTML:** which routes, body metadata, feature clusters, ids, and component slots express the slice before enhancement?
- **CSS:** which layers and files project the slice's material, layout, attention, and resonance states?
- **JS:** which modules observe, adjust, measure, or emit events for the slice?
- **`.spw`:** which conventions, claims, reviews, and tending notes explain why the slice matters?
- **Practice:** where can a contributor read, observe, gesture, tend, sediment, or hand off work?

Use these promotion rules:

- Keep a behavior local when it only serves one route and has no reusable semantic claim.
- Promote to shared CSS when the same semantic state needs the same projection across routes.
- Promote to shared JS when multiple surfaces need the same observation, event, adjustment, or measurement behavior.
- Promote to `.spw` when the behavior teaches a concept, defines a reusable contract, or changes how future contributors should reason.
- Promote to a new file or directory only when search, ownership, review boundaries, or seasonal handoff improve measurably.

The slice should support both rhythms:

- **Seamless adjustment:** quiet care work such as layout settling, reduced-motion projection, accessibility affordances, and resource posture.
- **Resonant cluster:** visible moments where operator focus, practice-bed insight, setting deviation, or cauldron/spell consequence deserves brief appreciation and local explanation.

## Patch Sequence (Suggested)

**Phase 0 — Orientation**
- This plan + the modular-experience-slices-volleyball.spw review.
- Cross-links from css-architecture-alignment.spw, spw-css-architecture/PLAN.md, runtime-bootstrap-performance/PLAN.md, and agent-optimization/PLAN.md.

**Phase 1 — Slice Definition & Contracts**
- Create `.spw/slices/` (or equivalent) with one canonical .spw per major slice containing runtime contract, CSS/JS ownership map, current state, and open seams.
- Update css-instruction.spw and planning-ecology.spw with slice ownership + volleyball guidance.
- Start with `math-practice-labs` as a pilot contract only after the Gemini math-lab patch is reviewed or ported.

**Phase 2 — Tending Notes & Practice Artifacts**
- Use the tending-note template after a real review or implementation session.
- Record one note for `math-practice-labs` once the vector-calculus / numerical-methods pilot is accepted, rejected, or split.
- Prefer `.spw` notes for durable concepts and plan-local template notes for draft coordination.

**Phase 3 — Bolder Tree Prototype (CSS first)**
- Implement one of the bolder proposals from the review (e.g., `public/css/slices/<slice-name>/` with layer-specific contribution files), or a manifest pattern that makes slice ownership visible without moving files.
- Update style.css imports only after proving the manifest does not obscure the cascade.
- If layer order changes are proposed, land them as their own patch with route screenshots, reduced-motion checks, and a rollback note.

**Phase 4 — JS + Runtime Symmetry (optional but powerful)**
- Explore parallel `public/js/slices/` structure or formalize ownership within the existing kernel/semantic/runtime/interface/modules layout using the same slice contracts.
- Enhance MODULE_DEFS or add slice metadata so the runtime itself knows which modules "belong" to which painted slice.

**Phase 5 — Volleyball Rituals & Tooling**
- Pilot human session → handoff using the protocol in the review.
- Enhance or document use of spw-plan-maintenance, spw-ontology-workbench, and existing spell/checkpoint surfaces for between-volley maintenance.
- Add lightweight session review templates.

**Phase 6 — Measurement & Refinement**
- After several real human volleys, assess friction reduction for new/returning contributors.
- Refine the slice boundaries and tree as the painting reveals what works.

## Validation

- Strict respect for AGENTS.md (css-instruction.spw, surgical changes, no un-planned deps). If the CSS layer order itself changes, that patch must update AGENTS.md and the relevant `.spw` convention in the same reviewable unit.
- `git diff --check`, `npm run check` (CSS and full subsets), manual review on key routes.
- A new contributor (or returning one after months) should be able to make a coherent change to one slice by primarily working inside that slice's directories + its .spw contract.
- Existing editor surfaces (design catalog, runtime timings, state inspector) continue to work and ideally become more useful because ownership is clearer.

## Relation to Existing Work

- Direct evolution of `archive/spw-css-architecture/PLAN.md` and the 2026 CSS alignment + runtime performance work.
- Uses the same .spw review + plan ecology that already supports agent-optimization and long-term collaboration.
- The slices are projections of the same Spw metaphysics (operators as voices, field as resonance, precipitates as meaning crystallization) that the workbench models.

## Status

- [x] Plan created with primary artifact in `.spw/reviews/modular-experience-slices-volleyball.spw`
- [x] Practice-bed pilot and tending-note template path added
- [ ] Slice definitions formalized in .spw
- [ ] `math-practice-labs` pilot reviewed and either ported, split, or rejected with a tending note
- [ ] Bolder tree prototype (CSS) implemented and validated
- [ ] First human volleyball pilot completed with handoff artifacts
- [ ] Tooling and instruction updates landed
- [ ] `attention-resonance-field` slice contract clarified alongside the current attention-field / wonder / ornament surfaces

This plan treats the site as a living, multi-author artwork that improves through deliberate, inspectable, volleyed contributions rather than big-bang rewrites.
