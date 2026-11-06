# Plan: semantic-html-normalization

**Status 2026-11-06.** The landmark sweep holds: every tracked route `index.html` (210, October's folio drop page among them) carries `<main>` and the skip link, since 51ac0714 closed the last five on 2026-10-30. Scripts-off sensors since 09-27: `audit:page-structure` names buttons only a script answers (8d1ed950, 768c5c09), and `component-snapshots.mjs` takes scripts-off stills (73f200f2). The code-block controls took `--touch-target-min` (42e4ce0a). Next slice: H1, the JS-on/off landmark, heading and link diff, which reports only until its counts are read once in a browser on the demo routes. H2, the access report, comes after it. How the 223 script-only buttons read with scripts off is a call per family (`wonder_semantic_html_normalization_script_only_buttons`).

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

## Failure Modes

- **Hard**: skip links or landmark ids are added inconsistently, producing broken internal targets or duplicate ids.
- **Soft**: the runtime still depends on verbose authored metadata because the inference layer does not cover the repeated cases cleanly.
- **Non-negotiable**: route content remains readable without JS, primary landmarks stay keyboard-accessible, and existing visual/state behaviors do not regress while semantics are normalized.

## Landed

- **The April sweep** (2026-04-16, wip): skip links and `main#main-content` across the public routes, each main labeled from its visible heading; `page-metadata.js` derives region heading ids, `aria-labelledby` links and `role="group"` for anonymous panels; repeated role-family selectors moved onto `data-spw-role-cluster`.
- **The last five** (51ac0714): four labs under `/design/experiments/` and `/topics/knowledge-bases/markdown/`.
- **References resolve** (probe 2026-11-06): across the 210 pages, every `aria-controls`, `aria-labelledby` and `aria-describedby` names an id on its own page, and no id repeats outside an escaped code sample. The 06-19 audit's "a matching HTML target" check retires on that; its "CSS state owner" half has no sensor and no reported miss.

## JS-off parity — 2026-09-27

Progressive enhancement is doctrine in five places and owned by none: `AGENTS.md` (JS only when HTML and CSS cannot carry the behavior), `.spw/conventions/stylesheet-ecology.spw#progressive_enhancement` (the CSS delivery side), `.spw/caches/living-terms-2026-09.spw` with `npm run audit:living-terms` (a highlighted word must keep its promise with scripts off), `dimensional-expression-navigation` (archived; the dimensional path is ordinary links), and `spw-operator-pages` craft guard 3 (archived). This plan owns the HTML side of that rule, because the static skeleton is what remains when scripts are off.

Facts: three routes carry a `<noscript>` block, one on home. The module catalog mounts 146 ids (4 core, 92 enhancement, 49 feature, 1 region; recounted 2026-10-25, 136 on 09-27), eight immediate. The runtime writes 115 custom properties and many `data-spw-*` states, and no sensor compares a JS-off render against a JS-on one.

**H1. The scripts-off diff.** Load each demo route with scripts disabled and again enabled, and report landmarks, headings, and link and form counts side by side. Touches `scripts/component-snapshots.mjs`, whose `applyScriptExecution` already flips `Emulation.setScriptExecutionDisabled` (the headless harness has no such switch), or a small script beside it that reuses it. Demo routes: `/`, `/about/website/`, `/settings/`, `/topics/math/`, `/topics/software/parsers/`, `/topics/software/spw/operators/ref/`. Gate: a headless browser the sandbox allows (`npm run sense -- doctor`); it joins `check:local` only after its counts are read once in a browser. Proposed output, so a row reads at a glance and teaches the difference as Spw: one line per route whose scene turns, `about.website[skeleton]{landmarks.headings.links}(off)` beside `(on)`, with a count only where the two differ.

## Access — 2026-10-25

The [review sitting](../../../.spw/caches/ui-review-sitting-2026-10.spw)'s `^"access"` frame holds gaps no plan owns. This plan takes them as proposed owner.

- **H2. Contrast and targets.** No sensor checks WCAG AA contrast or the 44px ground-control target; the dark operator colors in 0206fb41 were checked by hand. One report from computed styles: text contrast per route at pocket, light and dark, and coarse-pointer hit boxes under 44px outside `[data-spw-floating-chrome]`. Same browser gate as H1, after it.
- **Code-block controls:** landed (42e4ce0a). Edit and Copy on Spw code blocks take `--touch-target-min` in both axes on coarse pointers (`public/css/components/spw-source.css`); fine pointers keep `2rem`.
- **Script-only buttons:** 223 on 25 pages on 2026-11-06 (`/design/` 40, `/services/care/` 28, `/settings/` 21, `/tools/spw-parser/` 15). Each needs a scripts-off reading that does not promise an action. Settings chips already show switched off with a note (the creator's call); the other families wait on the wonder.
- **Math labs:** the inputs answer nothing with scripts off. The lab review belongs to [modular-experience-slices](../modular-experience-slices/PLAN.md).

## Validation

- **Hypotheses**: most routes converge on the same top-level semantic skeleton; repeated section frames expose clearer accessible names; and the runtime infers more metadata with less HTML boilerplate.
- **Negative controls**: page copy, route order, and existing interactive settings/image behaviors remain functionally unchanged.
- **Demo sequence**: the H1 routes; verify skip-link behavior, `main` targeting, section labeling, and semantic metadata overlays.
- `npm run audit:page-structure` (0 unbalanced, 0 heading-skip, 0 section-id on 2026-11-06), targeted duplicate-id checks on edited routes, and a scripts-off read before relying on runtime inference.
