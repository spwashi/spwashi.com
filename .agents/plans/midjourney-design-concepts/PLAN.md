# Midjourney-Inspired Focused Design Concepts Plan

**Status 2026-11-06.** The creator's own art leads this plan (2026-11-05, below). Landed: twelve pages open on the creator's scans, each matched by its own lettering, and one systems rule keeps every scan family whole (1a84b975); the texture slices of Patches 4 and 5B (dfafb7ef); the tiers and sidecars of Patch 6; and the creator's keep/replace/cut review (b87c59f5, `.spw/caches/image-review-2026-09.spw`), which set the image rule (a wonder that belongs to its page) and took over the image work of `style-image-cohesion` (archived 2026-10-10). Next commit, ungated: Patch 1B, a pointer from `public/images/README.md` (13 lines, naming neither) to the `renders.studies` registry in `.spw/assets.spw` and the staging rules in `.spw/conventions/asset-management.spw`. After it come slices 1 and 2 (who made it, a sensor). Placements, and how a scan is treated once it is placed, wait on the creator's look. The mark waits on the creator's pick (`index.spw#wonder_midjourney_design_concepts_mark`). Patches 2.5 and 7 have no owner. Session notes and the old commit series: [HISTORY.md](./HISTORY.md).

**Related:** [visual-capture-ecology](../archive/visual-capture-ecology/PLAN.md) · [reference-assignment-template](../reference-assignment-template/PLAN.md). **Absorbed 2026-10-06:** [promptable-image-library-pass](../archive/promptable-image-library-pass/PLAN.md).

## The creator's own art, first and between pages — 2026-11-05

The creator, in three lines on 2026-11-05: links between pages should use more of their own art, not Midjourney art in random places; the images often do not feel cohesive thematically; and they want to see more of their art, more immediately, from more pages. This extends the 2026-09 image rule (a wonder that belongs to its page) rather than replacing it.

Census, 2026-11-05 (route `index.html` files, images inside `<main>`):

- 214 route pages: 138 carry no image, 38 show hand-made art anywhere (folios, pads, panels, scraps, worktable under `public/images/assets/`), and 23 open on it (Home, Now, Play, Care, Curriculum, Coordination and the folio pages among them). Where the first image is something else, it comes from `routes/` (16), `renders/` (12), `illustrations/` (6) and `home/` (5).
- 1,816 images inside links between pages: `renders/` 631 (622 of them the asset catalog, whose job is to show renders), `folios/` 411, `panels/` 177, `primes/` 150, `illustrations/` 134, `routes/` 92, `home/` 52, `worktable/` 42, `scraps/` 32.
- `public/data/image-resources.json` holds 2,555 images with a role and concepts, and nothing about who made each one. The runtime does know, though; see slice 1.
- Re-measured 2026-11-06, after 1a84b975 and with primes counted as scans: 36 of the 210 pages with a `<main>` open on hand-made art, and 136 carry no image. The rest open on `routes/` (12), `renders/` (9) and `illustrations/` (6).

Proposed slices, in order:

1. **Who made it.** The site already reads provenance, in its own words: `classifyImageSource` in `public/js/runtime/expression/image-provenance.js` marks `*` original for the six scan folders and `~` generated for `renders/`. Everything else is read from the sidecars by `npm run images:provenance` into `public/js/generated/image-provenance.js`, which currently records 29 stems, all generated, in illustrations, motifs and rpg-wednesday. The creator asked for it on 2026-09-26, as a tone of acknowledgement (`.spw/conventions/site-semantics.spw`, frame `#image_provenance`). So this slice adds no new `made` field. It makes the manifest and the sensor import that classifier, so that "original" means one thing in every tool. Gaps it closes: `scripts/image-resource-manifest.mjs` stops walking the gitignored `renders/_raw/` (578 of the 2,555 tracked entries point at files that no deploy has); the `image-provenance` catalog selector (`public/js/runtime/catalog/enhancement.js`) names five of the seven folders its rules know, leaving out `worktable/` and `scraps/`, which is latent today because no page shows only those two. `routes/` (72 files) and `home/` (38) have no sidecars, so they stay unmarked ("no record, no mark") until `index.spw#wonder_midjourney_design_concepts_whose_hand` is answered. A scanned piece's sidecar carries a `scan:` entry in its `source` block; all 237 in the six scan families do, and none of the 19 in illustrations. A scan is not always the creator's hand: the one scanned collectible (`assets/collectibles/collectible-gothic-letters-dark-sun.spw`) has `scan:` and a `maker:` line for another maker, anonymized as `< ? >`. It sits outside the ruled folders and stays unmarked, and no tool may count it as the creator's. Ungated; no new `data-spw-*`. Verify: `npm run images:provenance -- --check`, plus counts by kind with no `_raw` path left.
2. **A sensor.** Per route: whether its first image is original, and which link images are generated renders outside the asset catalog, read through `classifyImageSource`. Advisory, like `audit:copy:accessor`. Proposal for its output: one Spw line per route that changes as the art changes, for example `/topics/software/  route[opens]{original} ~ links{4 original, 1 generated}`. It prints only the headline when every opening is original, and the full list otherwise.
3. **Links carry the creator's art, matched to the destination.** A picture that links a page shows something that belongs to that page's subject, read from the registry's `concepts` against the page's own expressions; component-region-personality's Wave 3 picture cards are the first place. Each placement is the creator's pick, after the 2026-09 review's practice (a folio scan stands in whole).
4. **More pages open on the creator's art.** The first screen is [landing-visual-hierarchy](../landing-visual-hierarchy/PLAN.md)'s; this plan proposes which piece, page by page, starting with landings whose first image is a route hero or a render. Gate: the creator's look, since a first image is a sensation call. First batch landed (1a84b975): about, about/website, recipes, topics, software, math, complexity, pedagogy, site design, architecture, craft and storyboard. Statistics was held, since Honk Bazongas ties to it only by its graph paper. Services waits on the tuning seat, RPG Wednesday on whose art it is, and Design on a look at the worktable scans (wip 2026-11-05 23:55).

