# AGENTS.md

## Project Overview
- This repository is a hand-authored site for `spwashi.com`: static routes, shared CSS/JS runtime, and editor-facing `.spw` inspection surfaces.
- The main edit surfaces are:
  - route HTML in directory `index.html` files
  - shared CSS under `public/css/`
  - shared JavaScript modules under `public/js/`
  - `.spw/` conventions and `.agents/plans/` notes when a concept should stay inspectable beyond one patch
- Treat `.spw/_workbench` as optional reference/tooling, not the default source of truth for site changes.

## Working Guidelines
- Clarify the public goal first: copy, route flow, interaction, semantic naming, or editor inspectability.
- Patch the smallest honest surface:
  - route HTML for copy, structure, and semantic attributes
  - shared CSS tokens/components/surfaces before page-local CSS
  - progressive-enhancement JS only when HTML/CSS cannot carry the behavior
  - `.spw` files when the concept or contract matters beyond one patch
- Prefer minimal, surgical edits that preserve the existing hand-written HTML structure.
- Keep pages framework-free unless explicitly requested; do not introduce runtime frameworks or client-side dependencies. A local-only build pipeline (`scripts/build.mjs`) and zero-dep introspection scripts are permitted — see the **Build pipeline** section below.
- Preserve existing copy, links, analytics snippets, and metadata unless the task requires changing them.
- If work spans multiple routes or shared layers, add or update a plan under `.agents/plans/<slug>/`.
- If a new reusable semantic family, runtime state, or sitewide contract is introduced, update the relevant `.spw` surface and wire it into `.spw/site.spw` when needed.

## Creator Identity

**Spwashi is a creator identity first, not just a place.** The canonical self-description is: _"I'm Spwashi. I build software and make art."_ Copy should lead with the person. The site can describe itself as a surface or space for the work, but Spwashi = the creator first.

## HTML And Assets
- Maintain semantic HTML structure with `header`, `nav`, `main`, and `footer` where applicable.
- Keep directory routing consistent: page changes should generally go in that route's `index.html`.
- Use root-relative asset links like `/public/css/style.css` to match the existing site.
- Favor accessibility basics: meaningful headings, descriptive link text, and `alt` text for images.
- Place shared CSS in `public/css/` and images in `public/images/` unless there is a clear existing subpattern to follow.
- Do not rename or move assets unless the task specifically requires it.

## Validation
- Run `git diff --check` after edits.
- Run `node --check <file>` for edited JS modules.
- Use targeted `rg` checks for anchors, asset paths, and semantic data attributes.
- For content edits, sanity-check surrounding markup for balanced tags and broken relative/root-relative links.
- If a local preview step is needed, use a simple static server; otherwise avoid adding tooling just for validation.

## Scope
- These instructions apply to the entire repository unless a nested `AGENTS.md` overrides them.

---

## Build pipeline

As of 2026-04, the site publishes through a local build step rather than serving the repo directly. This is a deliberate deviation from the earlier "no build tooling" rule, driven by the need for traceability (design catalog), HTML composition, and a proper dev/publish separation.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Local dev server (live reload, CSS hot-swap) serving the **source** tree. |
| `npm run build` | Produces `dist/` — copy of the tracked deployable site surface with the design catalog regenerated and a `.nojekyll` marker. |
| `npm run catalog` | Regenerates the in-tree design catalog at `design/catalog/` (gitignored). |
| `npm run manifest` | Regenerates the route runtime manifest. |
| `npm run sitemap` | Generates `dist/sitemap.xml` from tracked route canonicals. |
| `npm run check` | Validates the site (pre-existing). |

**Deploy:** `.github/workflows/deploy.yml` runs `npm run build` and publishes `dist/` to GitHub Pages on push to `main`. Binary deploy artifacts in `dist/` stay ignored; plaintext outputs can be tracked when useful for review.

**Design catalog:** `design/catalog/index.html` is a generated cross-reference of every site-facing `data-spw-*` attribute, custom-property token, CSS file, and `.spw` philosophy doc, with orphan detection. It excludes the installed workbench/tooling subtrees. See `scripts/generate-design-catalog.mjs`.

---

## Spw Design System - Agent Reference

This site uses a layered CSS architecture and an ES module JavaScript system built around the **Spw language**: a readable plain-text grammar projected into HTML, CSS, JS, and `.spw` inspection surfaces.

