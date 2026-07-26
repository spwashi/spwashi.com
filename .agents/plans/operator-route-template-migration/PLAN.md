# Operator Route Template Migration

## Public goal

Keep every Spw operator specimen unchanged for readers while moving the
operator-atlas family’s duplicated metadata heads onto the shared template
renderer.

## Scope

- `topics/software/spw/operators/*/index.html`
- Existing `<spw-page>` and `<spw-site-head>` contracts
- Existing migration script, without renderer changes

## Seams

- Template metadata owns title, canonical, social cards, keywords, JSON-LD,
  scoped stylesheets, and the site runtime entry.
- Authored body metadata remains authoritative for operator identity, page
  family, modes, wonder, related routes, and feature gates.
- Existing operator specimens, navigation configuration, and footer content
  remain unchanged.

## Non-goals

- No operator copy, grammar, CSS, runtime, or ontology changes.
- No body-content generation.
- No new directives, packages, or build stages.

## Validation

- Render all migrated operator routes with zero warnings.
- Require expanded title, canonical, OpenGraph, site header, and site footer.
- Require no unexpanded template directives in rendered HTML.
- `npm run manifest`
- `npm run check:local`
- `git diff --check`