## What the runtime does to a scan — read 2026-11-06

A session on 2026-11-06 read the image runtime and proposed four slices, I1 to I4. Checked against the code, two hold up and become slices 5 and 6. I1 folds into slices 1 and 2 and Patch 1B. I4 projected a focused `.spw-svg-rail` node and a figure lens into `data-spw-semantic-expression`, which belongs to [state-block-projections](../state-block-projections/PLAN.md) (its scope names image metaphysics surfaces); this plan keeps no copy of it.

5. **A scan opens as itself.** `getSemanticContext` in `public/js/media/image-metaphysics.js` gives a raster host with no authored `data-spw-realization` the realization `hybrid`, and `resolveSemanticEffect` turns `hybrid` into `watercolor`. The scan 1a84b975 put on `/topics/software/` sits in a bare `figure.image-study` inside a frame that has no realization either, so it opens under the wash: `public/css/effects/metaphysical-paper.css` filters `[data-spw-image-effect="watercolor"][data-spw-medium="raster"] img` and lays a tinted `::after` over it. The other eleven need the same read. The smallest change: `resolveSemanticEffect` asks `classifyImageSource` (slice 1), so an original defaults to `clarify` and the helper strip still offers the other effects. The rule is taught once, and the 1a84b975 rule in `public/css/systems/image-interaction.css` already keys the same six folders on `src`. Beside it, a proposal: for a scan, the hold becomes a light table, raising the paper grain and the lettering with no recolouring. Gate: the creator's look at `/topics/software/` beside a study render, because this changes how their art looks. Verify: the figure's `data-spw-image-effect` reads `clarify`.
6. **One hold per host.** This is true, and wider than the session said. The catalog entries `image-metaphysics` and `image-interaction` (`public/js/runtime/catalog/enhancement.js`) both mount on `.image-study`, `.topic-photo-card` and `[data-spw-image-surface]`, and each binds its own `pointerdown` hold. One fires at 480 ms (`HOLD_DURATION_MS`, ending in `markVisited`); the other fires at 420 ms (`GESTURE_MEASURE.holdMs`, ending in `inspecting`). `syncHost` also writes `data-spw-image-surface="true"` on every host it manages, so a later `collectFigures` in `image-interaction.js` can bind `.spw-svg-figure`, `.domain-visual` and `.spw-scaffold` hosts as well. Ungated: a probe that counts, per page, the hosts carrying both `data-spw-image-managed` and `data-spw-image-interaction-bound`. Merging the timers changes when inspecting and visited arrive, so it ends at a proposal and a demo for the creator's look. Splitting `image-metaphysics.js` into organs belongs to [runtime-plane-consolidation](../runtime-plane-consolidation/PLAN.md) ("Absorbed 2026-10-10 — runtime-module-decomposition").

**Spells on tape, scans that move (proposal).** The creator is weighing spells handwritten on washi tape and folded into origami or pop-up work, then scanned; Grok Imagine animating those scans; and Midjourney reading the materials into a more imaginative frame (wip 2026-11-06 11:30). Each piece arrives by this plan's intake rule: one image, a sidecar, a registry entry and one placement. The cauldron side belongs to [spellcraft-authoring](../spellcraft-authoring/PLAN.md) ("Operators, not verbs; magic, not cooking"). Two things this plan can offer. First, Patch 2.5 gains a real subject: an animated scan is a clip of the creator's own hand, and the still scan is its static and reduced-motion fallback. Second, the registry has to say what a Midjourney reading of a scan is (`index.spw#wonder_midjourney_design_concepts_reading_of_a_scan`).

