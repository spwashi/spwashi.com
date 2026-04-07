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
