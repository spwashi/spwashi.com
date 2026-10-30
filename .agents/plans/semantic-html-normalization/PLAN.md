# Plan: semantic-html-normalization

**Status 2026-10-30.** The landmark sweep holds: all 209 route pages carry `<main>` and the skip link (the last five, four labs under `/design/experiments/` and `/topics/knowledge-bases/markdown/`, landed 2026-10-30). Two scripts-off sensors landed since 09-27: `audit:page-structure` names buttons only a script answers (8d1ed950, 768c5c09), and `component-snapshots.mjs` takes scripts-off stills (73f200f2). Next slice: the JS-on/off landmark, heading and link diff below. It reports only until its counts are read once in a browser on the demo routes. The code-block controls took `--touch-target-min` on 2026-10-30 (Access, below). The access report comes after the diff.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.scripts_off_diff, ungated.code_block_controls, access.

**Related:** [gesture-aria-hygiene](../archive/gesture-aria-hygiene/FIX.md) (archived) · [page-region-discoverability](../archive/page-region-discoverability/PLAN.md).

Normalize the site's HTML semantics so landmarks, ids, and ARIA relationships are more consistent, while reducing how much semantic bookkeeping has to be hand-authored inline.

## Goal

The desired end state is a site where the static HTML carries a clearer, more consistent semantic skeleton across as many routes as practical: predictable `main` targets, skip links, stronger section labeling, and less ad hoc page-to-page drift. The runtime should then reinforce that structure by inferring the repetitive metadata and filling in missing relationships instead of requiring every page to hand-author the same semantic boilerplate. Taste note: improve clarity, layering, and a11y while keeping the site's genre-rich semantics readable rather than over-instrumented.

## Scope

- **In scope**: normalize top-level landmarks and skip-target structure across route HTML files; add or derive ids and ARIA labels/relationships for repeated page regions; trim reliance on hand-authored semantic bookkeeping where the runtime can infer it; and simplify nearby CSS/JS that duplicates semantic state groupings or region-normalization behavior.
- **Out of scope**: redesign route copy, rewrite every semantic data attribute out of the site, change major visual layout patterns, or touch unrelated local drift unless it directly intersects the normalization pass.

## Craft guard

Route HTML changes stay mostly mechanical: landmarks, ids, skip targets, and accessible names. `public/js/semantic/page-metadata.js` is already concept-dense and should absorb inference/normalization logic instead of spreading another semantics helper across the runtime; `public/js/interface/semantic-chrome.js` consumes what it derives. Any CSS simplification should remove duplicated semantic-state rules, not introduce a new styling vocabulary.

## Dependencies

none

## Failure Modes

- **Hard**: skip links or landmark ids are added inconsistently, producing broken internal targets or duplicate ids.
- **Soft**: the runtime still depends on verbose authored metadata because the inference layer does not cover the repeated cases cleanly.
- **Non-negotiable**: route content remains readable without JS, primary landmarks stay keyboard-accessible, and existing visual/state behaviors do not regress while semantics are normalized.

## Validation

- **Hypotheses**: most routes should converge on the same top-level semantic skeleton; repeated section frames should expose clearer accessible names; and the runtime should be able to infer more metadata with less HTML boilerplate.
- **Negative controls**: page copy, route order, and existing interactive settings/image behaviors should remain functionally unchanged.
- **Demo sequence**: open representative pages from `/`, `/about/website/`, `/settings/`, `/topics/math/`, `/topics/software/parsers/`, and `/topics/software/spw/operators/ref/`; verify skip-link behavior, `main` targeting, section labeling, and semantic metadata overlays still make sense.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.

## Active Refinement - 2026-06-19 Conversation Audit

This plan now owns the "html normalization audit" thread from the current conversation. The task is not a full content rewrite; it is a route-skeleton and alignment pass that should make HTML more predictable for CSS, runtime modules, accessibility, and `.spw` inspection.

Redistributed tasks:

