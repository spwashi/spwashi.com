# Domain Route Template Migration

## Public goal

Keep the nine domain-constellation pages visually and semantically unchanged
while moving their duplicated metadata heads onto the shared HTML-native
template renderer.

## Scope

- `about/domains/*/index.html`
- Existing `scripts/template.mjs` and
  `scripts/migrate-route-to-template.mjs` contracts, without extending them
- Existing page-template authoring convention and generated route checks

## Seams

- `<spw-page>` owns title, description, canonical, social metadata, keywords,
  and breadcrumb/header inputs.
- `<spw-site-head>` expands the common head, scoped stylesheets, runtime entry,
  social metadata, and JSON-LD.
- `<body data-spw-*>` remains the authored source of route personality.
- Existing `<spw-site-header>` and `<spw-site-footer>` declarations remain
  unchanged.

## Non-goals

- No body-content generation or copy changes.
- No framework or dependency changes.
- No migration of experiment pages with inline portable CSS/scripts in this
  batch.
- No new template directive or semantic attribute family.

## Validation

- Render all nine sources and require zero template warnings.
- Confirm rendered output contains no unexpanded `spw-*` directives.
- Compare canonical, title, body personality, header, and footer contracts.
- `npm run manifest`
- `npm run check:local`
- `git diff --check`