## Public Goal

Use Midjourney as an inspiration and concept-sketching tool for focused UX directions, then translate the best ideas into repo-native CSS, HTML semantics, image treatments, behavior notes, and `.spw` inspection notes. The output should be design direction and interaction personality, not unfiltered generated-image decoration.

The site should keep feeling authored by Spwashi. Midjourney can help discover palettes, materials, spatial metaphors, behavior metaphors, and visual motifs, but implementation should remain deliberate, accessible, and maintainable.

## Core Principle

Midjourney output is reference material unless explicitly promoted.

```text
render inspiration -> extract design principle -> prototype in CSS/HTML -> validate on real routes -> optionally promote optimized image asset
```

Do not paste generated imagery into routes just because it looks good. Every promoted asset needs a role, alt text, sidecar metadata, optimization, and route fit.

**Staging (2026-09-04):** `scripts/slice-render-primitives.mjs` grid-crops a `--tile` render and writes wash / edge / icon / nucleus WebPs plus a `.spw` sidecar. Sidecars name `theme_set`, `theme_pack_candidate`, `component_genre_candidate`, `trope`, `icon_candidate`, `replace_later`. Approximate tropes on `/design/materials/#staged-theme-sets` are allowed because stills interpret; they are not a shortcut into core CSS or a live theme pack. Two judged sets: `vellum-hex` (ritual-vellum, frame-card) and `algorithm-lattice` (oxide-ledger, software-card). A still of the 64px icons is the wonder: which climate?

Generated imagery should be translated into CSS, tokens, layout, or ornament before asset promotion is considered.

## UX Development Rule

A concept study should answer a UX question before it asks to become an asset.

Useful UX questions:

- What should the visitor feel is possible here?
- Which action should feel tactile, quiet, charged, inspectable, or ceremonial?
- Which route or component personality is being clarified?
- What behavior would this concept change: hover, focus, reveal, collect, compare, navigate, or settle?
- What can be expressed in CSS, HTML structure, or copy before considering an image?

## Reference Assignment Rule

Reference assignments should be useful for an intern or junior collaborator.

- Start with a small reference set: 2-5 routes, components, screenshots, prompt studies, image references, or animation clips.
- Assign one improvement or experiment, not a whole visual direction.
- Tie the assignment to a visible component behavior and the HTML structure that owns it.
- Prefer `/design/` and shared components as experiment surfaces before changing flagship routes.
- Record the result as keep, revise, discard, or promote.

## Current Reference Seeds

### Woven Signal Stack

Reference type: color and material seed.

Visual principles:

- stacked paper and mineral panels
- warm cream foreground against deep teal structure
- rusted copper accents as grounded artifacts
- thin amber signal line across dense material
- flowing ochre/russet fiber as directional attention

UX translation candidates:

- `/design/` palette study for inspectable material hierarchy
- card surface experiment using paper, deep-surface, and signal roles
- operator-chip or mode-switch focus treatment using the amber line as a restraint
- ornament experiment where fiber motion becomes a subtle resonance trail instead of a large animation

Promotion decision:

- Keep as reference for now.
- Translate into CSS roles and component experiments before considering any image asset.
- Reject direct hero usage unless a route later needs this exact material stack as content, not atmosphere.

### Folded Amber Register

Reference type: color, material, and state-marker seed.

Visual principles:

- overlapping handmade paper as inspectable layers
- teal mass as structure rather than decoration
- amber transparency as an active pane or warm affordance
- copper pins and small squares as selected, pinned, or collected state markers
- oxide-red depth as history, memory, or lower-register emphasis

UX translation candidates:

- `/design/components/` card specimen for selected/pinned state
- settings control experiment for active panes and calm reading surfaces
- component token study for `paper-lit`, `register-teal`, `amber-pane`, and `pin-copper`
- ornament restraint study where the warm glow is localized to state markers

Promotion decision:

- Keep as reference for now.
- Prefer component-local CSS experiments before shared palette aliases.
- Reject broad orange or rust backgrounds; the reference works because warmth appears in small markers and translucent planes.

### RPG Wednesday Veil Table

Reference type: route personality, color, and tabletop focus seed.

Visual principles:

- teal-green atmosphere as a story field
- map paper and handwritten traces as readable artifacts
- warm cube or lantern core as the active shared focus
- floating cyan globes as optional hints, memories, or guide marks
- dim collaborative figures as presence without portrait dependence

UX translation candidates:

