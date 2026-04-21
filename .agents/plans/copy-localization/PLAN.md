# Plan: copy-localization

Design a localization architecture for `spwashi.com` that preserves hand-authored routes, keeps English source legible, and prepares the site for Spw-authored translation work rather than flattening copy into generic string tables.

## Goal

The desired end state is a site that can publish multiple language variants without losing the authored quality of the current HTML routes or the inspectability of the site's semantic model. English remains the canonical editorial source for now, but the architecture should make room for other locale editions and for Spw to participate in translation as an authored projection layer: not only "string replacement," but deliberate restatement of tone, operator vocabulary, and conceptual framing. The taste note is **authored source + inspectable projection**: copy should stay readable in the route source, locale variants should be explicit and reviewable, and translation should be able to carry Spw-specific nuance rather than being trapped in a generic i18n substrate.

## Scope

- **In scope**: locale-aware route strategy; canonical source-locale rules; how copy units are identified; where translation payloads live; how the template/build/sitemap system should evolve; `lang`, `hreflang`, and canonical rules; how Spw-authored translation notes and copy variants should be modeled; rollout order for adding the first non-English locale.
- **Out of scope**: machine translation in production, runtime locale switching, browser-language negotiation redirects, CMS integration, user-contributed translations, or translating the entire site in one pass.

## Files

[NEW] .agents/plans/copy-localization/PLAN.md
[NEW] .spw/conventions/copy-localization.spw
[MOD] .spw/conventions/index.spw — expose copy-localization as a first-class site convention
[MOD?] .spw/site.spw — reference localization as part of the site translation bridge
[MOD?] scripts/template.mjs — support locale-scoped copy includes or translation projection hooks
[MOD?] scripts/build.mjs — emit locale variants and preserve a source-vs-derived distinction in the build
[MOD?] scripts/generate-sitemap.mjs — emit per-locale canonicals and alternate-language links
[MOD?] _partials/head-meta.html — locale-aware canonical, `lang`, and `hreflang` metadata
[MOD?] route `index.html` files — shift selected copy into locale-addressable authored units without flattening page structure
[NEW?] source locale copy surfaces under a dedicated top-level like `content/` or `locales/`
[NEW?] `.agents/plans/copy-localization/localization-architecture.spw` — only if implementation grows beyond the convention note

Craft guard:
- Route HTML must remain the primary authored page structure; localization should not force pages into opaque data blobs.
- English is the current source locale, but the architecture must not hard-code English assumptions into identifiers or file naming beyond an explicit source-locale declaration.
- Translation units should be larger than isolated UI atoms when tone, rhythm, or conceptual flow matters; paragraph- or section-level authorship is preferable to over-fragmented key/value churn.
- Spw-specific terms, operator language, and brace vocabulary need room for locale-specific glosses, not just one frozen literal translation.
- Locale expansion should be additive and reviewable; a missing translation should fail loudly in authoring or build checks rather than silently falling back in production for whole pages.
- SEO metadata must describe the actual published locale relationships, not synthetic alternates that do not yet exist.

## Recommended Architecture

1. **Canonical source model**
   English (`en`) remains the editorial source locale until a future plan explicitly changes it. Each translatable copy unit gets a stable semantic id based on page + cluster + role, not on the English string itself.

2. **Route model**
   Keep the current route tree as the source-locale surface during phase 1. Publish non-source locales under locale-prefixed routes such as `/es/...`. This avoids breaking existing canonical URLs while letting alternates be explicit.

3. **Copy-unit model**
   Treat translation units as authored blocks, not just atomized labels. Good unit shapes are:
   - metadata fields
   - nav/footer labels
   - section kickers/headings
   - paragraph blocks
   - CTA/link labels when wording changes intent
   Avoid splitting prose into sentence fragments unless the UI genuinely recombines them.

4. **Storage model**
   Use file-backed locale sources that are inspectable in git and can be authored in Spw-adjacent form. Preferred direction:
   - source page HTML still declares structure
   - translatable blocks are referenced by stable ids
   - locale payloads live in dedicated source files, likely per-route or per-surface
   - Spw can hold translation notes, glosses, and term policy alongside or above the final emitted strings

5. **Spw translation role**
   Spw should not replace emitted copy. It should carry:
   - term policy
   - operator glosses
   - tone notes
   - "literal vs public-facing" restatements
   - unresolved translation seams
   This creates a durable semantic layer for translation decisions without forcing the browser/runtime to parse Spw.

6. **Build contract**
   Extend the existing template/build pipeline so locale variants are generated at build time. The browser should receive plain static HTML per locale, not runtime translation logic.

7. **SEO contract**
   Each published locale page should emit:
   - correct `<html lang="...">`
   - locale-specific canonical
   - `hreflang` links for published alternates
   - `x-default` only if a deliberate default landing rule exists
   The sitemap should include locale-specific URLs and alternate links only for actually published pages.

## Implementation Phases

1. **Phase 0: semantic preparation**
   Define stable copy-unit ids, locale naming rules, and Spw translation vocabulary.

2. **Phase 1: build seam**
   Add locale-aware template/build support without changing every route. Prove it on one route such as `/` or `/about/`.

3. **Phase 2: first locale slice**
   Add one non-English locale for a small, high-signal route cluster and wire canonical/alternate metadata correctly.

4. **Phase 3: shared chrome**
   Move nav, footer, and shared metadata into locale-addressable surfaces.

5. **Phase 4: concept-rich routes**
   Translate operator-rich and philosophy-rich pages with explicit Spw gloss support.

## Semantics And Naming

- **locale**: a published language edition such as `en` or `es`
- **source_locale**: the canonical authoring locale for a copy unit
- **copy_unit**: a stable authored unit of translatable content
- **translation_projection**: the emitted locale-specific phrasing for a copy unit
- **gloss**: an explanatory note for a term whose direct translation is insufficient
- **term_policy**: locale-specific decision about whether to translate, transliterate, or preserve a Spw term

Naming rules:
- copy-unit ids should be semantic and route-aware, for example `home.hero.title` or `about.identity.summary`
- ids should not encode raw English text
- ids should be stable across wording changes when the semantic role remains the same

## Validation

- `git diff --check`
- `node --check scripts/template.mjs`
- `node --check scripts/build.mjs`
- `node --check scripts/generate-sitemap.mjs`
- targeted `rg` for `lang=`, `canonical`, and `hreflang`
- build a one-route locale prototype and inspect generated output paths plus metadata

## Failure Modes

- **Hard**: copy is extracted into tiny string tables that erase authored context and make translation quality collapse.
- **Hard**: locale routing is bolted on after the fact, forcing duplicate route trees or conflicting canonicals.
- **Hard**: Spw terms are treated as universally untranslatable, leaving non-English routes half-English and semantically uneven.
- **Soft**: copy-unit ids mirror current English wording too closely, so editorial revisions become migration work.
- **Soft**: fallback behavior hides missing translations instead of exposing the seam during authoring.
- **Non-negotiable**: the final site remains static HTML/CSS/JS with no client-side i18n dependency.

## Recommendation

Use locale-prefixed published routes for non-source locales, keep English source routes stable for now, and introduce file-backed copy-unit sources plus a `.spw` convention layer for translation policy and Spw-term glosses. That gives the site a clean build-time localization seam without sacrificing authored HTML or the site's semantic model.
