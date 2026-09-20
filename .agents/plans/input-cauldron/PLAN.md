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