### CSS layer order (lowest -> highest priority)
```text
reset -> tokens -> shell -> typography -> grammar -> components -> surfaces -> handles -> ornament
```
New styles override lower layers. Add to `ornament` only if you need to override everything else.

### Key files to edit for common tasks

| Task | File |
|------|------|
| Change shared colors, spacing, thresholds, or semantic tokens | `public/css/spw-tokens.css` |
| Change card glass/matte behavior | `public/css/spw-material.css` |
| Change brace forms or structural grammar | `public/css/spw-grammar.css` |
| Change shared surface layout or feature-gated component layout | `public/css/spw-surfaces.css` |
| Change wonder-memory propagation, accent memory, or ornament response | `public/js/spw-wonder-memory.js` + `public/css/spw-wonder.css` + `public/css/spw-ornament.css` |
| Change settings defaults, root data attributes, or deviation handling | `public/js/site-settings.js` + `settings/index.html` |
| Change navigation tokenization or grounded route behavior | `public/js/spw-navigation-spells.js` + `public/js/frame-navigator.js` |
| Change spell, checkpoint, or bookmark behavior | `public/js/spw-spells.js` + `public/js/spw-haptics.js` + `public/js/spw-experiential.js` |
| Change guide badge, interaction-context, or collection behavior | `public/js/spw-guide-badge.js` + `public/css/spw-ornament.css` |
| Add a canvas accent to a frame | add `data-spw-accent="wave|vortex|crystal|lattice|flow"` to the element and tune shared accent CSS/JS only if needed |
| Add a new operator type | `public/js/spw-shared.js` (`OPERATOR_DEFINITIONS`) + `public/css/spw-tokens.css` + any relevant shared CSS projection files |
| Add or rename a reusable feature cluster | route HTML + `.spw/surfaces/page-model.spw` when the model matters beyond one patch |

### Page shell metadata

The `<body>` element is the page-level semantic truth. Preserve or extend these families before inventing one-off route metadata:

- `data-spw-surface`
- `data-spw-features`
- `data-spw-route-family`
- `data-spw-context`
- `data-spw-wonder`
- `data-spw-page-family`
- `data-spw-page-modes`
- `data-spw-page-role`
- `data-spw-page-seed`
- `data-spw-related-routes`

Example:

```html
<body
  data-spw-surface="software"
  data-spw-features="operators metrics navigator console"
  data-spw-route-family="editorial systems curriculum"
  data-spw-context="analysis"
  data-spw-wonder="comparison constraint locality"
  data-spw-page-family="curriculum"
  data-spw-page-modes="reading inspect compare build"
  data-spw-page-role="topic-register">
```

### Feature gating vs feature naming

These are different layers and should not be conflated:

- `data-spw-features="..."` on `<body>` gates shared runtime/CSS feature families such as `navigator`, `console`, `svg-surfaces`, or `pretext-lab`.
- `data-spw-feature="name"` names the outermost element of a coherent functional cluster within a route, such as a quick-tune card grid, a palette probe, or a runtime map.

Use `data-spw-feature` on an existing meaningful cluster. Do not add empty wrappers just to carry the attribute.

Example:

```html
<div class="vibe-widget-grid" data-spw-feature="settings-quickstart">
```

### Common component and interaction primitives

```html
<!-- Operator chips -->
<a class="operator-chip" href="..." data-spw-operator="probe">?[topic]</a>
<a class="operator-chip" href="..." data-spw-operator="frame">#>name</a>

<!-- Inline topic markers -->
<span class="spw-topic" data-spw-topic>concept</span>

<!-- Brace form containers -->
<div data-spw-form="brace" data-spw-brace="objective">
<div data-spw-form="brace" data-spw-brace="subjective">

<!-- Canvas accent backgrounds -->
<section data-spw-accent="wave" data-spw-accent-palette="cool">
<section data-spw-accent="vortex" data-spw-accent-palette="warm">

<!-- Opt-in collectible guide badge behavior -->
<a class="operator-chip" data-spw-guide-badge="collect" href="/topics/software/spw/">
```

### Root runtime state

`public/js/site-settings.js` is the canonical source for root-level settings state and deviation handling. Do not introduce direct localStorage writes for canonical settings outside that module.

Common runtime attributes written to `<html>` include:

- `data-spw-color-mode`
- `data-spw-palette-resonance`
- `data-spw-operator-saturation`
- `data-spw-semantic-density`
- `data-spw-grain-intensity`
- `data-spw-show-spec-pills`
- `data-spw-enhancement-level`
- `data-spw-wonder-memory`
- `data-spw-developmental-climate`
- `data-spw-deviation-count`
- `data-spw-deviations`
- `data-spw-deviation-state`

If you need the full current list, inspect `setDatasetEntries(...)` in `public/js/site-settings.js`.

### Interaction, grounding, and collection state

Canonical interaction and retention state currently lives in shared JS and should be extended consistently:

- `data-spw-interaction-context="reading|browsing|inspecting|collecting|comparing"`
- `data-spw-collected="true"` and `data-spw-collection-strength`
- `data-spw-grounded="true|false"`
- `data-spw-grounded-in`
- `data-spw-grounded-wonder`
- `data-spw-pinned`

Prefer these existing names over inventing parallel state unless the distinction is real and teachable.

### Wonder, ornament, and spell direction

- `data-spw-wonder-state`, `data-spw-field-wonder`, and related memory-match state drive shared accent/ornament behavior.
- The ornament contract lives across `public/css/spw-tokens.css`, `public/css/spw-wonder.css`, `public/css/spw-ornament.css`, `.spw/conventions/ornament-contract.spw`, and `.spw/conventions/attention-field.spw`.
- Spells should be treated as **small replayable outcomes**, not merely collectible traces. Useful examples are restoring checkpoints or resuming a pinned working set.
- Serialization and readable Spw output support inspection, but they are not the primary value proposition of the spell surface.

### Material surface distinction

- **Glass surface** (`.frame-card`): semi-transparent `--card-bg`, `backdrop-filter: blur(12px)`
- **Matte surface** (`.mode-panel`): `--matte-surface` (warm, opaque, no blur)
- **Code surface**: `--surface-code` (dark, near-opaque)

### Operator color palette shorthand

| Operator | Color | CSS token |
|----------|-------|-----------|
| frame `#>` | teal | `--op-frame-color` |
| object `^` | amber | `--op-object-color` |
| probe `?` | violet | `--op-probe-color` |
| ref `~` | blue | `--op-ref-color` |
| action `@` | teal-dark | `--op-action-color` |
| topic `<` | sea-green | `--op-topic-color` |

### Component anatomy

Components follow a slot contract:

```text
header -> meta -> body -> figure -> actions -> footer
```

#### Lens / mode-switch pattern
- A `mode-switch` inside a `frame-topline` controls which content panel is visible.
- Each button is a `.frame-sigil` with `data-set-mode` and `aria-pressed`.
- JS sets `aria-pressed="true"` on the active button.
- Be mindful that mode-switch-specific pressed styles must win over generic `aria-pressed` states in `spw-handles.css`.
- Mode-specific operator colors are usually scoped through `--active-op-color` in the relevant route surface CSS.

#### Frame anatomy axes
A `site-frame` can have two independent interaction axes:
1. **Lens** (`mode-switch`): filters content type.
2. **Form** (`data-spw-form-options`): changes structural presentation.

These should feel visually distinct. Lens is a content filter; form is a spatial grammar choice.

### Coordination triggers

Update `.spw` surfaces when:

- a new reusable semantic family or attribute contract is introduced
- a runtime state becomes part of the site's inspectable model
- a concept should remain legible to agents/editors beyond one implementation patch

Add or update a plan under `.agents/plans/<slug>/` when:

- the work spans multiple routes
- the work touches both shared CSS/JS and route HTML
- the work changes how a concept should be understood, not just how it looks

### Do not
- Modify `style.css` layer declaration order.
- Add client-side frameworks or runtime npm dependencies (the local-only build pipeline is fine — see the Build pipeline section).
- Use `!important` outside the `ornament` layer.
- Add inline styles except for JS-driven dynamic values.
- Rename or move CSS files without updating the `@import` in `style.css`.
- Bypass `public/js/site-settings.js` with direct localStorage writes for canonical settings.
- Introduce one-off `data-spw-*` names when an existing family already fits.

---

## Attention Architecture

Progressive-enhancement system for section-context awareness and operator resonance. Centralizes mobile navigation and conceptual linking.

### Section-context handle

Mobile-first sticky chip that surfaces the current visible section by reading `data-spw-operator` and heading text.

**Files:** `public/js/spw-attention-architecture.js`, `public/css/spw-chrome.css`

