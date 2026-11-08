# Plan: screenshot-semantics

**Status 2026-11-06.** Landed: the named viewport-still recipes (de06af3c), with the nightly and wander walks since (9f3aae2a, 73f200f2); the 2026-08-31 crop seed (aba9c1e4); and stills for the sitting's three looks, `services-opening`, `settings-presets` and `play-opening` (a3d9164b, 2026-10-30), which answer to `--ids` and `npm run sense -- ink` and sit with the wanders, so the nightly month is unchanged. Capture mode (`data-spw-capture-mode`) gives clean-capture visibility and pauses SVG flows (`public/css/modes/capture.css`) and texture crops (`public/css/effects/texture-slice.css`). Nothing in the plan's paths has changed since. Next, ungated: slice 1 below, so that a still carries the page's own Spw line. The frame still (slice 2) waits on the creator's answer to `index.spw#wonder_screenshot_semantics_journey`: should a still show how the visit got here, and should that persist across sessions? `software-frame-probe` (`scripts/lib/viewport-still-recipes.mjs:1010`, from 4771b685) is already a frame-addressed pocket still of `/topics/software/`, and slice 2 extends it or says how it differs.

A face keeps its name in the light, read from lore.land's PLAN.C and PLAN.E on 2026-11-08 ([lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw)). A still worth keeping names what it shows in the markup a reader gets with scripts off. Capture mode already pauses motion (`public/css/modes/capture.css`). A link that sets a visit, and is saved only when someone keeps it, is that book's form of a journey. This site's hashes are the local floor. The story stays in the markup a still can read. Slice 1 stays next. Slice 2 stays gated on `wonder_screenshot_semantics_journey`.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.still_places, calls.journey, rules.motion.

**Related:** [visual-capture-ecology](../archive/visual-capture-ecology/PLAN.md) · [rpg-asset-capture-frames](../archive/rpg-asset-capture-frames/PLAN.md) (archived).

Extend selection and priming semantics so screenshots capture meaningful cognitive states — turning the site into a useful capture tool for artists who value the visual record of a developing idea.

## Goal

The desired end state is a site where a screenshot at any moment captures something worth keeping: current address, liminality phase, operator grammar engaged, and the journey fragment that led here. This requires selection and priming semantics that survive without runtime context — visual markers legible in a still image, not just in an interactive session. The artist use case drives this: someone who screenshots a good idea, marks a moment of developed thinking, or collects a token from an interesting journey through a cognitive surface. A well-primed screenshot should communicate what kind of surface this is, what is being examined, and how deeply the visit has gone. The taste note is **legible capture + journey memory**: every meaningful state should be screenshot-worthy, and the screenshot should be able to suggest how the state was reached.

## Scope

- **In scope**: priming semantics (how pre-selection attention is visualized without hover), selection state visual persistence (what carries meaning in a still image), journey token design (what a captured state communicates about its path), data attributes and CSS that carry state legibly without JavaScript, screenshottable state taxonomy, visual markers for liminality, selection, and operator engagement, and the QA capture process that distinguishes a device-frame still from a tall region anatomy clip.
- **Out of scope**: screenshot automation as a public product, social sharing infrastructure, server-side rendering, persistent screenshot storage, or URL-encoded state reconstruction beyond what simple hashes already support. Ad-hoc `/tmp` capture scripts are not a capture track.

## Files

Landed tooling: `scripts/lib/visual-capture-plan.mjs` (a viewport still versus a region anatomy clip, the `--stills` track), `scripts/lib/viewport-still-recipes.mjs` (named device-frame subjects) and `scripts/component-snapshots.mjs` (prepare, the blank/target retry, a shared `screenshotBuffer`). The slices below say which of `.spw/conventions/site-semantics.spw`, `public/js/semantic/component-semantics.js` and the route pages (`/`, `/topics/software/`, `/topics/software/spw/`) each one touches.

Craft guard:
- Priming and selection state must be readable in a static screenshot without JavaScript, hover, or focus context.
- Every screenshottable state must be reachable through keyboard, touch, and pointer equally.
- Journey tokens should be sparse and semantically rich — earned marks, not labels on every element.
- Visual markers for address and liminality should use existing operator color tokens, not new arbitrary colors.
- Nothing added for screenshot legibility should clutter the calm default state.
- Each scroll position may offer a visually composed viewport, but viewport position is atmospheric evidence, not semantic address.
- Explicit address, selection, focus, and authored attentional weight must remain more salient than automatic scroll passage.
- A capture must remain attractive after transient motion is frozen; screenshot value cannot depend on catching an animation peak.

## Slices

