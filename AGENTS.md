# AGENTS.md

## Project Overview
- This repository is a small static website for `spwashi.com`.
- Pages are organized as directory-based routes with `index.html` files, such as `/`, `/about`, and `/contact`.
- Shared assets live under `public/`, including stylesheets, images, and other static files.

## Working Guidelines
- Prefer minimal, surgical edits that preserve the existing hand-written HTML structure.
- Keep pages framework-free unless explicitly requested; do not introduce build tooling or dependencies by default.
- Reuse the shared stylesheet and current markup patterns before adding new inline styles.
- Preserve existing copy, links, analytics snippets, and metadata unless the task requires changing them.

## HTML Conventions
- Maintain semantic HTML structure with `header`, `nav`, `main`, and `footer` where applicable.
- Keep directory routing consistent: page changes should generally go in that route’s `index.html`.
- Use root-relative asset links like `/public/css/style.css` to match the existing site.
- Favor accessibility basics: meaningful headings, descriptive link text, and `alt` text for images.

## Assets
- Place shared CSS in `public/css/` and images in `public/images/` unless there is a clear existing subpattern to follow.
- Do not rename or move assets unless the task specifically requires it.

## Validation
- For content edits, sanity-check surrounding markup for balanced tags and broken relative/root-relative links.
- If a local preview step is needed, use a simple static server; otherwise avoid adding tooling just for validation.

## Scope
- These instructions apply to the entire repository unless a nested `AGENTS.md` overrides them.

---

## Spw Design System — Agent Reference

This site uses a layered CSS architecture and an ES module JavaScript system built around
the **Spw language** (a readable plain-text grammar). The following is a quick reference
for making targeted changes.

### CSS layer order (lowest → highest priority)
```
reset → tokens → shell → typography → grammar → components → surfaces → handles → ornament
```
New styles override lower layers. Add to `ornament` only if you need to override everything else.

### Key files to edit for common tasks

| Task | File |
|------|------|
| Change colors/shadows/spacing tokens | `public/css/spw-tokens.css` |
| Change card glass/matte behavior | `public/css/spw-material.css` |
| Change brace corner forms | `public/css/spw-grammar.css` |
| Change grain opacity defaults | `public/js/site-settings.js` (`GRAIN_INTENSITY_VALUE`) |
| Add a new operator type | `public/js/spw-shared.js` (`OPERATOR_DEFINITIONS`) + `spw-tokens.css` + `spw-cinematic.css` |
| Add a canvas accent to a frame | Add `data-spw-accent="wave|vortex|crystal|lattice|flow"` to the element |
| Change navigation | `public/css/spw-shell.css` for layout; each page's `<header>` for links |
| Add settings controls | `settings/index.html` + `public/js/site-settings.js` (`DEFAULT_SITE_SETTINGS`) |

### Spw HTML primitives (always available)

```html
<!-- Operator chips -->
<a class="operator-chip" href="..." data-spw-operator="probe">?[topic]</a>
<a class="operator-chip" href="..." data-spw-operator="frame">#>name</a>

<!-- Inline topic markers -->
<span class="spw-topic" data-spw-topic>concept</span>   <!-- renders as <concept> -->

<!-- Brace form containers -->
<div data-spw-form="brace" data-spw-brace="objective">  <!-- left-anchored, cool -->
<div data-spw-form="brace" data-spw-brace="subjective"> <!-- right-anchored, warm -->

<!-- Canvas accent backgrounds -->
<section data-spw-accent="wave" data-spw-accent-palette="cool">
<section data-spw-accent="vortex" data-spw-accent-palette="warm">
```

### Settings data attributes on `<html>`

The settings system applies these to `document.documentElement` at runtime:
- `data-spw-color-mode` — `light | dark | auto`
- `data-spw-operator-saturation` — `muted | normal | vibrant`
- `data-spw-semantic-density` — `minimal | normal | rich`
- `data-spw-grain-intensity` — `none | subtle | moderate | rich`
- `data-spw-show-spec-pills` — `on | off`

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

### Do not
- Modify `style.css` layer declaration order
- Add build tooling or npm dependencies
- Use `!important` outside the `ornament` layer
- Add inline styles except for JS-driven dynamic values
- Rename or move CSS files without updating the `@import` in `style.css`
