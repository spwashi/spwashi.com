---
name: spw-css-dom-lab
description: Small reversible HTML/CSS/DOM experiments. Keep them local until a second consumer appears.
---

# Spw CSS + DOM Lab for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Hypothesis First:** Define a single-sentence hypothesis (feel, learnability, ergonomics) before touching code.
* **1-Session Rule:** An experiment must live and die in a single session. Either promote it or discard it.
* **Stop Condition:** Do NOT register a new catalog module or sitewide token for a localized experiment.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Core Bundle Pollution:** Never import experimental lab CSS into `style-core.css` or shared tokens "just in case".
* 🚫 **No Breaking Base Styles:** Experiments must be strictly additive and contained within a single class or element scope.
* 🚫 **No Immediate Mounts:** If JS is needed for the experiment, mount it on `interaction` or `visible`, never `immediate`.
* 🚫 **No :root spend of local channels:** `@property --charge` / `--spw-resonance` are `inherits: false`. A lab calc on `:root` will not lift with hover.

---

## 📐 Experiment Lifecycle & Promotion Gate (Codex)

```text
Step 1: Sandbox   → Build the probe in a route-local file (e.g. <route>/index.html).
Step 2: Stress    → Test mobile (360px), desktop (1440px), touch pointer, reduced motion.
Step 3: Evaluate  → Did the experiment solve the public UX goal?
Step 4: Promote   → IF AND ONLY IF a second route or feature needs it, extract into shared CSS/JS.
        Discard   → Otherwise, keep route-local or revert.
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Visual Route Inspection:** Verify responsive layout and interactive feel.
2. **Whitespace & Diff Sanity:**
   ```bash
   git diff --check
   ```
3. **No Unintended Bundle Creep:** Confirm `public/css/tokens/core.css` and `module-catalog.js` remain clean.
4. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
