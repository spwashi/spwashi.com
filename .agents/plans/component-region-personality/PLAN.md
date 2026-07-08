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

| Task | Action |
|------|--------|
| Agent instruction leak | Remove `Operational entry: select a conceptual route...` from home hero; relocate to agent-anatomy block on `about/website/` or technical copy-depth layer |
| Duplicates | Merge services hook + `site-lede`; merge topics hook + first `frame-note` |
| Tour-guide cluster | Rewrite home tuning links — vary verbs (open, trace, compare) instead of Explore / Learn how / Dive into |
| Perspective-pair | Replace seven inline `Objective terminal` / `Subjective terminal` labels with `perspective-pair` partial or glossary link; specimen stays on `design/components/` |
| Consultant-deck | Rename `Strategic Landscape` kicker; shorten services evidence mantra in public tier |

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