- `/play/rpg-wednesday/` route-personality experiment
- capture-frame or session-card palette test
- central focus treatment for current turn, current map, or current prompt
- fine-line annotation style for route traces and session metadata

Promotion decision:

- Keep as reference for now.
- Prefer route-local CSS and component experiments before image promotion.
- Reject direct background use if it weakens map, note, or action readability.

### Rice Paper Vellum Fold

Reference type: material and foreground-surface seed.

Visual principles:

- translucent cream paper as a foreground card material
- fibrous edges as tactile boundaries
- warm fold lines as state and depth cues
- cool ground plane as contrast restraint
- curled edge as reveal without large motion

UX translation candidates:

- `/design/components/` card material specimen
- `.frame-card` reveal or focus surface experiment
- reduced-motion-safe depth cue using border, shadow, and internal glow
- material token study for `vellum-surface`, `fiber-edge`, and `fold-shadow`

Promotion decision:

- Keep as reference for now.
- Translate into CSS material behavior before considering image use.
- Reject broad texture overlays if they make text or slot anatomy harder to read.

### Garden Bed Atlas and Cauldron Marks — session 2026-09-17

Reference type: cauldron concreteness seed. Source: `public/images/renders/_raw/2026-09-17-session-5/` (32 renders, eight prompts; the zip is not a published asset).

What the session holds:

- **Open atlas, candlelit desk, teal lattice trees growing from the pages** — the memory garden as a picture: what you hold grows out of the page. Promoted 2026-09-17 as `assets/illustrations/garden-bed-atlas` (1680×720 master; hero 1024 wide) with a sidecar, and placed once, on Home `#living-concepts`, as the supporting figure beside the tap/hold/mix key.
- **Nine emblematic marks on cream paper** — seedling, skillet, arched door, diamond lattice, compass star, open hand, plank door, candle, star. Read as a glyph set for the cauldron phases (seedling gather · candle prime · skillet compose · star extend) and for collected kinds. Kept as reference: extract as inline SVG marks for the phase rail before any raster is promoted.
- **Layered translucent world-glass planes in teal** — paper-substrate atmosphere; overlaps `papergami`. Reference only.
- **Faint teal lattice on warm cream paper** — a tileable ground; candidate for a `data-spw-biome` texture, reference only.
- **Dragon's egg glowing in straw, candlelit alcove** — a candidate face for the streak-pet anchor (`/about/plans/#production-seeds`); reference until the pet has an owner and a card.
- **Pie tipping off a windowsill** — Wonder About Pi(e) series seed; reference for the folio series bed.
- **Bonk City at dusk; boonberry bramble with a line of ants** — lore.land pantry; reference for the RPG Wednesday and lore.land routes.

Design question answered: the cauldron felt abstract on first entry because nothing on screen showed what it was for. The picture says it in one look (held things grow out of the page), and the copy now says it in one sentence (press and hold a highlighted word to drop it in).

Promotion decision:

- `garden-bed-atlas`: promoted, one placement, supporting prominence, alt text names the mechanism.
- Marks: reference, then SVG. Everything else: reference.

Next prompts (for the creator, who has Midjourney). The cauldron prompt is superseded as a next step: on 2026-11-06 the creator moved the cauldron to magic, not cooking, retired its gather, prime, compose and cast verbs (c672468e), and named washi-tape spells as its material (spellcraft-authoring, "Operators, not verbs; magic, not cooking"). It stays here as a record.

```text
Focused visual study for spwashi.com footer cauldron panel.
Design question: what does a cauldron look like when it holds words instead of soup?
Visual lane: material and operator.
Mood: warm, exact, handmade, slightly comic, calm.
Palette: warm cream paper, deep teal, copper, one amber ember; no purple.
Material: cast iron and paper; the ingredients are small paper slips with single marks on them.
Light cue: ember from below, table light from the side.
Composition: one skillet-cauldron centered on a paper ground, three slips half-sunk in it, one slip rising as steam that becomes a sprout; generous margin.
Motifs: skillet, seedling, candle, star, brace.
Spell or cauldron: gather → prime → compose → extend.
Grounding point: _partials/site-footer.html #memory-garden-cauldron; interface/cauldron/*.
Avoid: legible text, logos, fake UI, cauldron-witch clichés, purple-white gradients, photoreal people.
Output goal: one supporting illustration for the panel, and SVG-able marks.
```

```text
Focused visual study for spwashi.com streak pet anchor.
Design question: what small creature grows from a group's return rather than from points?
Visual lane: route-specific art direction (RPG Wednesday, lore.land).
Mood: tender, dressed-up, a little absurd, durable.
Palette: warm cream, deep teal, copper scales, one amber glow.
Material: papier-mâché and cloth; a costume that can change.
Light cue: candle in an alcove.
Composition: one egg-sized creature on straw wearing one removable outfit piece; room around it for a second outfit.
Motifs: egg, straw, hat, seam.
Spell or cauldron: return → dress → keep.
Grounding point: /about/plans/#production-seeds; a seed-card template.
Avoid: mascots from existing games, legible text, logos, photoreal people.
Output goal: a customizable anchor the group can name and dress.
```

