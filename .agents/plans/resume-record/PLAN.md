# Resume Record

## Public Goal

The site is the résumé. A few walkable records (years, practices) let a visitor handle that fact without turning every card into a CV.

Draws from `audience-onboarding-copy` (smart busy reader, self-select a next stop) and `component-region-personality` (copy relates to a growing component ecology). Runtime kinship is `semantic-expression-consequence`: hover lights authored kin; it does not invent a second ontology.

## Non-Goals & Boundaries

- Resume-record is **not** the seed under every component. That remaining a goal is fine; forcing it is not.
- Do not compete with seed-cards, living terms, scene beds, or the cauldron. Spw may flocculate related handles (shared `data-spw-seed` / `data-spw-semantic-expression`) without merging families.
- No new `data-spw-resume` attribute. Feature cluster + existing seed, expression, and scene hosts.
- Do not publish unpublished identity (school names, district budget compares, heard-$83k as a sourced figure).
- No new parallax/pinch runtime. About should keep `pan-y pinch-zoom`, region seats, and expression resonance. Scroll depth consumes existing slot/tier/state first (page-region-discoverability).

## Seams & Minimal Touch Files

- Plan / contract: `.agents/plans/resume-record/PLAN.md`, `.spw/conventions/resume-record.spw`
- Route HTML: `about/index.html`, `tools/index.html`, `tools/spw-parser/index.html`, `tools/profile/index.html`, `tools/character-sheet/index.html`, `tools/budgeting/index.html`, `tools/midjourney/index.html`, `topics/math/combinatorics/index.html`
- Parser samples: `public/js/modules/tools/spw-literal-parser.js` (`practices`, `sync`, `film`, `year`)
- Route CSS: `public/css/routes/surfaces/about.css`, `public/css/routes/surfaces/tools-budgeting-surface.css`

## Validation Steps

1. `git diff --check`
2. `rg 'data-spw-feature="resume-record"|career\\[year\\]|practice\\[software\\]' about/index.html tools/budgeting/index.html`
3. Confirm kinship tokens share subject/mode/part with existing About expressions (`career`, `software`, `language`).
4. Year-mix radios on `/tools/budgeting/#year-mix` light a specimen via CSS `:has` (no JS). Stack fieldsets by 52rem. Tools hub practice doors may share seeds; they must not carry `data-spw-feature="resume-record"`.
