# Plan: Site Copy, Component Diversity, Conceptual Depth, Screenshot Value, and Settings UX/Architecture (June 2026)

## Public Goal
Freshen and deepen site copy for June while improving component variety, conceptual clarity, topical discoverability (especially curriculum, operators, measurement, priming), the value of screenshots for different page regions, and the settings surface as the primary control + learning layer for the site's operational semantics, developmental climate, and new contracts.

This continues the "living learning surface" direction: the site should feel more alive, more useful for active engagement (priming, measuring, studying), and more inspectable/coherent for both humans and agents.

## Scope
**In scope (smallest honest surfaces first):**
- Copy freshening on high-traffic entry points (home, Town Library, curriculum, about, settings) for June voice, priming UX value, and ties to recent operational semantics (operators as handles, subjective/objective measures, curriculum as active practice).
- Component diversity: vary usage of frames/panels/cards, living-terms, operator chips, tuning widgets, semantic expressions without new wrappers or bloat.
- Conceptual depth & discoverability: strengthen links, explanations, and data-spw-* attributes that surface curriculum, operator projections, measurement contract, priming gestures.
- Screenshot value: ensure varied regions (hero, gate ways, labs, artifacts, settings panels) have strong hierarchy, contrast, and semantic labels so screenshots remain useful teaching/ portfolio artifacts.
- Settings UX & architecture: better organization of climate/presets vs. new operational features; clearer progressive disclosure; new lightweight controls or readouts for measure kinds, operator projections, priming state where they add real value without complexity.

**Out of scope:**
- Large new features or routes.
- New npm packages.
- Reordering CSS layers or major refactors (use existing patterns).
- Full rewrite of any page.

## Files Likely To Change (prioritized by smallest surface)
- Route HTML: index.html (home), curriculum/index.html, play/rpg-wednesday/library/index.html, about/index.html, settings/index.html.
- Shared CSS (if needed for component variety or screenshot contrast): public/css/handles/operators.css, components/frames.css, settings-related, effects.
- Minimal progressive JS only if HTML/CSS cannot carry (e.g. better status readout in settings for active measures).
- .spw updates only if new reusable semantic family or attribute contract is introduced (e.g. data-spw-measure-kind visibility in settings, priming state exposure).
- This PLAN.md and cross-refs in agent-optimization if relevant.

## Approach
1. Smallest honest patches: one paragraph or component cluster at a time.
2. Tie copy to real recent contracts (operator-site-projection, measurement-contract, operational-semantics) so it feels alive rather than marketing.
3. Component variety by re-using existing families in new combinations on the same pages.
4. Screenshot value by ensuring regions have clear visual "punch" and machine-readable labels.
5. Settings as the control surface for the new operational layer (climate + operators + measures + priming).

## Success Criteria (updated)
- Copy feels current for June and actively primes the improved priming/measurement/operator experience.
- Readers can discover curriculum, specific operators, and subjective/objective measures more easily from multiple entry points.
- Screenshots of different regions (home lenses, library map, curriculum modules, settings panels, lab statuses) remain high-value without heavy post-processing.
- Settings page feels more organized and progressively reveals the full power of the site's contracts without overwhelm. New "Operational visibility" section added as architecture improvement.
- Component variety increased through existing families in fresh combinations (chip clusters inside panels, living-term notes, direct curriculum priming prompts).
- All changes pass git diff --check, targeted rg for anchors/attrs, and manual visual sanity on key breakpoints.

## Commits (example shape)
- `#[copy] — June freshness + priming UX on home, library, curriculum`
- `.[components] — component variety pass on entry surfaces`
- `.[settings] — settings UX and architecture refinements`
- `&[docs] — plan + .spw cross-refs for the new operational layer visibility`

## Validation
- `git diff --check`
- `rg` for new/updated data-spw-*, links to /curriculum/, operator chips, measure references
- Manual review of varied screenshot regions
- Settings page walkthrough for UX friction
- No new dependencies or layer reordering

This work directly supports the site's evolution into a more useful, alive, inspectable living medium.