**HTML contract:**

```html
<a class="spw-section-handle"
   href="#main-content"
   data-spw-handle-state="hidden"
   aria-label="Jump to top of current section">
    <span class="spw-section-handle__op" aria-hidden="true">#&gt;</span>
    <span class="spw-section-handle__label">section</span>
</a>
```

**Behavior:**
- Hidden by default on desktop; visible on mobile/narrow screens when scrollY > 240px
- IntersectionObserver tracks all sections matching `main section[data-spw-kind], main article[data-spw-kind], main section[id], main article[id]`
- JS updates handle label from section heading, aria-label, or id
- Progressive enhancement: degrades to static "return to top" anchor if JS unavailable

**Integration:** add the `.spw-section-handle` element early in `<body>` on routes with long sectioned content (blog, about, topics).

### Resonance probe

Pinned operator focus/hover state that sets `html[data-spw-resonance-probe="operator-name"]` to trigger soft echo glow on matching operators across the page.

**Files:** `public/js/spw-attention-architecture.js`, `public/css/spw-wonder.css`

**Behavior:**
- `focusin` on any `[data-spw-operator]` immediately pins that operator
- `mouseover` with 260ms delay allows hovering without committing
- `focusout` and `mouseleave` clear the pin
- CSS `:has()` selector (with `@supports`) applies `--spw-resonance` to matching operators

**CSS contract** in `spw-wonder.css`:
```css
:where([data-spw-operator]) {
  box-shadow: var(--spw-local-shadow, none),
    0 0 0 calc(1px * var(--spw-resonance, 0)) 
    color-mix(in srgb, var(--spw-operator-color, ...) 42%, transparent);
}
```

---

## Page Layout Variants

Desktop-aware layout system with flex/grid containers for better space utilization.

**Files:** `public/css/spw-shell.css`, `public/css/spw-tokens.css`

**Variants** via `data-spw-layout` on `<body>` or `main`:

- `reading`: narrower column (default `--page-width-reading`)
- `wide`: moderate expansion (`--page-width-wide`)
- `atlas`: maximum breathing room (`--page-width-atlas`)
- `split`: two-column grid on ≥72rem, gutter rail on the right

**Gutter rail** (.spw-gutter-rail):
- Only renders on `split` layout at desktop breakpoints
- Positioned as secondary column with gap `--attention-rail-gap`
- Can hold secondary navigation, asides, or observational content

**Setup:** 
1. Add `data-spw-layout="wide"|"atlas"|"split"` to page `<body>`
2. On `split` layout, add `.spw-gutter-rail` element inside `<main>` or as flex sibling

---

## Conceptual Resonance

CSS-only operator linking via `:has()` selector. Creates soft visual echo when any instance of an operator is focused/hovered.

**Files:** `public/css/spw-wonder.css`

**Mechanism:**
```css
:where(main, body):has(:where([data-spw-operator="frame"]:is(:hover, :focus-visible)))
  :where([data-spw-operator="frame"]:not(:hover):not(:focus-visible)) {
  --spw-resonance: calc(var(--attention-field-radius, 0.4) * 1);
}
```

Covers 7 operators: frame, object, probe, ref, action, stream, surface.

**Physics tokens** in `spw-tokens.css`:
- `--attention-field-radius`: decay multiplier (0.4 default)
- `--attention-field-decay`: cascade falloff (0.65 default)
- `--attention-echo-duration`: animation duration (480ms)

---

## JSON Hydration Contract

Progressive enhancement pattern for async data loading with skeleton UI and error states.

**Files:** `public/css/spw-components.css` (section 24)

**HTML contract:**

```html
<!-- Loading state -->
<div data-spw-hydration="loading">
  <div class="spw-skeleton" data-spw-skeleton-role="heading"></div>
</div>

<!-- Ready state -->
<div data-spw-hydration="ready">
  <!-- actual content -->
</div>

<!-- Error state -->
<div data-spw-hydration="error" aria-label="Failed to load data"></div>
```

**CSS states:**
- `[data-spw-hydration="loading"]`: shimmer overlay
- `[data-spw-hydration="ready"]`: fade-in settle animation
- `[data-spw-hydration="error"]`: error hint glyph

**Skeleton roles:** `heading`, `line`, `card` (different sizing)

**Integration:** Use this pattern for client-side JSON data sources (topic filters, topic discovery, runtime maps).