## Literate Output Rule

- A promoted concept needs a named principle, not just a prompt.
- Use the same name in the prompt bank, CSS token, route note, and `.spw` sidecar when the concept becomes durable.
- If a concept affects behavior, document the behavior word beside the visual principle.
- Keep rejection notes specific enough that a later pass does not repeat discarded directions.

## Token Efficiency

- Treat each study as a candidate for a small number of reusable tokens or concepts, not a reason to invent a new visual language.
- Extract only what can plausibly be reused across routes or components.
- Prefer CSS tokens, gradients, spacing, and structural motifs before image promotion.
- Do not create a new named concept unless it can survive on at least two surfaces or in one durable `.spw` contract.
- If a reference is useful only once, keep it as inspiration rather than naming a new token family.

## Navigability Contract

- Use prompt names, study names, and sidecar stems that mirror the semantic concept under study.
- Keep image filenames, `.spw` sidecars, and route references aligned so a coding model can follow the trail without cross-referencing multiple aliases.
- Prefer route/component nouns over art-direction adjectives in durable filenames.
- If a study becomes a reusable concept, give it one name and reuse that same name in CSS tokens, `.spw`, and documentation.
- Avoid introducing multiple names for the same visual idea unless the codebase already needs that distinction.

## Existing Repo Context

Relevant folders:

- `public/images/renders/_raw/`
- `public/images/renders/_raw-2x2/`
- `public/images/renders/unsorted-curation/`
- `public/images/renders/2026-03-10-favicon-study/`
- `public/images/renders/papergami/`
- `public/images/assets/illustrations/`
- `public/images/assets/motifs/`
- `public/images/routes/home/`
- `public/images/routes/design/`

Relevant docs and sidecars:

- `public/images/README.md`
- existing `.spw` sidecars under `public/images/assets/**`
- existing Midjourney source metadata in render sidecars
- `/design/catalog/` for review of public images and sidecars

Relevant skills:

- `image-naming-magic` for naming, alt text, and semantic placement.
- `image-optimize` for tracked responsive variants.
- `spw-craft-quality` for translating visual direction into CSS/HTML quality.
- `spw-semantics-rigor` when a visual motif becomes a reusable semantic contract.

## Success Criteria

- Each Midjourney study answers one design question.
- Each promoted study answers a UX or behavior question before an asset question.
- Extracted ideas become CSS tokens, layout motifs, route art direction, or sidecar metadata before becoming assets.
- Promoted images have optimized derivatives, descriptive alt text, and `.spw` sidecars.
- No route becomes visually dependent on a raw generated image.
- Concepts map back to existing Spw semantics: operator, brace, frame, substrate, ornament, attention field, or route family.
- The design catalog can explain why each promoted visual exists.
- Concept notes are literate enough that the next component session can implement the CSS/HTML behavior without reopening the image reference.

## Out Of Scope

- Do not use Midjourney as a replacement for site design decisions.
- Do not add raw Midjourney images directly into route HTML.
- Do not create generic AI-art hero images without a route-specific semantic role.
- Do not imitate living artists or commercial brand styles.
- Do not use Midjourney output as evidence for accessibility, usability, or layout correctness.
- Do not add new runtime dependencies.
- Do not bypass image optimization or sidecar metadata.

## Concept Lanes

Use focused lanes so prompts produce useful comparative references.

### Lane 0 - Behavior And Personality

Design questions:

- What should Spwashi interactions feel like before any image appears?
- Which behaviors should be crisp, quiet, tactile, charged, inspectable, or ceremonial?
- How should route identity appear through repeated interaction rather than static art direction?
- What motion reference helps explain an operator chip, mode switch, reveal, or ornament response?

Possible outputs:

- Behavior notes for `color-motion/PLAN.md`.
- Timing and reduced-motion notes for operator chips and controls.
- Route personality notes for `/design/`, `/settings/`, and homepage surfaces.
- CSS translation candidates before asset promotion.

### Lane 1 - Palette And Atmosphere

Design questions:

- What should the default light palette feel like beyond "paper plus teal"?
- How warm should route surfaces be before they feel muddy?
- Which accent families distinguish craft, software, art, play, and settings?
- How should dark mode feel: observatory, console, vellum, or night studio?

Possible outputs:

- Token notes for `public/css/tokens/core.css`.
- Route-local palette direction for `home.css`, `website-surface.css`, or `design-surface.css`.
- Theme-pack inspiration for existing theme packs.