Commit 1 landed with the plan itself (64f264e0). The old commits 2 to 5 (taxonomy, CSS persistence, runtime attributes, verification) become these slices:

1. **A still carries its Spw line (proposal, ungated).** `scripts/component-snapshots.mjs` already records `componentExpression`, but only the target's own `data-spw-semantic-expression`, so it is null whenever the target carries none: 2 of the 8 values in the local run manifests since October (`design/components/captures/runs/`, gitignored). The satchel already has the fallback. `readPageLine()` in `public/js/interface/state-inspector.js` takes the expression nearest the middle of the screen (902738b4), and the capture would read the same line when the target has none. Every still then says where it is in the language the site teaches, without a mark on the page. Whether the line should also reach the creator's own screenshots is `index.spw#wonder_screenshot_semantics_still_line`. Tooling only: no page change and no new attribute. Verify: `npm run visual:capture -- --stills --ids software-frame-probe --viewports pocket`, after which the manifest entry holds a line such as `software[field]{orient}<register>`.
2. **One frame still (gated).** One screenshottable state on `/topics/software/`, with a named still id, extending `software-frame-probe`. It waits on `index.spw#wonder_screenshot_semantics_journey`, because the state it captures either includes the path or does not.
3. **Taxonomy (old commit 2).** `.spw/conventions/site-semantics.spw` gains the screenshottable states that slices 1 and 2 actually used, and no more. It follows slice 2.
4. **Persistence without JavaScript (old commits 3 and 4).** Selection and liminality stay visible in CSS, and `component-semantics.js` writes priming and address into the attributes that already exist. No new `data-spw-*` family; this plan is a presentation criterion. It follows slice 2's answer.
5. **Verification (old commit 5).** The demo sequence under "Validation", as named stills. It closes the plan.

Capture loop (the `fuzz:*` scripts never existed):
- Explore: `npm run visual:explore`
- Recapture misses: `npm run visual:stabilize`
- One state: `npm run visual:capture -- --stills --ids <still> --viewports pocket`
- Every still gate in other plans runs with `data-spw-capture-mode="screenshot"` (`scripts/component-snapshots.mjs:575`, `:979`), so floating chrome, the section handle and the state inspector are hidden (`public/css/modes/capture.css:7-35`) and animated SVG flows are paused (`:40`). A still is one frame, so timing and motion are judged live or from a recording (the sitting's `rules.motion`).

## Dependencies

- `mobile-runtime-foundation` — priming semantics must be mobile-first and coarse-pointer aware; selection and address state lives in shared registers.
- `css-progressive-ornaments` — screenshot-safe visual state lives in the enhancement and component layers, not in ornaments.
- `cognitive-navigation` — liminality position and breadcrumb trail are prime screenshot content; both plans share vocabulary.

## Failure Modes

- **Hard**: priming state only exists as hover or JavaScript class — every screenshot shows the ambient default with no record of what was being addressed.
- **Hard**: selection state is visually indistinguishable from focus state, so screenshots cannot tell the difference between passing through and deliberate examination.
- **Soft**: journey token markers add visual noise to the default state instead of emerging quietly under attention.
- **Non-negotiable**: all visual markers for screenshot state must be accessible, reduced-motion safe, and legible without color as the only channel.

## Active refinement — 2026-09-04 pocket density

Niche hook stills (`town-opening`, `research-opening`, `membership-opening`, `svg-storytelling-opening`, `about-opening`) are now named recipes. The keepers are the diagrams and pressed lenses. The miss is cloned extras: do not ship lens + spec + climate rail + SVG + landmarks as one pocket subject on the next hubs.

Owned with `component-region-personality` wave 5: one extra dense object per first frame; route families disagree about which. Recapture with `npm run visual:capture -- --stills --ids <opening> --viewports pocket`.

## Validation

- **Hypotheses**: persistent data attributes and CSS-driven selection states will make screenshots legible without runtime context; priming states will be achievable through all input modes; journey tokens will feel like earned marks rather than tracking labels.
- **Negative controls**: calm default state remains undisturbed; no new JavaScript required for basic state legibility.
- **Demo sequence**: navigate to a named frame via keyboard, screenshot; address an operator card via touch, screenshot; reach a nested liminality state on the software page, screenshot — compare all three for information density and legibility without explanatory text.

## Spw Artifact

`.agents/plans/screenshot-semantics/screenshot-semantics.spw`

## Landed 2026-08-31 — crop seed follows the visit key

Texture-slice hashes `data-spw-image-key` before seed/id, so the same still (crane on craft and the Midjourney bench) keeps one crop in a screenshot. Authored `data-spw-texture-slice` stays on the host; resolved family lives on `data-spw-slice-family`. Capture still freezes crop motion.
