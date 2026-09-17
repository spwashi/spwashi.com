# Film Route Template Migration

## Public goal

Keep the ten film field-guide and scene-composition routes visually and
semantically unchanged while moving their duplicated metadata heads onto the
shared HTML-native template renderer.

## Scope

- `topics/film/**/index.html`
- Preserve `/public/css/effects/cinematic.css` through the existing
  `extra_styles` template input.
- Use existing template and migration contracts without adding runtime work.

## Seams

- `<spw-site-head>` owns common metadata, scoped route CSS, and the shared site
  runtime.
- `extra_styles` owns the film family’s cinematic effect layer.
- Authored body metadata, content, diagrams, navigation, and footer remain
  unchanged.

## Non-goals

- No film copy, hierarchy, cinematic CSS, or interaction changes.
- No body-content generation.
- No new dependencies or template directives.

## Validation

- Render all ten routes with zero warnings or unexpanded directives.
- Require the cinematic stylesheet exactly once on every rendered route.
- `npm run manifest`
- `npm run check:local`
- `git diff --check`