### Lane 2 - Material And Surface

Design questions:

- What is the difference between glass, matte, paper, bioplastic, field, and signal?
- How should cards lift without looking generic?
- What should a "semantic surface" look like when active, resonant, or settled?
- What can fiber, handmade paper, folded vellum, thread, seams, and pins teach a component about readable depth?

Possible outputs:

- Material token tuning in `public/css/effects/material.css`.
- Card surface refinements in `public/css/components/cards.css`.
- Better local tokens for shadow, edge, grain, and backdrop.
- Component-session notes for `fiber-paper-surface-study`.

### Lane 2.5 - Culinary Engineering And Theatre Light

Design questions:

- Which cooking methods can become component methods: mise en place, reduction, emulsion, proofing, service, or leftovers?
- How can lighting make behavior readable: invite, reveal, settle, warn, or resonate?
- What should a component look like when it is staged, not decorated?
- How much shadow can a route hold before the HTML structure becomes harder to read?

Possible outputs:

- Reference assignments for `culinary-component-engineering`.
- Lighting behavior notes for `theatre-lighting-behavior`.
- Route-local experiments on `/design/`, `/design/components/`, `/design/palettes/`, or `/play/rpg-wednesday/`.
- CSS translation candidates for active edge, side light, focus object, and reduced-motion blackout.

### Lane 3 - Operator And Grammar Visuals

Design questions:

- How can operator chips feel tactile without becoming buttons from a UI kit?
- How should objective/subjective braces look as a visual grammar?
- What visual distinction should frame, object, probe, ref, action, stream, and surface carry?

Possible outputs:

- Operator color distinction notes for `public/css/tokens/core.css`.
- Handle refinements in `public/css/handles/operators/`.
- Brace/grammar refinements in `public/css/grammar/syntax.css`.
- `.spw` notes if grammar visuals become canonical.

### Lane 4 - Ornament And Attention Field

Design questions:

- What kind of ornament belongs to the site: rails, seams, ribbons, halos, topographic lines, paper folds?
- How visible should resonance and wonder memory be?
- Which ornament forms should remain rare?

Possible outputs:

- Ornament tuning in `public/css/ornament/ornament.css`.
- Canvas accent direction in `public/css/ornament/canvas-accents.css`.
- Attention-field documentation updates.

### Lane 5 - Route-Specific Art Direction

Design questions:

- What should `/` communicate visually in one glance?
- What should `/design/` show that `/website/` does not?
- What visual world belongs to recipes, play, RPG Wednesday, or topics?

Possible outputs:

- Route image briefs.
- Route-local CSS tokens.
- Candidate promoted assets under `public/images/routes/<route>/`.
- Sidecars and design catalog review.

## Prompting Protocol

Every Midjourney prompt should specify:

- Route or component target.
- Design question.
- Visual lane.
- Palette constraints.
- Material constraints.
- Composition constraints.
- What to avoid.
- Whether text/logos/UI screenshots are excluded.

## Sensory-Literate Prompt Axes

Use these axes when a reference should be dense enough for learners to skim, wonder, and reuse:

- `subject`: the object or surface under study, such as card, chip, route, table, rail, figure, or prompt tray.
- `material behavior`: what the surface does, such as fold, bloom, simmer, reveal, settle, warn, collect, or ground.
- `light cue`: side light, table light, footlight, backlight, blackout, ember, or diagnostic glow.
- `spell`: the small replayable move a user could repeat, restore, cast, or compare.
- `cauldron`: the ingredient set before it becomes a prompt, asset, token, or component rule.
- `grounding point`: the route, component, state, or HTML owner where the metaphor becomes usable.
- `guardrail`: the thing the reference must not break, such as readability, operator distinction, reduced motion, or semantic HTML.

Metaphor may be lyrical, but it should still land somewhere inspectable. If a prompt cannot name its owner, it remains inspiration rather than a production direction.

Template:

```text
Focused visual study for spwashi.com [route/component].
Design question: [specific question].
Visual lane: [palette/material/operator/ornament/route].
Mood: [3-5 adjectives].
Palette: [existing token colors or restrained direction].
Material: [paper/glass/matte/bioplastic/field/signal].
Light cue: [side light/table light/footlight/backlight/blackout/ember/diagnostic glow].
Composition: [layout metaphor, density, scale].
Motifs: [brace, frame, operator chip, rail, seam, atlas, fold].
Spell or cauldron: [replayable move or ingredient set].
Grounding point: [route/component/state/HTML owner].
Avoid: generic SaaS UI, legible text, logos, fake screenshots, purple-white default gradients, photoreal people.
Output goal: inspiration reference for CSS/design tokens, not final UI.
```

Example:

