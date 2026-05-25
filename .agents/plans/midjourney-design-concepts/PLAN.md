# Midjourney-Inspired Focused Design Concepts Plan

## Public Goal

Use Midjourney as an inspiration and concept-sketching tool for focused UX directions, then translate the best ideas into repo-native CSS, HTML semantics, image treatments, behavior notes, and `.spw` inspection notes. The output should be design direction and interaction personality, not unfiltered generated-image decoration.

The site should keep feeling authored by Spwashi. Midjourney can help discover palettes, materials, spatial metaphors, behavior metaphors, and visual motifs, but implementation should remain deliberate, accessible, and maintainable.

## Core Principle

Midjourney output is reference material unless explicitly promoted.

```text
render inspiration -> extract design principle -> prototype in CSS/HTML -> validate on real routes -> optionally promote optimized image asset
```

Do not paste generated imagery into routes just because it looks good. Every promoted asset needs a role, alt text, sidecar metadata, optimization, and route fit.

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
- Handle refinements in `public/css/handles/operators.css`.
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

## Patch 1 - Inspiration Intake Structure

Goal: make Midjourney studies traceable before any visual implementation.

Files:

- `public/images/README.md`
- optional `public/images/renders/README.md`
- optional `.spw/conventions/image-study.spw`
- optional `.agents/plans/midjourney-design-concepts/PLAN.md` if this becomes a larger track

Changes:

- Document raw, curated, promoted, and rejected states.
- Define required sidecar fields for generated image studies.
- Add a note that studies should first attempt CSS/token translation before image promotion.
- Add a naming convention for Midjourney studies:

```text
<date>-<route-or-component>-<lane>-<short-concept>-<source-id>
```

Example:

```text
2026-05-25-home-material-paper-machinery-a1b2c3d4.png
```

Validation:

- `rg -n "Midjourney|image_study|promotion_status" public/images .spw`

## Patch 1A - Study Registry

Goal: make each study traceable as a code-reviewable entry.

Files:

- `public/images/README.md`
- optional `public/images/renders/README.md`

Changes:

- Document raw, curated, rejected, and promoted states.
- Add the naming convention and sidecar fields.

Validation:

- `rg -n "image_study|promotion_status|Midjourney" public/images .spw`

## Patch 1B - Promotion Thresholds

Goal: make asset promotion stricter and easier to reason about.

Files:

- `public/images/README.md`
- optional `.spw/conventions/image-study.spw`

Changes:

- Add the CSS-first rule.
- Add the promotion threshold and rejection checklist.

Validation:

- `rg -n "promotion|reject|token reuse" public/images/README.md .spw`

## Patch 2 - Prompt Bank

Goal: create reusable focused prompt templates tied to actual site surfaces.

Files:

- `.agents/plans/midjourney-design-concepts/prompt-bank.md`

Prompt families:

- Homepage paper machinery.
- Design route grammar atlas.
- Website route signal console.
- Settings route tactile controls.
- Topics route diagram/photo bridge.
- Operator chip material studies.
- Ornament rail and seam studies.
- Dark mode observatory studies.

Validation:

- Prompt bank contains design questions, not just vibes.
- Each prompt declares what implementation surface it could affect.

## Patch 2A - Prompt Template

Goal: define one reusable prompt structure before writing many prompts.

Files:

- `.agents/plans/midjourney-design-concepts/prompt-bank.md`

Changes:

- Keep the template compact and consistent.
- Tie each prompt to one design question and one likely implementation surface.

Validation:

- Readability check: can a reviewer understand the intent without the image?

## Patch 2B - Prompt Families

Goal: add a small set of prompt families tied to existing route surfaces.

Files:

- follow-up prompt bank file or plan note

Changes:

- Add route-specific prompt families only after the template is stable.

Validation:

- Each prompt family should map to a route or component hook.

## Patch 2.5 - Animation Study Sprint

Goal: use the temporary SuperGrok animation window to explore motion principles for Spw surfaces, operators, ornament, and route identity without committing raw animated outputs to production.

Outputs:

- animation reference clips
- timing notes
- motion vocabulary
- CSS translation candidates
- reduced-motion risks
- optional promoted video assets only after optimization and fallback planning

