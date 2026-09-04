# Component Region Personality

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
| Settings / runtime | Label posture (`named` → `familiar` → `silent`) |
| Build / catalog | Copy-unit manifest from `extract-site-copy.mjs`; design catalog cross-ref |
| Plans | Bridges to `semantic-copy-depth`, `copy-localization`, `page-model` |

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
| Partials | Scaffold `_partials/perspective-pair.html`, `_partials/leaf-neighbor-rail.html` when ids stable |

### Wave 3 — Linking contour

| Task | Action |
|------|--------|
| Visual cards | Promote `spw-visual-link-card` to `topics/`, `services/`, `recipes/` heroes (2–3 major children each) |
| Chip caps | Split `frame-operators` rows >8 into card grid or collapsible route drawer |
| Link contour attr | Introduce `data-spw-link-contour`; align `public/js/semantic/link-copy.js` |
| Query intent | Add tuning links on `topics/`, `play/` where posture variants help |

### Wave 4 — Leaves, familiarity, vocabulary

| Task | Action |
|------|--------|
| Leaf template | `leaf-neighbor-rail` on topic leaf routes via template partial |
| Glossary specimens | `perspective-pair`, `agent-anatomy` in `design/components/` |
| Label posture | Settings control for `data-spw-label-posture` (named / familiar / silent) |
| Vocabulary pass | Rotate atlas, proof card, resting point, legible per vocabulary_register |
| Region motifs | Assign `data-spw-vocabulary` + `data-spw-copy-motifs` per hub family |
| Component audit | Run design catalog + rg audit dimensions from `.spw` |

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
- `relational-attention-media/` — capture seeds (reframe away from proof-card tone)
- `screenshot-semantics/` — pocket still recipes and the one-extra-per-frame density rule