```text
Focused visual study for spwashi.com homepage hero.
Design question: how can a personal software-and-art site feel like paper machinery without looking steampunk?
Visual lane: material and ornament.
Mood: calm, tactile, exact, luminous, handmade.
Palette: warm paper, deep teal, amber trace, muted ink, no saturated purple.
Material: matte vellum, translucent edge seams, subtle fiber grain.
Composition: layered cards, folded rails, small operator-like marks, generous negative space.
Motifs: frame, brace, seam, atlas, signal field.
Avoid: generic SaaS dashboard, readable text, logos, human portraits, neon cyberpunk.
Output goal: CSS material references and route art direction.
```

## Curation Protocol

For each batch, capture:

- Prompt text.
- Midjourney job id or source identifier.
- Date.
- Chosen candidates.
- Rejected candidates and why.
- Extracted palette notes.
- Extracted material notes.
- Extracted composition notes.
- Possible route/component target.
- Whether it should remain inspiration or become an asset.
- Whether the study yields a reusable token, a route concept, or only an image reference.

Suggested sidecar fields:

```spw
image_study = .{
  source: "Midjourney"
  source_id: "..."
  prompt_summary: "..."
  route_target: "/design/"
  design_lane: "material"
  visual_qualities: "tactile, folded, luminous, precise"
  extracted_principles: [
    "Use edge seams as structural grammar",
    "Keep amber as trace, not fill",
    "Make paper grain visible only in large surfaces"
  ]
  promotion_status: "inspiration-only"
}
```

## Design Extraction Checklist

For each selected reference, extract:

- palette role
- material principle
- spatial/composition principle
- semantic motif
- CSS translation candidate
- route/component fit
- accessibility risk
- promotion decision
- token reuse likelihood
- whether an existing route/component hook can express the idea

## Rejection Reasons

- too generic SaaS
- too illustration-led
- too image-dependent
- weak Spw semantic fit
- poor route fit
- accessibility risk
- not worth asset promotion
- better translated into CSS
- too narrow to justify a new token

## Asset Promotion Rules

Only promote a generated image when:

- It has a clear route or component role.
- It improves comprehension or atmosphere beyond what CSS can do.
- It has a descriptive filename.
- It has alt text or an explicit decorative role.
- It has optimized derivatives.
- It has a `.spw` sidecar.
- It appears in `/design/catalog/` without orphan issues.
- It does not duplicate a concept already expressible by existing tokens.

Promotion path:

```text
raw render -> curation folder -> named candidate -> optimized derivatives -> route/assets folder -> sidecar -> route integration -> design catalog review
```

Use:

- `public/images/renders/_raw/` for unreviewed source exports.
- `public/images/renders/unsorted-curation/` for candidates under review.
- `public/images/assets/illustrations/` for reusable illustration assets.
- `public/images/assets/motifs/` for small motif assets.
- `public/images/routes/<route>/` for route-specific images.

## Patches

Landed, each with its evidence (the file lists went with them):

- **Patch 4, material translation** (dfafb7ef, 2026-08-31): four motif tiles became the opt-in `data-spw-texture-slice` overlay rather than full-bleed backgrounds (HISTORY.md, "Landed 2026-08-31"). The translations it worked by still hold. Paper fiber becomes a quiet CSS grain or shadow, and a folded vellum edge becomes a border, outline or gradient. A luminous seam becomes a local line-and-glow token, layered machinery becomes grid and card composition, and a signal field becomes low-opacity gradients or a canvas accent.
- **Patch 5B, follow-on route:** the same slices carried to home, about, RPG Wednesday and lore.land (the Status at 335f6924).
- **Patch 6/6A/6B, asset promotion:** tiers and sidecars, one asset path at a time, with the rejection log in `.spw/caches/image-review-2026-09.spw` (b87c59f5). Its threshold now lives in "Asset Promotion Rules", and its sidecar fields in "Curation Protocol", both above.

Patch 5/5A, a first concept prototyped on `/design/` alone, is partial. `/design/materials/#staged-theme-sets` shows the staged sets, and no grammar-atlas prototype exists. No slice is named until a study asks for one.

### Patch 1 — intake and the README pointer

Patches 1 and 1A asked for the same thing twice: the raw, curated, rejected and promoted states, a naming convention, and sidecar fields. Most of it now exists outside the README. The registry is `renders.studies` in `.spw/assets.spw`, and staging is the `staging` block of `.spw/conventions/asset-management.spw`, which also names the gitignored `00.unsorted/` and `renders/_raw/` sources. The sidecar fields are in "Curation Protocol". A Midjourney study is named `<date>-<route-or-component>-<lane>-<short-concept>-<source-id>`, as in `2026-05-25-home-material-paper-machinery-a1b2c3d4.png`.

