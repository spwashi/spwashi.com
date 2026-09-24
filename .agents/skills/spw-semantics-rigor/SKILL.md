---
name: spw-semantics-rigor
description: Clean up naming and meaning across copy, data-spw attributes, CSS tokens, JS state, and .spw notes. Use when ontology drifted—not when every new string needs a convention.
---

# Spw Semantics Rigor for spwashi.com

* Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.
* Adjacent measurement surface: [`.spw/skills/semantics-rigor.spw`](../../../.spw/skills/semantics-rigor.spw)

---

## 1. Spw Invocation Contract

* **Default Operation:** `align` (or `audit` when measuring cross-layer drift).
* **Sense (Pre-flight):** `npm run spw:integrity && npm run spw:lattice` (every citation and operator cell, before renaming; integrity takes about 80s, so run it once before and once after, not per edit).
* **Probe (Falsification):** `npm run spw:integrity && npm run reasons && npm run spw:lattice`
* **Precipitate:** Crystallize expression rules in `.spw/conventions/semantic-expression-consequence.spw`; attribute stems in `.spw/conventions/data-spw-attribute-governance.spw`; measurements in `.spw/skills/semantics-rigor.spw`.

---

## 2. ⚡ Quick Strike & Stop Conditions

* **Purpose:** This skill is for **cleanup, pruning, and alignment**, not for inventing new attribute families.
* **Reuse First:** Map onto existing `data-spw-*` families (`.spw/site.spw`) before proposing a new stem.
* **Expression Manifest Flow:** When authoring `data-spw-semantic-expression`, remember the pipeline:
  `data-spw-semantic-expression` → `npm run manifest:expressions` → `buildKinIndex` → 700ms dwell salience.
  *If you rename an expression subject without re-running `npm run manifest:expressions`, kin ties vanish silently.*
* **Stop Condition:** A pass that adds `.spw` files without resolving a naming collision or removing dead code is growing the ontology, not cleaning it. Stop and name the collision you meant to fix.

---

## 3. 🛡️ Constitutional Guardrails

* 🚫 **No Attribute Proliferation:** Add a `data-spw-*` attribute to HTML only when a CSS rule, JS consumer (check `el.dataset.spwFoo` writes too, not just the literal string), or inspectable `.spw` contract depends on it.
* 🚫 **No Ad-Hoc Stems:** Do not invent synonyms for existing operators. The character table in `public/js/kernel/operator-detection.js` is canon; atlas slugs are aliases.
* 🚫 **Preserve Creator Truth:** Do not rephrase author copy into mechanical machine-speak. Spwashi is a creator first.
* 🚫 **Public nouns:** `.spw-frame` / `.spw-chip`. Do not author `site-frame` or `operator-chip` on public routes. Catalog `selector` strings must name the same nouns (`npm run audit:module-selectors`).
* 🚫 **Migration tools:** `scripts/rewrite-semantic-nouns.mjs` can empty `class=""` via a 500-char lookahead. Diff for dropped `data-spw-textual-role` before committing a bulk rename.

---

## 4. 📐 Homonym & Disambiguation Matrix

When concept names collide across layers, use explicit coordinates rather than inventing parallel names:

| Ambiguous Stem | Meaning 1 (CSS / Layout) | Meaning 2 (JS / Runtime) | Meaning 3 (.spw / Ontology) |
| :--- | :--- | :--- | :--- |
| **`region`** | `data-spw-region` (material seat) | `region-enhancer` (module family) | Boundary claim in `.spw` |
| **`expression`** | `data-spw-semantic-expression` (copy grammar)| `spwExpression` (cauldron render) | `expression = ...` (.spw header) |
| **`settle`** | Box/layout reflow settle phase | Transition end / event debounce | Cognitive agreement / equilibrium |
| **`resonance`** | CSS `:has()` operator echo glow | Attention probe focus tracking | Topic/concept relational affinity |
| **`density`** | Typographic line-height & packing | UI widget spacing mode | Semantic information density |
| **`copy`** | `data-spw-copy-unit` (flat i18n projection) | `data-spw-semantic-expression` (multidimensional handle) | term_policy / copy-depth voice register |

---

## 5. 🌌 Execution & Validation Ladder

1. **Sense:**
   ```bash
   npm run spw:integrity && npm run spw:lattice
   ```
2. **Rebuild Expression Kinship (if expressions touched):**
   ```bash
   npm run manifest:expressions
   ```
3. **Plan-Only Edit Probe (preview rewrites before mutating):**
   ```bash
   npm run spw -- pulse <file.spw>
   ```
4. **Local Verification Pass:**
   ```bash
   npm run ecology:language
   npm run check:local
   ```