Rules:

- Treat animations as reference unless explicitly promoted.
- Extract motion principles before implementation.
- Prefer CSS translation for hover, focus, charge, reveal, resonance, and ornament timing.
- Any promoted animation needs a static fallback, reduced-motion behavior, route role, metadata, and optimization.

Prompt template:

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

Validation:

- Prompt bank contains animation questions, not just still-image concepts.
- Each animation study declares its likely implementation surface.

## Patch 3 - Palette Extraction

Goal: turn selected references into measured palette candidates.

Files:

- `public/css/tokens/core.css`
- `public/css/routes/surfaces/home.css`
- `public/css/routes/design-surface.css`
- `public/css/routes/website-surface.css`
- sidecars for selected studies

Changes:

- Extract 5-7 color roles from each selected reference:
  - background
  - surface
  - ink
  - line
  - primary accent
  - warm trace
  - cool shadow
- Map them to existing site tokens before creating new ones.
- Test in light and dark mode.
- Avoid direct color copying from a render if it clashes with operator semantics.

Validation:

- `npm run check:css`
- Manual browser comparison on target route.

## Patch 3A - Extract Principles

Goal: extract reusable palette and material principles from the strongest studies.

Files:

- selected `.spw` sidecars
- `public/css/tokens/core.css`

Changes:

- Record palette roles and material principles only.

Validation:

- `npm run check:css`

## Patch 3B - Route Fit Review

Goal: decide whether the extracted ideas belong in a route or stay as reference.

Files:

- selected `.spw` sidecars
- `/design/catalog/`

Changes:

- Add route/component fit and accessibility risk notes.

Validation:

- `/design/catalog/` review

## Patch 4 - Material Translation

Goal: translate Midjourney material ideas into CSS surfaces rather than image backgrounds.

Files:

- `public/css/effects/material.css`
- `public/css/components/cards.css`
- `public/css/components/surfaces.css`
- `public/css/grammar/syntax.css`

Translation examples:

- Rendered paper fiber -> subtle CSS grain or shadow, not full bitmap.
- Folded vellum edge -> border/outline/background gradient.
- Luminous seam -> local token for line and glow.
- Layered machinery -> grid/card composition, not ornamental clutter.
- Signal field -> low-opacity radial/linear gradients or canvas accent.

Validation:

- Visual comparison against selected reference.
- Reduced motion and dark mode checks.
- `npm run check:css`

## Patch 5 - Route Concept Prototype

Goal: apply one focused concept to one route as a reviewable prototype.

Recommended first route:

- `/design/` for the first prototype because it can safely expose grammar, catalog, and visual-concept experiments without forcing the whole site identity to change too early.
- `/` if testing site identity.
- `/settings/` if testing control material and timing.

Implementation surfaces:

- Route CSS file.
- Existing route HTML only if a semantic hook is missing.
- Shared CSS only if the concept becomes reusable.
- `.spw` sidecar if the concept becomes a named visual grammar.

Rules:

- Prototype one concept per patch.
- Keep before/after easy to review.
- Avoid adding new images until CSS translation is evaluated.

Validation:

- Browser check mobile and desktop.
- `npm run check`
- Design catalog check if images are promoted.

## Patch 5A - `/design/` Prototype

Goal: prototype the first concept on `/design/` only.

Files:

- `public/css/routes/design-surface.css`
- route HTML only if needed for a semantic hook

Changes:

- Prototype the grammar atlas or concept catalog direction.

Validation:

- Browser check on `/design/`

## Patch 5B - Follow-On Route

Goal: apply the proven concept to another route only after the prototype is validated.

Files:

- a second route chosen from the concept's fit

Changes:

- Translate the same concept, not a new one.

Validation:

- Browser check on the chosen route

## Patch 6 - Asset Promotion

Goal: promote only the strongest generated assets with metadata and optimization.

Use skills:

- `image-naming-magic`
- `image-optimize`

Files:

- `public/images/renders/...`
- `public/images/assets/...`
- `public/images/routes/...`
- matching `.spw` sidecars
- route HTML only after optimized asset exists

Promotion threshold:

