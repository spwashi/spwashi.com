# Instrumentation Legibility

## Goal

Refine recent developmental-climate and semantic-chrome changes so component instrumentation remains useful to machines and debuggers without crowding the public reading hierarchy.

## Scope

- Shared climate styling: `public/css/effects/developmental-climate.css`
- Shared component/chrome styling: `public/css/spw-components.css`, `public/css/spw-handles.css`, `public/css/effects/wonder.css`
- Runtime metadata producers: `public/js/semantic/component-semantics.js`, `public/js/interface/semantic-chrome.js`, `public/js/spw-state-inspector.js`, `public/js/interface/prompt-utils.js`, `public/js/kernel/site-settings.js`
- Inspectable model: `.spw/surfaces/page-model.spw`

## Contract

- Use `data-spw-instrumentation` for producer/behavior families such as `prompt-surface`, `prompt-copy`, `semantic-chrome`, `state-inspector`, and `image-metaphysics`.
- Use `data-spw-debug-source` for the module that most directly owns the instrumentation.
- Keep semantic chrome collapsed unless semantic metadata or debug mode is enabled.
- Keep prompt-copy controls inside existing frame heading/topline flows when possible.

## Status

- [x] Restore climate compatibility aliases and fix reduced-motion syntax.
- [x] Add instrumentation/debug-source fields to component semantic snapshots.
- [x] Surface instrumentation in semantic popovers and state inspector blocks.
- [x] Move prompt-copy UI into the frame header flow.
- [x] Record the instrumentation contract in the page model.
- [x] Register component identities and semantic ownership for console inspection.
- [x] Route brace pivot settings changes through the canonical settings manager.
- [x] Add an inspectable route-discovery menu contract so shell navigation can be narrated as state instead of inferred from layout.
- [x] Raise the Glass console/settings legibility floor so runtime theme experiments stay readable across light and dark recording contexts.
