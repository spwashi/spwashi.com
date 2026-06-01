# Spw Surface Normalization & Navigability

## Public Goal

Establish a lightweight but consistent writing and structural model for the site's .spw surfaces (conventions, philosophy, reviews, surfaces, and application notes) so that they feel like natural, readable extensions of the spw-workbench's own self-modeling canon, while remaining distinctly local to this repository for human developer collaboration.

Make the collection of .spw files more **navigable** (easy to traverse, cross-reference, and discover relevant surfaces) and more **dimensional** (explicitly layered along meaningful axes such as temporal rhythm, practice depth, semantic layer, and collaboration phase) so that developers with varying skill levels and familiarity can more easily enter, tend, and exchange within the living documentation of the site.

This work directly supports the local "earthy rhythms of participation and exchange" model (tending experience slices like garden beds or painting layers over seasons) and the need for practice structures that accommodate developers arriving with different relationships to the fundamentals.

It also prepares for a larger expansion in semantic capacity: many more operators, audience registers, practice beds, creative prompts, product lines, and slice contracts can exist if `.spw` surfaces make clear whether they are caching insight, auditing understanding, aligning patterns, priming expansion, creating a contract, or archiving old context.

## Current Baseline

The spw-workbench maintains a highly consistent internal style for its own .spw modeling:
- Clean, minimal headers with `#>` anchor tags and `#:category #!tag` layer declarations.
- Disciplined use of `^"section"{ ... }` for major divisions, often with structured objects, arrays, and `~#note / ~#invariant / ~#definition` micro-metadata.
- Explicit, short-named reference style: `@shortname: ~"./relative/path.spw"`.
- Declarative yet precise tone, even when addressing philosophical or experiential topics.
- Strong internal dispatch and registry surfaces (index.spw, conventions/index.spw, registries/*) that make the canon traversable.

The site's .spw surfaces (especially newer reviews and application notes) show valuable local voice and metaphors (precipitates/sedimentation, cauldron as garden/kitchen, spirit cycle, earthy rhythms, practice beds, literary geology of CSS layers, attribute grammar families) but vary in:
- Header length and format.
- Mix of free-form prose blocks vs. structured `^" "` sections.
- Reference style (sometimes loose prose citations, sometimes the `@name: ~"path"` pattern).
- Overall "dimensionality" — most surfaces are relatively flat lists of concepts rather than explicitly multi-axial.

This creates mild but growing friction for long-term human collaboration: returning developers or those with different entry points must re-learn stylistic conventions per file rather than relying on a stable, workbench-aligned grammar for the surfaces themselves.

## Scope (Smallest Honest Surfaces)

**In scope:**
- Normalization rules for headers, major sectioning (`^" "` vs prose), reference conventions, and lightweight metadata (`~#note`, etc.).
- Mechanisms for navigability: consistent dispatch/index patterns, cross-slice and cross-review linking, "sedimentation notes" that trace how ideas move between surfaces over time.
- A lightweight dimensional model: explicit axes that any .spw surface can declare (Temporal / Rhythmic, Practice Depth, Semantic Layer, Collaboration Phase, Provenance).
- Semantic-capacity operations: cache, audit, align, prime, contract, and archive, with small insight-cache entries for ideas that are valuable but not ready for implementation.
- Updates to key existing surfaces that would most benefit (planning-ecology.spw, site-semantics.spw, css-instruction.spw, recent reviews on rhythms/practice/grammar/geology, and the modular-experience-slices coordination surfaces).
- Companion living spec in .spw (probably a new review or conventions file).
- Integration with the local collaboration model (slices as ownership units, earthy participation rhythms, practice beds for varying skill levels).
- Use of spw-plan-maintenance for ongoing hygiene.

**Out of scope (for this plan):**
- Changes to the spw-workbench canon itself (per current scoping: the model remains local/downstream to this repo).
- Large-scale rewrites of every .spw file.
- New tooling or heavy automation (prefer small, hand-maintainable patterns that can later be supported by maintenance skills).
- Any changes that would require updates to the workbench or affect its internal modeling.

## Proposed Normalization Rules (Lightweight but Enforceable Locally)

**1. Headers (workbench-aligned but room for local title)**
- Every canonical .spw surface should open with:
  ```
  # Short Descriptive Title
  #
  # One- or two-sentence purpose. Optional local flavor.
  #>spw_unique_anchor
  #:category #!tag
  #:layer #!pragmatics   (or semantics, etc.)
  ```
- Application/review files may have a slightly longer evocative title, but must still include the `#>` and `#:layer` block immediately after.

**2. Major Structure**
- Prefer `^"section_name"{ ... }` for primary divisions (thesis, roots, invariants, practice_structure, etc.).
- Inside sections, use `~#note:`, `~#invariant:`, `~#definition:`, `~#goal:`, etc. for metadata.
- Long prose is welcome for local voice and metaphor, but wrap it inside the structured forms rather than as top-level free-form `key = `long text`` blocks.

**3. References (consistency & navigability)**
- Use the explicit short-name pattern everywhere possible:
  ```
  @language_ladder: ~"../../.agents/plans/language-ladder-runtime-instrumentation/PLAN.md"
  @precipitates: ~"../conventions/precipitates-and-projections.spw"
  ```
- Maintain a small "dispatch" or "roots" block near the top of index/review surfaces so readers (and future tools) have a single place to start traversal.

**4. Tone Balance**
- Workbench rigor for scaffolding (headers, sectioning, references, invariants).
- Local earthy, rhythmic, literary voice inside the content (sedimentation, tending, gardening, spirit cycles, practice beds, painting layers).
- The form signals "this is Spw describing its world"; the substance carries the site's particular collaboration and learning culture.

**5. Lightweight Dimensional Declaration (new but cheap)**
- Any .spw surface that benefits from it may declare one or more explicit dimensions near the top:
  ```
  ^"dimensions"{
    temporal_rhythm: "spirit_cycle | seasonal | sedimentation"
    practice_depth: "reading | observation | gesture | tending | succession"
    semantic_layer: "grammar | semantics | pragmatics | application"
    collaboration_phase: "initiation | exchange | weathering | return"
  }
  ```
- This makes surfaces queryable along the axes that matter for the local rhythms and practice model without requiring heavy infrastructure.

**6. Semantic-Capacity Operation Declaration**
- When adding new meaning to `.spw`, name the operation:
  - `cache`: hold insight with evidence
  - `audit`: test understanding against code/routes/runtime
  - `align`: make surfaces share a vocabulary stem
  - `prime`: prepare creative expansion without implementing it
  - `contract`: promote repeated patterns into durable guidance
  - `archive`: reduce active semantic load while preserving context
- Use `.spw/conventions/semantic-capacity.spw` as the canonical reference.
- Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` when a small insight is enough.

## Concrete Before/After Illustrations

These examples show the smallest honest normalization that aligns a typical site review with workbench scaffolding while preserving local voice.

**Before (typical current site review style):**

```
# Fundamentals Practice Rhythms

Developers arrive with widely varying skills...

## Proposed Structure

Practice beds within slices...
```

**After (normalized):**

```
# Fundamentals Practice Rhythms — A Structure for Wide-Ranging Developers
#
# One- or two-sentence purpose. Local flavor welcome.
#>spw_fundamentals_practice_rhythms
#:review #!learning #!collaboration #!architecture
#:layer #!pragmatics

@modular_slices: ~"./modular-experience-slices-volleyball.spw"
@slices_plan: ~"../../.agents/plans/modular-experience-slices/PLAN.md"

^"thesis"{
  claim: "Developers arrive with widely varying skills..."
  earthy_rhythms_integration: "..."
}

^"practice_structure"{
  practice_beds: "..."
  progressive_entry_points: { reading: "...", observation: "...", ... }
}
```

**Key visible changes:**
- Short evocative title + purpose line.
- Immediate `#>` anchor + `#:layer` block.
- Explicit `@name: ~"path"` references (workbench style).
- Primary divisions use `^"name"{ ... }` with `~#` micro-metadata inside where useful.
- Earthy voice lives comfortably inside the structured containers.

A second common pattern (long top-level prose block) becomes a ^"roots" or ^"invariants" section containing the prose as a value, or is folded into the thesis/grounding facets.

## Sedimentation Notes (Lightweight Handoff Convention)

A sedimentation note is a tiny, dated entry (often a single ^"sedimentation" block or a standalone small .spw) that records:
- What crystallized or moved.
- Which surfaces were involved.
- Why it matters for future tendings (especially for returning developers or new slice participants).

Example (minimal, inside a review or as its own note):

```
^"sedimentation"{
  date: "2026-04"
  from: "css-architecture-alignment.spw + html-css-structure-audit.spw"
  into: "fundamentals-practice-rhythms.spw + this normalization plan"
  note: "Recognizability and attribute grammar families are now first-class practice dimensions. CSS literary geology (strata) is explicitly tied to practice beds inside slices."
  for_future: "When touching grammar or attribute surfaces, check the practice_depth axis and leave a trace for the next tender."
}
```

These notes become part of the "warm memory" layer in planning-ecology.spw and are prime candidates for spw-plan-maintenance sweeps.

## Navigability & Dimensional Improvements

- Strengthen existing dispatch surfaces (planning-ecology.spw, site.spw, reviews/index.spw, conventions/index.spw) with consistent @references and dimension notes.
- Introduce a lightweight convention for "sedimentation notes" (small entries that record when and why an idea moved between surfaces or crystallized in a review).
- Make practice beds and entry points for different skill levels first-class and discoverable inside slice .spw contracts.
- Over time, the dimensional declarations + consistent structure should make it feasible for simple maintenance tools or even manual "spw-plan-maintenance" sweeps to surface related surfaces across temporal, practice, or semantic dimensions.

## Integration with Existing Work & Sibling Surfaces

This plan is a direct evolution and enabling layer for the current collaboration direction:

**Core sibling surfaces (must be read together):**

- **`.spw/reviews/fundamentals-practice-rhythms.spw`** — Defines the five practice beds (reading, observation, gesture, tending, succession) as the primary on-ramps for developers of any background. Normalization makes these beds themselves more recognizable and traversable. The dimensional axes proposed here (especially `practice_depth`) are taken directly from that review.

- **`.spw/reviews/modular-experience-slices-volleyball.spw`** (and its companion `.agents/plans/modular-experience-slices/PLAN.md`) — Establishes experience slices as stable, cross-layer ownership units tended through earthy rhythms (sedimentation, weathering, succession, gardening). Normalized .spw surfaces become the durable "contract + handoff" layer for each slice. Slice contracts should declare which practice beds they currently expose.

- **`.spw/reviews/css-architecture-alignment.spw` + `html-css-structure-audit.spw` + `classname-patterns-attribute-grammar-recognizability.spw`** — The literary geology of CSS layers, timing of attribute application, and recognizability of grammar families are all surfaces that benefit enormously from consistent .spw self-description.

- **`.spw/conventions/precipitates-and-projections.spw` + `spirit-cycle` philosophy** — Normalization is itself a form of controlled crystallization (precipitate) that makes prior thought more findable and projectable forward in time.

**Relationship to agent-optimization track:**
This work lives under the editor/inspectability umbrella. It reduces the "re-learn the surface" tax every time a human (or future agent) returns to a review or convention. It is a prerequisite for any serious scaling of the experience-slices model.

It deliberately stays local and scoped to the surfaces that support human developer collaboration on this codebase. No changes are proposed to the spw-workbench canon.

## Dimensional Navigation Surfaces (Future Leverage)

Once a critical mass of surfaces carry lightweight `^"dimensions"` declarations, a small living index becomes valuable. A candidate shape (initially hand-maintained, later supportable by spw-plan-maintenance):

```
# .spw/reviews/dimensions-index.spw (proposed, lightweight)

#>spw_dimensions_index
#:index #!review #!navigation
#:layer #!pragmatics

@fundamentals: ~"./fundamentals-practice-rhythms.spw"
# practice_depth: [reading, observation, gesture, tending, succession]

practice_depth: .{
  reading: ["fundamentals-practice-rhythms", "html-css-structure-audit", ...]
  gesture: ["reference-assignment-template", "css-sensitive-attribute-writes", ...]
  ...
}[reg=index]

semantic_layer: .{
  pragmatics: ["planning-ecology", "css-instruction", "spw-surface-normalization", ...]
  ...
}

temporal_rhythm: .{
  sedimentation: ["precipitates-and-projections", "spw-surface-normalization (this)", ...]
}
```

Even without the index file, consistent use of dimension tags inside existing reviews + the @reference discipline makes manual "find surfaces in tending phase for the attention slice" feasible with rg or editor search.

## Patch Sequence (Suggested)

**Phase 0 — Orientation & Living Spec**
- This plan + the companion `.spw/reviews/spw-surface-normalization.spw` as the canonical living reference.
- Cross-links from `agent-optimization/PLAN.md`, `planning-ecology.spw`, `modular-experience-slices/PLAN.md`, and the fundamentals-practice-rhythms review.

**Phase 1 — Core Normalization Rules (smallest honest surfaces)**
- Update css-instruction.spw and planning-ecology.spw with the header, sectioning, reference, and dimensional declaration conventions.
- Apply the rules surgically to 3–5 high-traffic surfaces (fundamentals-practice-rhythms, the main slices review, site-semantics, precipitates-and-projections, one or two others).
- Add a short "local .spw writing conventions" note that explicitly allows the earthy/collaborative voice inside the workbench-aligned forms.

**Phase 2 — Navigability & Dispatch Strengthening**
- Improve cross-referencing and dispatch blocks in the key index/review surfaces.
- Pilot "sedimentation notes" in a few places (lightweight entries that trace movement of ideas across reviews and plans).
- Make practice depth / entry points visible in slice contracts.

**Phase 3 — Dimensional Model Maturation (only if it proves valuable)**
- Expand the lightweight dimensions where they genuinely aid discovery (temporal rhythms, practice depth for varying skills, semantic vs application layer).
- Evaluate whether a small maintenance script or enhanced spw-plan-maintenance invocation can help surface related surfaces along these axes.

**Phase 4 — Ongoing Hygiene**
- Fold the conventions into the regular spw-plan-maintenance rhythm.
- Revisit after any significant wave of new reviews or slice work.

## Validation & Observable Success Criteria

**Immediate (after Phase 1 pilot surfaces):**
- A developer who has not touched the repo in 3+ months can open a normalized review (e.g. fundamentals-practice-rhythms) and know within 30 seconds: its purpose, its primary dimensions (practice_depth, semantic_layer), and the 2–3 most relevant sibling surfaces via the @references block.
- `rg "@[a-z_]+: ~"` inside .spw/ and .agents/plans/ yields consistent, clickable (in good editors) references rather than a mix of prose citations and ad-hoc paths.
- The first two or three "returning developer" or "new slice tender" handoff sessions using sedimentation notes feel lower friction than pre-normalization reviews.

**Medium term (after Phase 2–3):**
- Questions of the form "which surfaces address practice beds in the attention or musical slices?" can be answered with a single rg pass over dimension declarations + slice contracts, without reading every file.
- spw-plan-maintenance (or a human using its output) can surface "stale cross-references" or "surfaces missing a practice_depth tag" as routine hygiene rather than heroic archaeology.
- New reviews and slice contracts written after the conventions land require noticeably less back-and-forth in review about "how should this .spw be structured?"

**Hard invariants (always):**
- All changes remain strictly local to this repo's collaboration surfaces. No proposals touch the spw-workbench canon.
- `git diff --check` passes after every edit.
- The earthy, literary, rhythmic voice of the site is not flattened — it is given a more stable, workbench-aligned container so it can be heard more clearly over years.

Validation steps for any concrete patch:
1. `git diff --check`
2. Manual spot read of the changed .spw by someone who did not author the normalization pass.
3. Quick smoke of any public editor surface that cites the changed file (e.g. /about/plans/ if relevant).
4. (Optional but encouraged) A short sedimentation note recording what the normalization pass itself taught.

## Status

- [x] Plan written (with concrete examples, priority targets, dimensional sketch, sedimentation convention, and sibling integration)
- [x] Companion .spw living spec exists at `.spw/reviews/spw-surface-normalization.spw` (points here; can be expanded with examples later)
- [x] Semantic-capacity operation convention added at `.spw/conventions/semantic-capacity.spw`
- [x] Insight-cache template added at `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw`
- [ ] Core conventions documented in planning-ecology.spw + css-instruction.spw (Phase 1)
- [ ] Pilot surfaces (fundamentals + slices + precipitates + 1–2 indexes) updated
- [ ] Sedimentation note convention piloted on at least one real cross-review movement
- [ ] First spw-plan-maintenance sweep that understands the new conventions

This plan treats the site's .spw surfaces as a living, multi-author garden whose internal consistency and dimensionality directly enable the earthy, sustainable collaboration model the repository is cultivating. It borrows the workbench's proven self-modeling discipline not to erase local voice, but to give that voice a stable, traversable container — so that developers arriving with different skills, in different seasons, can more easily find where to plant their hands and what previous gardeners have already made fertile.
