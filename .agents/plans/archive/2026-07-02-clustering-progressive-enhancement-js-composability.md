# Audit: Rule Clustering, Progressive Enhancement, JS Composability - 2026-07-02

Third same-day record, following the triage and the alignment/responsiveness/performance audit. Static analysis of `public/css` (124 source files) and `public/js`; nothing changed in this pass.

## CSS Rule Clustering

**Within-file clustering is a working system.** The declaration-order convention is documented in `public/css/README.md` (cluster order for new/touched blocks, explicit no-churn rule), banner headers with purpose/dependency notes are consistently present, and `check:css` enforces contracts.

**P2 - The clustering gap is across files, not within them: shared-vocabulary selector scatter.**
`.operator-chip` and `.frame-card` are each styled in 45 of 124 files; `.frame-sigil` in 26; `.mode-switch` in 12. A reader asking "what can affect an operator chip?" faces a third of the tree. The 2026-07-02 `-intent` contract is the structural fix: when route/component files specialize shared vocabulary through intent variables instead of selector rules, scatter stops growing. Recommend: (a) treat scatter count per shared selector as a tracked metric in `css-maintainability-refactor/` (`rg -l '\.operator-chip' public/css | wc -l`), (b) new route work may not add selector rules for shared handle vocabulary - variables only.

**P3 - Debug-owner marker coverage is thin: 18/124 files.**
`--spw-debug-layer-owner` was seeded into high-value blocks only. Fine as a per-touch program; not worth a sweep. Owner: `css-architecture-readability/` rubric.

## Progressive Enhancement

**The spine is genuinely strong.** `<html>` ships clean; `kernel/dom-render.js` adds `data-spw-hydration` states after boot, so with JS absent no hydration-keyed CSS fires and nothing is hidden by the hydration system. Controls are statically authored real elements (`<button class="frame-sigil" aria-pressed="...">` in markup, not JS-injected). `modes/hydration.css` uses staged containment guards (`static -> activating -> ready`) rather than opacity/display gates - boot guards cannot blank content.

**P2 - Non-default lens panels ship `hidden` in static HTML.**
Topics' lane board (and the same `data-mode-group`/`data-mode-panel` pattern elsewhere) statically hides all but the default panel. Without JS the other lanes are unreachable. Adopt an explicit contract: content inside a statically-`hidden` mode panel must be navigation/duplicative (reachable through nav or other routes), never sole-source prose. Owner: `interaction-loop-contract/` or the lens runtime's convention entry.

**P3 - `<noscript>` exists only on the homepage.** Low stakes given the static-first architecture, but route templates could inherit the same fallback note.

**Cross-reference:** `.spw/reviews/html-css-structure-audit.spw` already flags JS-applied `data-spw-*` timing as cascade friction; the hydration containment guards are the current mitigation and should be named in that review's next revision.

## Composability With JavaScript

**The buses are right.** JS composes with CSS through three clean channels: data-attribute state contracts (`aria-pressed`, `data-spw-*`) projected by shared layers; CSS custom properties (101 distinct `--*` written via `setProperty` across 33 files); and 21 distinct `spw:*` CustomEvents. Direct inline-style writes are rare and concentrated where they belong (27 of 82 sit in the `state-inspector` dev tool; everything else is single digits). `kernel/dom-contracts.js` is the topography registry the maintainability plan asked for - frozen, named selector families.

**P2 - The custom-property bus has no contract index.**
101 JS-written custom properties have no generated table mapping writer file -> property -> CSS reader files. This is the standing authoring-traceability gap (data-spw-*/variable <-> CSS cluster <-> doc). Recommend a generated artifact under `agentic-dev-contracts/` (the bucket for invalidatable generated indexes): extend `scripts/css-contracts.mjs` or add a sibling script emitting writer/reader tables for custom properties and `spw:*` events. This also gives the scatter metric from the clustering section a home.

**P3 - JS can now target intent variables.**
The `--mode-switch-*-intent` / `--operator-chip-*-intent` contracts are also a JS composition surface: runtime code that wants to re-tint a control should set intent variables, never state variables or inline colors. Worth one line in `.spw/conventions/site-semantics.spw` next time it is touched.

## Suggested Execution Order

1. Generated contract index for JS-written custom properties and `spw:*` events (unlocks traceability and the scatter metric).
2. Hidden-panel PE contract line in the lens runtime convention.
3. Scatter metric + variables-only rule recorded in `css-maintainability-refactor/`.
4. Debug-owner markers and noscript fallbacks continue per-touch.
