---
name: spw-privacy-engineering
description: Audit browser-resident privacy risks—storage, service worker, embeds, analytics, asset metadata. Use when data handling changes, not as a default every patch.
---

# Spw Privacy Engineering for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

Privacy work is real when storage, embeds, or analytics move. It is not a
reason to add more inspect surfaces.

## Look at

- localStorage / IndexedDB / site-settings ownership
- Service worker caches and offline behavior
- Third-party embeds and scripts
- Analytics snippets
- Image/EXIF and public asset metadata
- What is disclosed vs silent in the UI

## Workflow

1. Name the data flow and retention.
2. Prefer existing settings/storage modules over new keys.
3. Document browser-resident behavior where users can find it.
4. Avoid expanding collection “for agents.”

## Validation

- Trace writes to storage through known modules
- Confirm settings/reset paths still make sense
