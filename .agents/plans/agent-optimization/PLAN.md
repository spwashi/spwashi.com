# Agent Optimization for spwashi.com

## Public Goal

Make the full agent operating environment for this repository (`.agents/`, skills, planning ecology, `.spw` bridges, public editor surfaces, and validation contracts) itself a first-class, low-friction, inspectable surface. The outcome: AI agents, human editors, and future collaborators can answer "how do I work on this site effectively?" and "did my change preserve the intended contracts?" with minimal repeated discovery or tribal knowledge.

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
- Build/dev scripts explicitly account for `.agents` (sitemap, checks, etc.).
- Existing `agentic-dev-contracts/PLAN.md` (largely landed; defines cheap "what is this route?" + "did I break it?" questions).

**Known gaps and friction:**
- No first-class entry in the `.spw` ontology for the planning ecology, skills layer, or "agent contracts" as a reusable semantic family (despite heavy use and public exposure).
- `archive/README.md` is stale (references only 3 of the 4 canonical tracks).
- The public `/about/plans/` page is a significant hand-maintenance tax; plan cards and status are not derived from the filesystem or a machine-readable index.

**Recent improvement (operator-site-projection):**
- New convention `.spw/conventions/operator-site-projection.spw` turns operators from symbolic labels into practical codebase handles.
- Projections now exist for: `?` (probe), `@` (action), `#>` (frame), `~` (ref), `%` (measure), `^` (integration), `!` (pragma), `*` (value), `&` (subject), and `.` (ground).
- Each carries: site_role, stable HTML selectors, runtime event mappings (SpwBus), ownership in the script_structure layers, falsifiable claims (using claim_chain), phase behavior, affordance validation, and concrete examples inside slices (especially math-practice-labs).
- This directly supports selection, ownership, validation, and UI state work for agents and editors. Wired into site.spw and conventions/index.spw. See also the active claims and contracts added in site-semantics.spw.
- **CSS/HTML architecture implications**: Strengthens the requirement that operator-driven styling (operators.css, wonder.css resonance, etc.) remain centralized and traceable from data-spw-operator attributes. New operators add concrete styling and selector contracts that future CSS refactors must respect (see updated css-architecture-readability/PLAN.md and the css-layer-order-001 claim). Encourages consistent `data-spw-operator` usage in HTML as a primary query surface.
- **Emergent cognitive+computational communication alignment pass (continued)**:
  - Deepened the `%` (measure) operator projection in operator-site-projection.spw to explicitly distinguish and integrate subjective measures (felt resonance, wonder intensity, deviation salience — captured via workbench annotations, cauldron, claim protocols) and objective measures (performance, layout, audit counters — captured via plugins/LSP). Added dedicated claims, data-spw-measure-kind support, workbench capabilities mapping, and examples.
  - Added operational_semantics sections (with the same distribution: cognitive/computational use, selectors, events, ownership, claims, validation) to ornament-contract.spw and query-disposition.spw.
  - Updated math-practice-labs slice with concrete subjective + objective % examples.
  - JS/CSS alignment: Added setMeasuredValue helper in public/js/modules/math-diagrams.js and [data-spw-measure-kind] rules in public/css/handles/operators.css. These changes were made to align the working tree with the operator and resonance contracts.
  - This continues making the entire .spw surface a coherent medium where cognitive practitioner judgment and computational instrumentation can communicate and compose. Architecture (script_structure, ui_resonance, operator projections) now has tighter cohesion with actual runtime and styling implementations.

**Recent addition (experiential + spell/cauldron discoverability):**
- Deeper updates to `public/js/runtime/experiential.js` generalized tap/hold/swipe (pointer + device detection), added reusable GESTURE_SVGS + render helpers as visual topical anchors, device-aware educational lead text, and learning-science notes for students vs. uncurious visitors.
- Added inline SVGs and data-spw-interaction / semantic-expression attributes in design/palettes (spell-cauldron), settings (presets/modes/notes), and blog (gardening/design threads) as visual + semantic anchors.
- Improves "reasons to engage" on elements (spell, cauldron, modes, notes) so visitors of any curiosity level have immediate value, while preserving progressive enhancement and Spw brace/semantic patterns.
- Recorded here as it directly improves the editor/learner operating environment (discoverability of interaction semantics and learning progressions). See related broad UX plan notes and the culinary-expertise plan for overlapping social-kitchen grammar work.

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
- ~50+ active backlog plans create signal-to-noise risk; no lightweight status markers (canonical/active/dormant) usable by tools or the public page.
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
