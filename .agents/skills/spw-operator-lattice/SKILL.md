---
name: spw-operator-lattice
description: Inspect Spw operator usage across .spw, HTML data-spw-*, and route links. Use for operator/cross-link audits—not to sprinkle more chips everywhere.
---

# Spw Operator Lattice for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Grammar, Not Confetti:** Operators are functional linguistic handles—NOT decorative chips to sprinkle on every paragraph.
* **Stop Condition:** A chip with no route link, focus handle, or resonance connection behind it is decoration. Leave it out.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Arbitrary Sigil Invention:** Use the operator character table in `public/js/kernel/operator-detection.js` (`OPERATOR_DEFINITIONS`, re-exported by `shared.js`). Atlas slugs are aliases; `.spw/language/operator-namespace-alignment.spw` maps them. The creator wants the table to move into the workbench, with the site importing it (`#direction_2026_10_11` in that file). That move is an upstream ask, so until it lands this file stays the reference, and no one here edits `.spw/_workbench`.
* 🚫 **Color Through Intent:** Color chips by setting `--operator-chip-*-intent` on the surface, never by painting the chip directly — the routes layer wins the cascade and a direct paint gets overridden or overrides the wrong thing. Keep readable contrast in both themes.
* 🚫 **A11y Labeling:** A bare sigil like `#>label` reads as punctuation to a screen reader. Give it a text label or accessible name.

---

## 📐 Canonical Operator & Sigil Registry

The registry is `operator-detection.js`: 19 prefixes, each with its type, mnemonic, and charge geometry. Read it there rather than from a copy here — a copied table drifts (this one once listed 7 operators and a `--op-measure-color` token that never existed). A few worth knowing by heart:

| Sigil | Reading |
| :--- | :--- |
| `#>name` | Frame address — a named, addressable surface |
| `?[topic]` | Wonder — an open question |
| `@posture` | Perspective — where a view is taken from |
| `$` / `&` | Substrate / subject |
| `!action` | Action — commit a move |

---

## 🌌 Tooling & Validation Ladder

Use the mounted `spw` CLI to audit lattice connectivity and hit density. Steps 2 and 3 each walk the whole `.spw` corpus and take minutes (density took about four over 398 files on 2026-10-13), so run the one the question needs:

```bash
# 1. Inspect top lattice hubs and connections:
npm run spw:lattice

# 2. Audit operator hit densities across .spw (the boon/bone selectors find no
#    parsed operations in this corpus; the site's !boon lives in prose):
npm run spw -- density .spw --selectors ops:frame,ops:body

# 3. View operator graph hubs:
npm run spw:graph

# 4. Local verification gate:
npm run check:local
```
