# Component Region Personality

**Status 2026-10-25.** Waves 0–2 have landed: copy-unit ids, and `npm run audit:copy:accessor` (c0fa1767). The one next slice is the Wave 3 cards: `spw-visual-link-card` on the services and recipes heroes, in HTML only; the card CSS already ships (`public/css/components/content.css:1259`). Topics has 6 of these cards (`topics/index.html:258-322`); services and recipes have none. Which two or three children get a card is the creator's call in a browser review, live at pocket beside `/topics/`. The three new `data-spw-*` attributes Waves 3–4 proposed are struck. The plan still holds the anatomy vocabulary from webpage-trope-vocabulary.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — hubs.hero_children, seams.entrance_copy.

**Entrances:** this plan owns the entrance hubs' real estate, their cards and chips. The words belong to [semantic-copy-depth](../semantic-copy-depth/PLAN.md).

**Related:** [webpage-trope-vocabulary](../archive/webpage-trope-vocabulary/PLAN.md) (archived).

## Public Goal

Develop meaningful component real estate and region personality across spwashi.com so public copy relates to a growing component ecology — not repeated meta-documentation. Editing-team surfaces should stay inspiration-ready for a media launch; screenshots should remain interpretable by humans and models; copy should be named for later translation.

## Primary Contract

`.spw/conventions/component-region-personality.spw`

## Scope

| Layer | Work |
|-------|------|
| `.spw` | Referentiality tiers, vocabulary register, linking contour, edit waves |
| Route HTML | Hub voice surgery, copy collectibles, contour redistribution |
| Partials | `perspective-pair`, `agent-anatomy`, `leaf-neighbor-rail`, visual-link-card promotion |
| Settings / runtime | ~~Label posture (`named` → `familiar` → `silent`)~~ struck 2026-10-10 with its attribute (Wave 4) |
| Build / catalog | Copy-unit manifest from `extract-site-copy.mjs`; design catalog cross-ref |
| Plans | Bridges to `semantic-copy-depth`, `copy-localization` |

## Out of Scope (for now)

- Full locale rollout (`/es/...`)
- Client-side translation runtime
- Renaming every `data-spw-feature` in the tree (audit first, rename in wave 4)
- Runtime `data-spw-region-personality`, `data-spw-region-voice`, `data-spw-region-gravity-axis`. Those duplicate kind/role/harmony/context/seats. This plan owns copy referentiality, not a new physics family.

## Constraints

- Essential meaning stays in visible HTML (semantic-copy-depth rule).
- Creator-first identity preserved (`I'm Spwashi. I build software and make art.`).
- Agent instructions only in `data-spw-referentiality="agent"` or `technical` anatomy.
- No new npm packages without plan note and review.

## Edit Waves

### Wave 0 — Document and wire (this plan)

- Publish `component-region-personality.spw`
- Wire into `.spw/site.spw`, `.spw/conventions/index.spw`, plans index

### Wave 1 — De-mechanize public voice

**Files:** `index.html`, `services/index.html`, `topics/index.html`, `about/index.html`, `design/index.html`, `design/components/index.html`, load-symphony experiment copies

| Task | Action | Status |
|------|--------|--------|
| Agent instruction leak | Remove `Operational entry` from home hero | landed earlier |
| Duplicates | Merge services hook + entry note; thin topics hook vs description | landed 2026-08-22 |
| Tour-guide cluster | Vary verbs; destiffen "Return here when" | landed on services, about, tools seats |
| Perspective-pair | Public hubs use Holds / First move; specimen keeps terminal labels at `/design/components/#perspective-pair` | landed 2026-08-22 |
| Consultant-deck | Rename `Strategic Landscape` kicker | already gone |

**Validation:** `rg 'Objective terminal' **/*.html` → only glossary/specimen routes.

### Wave 2 — Copy collectibles + templating

| Task | Action |
|------|--------|
| Copy-unit ids | Add `data-spw-copy-unit="route.surface.block"` to ledes, notes, hooks on touched hubs |
| Roles | Add `data-spw-textual-role`, `data-spw-referentiality` on collectibles |
| Extract script | Extend `scripts/extract-site-copy.mjs` to output manifest keyed by copy-unit |
| Partials | Scaffold (proposed) `_partials/perspective-pair.html`, `_partials/leaf-neighbor-rail.html` when ids stable |

