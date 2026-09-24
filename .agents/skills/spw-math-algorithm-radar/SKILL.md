---
name: spw-math-algorithm-radar
description: Map math/algorithm ideas onto public pages and practice beds. Use for learning routes—not to force labs onto every topic.
---

# Spw Math / Algorithm Radar for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Pedagogy First:** Lead with an intuition — usually geometric or visual — before code or notation, so a reader has something to hold when the symbols arrive.
* **Stop Condition:** Do not build a heavy canvas simulator for a simple algebraic concept that can be clearly illustrated with a crisp static SVG diagram.

---

## 🛡️ Constitutional Guardrails

* 🚫 **Zero-JS Degradation:** The explanation and static diagram read completely with JavaScript off.
* 🚫 **Accessible Math Markup:** Semantic HTML, SVGs with `role="img"` and a title or `aria-label`, and a text equivalent for each formula.
* 🚫 **No Performance Traps:** Interactive canvases draw on `requestAnimationFrame`, stop when offscreen or idle, and avoid per-frame allocation. Under reduced motion, step instead of animate.

---

## 📐 Pedagogical Progression & Lab Ladder

```text
Step 1: Intuition → Plain English narrative explaining "why this math matters".
Step 2: Static SVG→ Clear, accessible vector geometry with labeled axes/nodes.
Step 3: Interactive→ Optional playable instrument, mounted at MOUNT_WHEN.INTERACTION or VISIBLE.
Step 4: Formula   → Concise formalization. Spw operator tie-ins only where they teach something the formula does not.
```

---

## 🌌 Tooling & Validation Ladder

1. **Verify Lab Module Syntax:**
   ```bash
   node --check <touched-lab-module.js>
   ```
2. **Runtime Catalog Check (if lab registered):**
   ```bash
   npm run check:runtime
   ```
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
