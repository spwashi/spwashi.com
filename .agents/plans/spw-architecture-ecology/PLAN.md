# Spw Architecture Ecology

## Public Goal

Strengthen the site's `.spw` layer as an inspectable ecology: explicit topology, typed relational design, promotion protocol, ecology coordinators, owner registry, component-template surface, slimmer `site.spw`, review graduation metadata, language-ecology alignment, slice promotion, convention hygiene, and precipitated agent/editor indexes — so agents and editors can route work without reconstructing meaning from file names or re-scanning 182 plan folders.

## Primary Contract

- `.spw/conventions/spw-architecture-ecology.spw` — topology, promotion, and ownership
- `.spw/graph.spw` — typed node/edge vocabulary and live cross-document relations

## Relationship to Other Tracks

| Track | Division of labor |
|-------|-------------------|
| `spw-surface-normalization/` | File shape, dimensions, reference style — **graduates into conventions** via this plan's promotion protocol |
| `spw-architecture-ecology/` (this plan) | Layer topology, coordinators, registry, precipitates, `site.spw` hub shape |
| `.spw/graph.spw` | Directional relations, bounded relation verbs, owner references, reading streams, confluences, and claim/probe edges |
| `component-region-personality/` | Public HTML copy, referentiality, templates **in routes** |
| `agent-optimization/` | Skills, public editor surfaces, maintenance cadence |
| `agentic-dev-contracts/` | Manifests, `check`, generated state doctrine |
| `spw-metaphysical-language/` | construct-codex, drift ledger — **language-ecology owner** |

## Scope

**In scope**

- Ecology coordinator convention files (`copy`, `region-component`, `language`, `interaction`, `capture`, `agent`)
- Relational graph contract: typed nodes, bounded edge vocabulary, navigable owners, consequences, evidence, and lifecycle
- `owner-registry.spw`
- `surfaces/component-templates.spw`
- Review `promotion_status` metadata
- Precipitates: `plans-index.json`, `skills-index.json`, copy-units manifest path
- `site.spw` `translations.ecologies` hub + `@` ref pruning
- Language plan bucket alignment (`semantic_rails`)
- Slice index promotions (spellcraft, copy-collectibles, attention-resonance-field, chrome-field)
- Partial `validate-conventions.mjs` from v04 profiles
- Minimal `construct-codex.spw` shell (language wave D)

**Out of scope**

- Physical merge/move of 182 plan folders (index notes only until ref-safe pass)
- Upstream spw-workbench changes
- Client-side plan browser runtime
- Full locale rollout

## Constraints

- Hand-authored HTML/CSS/JS remain source of truth; `.spw` and `.agents/state/` project and route.
- New generated artifacts must declare invalidation (`planning-ecology.spw#agentic_cache_contract`).
- Coordinator files stay thin dispatch surfaces — no essay duplication of PLAN.md.
- Relations stay directional and consequential; avoid comma-separated dependency strings and generic `related_to` edges.
- `site.spw` hub rule: no new per-plan `@` refs after wave H without owner-registry entry.

## Edit Waves

### Foundation R — Relational design contract (landed 2026-07-12)

- Refactor `.spw/graph.spw` from prose node lists into a stable node/edge contract.
- Bound relation verbs to `owns`, `grounds`, `requires`, `projects`, `routes`, `evidences`, `tests`, and `supersedes`.
- Use Spw references, facets, sets, streams, confluences, wonder blocks, and claim/probe fields according to their distinct jobs.
- Archive the legacy `depends_on` / `enables` string model in place so rationale remains inspectable without remaining active.
- Route the contract through `.spw/site.spw`, `.spw/conventions/index.spw`, and the architecture convention.

### Wave A — Ecology coordinator shells

Create `.spw/conventions/`:

- `copy-ecology.spw`
- `region-component-ecology.spw`
- `language-ecology.spw`
- `interaction-ecology.spw`
- `capture-ecology.spw`
- `agent-ecology.spw`

Each file: `operation=align`, `fixity=tending`, `owner_plan`, `satellite_plans`, `conventions` dispatch, `conflict_rule`, `validation` rg probe.

Wire in `conventions/index.spw` (`ecologies` dispatch facet) and `planning-ecology.spw`.

### Wave B — Owner registry

- Create `.spw/conventions/owner-registry.spw`
- Seed from `operational-semantics.spw#active_contracts`, wave A coordinators, semantic_rails + fix_queue from `plans/index.spw`
- Target ≥20 entries with `probe_ref` + `falsification`

### Wave C — Precipitates