### Wave 3 — Linking contour

| Task | Action |
|------|--------|
| Visual cards | Promote `spw-visual-link-card` to `topics/`, `services/`, `recipes/` heroes (2–3 major children each) |
| Chip caps | Split `frame-operators` rows >8 into card grid or collapsible route drawer |
| ~~Link contour attr~~ | ~~Introduce `data-spw-link-contour`~~. Struck 2026-10-10: no new `data-spw-*` families; map the contour onto existing stems in `.spw/site.spw` if it is needed |
| Query intent | Add tuning links on `topics/`, `play/` where posture variants help |

### Wave 4 — Leaves, familiarity, vocabulary

| Task | Action |
|------|--------|
| Leaf template | `leaf-neighbor-rail` on topic leaf routes via template partial |
| Glossary specimens | `perspective-pair`, `agent-anatomy` in `design/components/` |
| ~~Label posture~~ | ~~Settings control for `data-spw-label-posture` (named / familiar / silent)~~. Struck 2026-10-10: no new `data-spw-*` families |
| Vocabulary pass | Rotate atlas, proof card, resting point, legible per vocabulary_register |
| Region motifs | Assign the existing `data-spw-vocabulary` per hub family. `data-spw-copy-motifs` is struck (2026-10-10): no new `data-spw-*` families, and tone lives in the expression, not an attribute (7a62b2b4) |
| Component audit | Run design catalog + rg audit dimensions from `.spw` |

2026-10-25: two struck names still sit in the tree. `data-spw-copy-motifs` is written at `index.html:54` and `tools/index.html:52`, `:171`, and nothing reads it. `data-spw-label-posture` is still a capture axis at `scripts/lib/visual-capture-plan.mjs:558`. Neither is removed here.

### Wave 5 — Pocket-frame density and variety (2026-09-04 stills)

Niche hooks (Town, Research, Membership, SVG Storytelling) proved a labeled diagram and a pressed lens photograph. They also cloned the same extra stack: spec pills + climate rail + landmarks + diagram. A pocket crop then names the scaffold, not the route.

**Rule:** the first pocket still gets **one** extra dense object besides identity and the lens — a diagram, a climate rail, **or** a landmark path, not all three. Route families should disagree about which extra they keep.

| Family | First-frame extra | Do not clone |
|--------|-------------------|--------------|
| research | insight ladder diagram | climate tropes in the same crop |
| town | atlas path diagram | a second settings row competing with the lens |
| membership | role-field diagram | repeating the research tropes rail |
| craft / svg | motif kit | long lede before the kit |
| about | identity copy surviving the crop | anatomy rail stealing the lede |
| home | identity + working view | another climate rail on the opening |

**Next routes:** Play, Services, Recipes, Coordination — pick a different extra before adding SVG + rail + landmarks together. Audit `rg 'spw-ornament-rail' **/index.html` and `rg 'spw-page-landmarks' **/index.html` for cloned order.

2026-10-25 tension with Wave 3: the services hero already holds a photo (`services/index.html:135`) and its landmarks (`:161`). This rule allows one extra dense object in the first pocket frame, so picture cards there would be a second.

**Validation:** `npm run visual:capture -- --stills --ids <opening> --viewports pocket` and write one sentence naming the subject. If two reviewers name the scaffold instead of the route, drop an extra.

## Risks

| Risk | Mitigation |
|------|------------|
| Partial rollout leaves mixed voice | Wave 1 completes all hubs before leaf pass |
| Copy-unit churn blocks i18n | Freeze ids per route after wave 2 review |
| Silent label mode hurts a11y | Keep headings, landmarks, focus order; test keyboard path |
| Renaming features breaks catalog | Audit before rename; update `generate-design-catalog.mjs` |

## Validation Loop

```bash
rg 'Objective terminal' **/*.html
rg 'Operational entry' index.html
rg 'proof card' **/*.html -i
git diff --check
npm run check:local
npm run catalog   # after copy-unit + component catalog updates
```

## Related Plans

- `semantic-copy-depth/` — copy-depth ladder and display rules
- `chrome-navigation-wonder/` — navigation contour
- `modular-experience-slices/` — durable slice ownership for partials
- `archive/relational-attention-media/` (archived) — capture seeds (reframe away from proof-card tone)
- `screenshot-semantics/` — pocket still recipes and the one-extra-per-frame density rule