- promote only when the asset adds meaning that CSS cannot express cleanly
- reject anything that is generic, decorative-only, or redundant with existing tokens
- prefer a route or component role over a standalone illustration when possible

Required sidecar fields:

- source
- source id
- prompt summary
- route/component role
- alt text or decorative status
- visual qualities
- extracted principles
- related images
- promotion status

Validation:

- `npm run catalog`
- `/design/catalog/` review
- `npm run check`
- file existence checks for route references

## Patch 6A - Select Candidate

Goal: choose the smallest set of assets worth promoting.

Files:

- `public/images/renders/unsorted-curation/`
- `public/images/assets/illustrations/`

Changes:

- Keep only assets that improve comprehension or atmosphere beyond CSS.

Validation:

- Rejection log is filled for rejected candidates.

## Patch 6B - Optimize And Promote

Goal: promote the chosen asset with optimized derivatives and sidecar metadata.

Files:

- `public/images/routes/...`
- matching `.spw` sidecar

Changes:

- Promote one asset path at a time.

Validation:

- `npm run catalog`
- `npm run check`

## Patch 7 - Concept Library

Goal: build a small library of reusable visual concepts from successful studies.

Possible concept names:

- paper machinery
- signal atlas
- folded rail
- operator enamel
- vellum console
- quiet observatory
- luminous seam
- grammar field

Document first:

1. paper machinery
2. signal atlas
3. folded rail

Keep as emerging until proven in route/component work:

- operator enamel
- luminous seam
- quiet observatory
- grammar field

Files:

- `.spw/conventions/visual-concepts.spw`
- `public/css/README.md`
- optional route docs or design route content

Each concept should define:

- where it belongs
- where it does not belong
- color rules
- material rules
- motion rules
- semantic hooks
- example files

Validation:

- `rg -n "paper machinery|signal atlas|folded rail|operator enamel|visual-concepts" .spw public/css public/images`

## Patch 7A - Canonical Concepts

Goal: document the concepts that are already mature enough to name.

Files:

- `.spw/conventions/visual-concepts.spw`

Changes:

- Start with paper machinery, signal atlas, and folded rail.

Validation:

- The concepts are describable in one sentence each.

## Patch 7B - Emerging Concepts

Goal: capture the ideas that are promising but not yet durable.

Files:

- `.spw/conventions/visual-concepts.spw`

Changes:

- Record operator enamel, luminous seam, quiet observatory, and grammar field as emerging only.

Validation:

- Do not promote them into tokens until they survive route/component use.

## Suggested Commit Series

1. `Document Midjourney inspiration workflow`
2. `Add focused design prompt bank`
3. `Run SuperGrok animation study sprint`
4. `Prototype design route grammar atlas concept`
5. `Extract palette candidates from visual studies`
6. `Translate material study into CSS surfaces`
7. `Promote selected generated asset with sidecar`
8. `Document reusable visual concepts`

## Combined Roadmap Position

This plan supplies steps 6-9 in the combined design-system track:

```text
6. Document Midjourney inspiration workflow
7. Add focused design prompt bank
8. Run SuperGrok animation study sprint
9. Prototype /design/ grammar atlas concept
```

The key constraint is token efficiency: inspiration should sharpen the repo-native system, not add unused visual vocabulary.

Preferred first implementation sequence:

```text
Document Midjourney inspiration workflow
Add focused design prompt bank
Run SuperGrok animation study sprint
Prototype design route grammar atlas concept
```

Midjourney remains a concept-sketching and reference tool. It should strengthen the repo-native system: tokens, semantics, CSS contracts, `.spw` conventions, and inspectable route/component boundaries.

## Validation Loop

For CSS-only concept work:

```sh
npm run check:css
git diff --check
```

For route or image integration:

```sh
npm run check
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

- Should Midjourney be used mainly for palette/material exploration or for promotable route imagery?
- Which route deserves the first focused concept study?
- Should raw Midjourney prompts live in repo docs, `.spw` sidecars, or stay outside until a candidate is promoted?
- What is the threshold for promoting an image versus translating the idea into CSS?
- Which visual concepts are already canonical enough to document: paper machinery, signal atlas, folded rail, or operator enamel?
