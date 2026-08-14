---
name: spw-math-algorithm-radar
description: Map math/algorithm ideas onto public pages and practice beds. Use for learning routes—not to force labs onto every topic.
---

# Spw Math / Algorithm Radar for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Pedagogy First:** Math and algorithmic concepts must lead with clear geometric or intuitive visual metaphors before code.
* **Stop Condition:** Do not build a heavy canvas simulator for a simple algebraic concept that can be clearly illustrated with a crisp static SVG diagram.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **Zero-JS Degradation:** The core mathematical explanation and static diagram must be 100% understandable even if JavaScript is disabled.
* 🚫 **Accessible Math Markup:** Use semantic HTML, clean SVGs with `aria-label`, and text equivalents for mathematical formulas.
* 🚫 **No Performance Traps:** Interactive math canvases must use `requestAnimationFrame` with idle throttling and avoid high-frequency garbage collection.

---

## 📐 Pedagogical Progression & Lab Ladder (Codex)

```text
Step 1: Intuition → Plain English narrative explaining "why this math matters".
Step 2: Static SVG→ Clear, accessible vector geometry with labeled axes/nodes.
Step 3: Interactive→ Optional interactive lab mounted on `interaction` or `visible`.
Step 4: Formula   → Concise mathematical formalization and Spw operator tie-ins.
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

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