- Extend `scripts/maintain-plan-directory-indexes.mjs` → `.agents/state/plans-index.json` (buckets, owner_map, wip/fix flags)
- Add `scripts/generate-skills-index.mjs` → `.agents/state/skills-index.json`
- Document invalidation in `agent-ecology.spw`
- Optional npm script aliases under `package.json` (no new deps)

### Wave D — Language hygiene

- Promote `spw-language-v04`, `language-reclustering`, `spw-metaphysical-language`, `homonym-renaming` to `semantic_rails` in `plans/index.spw` + `.agents/plans/README.md`
- Land minimal `.spw/conventions/construct-codex.spw` (header + drift_ledger facet + operator entry stubs)
- Complete `language-ecology.spw` dispatch
- Add `scripts/validate-conventions.mjs` (header, `#>`, `operation`, `fixity` checks) — wire into `check:local` when stable

### Wave E — Component templates surface

- Create `.spw/surfaces/component-templates.spw`
- Register templates from `component-region-personality.spw`
- Cross-link `design/components/index.html` specimens (perspective-pair, agent-anatomy, leaf-neighbor-rail)
- Extend design catalog generator to list template ids when present

### Wave F — Slice promotion

Add to `.spw/slices/index.spw`:

- `spellcraft-authoring/`
- `copy-collectibles/`
- `attention-resonance-field/`
- `chrome-field/` (or name aligned with floating-chrome-stack)

Each slice: `index.spw`, owner plan ref, validation commands, tending-note path.

### Wave G — Review graduation

- Add `promotion_status`, `review_by`, optional `promoted_to` to all `.spw/reviews/*.spw`
- Extract duplicate rules from `spw-surface-normalization.spw` review into `conventions/surface-normalization-rules.spw` when ready; mark review `promoted`

### Wave H — site.spw slimness

- Add `translations.ecologies` facet pointing at coordinator conventions
- Remove redundant per-plan `@` refs now covered by coordinators + owner-registry
- Keep `planning_tracks`, `operational_layer`, `surfaces`, `integration_contract`

### Wave I — Public projection (optional)

- Generate or semi-generate `/about/plans/` bucket section from `plans-index.json`
- Until then: add architecture-ecology card to hand-maintained page pointing at convention + plan

## Consolidation Posture (index notes, not folder moves)

| Owner plan | Satellites (merged-into notes when touched) |
|------------|-----------------------------------------------|
| `semantic-copy-depth` + `component-region-personality` | `hook-region-anatomy`, `audience-onboarding-copy` via **copy-ecology** |
| `page-region-discoverability` | `hook-region-anatomy`, `webpage-trope-vocabulary` via **region-component-ecology** |
| `spw-metaphysical-language` | `language-reclustering`, `homonym-renaming`; v04 = grammar substrate |
| `spellcraft-authoring` | capture satellites via **capture-ecology** (already owner) |
| `interaction-loop-contract` | gesture, header, floating-chrome via **interaction-ecology** |

## Additional Rails (do not skip)

- `wip.spw` legacy_stream migration on touch (`wip-notebook.spw`)
- Design catalog ↔ copy-units ↔ component-templates cross-ref
- `product-lines.spw` + creative marketing dispatch for media-company offers (`capture-ecology` bridge)
- `experience-slice` vs route-local HTML boundary (`modular-experience-slices`)
- `spw-plan-maintenance` skill invocation after each wave landing

## Risks

| Risk | Mitigation |
|------|------------|
| Coordinator files become second PLAN.md dumps | Max ~60 lines each; dispatch only |
| Owner registry stale | Regenerate with plan-index maintenance script |
| site.spw prune breaks agent habits | Wave H only after registry + precipitates exist |
| construct-codex scope creep | Minimal shell in D; metaphysical plan owns expansion |
| Duplicate normalization owners | Graduate surface-normalization review per wave G |

## Validation

```bash
rg 'spw-architecture-ecology' .spw .agents/plans
test -f .spw/conventions/spw-architecture-ecology.spw
test -f .spw/graph.spw
rg 'relation = "(owns|grounds|requires|projects|routes|evidences|tests|supersedes)"' .spw/graph.spw
! rg '~#(depends_on|enables): "' .spw/graph.spw
# After wave A:
ls .spw/conventions/*-ecology.spw
# After wave C:
test -f .agents/state/plans-index.json
git diff --check
npm run check:local
```

## Related Plans

- `spw-surface-normalization/`
- `agent-optimization/`
- `agentic-dev-contracts/`
- `modular-experience-slices/`
- `spw-language-v04/`
- `spw-metaphysical-language/`
- `language-reclustering/`
- `component-region-personality/`
- `semantic-copy-depth/`
