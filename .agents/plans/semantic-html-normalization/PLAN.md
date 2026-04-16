# Plan: semantic-html-normalization

Normalize the site's HTML semantics so landmarks, ids, and ARIA relationships are more consistent, while reducing how much semantic bookkeeping has to be hand-authored inline.

## Goal

The desired end state is a site where the static HTML carries a clearer, more consistent semantic skeleton across as many routes as practical: predictable `main` targets, skip links, stronger section labeling, and less ad hoc page-to-page drift. The runtime should then reinforce that structure by inferring the repetitive metadata and filling in missing relationships instead of requiring every page to hand-author the same semantic boilerplate. Taste note: improve clarity, layering, and a11y while keeping the site's genre-rich semantics readable rather than over-instrumented.

## Scope

- **In scope**: normalize top-level landmarks and skip-target structure across route HTML files; add or derive ids and ARIA labels/relationships for repeated page regions; trim reliance on hand-authored semantic bookkeeping where the runtime can infer it; and simplify nearby CSS/JS that duplicates semantic state groupings or region-normalization behavior.
- **Out of scope**: redesign route copy, rewrite every semantic data attribute out of the site, change major visual layout patterns, or touch unrelated local drift unless it directly intersects the normalization pass.

## Files

[NEW] .agents/plans/semantic-html-normalization/PLAN.md
[NEW] .agents/plans/semantic-html-normalization/wip.spw
[MOD] about/domains/*/index.html - normalize skip links, `main` targets, and landmark consistency for domain specimen pages
[MOD] about/website/index.html - normalize landmarks and section semantics while preserving the current design-offer pass
[MOD] newyear/index.html - add skip-target and landmark consistency
[MOD] offline/index.html - normalize the standalone fallback route semantics
[MOD] play/index.html - normalize top-level semantics for the play hub
[MOD] play/rpg-wednesday/*/index.html - normalize repeated RPG route landmarks and section ids
[MOD] recipes/fermentation/index.html - normalize top-level semantics
[MOD] recipes/mise-en-place/index.html - normalize top-level semantics
[MOD] recipes/reduction/index.html - normalize top-level semantics
[MOD] rpg/index.html - normalize top-level semantics
[MOD] services/index.html - normalize top-level semantics
[MOD] settings/index.html - normalize top-level semantics while preserving the pending settings-order/runtime copy work
[MOD] tools/*/index.html - normalize tool-route landmarks and skip-target structure
[MOD] topics/architecture/index.html - normalize topic-route semantics and labeling
[MOD] topics/craft/*/index.html - normalize craft-route semantics and labeling
[MOD] topics/math/*.html - normalize math-route semantics and labeling
[MOD] topics/pedagogy/index.html - normalize pedagogy-route semantics and labeling
[MOD] topics/site-design/index.html - normalize design-route semantics while preserving the pending resonance/offer refinements
[MOD] topics/software/*.html - normalize software-route semantics and labeling
[MOD] topics/software/spw/index.html - normalize the syntax atlas semantics
[MOD] topics/software/spw/operators/*/index.html - normalize repeated operator-page semantics and ids
[MOD] public/js/spw-page-metadata.js - derive missing landmark ids and ARIA relationships, and reduce the need for hand-authored repeated metadata
[MOD] public/js/spw-semantic-chrome.js - consume the normalized region metadata more directly if needed after the HTML/runtime cleanup
[MOD] public/css/spw-components.css - simplify repeated semantic metadata display rules to match the normalized region contract
[MOD?] public/css/spw-grammar.css - consolidate repeated role-group semantics if the HTML/runtime normalization makes the current selector duplication unnecessary

### Craft guard

This pass touches many HTML files, so the danger is churn without a tighter contract. The HTML changes should stay mostly mechanical: landmarks, ids, skip targets, and accessible names. `public/js/spw-page-metadata.js` is already concept-dense and should absorb inference/normalization logic instead of spreading another semantics helper across the runtime. Any CSS simplification should remove duplicated semantic-state rules, not introduce a new styling vocabulary.

## Commits

1. #[semantic-html-normalization] — record the plan artifacts and hygiene baseline
2. &[semantic-html-normalization] — normalize route landmarks, skip targets, and top-level page semantics across HTML families
3. &[semantic-html-normalization] — derive repeated region ids and ARIA relationships from the page-metadata runtime
4. .[semantic-html-normalization] — simplify semantic display rules and document the reduced authored contract
5. ![semantic-html-normalization] — verify markup integrity, metadata inference, and accessibility-oriented selectors

## Agentic Hygiene

- Rebase target: `main@9511b53`
- Rebase cadence: before commit 2 and before merge
- Hygiene split: the worktree already carries uncommitted follow-up edits in `about/website/index.html`, `index.html`, `settings/index.html`, `topics/math/index.html`, `topics/site-design/index.html`, `topics/software/index.html`, `public/css/settings-surface.css`, `public/css/spw-surfaces.css`, `public/js/site-settings.js`, `public/js/spw-palette-resonance.js`, and `.agents/plans/vibe-setting-widgets/wip.spw`; this pass will preserve that drift, integrate only the overlapping HTML files deliberately, and avoid unrelated settings/runtime files unless a direct semantic consolidation requires them.

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