- Verify every high-traffic route has one stable `main` target, one clear skip-link destination, and section ids that match visible headings or route purpose.
- Align repeated card/frame HTML with the shared component anatomy: header, meta, body, figure, actions, footer.
- Prefer existing `data-spw-*` families on meaningful clusters over new wrappers or one-off attributes.
- Check that interactive controls using `aria-pressed`, `aria-expanded`, `aria-controls`, or `data-set-mode` have a matching HTML target and a CSS state owner.
- Replace legacy file/path assumptions in this plan as files are touched; current code lives in layered `public/css/**` and `public/js/**` modules, not the older monolithic `spw-*` names.

Validation additions:

- `rg -n "href=\"#main-content\"|id=\"main-content\"|aria-controls|data-set-mode" **/index.html`
- Targeted duplicate-id checks on edited routes.
- Spot-check that normalized HTML still renders without JavaScript before relying on runtime inference.

## JS-off parity — 2026-09-27

Progressive enhancement is doctrine in five places and owned by none: `AGENTS.md` (JS only when HTML and CSS cannot carry the behavior), `.spw/conventions/stylesheet-ecology.spw#progressive_enhancement` (the CSS delivery side), `.spw/caches/living-terms-2026-09.spw` with `npm run audit:living-terms` (a highlighted word must keep its promise with scripts off), `dimensional-expression-navigation` (the dimensional path is ordinary links), and `spw-operator-pages` craft guard 3. This plan owns the HTML side of that rule from today, because the static skeleton is what remains when scripts are off.

Facts: three routes carry a `<noscript>` block, one on home. The module catalog mounts 146 ids (4 core, 92 enhancement, 49 feature, 1 region; recounted 2026-10-25, 136 on 09-27), eight immediate. The runtime writes 115 custom properties and many `data-spw-*` states, and no sensor compares a JS-off render against a JS-on one. `audit:living-terms` is the only parity probe, and it covers one mechanic.

Next slice, narrowed 2026-10-10. Controls already have a sensor: `audit:page-structure` names buttons a page offers with scripts off that nothing answers (8d1ed950, 768c5c09; it skips buttons inside a `<form>`), `audit:living-terms` covers living terms, and `component-snapshots.mjs` takes scripts-off stills (73f200f2). What no sensor does yet: load a route with scripts disabled and again enabled, and diff landmarks, headings, and link and form counts. The scripts-off switch is `applyScriptExecution` in `scripts/component-snapshots.mjs:423` (`Emulation.setScriptExecutionDisabled`); `chrome-headless-harness.mjs` has none. Report per route; do not gate `check:local` on it until the counts are read once in a browser on the demo routes: `/`, `/about/website/`, `/settings/`, `/topics/math/`, `/topics/software/parsers/`, `/topics/software/spw/operators/ref/`.

## Access — 2026-10-25

The [review sitting](../../../.spw/caches/ui-review-sitting-2026-10.spw)'s `^"access"` frame holds gaps no plan owns. This plan takes them as proposed owner.

- Contrast and targets: no sensor checks WCAG AA contrast or the 44px ground-control target. The dark operator colors in 0206fb41 were checked by hand. One report from computed styles: text contrast per route at pocket, light and dark, and coarse-pointer hit boxes under 44px outside `[data-spw-floating-chrome]`.
- Code-block controls: landed 2026-10-30. Edit and Copy on Spw code blocks are content controls, so on coarse pointers they take `--touch-target-min` in both axes (`public/css/components/spw-source.css`), not `--touch-target-compact`; fine pointers keep `2rem`.
- Script-only buttons: 223 on 24 pages (`/design/` 40, `/services/care/` 28, `/settings/` 21). Each needs a scripts-off reading that does not promise an action.
- Math labs: the inputs answer nothing with scripts off. The lab review belongs to [modular-experience-slices](../modular-experience-slices/PLAN.md).
- Skip links: the five gaps closed 2026-10-30.
