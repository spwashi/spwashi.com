---
name: spw-css-dom-lab
description: Small reversible HTML/CSS/DOM experiments. Keep them local until a second consumer appears.
---

# Spw CSS + DOM Lab for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Hypothesis First:** Define a single-sentence hypothesis (feel, learnability, ergonomics) before touching code.
* **1-Session Rule:** An experiment ends its session decided: promoted, kept route-local on purpose, or reverted. Half-wired probes left for later become the next session's archaeology.
* **Stop Condition:** Do not register a new catalog module or sitewide token for a localized experiment.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Core Bundle Pollution:** Do not import experimental lab CSS into `style-core.css` or shared tokens "just in case"; core CSS is paid on every route.
* 🚫 **No Breaking Base Styles:** Experiments stay additive and scoped to one class or element.
* 🚫 **No Immediate Mounts:** If the experiment needs JS, mount it at `MOUNT_WHEN.INTERACTION` or `VISIBLE`, not `IMMEDIATE`.
* 🚫 **No :root spend of local channels:** `@property --charge` / `--spw-resonance` are `inherits: false`. A lab calc on `:root` will not lift with hover.

---

## 📐 Experiment Lifecycle & Promotion Gate

```text
Step 1: Sandbox   → Build the probe in a route-local file (e.g. <route>/index.html).
Step 2: Stress    → Test pocket (390px) and broadsheet (1440px), touch pointer, reduced motion.
Step 3: Evaluate  → Did the experiment serve the hypothesis? Feel is judged by a human in the browser.
Step 4: Promote   → Only when a second route or feature needs it, extract into shared CSS/JS.
        Discard   → Otherwise, keep route-local or revert.
```

---

## 🌌 Tooling & Validation Ladder

1. **Visual Route Inspection:** Verify responsive layout and interactive feel.
2. **Whitespace & Diff Sanity:**
   ```bash
   git diff --check
   ```
3. **No Unintended Bundle Creep:** `git diff --stat -- public/css/tokens public/js/runtime/catalog` should be empty.
4. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
