# Brief: Operator x Operand Matrix Probe

Sized for one exploratory session. References: `/design/` experiment surfaces, `kernel/shared.js` OPERATOR_DEFINITIONS + OPERATOR_GEOMETRY (leftRole/rightRole vocabulary), spellcraft-authoring model section.

**One UX question:** does seeing the combination space (operators as rows, recent operands as columns, cells showing real combinations gathered from the ledger/cauldron) teach the language faster than reading operator pages one at a time?

**One behavior:** a design-lab panel rendering the matrix from live data (`document.querySelectorAll('[data-spw-op]')` on the current page plus `window.spwEffects.list()`); empty cells render as open valences (italic, dimmed — matching the geometry-projection.css convention), inviting completion.

**Validation:** matrix renders from at least two live surfaces; no new attribute names introduced; capture-legible under data-spw-capture-mode; no-JS shows a prose explanation instead of an empty panel.
