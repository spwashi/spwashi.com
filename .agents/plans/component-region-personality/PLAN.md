# Component Region Personality

**Status 2026-11-06.** Landed: Waves 0–2, copy-unit ids and `npm run audit:copy:accessor` (`c0fa1767`). Two lines of work wait on the creator's eye. Wave 3 puts `spw-visual-link-card` on the services and recipes heroes, in HTML only: the card CSS ships (`public/css/components/content.css:1259`), topics has six (`topics/index.html:255-320`), and which two or three children get one is the creator's call at pocket beside `/topics/` (`index.spw#wonder_component_region_hero_children`). The harmony slices below start from a census of the undefined shape tokens, read in this review. The three new `data-spw-*` attributes Waves 3–4 proposed are struck. The plan still holds the anatomy vocabulary from webpage-trope-vocabulary.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — hubs.hero_children, seams.entrance_copy.

**Entrances:** this plan owns the entrance hubs' real estate, their cards and chips. The words belong to [semantic-copy-depth](../semantic-copy-depth/PLAN.md). [topic-building-blocks](../topic-building-blocks/PLAN.md) may drop the topics visual-studies row and the repeated craft square. The six topic visual cards stay, and Wave 3 is still Services and Recipes.

**Clusters:** [update-clusters-2026-11.spw](../semantic-copy-depth/update-clusters-2026-11.spw). H1 stays next. The instrument in [spw-native-components-2026-11.spw](../../../.spw/caches/spw-native-components-2026-11.spw) — mono for the sigil line, editorial for the lede, `{` and `}` easing apart on one frame — waits behind H1 and behind that file's cluster C. This plan does not restyle a chip inside a copy commit.

**Related:** [webpage-trope-vocabulary](../archive/webpage-trope-vocabulary/PLAN.md) (archived).

## Harmony across components — 2026-11-05

The creator asked for harmony across components and a visual ecology that can encourage play. The reading is in [chrome-ecology-2026-11](../../../.spw/caches/chrome-ecology-2026-11.spw#harmony):

- **A class renders by its element.** `ornament/whimsy.css:124-130` gives `:where(.spw-chip, button, input[type=button], input[type=submit])` a 5px paper corner and a colour-only transition from the last layer, so `.spw-reward-dock-trigger` (a `<button>`) takes 5px and snaps where `.spw-cauldron-chip` (an `<a>`) stays a pill, and the chip's own radius and timing never render.
- **One role, many shapes.** The floating sheet carries about eight radii (cauldron dialog 1rem, region menu .85rem, concept popover 8px, discovery notice 5px, reward dock .7rem, toast .6rem, folio view .3rem, generic `--shape-control`) while `--shape-floating` is read in 11 files; `--shape-small`, `--shape-panel` and `--shape-medium` are used and never defined; six shadow families run side by side; the discovery notice is light glass on desktop and a hard-coded dark panel on phones (`shell/chrome/adaptive.css:33-46`).
- **Three chip dialects on one screen.** Home at pocket shows rounded pills (Next room), left-ruled bed tabs (Hook, Door, Atlas, Garden) and term chips that carry a left rule, a full border and a dotted underline at once.
- **What holds.** `effects/material.css:186-191` lets route bridges, reason strips and the lens switch take the host's material: one mechanism across families, and the model for the rest.

Proposed principle, the creator's to keep or refuse (`index.spw#wonder_component_region_role_not_element`): a component takes its shape and timing from its role class, never from its HTML element; one radius and one shadow per role, from tokens; one key, taught once (the ornament contract's own words). The first ungated step, a census of the fallbacks behind the three undefined shape tokens, is read below as H1, since defining them changes every place a fallback differs. Every shape change after it ends at a browser demo; [css-cascade-stratification](../css-cascade-stratification/PLAN.md) owns the layer that lets whimsy reach elements, and [color-motion](../color-motion/PLAN.md) owns the timing.

### Harmony slices — 2026-11-06

- **H1 · Census the shape fallbacks.** Read 2026-11-06 (`wip.spw#shape_census`): 22 reads in 11 files outside the bundles. `--shape-medium` falls back to 0.85rem on all three lines. `--shape-small` falls back to 0.55rem except in `effects/debug.css:252` and `routes/surfaces/rpg-wednesday.css:298` (8px). `--shape-panel` falls back to 0.82rem in the shell chrome (`header.css:573`, four in `navigation.css`), 0.75rem in `routes/widgets/care-handle.css:127` and 1rem in `components/cauldron.css:1042`. Proposal: define small (0.55rem) and medium (0.85rem) beside the shape aliases in `public/css/tokens/core.css` (:680-685), where only the two 8px corners move, by 0.8px; leave panel to H2, because care and the cauldron would visibly change. Gate: a pocket still of `/play/rpg-wednesday/` for small and medium. Verify: `rg -c -g '!public/css/bundles/**' -e 'var\(--shape-(small|panel|medium)' public/css` still sums to 22, and the two tokens resolve.
- **H2 · One radius per floating role.** Proposal: the floating sheets in `components/floating-chrome.css` and `components/cauldron.css` read `--shape-floating` (`var(--radius-lg)`, `tokens/core.css:684`), `--shape-panel` is defined once the cauldron's 1rem and care's 0.75rem have been seen beside the chrome's 0.82rem, and the phone discovery notice (`shell/chrome/adaptive.css:33-46`) takes the host's material the way the lens switch does in `effects/material.css`. Gate: a demo at pocket and desktop for the creator's look.
- **H3 · One chip grammar.** Scope the paper corner in `ornament/whimsy.css` §4 (:124-130) by role rather than by `button`, so a chip keeps its shape on `<a>` and on `<button>`, and give `.spw-living-term` one affordance cue instead of three. Chips live in `handles/operators/sigils-and-chips.css`; the term is styled from 13 sheets, its dotted underline in `components/foundation.css` (the candidate-term rule at :1204). §4's snapping motion stays: the creator kept it. Gate: `index.spw#wonder_component_region_role_not_element`, then a demo on `/` at pocket and desktop.
- **H4 · Wave 3 cards on the creator's art.** Proposal: each card opens on one of the creator's scans whose own lettering names the child, the way `1a84b975` matched twelve pages to their scans; `public/data/image-resources.json` `concepts` only shortlists candidates. Wave 5's one-extra rule still binds the services hero (photo :135, landmarks :161). Gate: `index.spw#wonder_component_region_hero_children`.

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

### Waves 1–2 — landed

- **Wave 1, public voice.** Landed: the `Operational entry` leak removed from the home hero (`d78d4632`); the services hook merged; tour-guide verbs varied on services, about and tools; perspective-pair reads Holds / First move on public hubs, with terminal labels kept on the specimen at `/design/components/#perspective-pair`. Check: `rg -l 'Objective terminal' --glob '*.html'` returns only `design/components/index.html`.
- **Wave 2, copy collectibles.** Landed: `data-spw-copy-unit` ids and `data-spw-textual-role` (178 pages) with the accessor audit (`c0fa1767`). Still open: `scripts/extract-site-copy.mjs` has no copy-unit reader yet, and the `perspective-pair` and `leaf-neighbor-rail` partials are not in `_partials/`.

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