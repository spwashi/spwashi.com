# Portable Experiment Template Migration

## Public Goal

Bring the final two design experiments onto shared metadata/runtime composition without breaking their copy-and-lift portability as self-contained instruments.

## Scope

- Preserve authored inline `<style>` and inline `<script>` blocks when the route migrator replaces a manual head.
- Migrate `design/experiments/menu-field/index.html`.
- Migrate `design/experiments/subject-balance/index.html`.
- Retain `noindex`, route metadata, inline instrument styling, body scripts, and content exactly.

## Non-goals

- Do not extract instrument CSS or JavaScript into shared files.
- Do not redesign either experiment or introduce a new runtime feature family.
- Do not add a new template directive when ordinary HTML beside `<spw-site-head>` carries the contract.

## Seams

- Stable shared head: `<spw-site-head>`.
- Portable route-local head content: ordinary inline HTML retained after the shared directive.
- Fixity tier: shared metadata is stable; instrument implementation remains route-local and portable.

## Validation

- Add migration coverage for inline head style/script retention.
- Render both routes with zero warnings and no unexpanded directives.
- Confirm one inline style, one site runtime entry, and `noindex` per route.
- Run `npm run manifest`, `npm run check:local`, and `git diff --check`.

## Status

- [x] Audit the remaining manual-head routes and identify the portability seam.
- [x] Preserve inline head blocks in the migrator.
- [x] Migrate both portable experiment routes.
- [x] Validate rendered output and local contracts.
