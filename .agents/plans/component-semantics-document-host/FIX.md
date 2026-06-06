# Component Semantics Document Host Guard

## Failure

The hydrated homepage `outerHTML` contained component-level attributes on `<body>` that were absent from the static `curl` response, including `data-spw-kind`, `data-spw-role`, and `data-spw-form`.

This made route-level styling vulnerable to late additions that read component semantics as global state. The visible symptom was a mismatch between the hydrated browser view and the server/static response around chrome scale and containment.

## Diagnosis

`public/js/semantic/component-semantics.js` collects targets with `COMPONENT_SELECTOR`. That selector includes semantic attribute selectors from `public/js/kernel/dom-contracts.js`, including `[data-spw-features]`.

Because route `<body>` elements use `data-spw-features` for page-level feature gating, the component semantics pass could classify `<body>` as a reusable component and backfill inferred component metadata onto the document host.

## Planned Fix

Keep component semantics scoped to reusable page components by skipping `document.documentElement` and `document.body` during semantic target collection.

Route-level and root-level metadata remain owned by authored HTML and settings/runtime modules, while component normalization continues to apply to actual descendants.

## Deferred Follow-ups

- Consider splitting document-host selectors from component selectors if more root-level semantic attributes are added.
- Add a generated audit that flags runtime writes of component-only attributes to `<html>` or `<body>`.
