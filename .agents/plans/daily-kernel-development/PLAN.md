# Daily Kernel Development Exercise

## Public Goal

Create a repeatable "daily kernel" development exercise: a small, tunable practice loop for improving this codebase's semantic capacity, brand physics, regional experience design, and cross-discipline collaboration.

The exercise should help professional engineers, animators, illustrators, designers, musicians, writers, and patrons explore the same system without flattening their differences. Each daily kernel should be small enough to implement or review in one session, but meaningful enough to strengthen the site's long-term product and learning value.

## Why This Exists

The site is accumulating a rich language:

- Spw operators and linguistic dimensions
- CSS layers, clusters, material tokens, and regional profiles
- HTML component anatomy and data-spw contracts
- runtime attention, rhythm, cadence, and measurement
- product lines and creative marketing surfaces
- practice beds, semantic-capacity caches, and slice contracts

This richness can become either a powerful studio/university system or a source of distraction. The daily kernel exercise keeps exploration ergonomic: one focus, one audience pair, one region/component, one brand-physics variable, one validation path.

## Daily Kernel Shape

Each daily kernel should declare:

- **focus:** one operator, component, route region, CSS cluster, audience register, or product-line dimension
- **disciplines:** one primary discipline and one bridge discipline
- **region:** the site region or component pattern being studied
- **brand physics:** the stable Spwashi-designed behavior being tuned
- **intensity:** quiet, studio, performance, or festival
- **semantic operation:** cache, audit, align, prime, contract, or archive
- **output:** note, CSS trace, HTML pattern audit, data feed improvement, route-local sketch, or claim
- **validation:** one command, `rg` trace, browser smoke, or manual inspection path

## Discipline Ergonomics

### Engineers

Engineers need clear ownership, validation, and small implementation surfaces.

- Best entry: `site-semantics`, `operator-site-projection`, `dom-contracts`, CSS layer docs, runtime module definitions.
- Reward: they can make powerful changes without guessing intent.
- Risk: over-optimizing code before understanding sensory or audience value.

### Animators

Animators need timing, easing, rhythm, reduced-motion boundaries, and a reason for movement.

- Best entry: attention field, motion tokens, operator resonance, promo/wonder cadence, cauldron/spell gestures.
- Reward: motion becomes meaning rather than decoration.
- Risk: adding animation where the page needs calm or accessibility.

### Illustrators

Illustrators need substrate, composition, figure/ground, palette, edition logic, and screenshot-ready surfaces.

- Best entry: design palettes, image sidecars, grain texture, frame cards, seed/reference cards.
- Reward: visual work becomes a structured extension path instead of a pasted asset.
- Risk: local visual flourishes that do not map to route meaning or product-line proof.

### Designers

Designers need component anatomy, interaction consequence, accessibility, route flow, and visual hierarchy.

- Best entry: `/design/`, `/design/components/`, site-semantics, queryable component contracts.
- Reward: they can improve clarity while preserving brand physics.
- Risk: renaming or wrapping components without preserving inspectability.

### Musicians

Musicians need cadence, motif, loop, score, timbre, performance, and session logic.

- Best entry: promo/wonder cycle, attention rhythm, play sessions, cauldron mixing, operator voices.
- Reward: they can read the site as a performable score.
- Risk: metaphor that does not produce a concrete timing or interaction contract.

## University Architecture Metaphor

Treat the site like a small university or studio campus. The metaphor is useful only when it improves regional semantics.

- **Commons:** homepage, about, contact, current promo/wonder. Low-friction orientation and return.
- **Studios:** design, palettes, components, image surfaces. Sensory development and material exploration.
- **Labs:** math practice, runtime behavior, settings, tools. Instrumented experimentation.
- **Library:** operator atlas, plans, reviews, `.spw`, design catalog. Search, provenance, and recall.
- **Theater:** play, RPG Wednesday, promo/wonder, live demos. Performance and public narrative.
- **Workshop:** software, Spw, CSS architecture, runtime contracts. Making, repair, and tooling.
- **Garden:** practice beds, cauldrons, sedimentation notes, product lines. Growth, return, and seasonal tending.

Regional semantics should be especially well-designed in studios, labs, library, theater, and garden because those regions train senses: visual attention, rhythm, trust, comparison, memory, and creative appetite.

## Brand Physics

Brand physics are learnable behaviors designed by Spwashi and tested by Spwashi plus collaborators. They are not a style guide in the narrow sense; they are how the site behaves when a visitor learns it.

Initial brand-physics variables:

- **gravity:** what feels stable, grounded, and worth returning to
- **resonance:** what echoes when addressed
- **cadence:** how daily/weekly/monthly rhythm is expressed
- **grain:** how material texture signals care without noise
- **charge:** how attention accumulates and discharges
- **threshold:** how a visitor knows they are entering a new region
- **edition:** how an instance becomes collectible or worth sharing
- **repair:** how the system explains unavailable, quiet, or failed interactions

Each daily kernel may tune one variable. Do not tune multiple brand-physics variables in the same patch unless the exercise is explicitly an audit.

## Tunable Intensities

- **quiet:** clarify semantics without making the page more visually loud
- **studio:** make a pattern more inspectable for creative work
- **performance:** make a resonant cluster appreciable in motion, cadence, or copy
- **festival:** intentionally high-energy route-local experiment; must stay scoped and reversible

Default to `quiet` or `studio`.

Use `performance` only when the feature teaches a relation or supports public demonstration.

Use `festival` only in a route-local sketch or explicitly experimental plan.

## Implementation Path

### Phase 1 - Contract And Dispatch

- Add `.spw/conventions/daily-kernel.spw`.
- Wire it into `.spw/site.spw` and `.spw/conventions/index.spw`.
- Add this plan to `.agents/plans/README.md`.
- Cross-reference from model-guided refinement and semantic-capacity conventions.

### Phase 2 - Daily Kernel Template

- Add a reusable `daily-kernel-note.spw` template.
- Include focus, disciplines, region, brand physics, intensity, semantic operation, output, validation, and do-not-touch.

### Phase 3 - First Audits

Run three no-code audits before implementation:

- **Studio audit:** one design/palette/component surface for illustrator + designer ergonomics.
- **Lab audit:** one runtime/settings/math surface for engineer + animator ergonomics.
- **Theater audit:** one promo/wonder/play surface for musician + artist ergonomics.

Each audit should produce either an insight cache, a claim, or a route-local first patch.

### Phase 4 - First Implementation Kernel

Implement one small kernel:

- one route
- one component family
- one CSS behavior or one data feed update
- optional `.spw` note
- no JS unless a declared runtime consequence is required

## Validation

Always:

- `git diff --check`
- targeted `rg` for new stems and anchors

When implementation touches code:

- `npm run check:css` for CSS changes
- `node --check <edited-js-file>` for JS changes
- browser smoke for route-local visual changes

## Status

- [x] Plan created
- [x] `.spw/conventions/daily-kernel.spw` wired into dispatch
- [x] daily-kernel-note template added
- [ ] first no-code daily kernel audit completed
- [ ] first implementation kernel completed
