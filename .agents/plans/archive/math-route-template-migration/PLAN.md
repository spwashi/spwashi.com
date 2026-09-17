# Math Route Template Migration

## Public goal

Keep all fourteen math learning routes, diagrams, social metadata, and authored
page personality unchanged while moving their duplicated heads onto the shared
HTML-native template renderer.

## Scope

- `topics/math/*/index.html`
- Preserve page-local module and stylesheet URLs through existing
  `extra_scripts` and `extra_styles` template inputs.
- Extend the migration regression test for retained head assets.

## Seams

- `<spw-site-head>` owns common metadata, scoped CSS, and the shared runtime.
- `extra_scripts` retains math diagram modules on routes that require them.
- `extra_styles` retains non-shared route stylesheets when later batches use
  them.
- Body metadata and route content remain authoritative and unchanged.

## Non-goals

- No math copy, diagrams, CSS, or interaction changes.
- No new client runtime or dependencies.
- No body-content generation.

## Validation

- Render all fourteen routes with zero warnings or unexpanded directives.
- Require math diagram modules on the same seven routes before and after.
- Run template and migration regression tests.
- `npm run manifest`
- `npm run check:local`
- `git diff --check`