**Patch 1B, the next commit (ungated).** It touches `public/images/README.md` only, adding a short pointer to the registry, the staging rules, the 2026-09 review log and the CSS-first rule with its threshold ("Asset Promotion Rules"). It also adds one line naming `npm run images:provenance` as where original and generated are recorded. Verify: `rg -n "renders.studies|asset-management|image-review-2026-09" public/images/README.md` finds all three.

### Patch 2 — prompt bank (partial)

The seeds live in `.spw/caches/prompt-seeds-2026-09.spw` (a9fa3ca7); `prompt-bank.md` was never started, and the seeds cache took its place. 2A's one template is "Sensory-Literate Prompt Axes" above. Each prompt states a design question and the surface it could change, so that a reviewer understands it without the image. Families still unwritten: homepage paper machinery, the design route's grammar atlas, the website route's signal console, the settings route's tactile controls, the topics route's diagram/photo bridge, operator chip materials, ornament rails and seams, and dark-mode observatory studies. Proposal: since 2026-11-05, write a family only for a page that has no hand-made piece to carry it.

### Patch 2.5 — animation study (no owner)

Not started. It was written for a temporary SuperGrok window, and the creator's 2026-11-06 material path gives it a subject: Grok Imagine animating a scan ("Spells on tape, scans that move", above). Its rules still stand. An animation is reference unless it is promoted. Motion principles come out before implementation, and CSS carries the timing of hover, focus, charge, reveal, resonance and ornament. A promoted clip needs a static fallback, reduced-motion behaviour, a page role, metadata and optimization.

```text
Focused motion study for spwashi.com [route/component].
Design question: [specific motion question].
Motion lane: [surface/operator/ornament/route].
Behavior: [hover/focus/charge/reveal/resonance/ambient].
Timing: [ack/control/surface/reveal/ambient/ritual].
Easing: [mechanical/precise/paper/orbit].
Avoid: generic app microinteraction, noisy looping, motion that hides state, motion without a static fallback.
Output goal: motion reference for CSS timing and reduced-motion planning, not final production animation.
```

### Patch 3 — palette extraction (partial)

Take five to seven colour roles from each selected reference: background, surface, ink, line, primary accent, warm trace and cool shadow. Map them to existing tokens in `public/css/tokens/core.css` before creating any new one, test them in light and dark, and never copy a colour that clashes with operator semantics. 3A records only palette roles and material principles in the sidecar, and 3B decides at `/design/catalog/` whether the result belongs to a route or stays reference. Verify: `npm run check:css`, plus a browser comparison on the target route. Proposal: the first extraction reads one of the creator's scans rather than a render. 1a84b975 dropped the sampled `data-spw-accent-colors` on three of the twelve pages so that the runtime samples the new piece, which puts the palette of the creator's own paper one read away.

### Patch 7 — concept library (no owner)

Not started, and `.spw/conventions/visual-concepts.spw` does not exist. Document first: paper machinery, signal atlas and folded rail. Keep these as emerging until a route or component uses them: operator enamel, luminous seam, quiet observatory and grammar field. Vellum console was also named. Each concept says where it belongs and where it does not; gives its colour, material and motion rules, its semantic hooks and an example file; and fits in one sentence before it becomes a token. Verify: `rg -n "paper machinery|signal atlas|folded rail" .spw public/css` (empty on 2026-11-06).

## Position

The key constraint is token efficiency: inspiration should sharpen the repo-native system, not add unused visual vocabulary.

Midjourney remains a concept-sketching and reference tool. It should strengthen the repo-native system: tokens, semantics, CSS contracts, `.spw` conventions, and inspectable route/component boundaries.

## Validation Loop

For CSS-only concept work:

```sh
npm run check:css
git diff --check
```

For route or image integration:

```sh
npm run check:local
npm run catalog
git diff --check
```

For promoted assets:

```sh
rg -n "/public/images/|public/images/" **/index.html public/css
find public/images -name "*.spw" | sort
```

Manual review:

- Target route at mobile and desktop widths.
- `/design/catalog/` for image references and sidecars.
- Light, dark, and reduced-motion modes when the concept affects CSS.

## Review Questions Before Implementation

- Palette and material exploration, or promotable route imagery? Settled by the creator: their own art leads, and a Midjourney render goes only where it belongs to its page (the 2026-09 review, b87c59f5; 2026-11-05, above).
- Where do raw prompts live? In `.spw/caches/prompt-seeds-2026-09.spw`, loadable by name (a9fa3ca7).
- When does an image get promoted rather than translated into CSS? See "Asset Promotion Rules".
- Still open: which route deserves the first focused concept study (Patch 5A), and which concepts are canonical enough to document (Patch 7)?
