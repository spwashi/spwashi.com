# Input cauldron handoff

Operation: align. Fixity: tending. Focus: deliberate composition in ordinary text fields.

## Public goal
Make writable inputs and textareas readable, keyboard/touch usable, and able to receive a chosen cauldron fragment without exporting their contents.

## Scope
- Shared component CSS: controls.css, baseline field sizing/focus/disabled/readonly states; no shell search resizing.
- Interface module: field-composition.js; delegated focus, one contextual toolbar, native modal picker, text/Spw preview, insert/append and guarded undo.
- Enhancement catalog: one lazy visible main host; dynamic fields handled by delegation.
- Existing cauldron storage read API only; no new storage, network calls, clipboard reads, or automatic field capture.
- Exclude passwords, credentials, email/URL/number/search fields, readonly, disabled, inert, and cauldron picker fields.
- Preserve maxlength, selection, user edits, and existing input/change listeners. Never submit a form.
- Existing cauldron-dynamics convention records the one-way handoff; no new data attribute family.

## Validation
Selector census; CSS payload; focused unit/browser tests on care, profile, and settings at phone/desktop widths; visual attention receipt; ecology; manifest; check:local -- --allow-dirty.

## Archived — 2026-09-20

Operation `archive`, fixity `cold`. Landed in `f1672070`: field-composition,
lazy enhancement registration, and registered tests are present. The commit
records 406 passing module tests and browser checks; those are historical
receipts, not rerun by this refresh. Future composition work belongs to
[spellcraft-authoring](../../spellcraft-authoring/PLAN.md) and cauldron-dynamics.
