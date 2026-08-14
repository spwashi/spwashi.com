---
name: spw-craft-quality
description: Improve visual hierarchy, accessibility (a11y), device parity, and code clarity on a small public slice. Prefer removing weight over adding inspectability.
---

# Spw Craft Quality for spwashi.com

* Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.
* Adjacent measurement surface: [`.spw/skills/craft-quality.spw`](file:///Users/spwashi/air/spwashi.com/.spw/skills/craft-quality.spw)

---

## 1. Spw Invocation Contract

* **Default Operation:** `align` (or `prime` if opening an exploratory direction).
* **Sense (Pre-flight):** `npm run css:payload` (measure bundle weight before touching files).
* **Probe (Falsification):** `node scripts/check-site.mjs && git diff --check`
* **Precipitate:** Crystallize durable rules into `.spw/conventions/stylesheet-ecology.spw`; record measurements in `.spw/skills/craft-quality.spw`.

---

## 2. ⚡ 60-Second Quick Strike & Stop Conditions

* **Bounded Focus:** Pick **one** axis (clarity, hierarchy, a11y, device parity, or maintainability) on **one** bounded slice.
* **Anti-Bloat Rule:** Remove dead attributes, obsolete observers, and unneeded CSS selectors before adding new code.
* **Stop Condition:** If you have edited more than 3 files for a craft pass, STOP. You are crossing slice boundaries.

---

## 3. 🛡️ Constitutional Guardrails

* 🚫 **No Cascade Disruption:** Honor the CSS layer order; never use `!important` in component or route CSS.
* 🚫 **No Cosmetic Attribute Sprawl:** Never invent one-off `data-spw-*` attributes for visual-only tweaks.
* 🚫 **No Hover-Only Disclosures:** Critical navigation and controls must work on touch/coarse pointers.
* 🚫 **A11y Baselines:** Ensure 44px+ touch targets, clear `:focus-visible` rings, and WCAG AA contrast (4.5:1 minimum).

---

## 4. 📐 Implementation & Device Matrix

| Target Dimension | Implementation Contract | CSS Layer / Selector |
| :--- | :--- | :--- |
| **Touch Targets** | `min-height: 44px; min-width: 44px;` on coarse pointers | `components/*.css` via `:where(...)` |
| **Contrast & Ink** | Use `--ink-on-matte*` and `--material-ink-*` tokens on matte surfaces | `tokens/core.css` tokens |
| **Focus Rings** | Clear `:focus-visible` outline using `--focus-ring` token | `shell/chrome.css` & component styles |
| **Fluid Responsiveness**| Container queries (`@container`) and CSS `clamp()` over scattered `@media` | `components/*.css`, `shell/layout.css` |
| **DOM Event Cleanup** | `AbortController` or explicit `removeEventListener` on unmount | Plain JS modules |

---

## 5. 🌌 Execution & Validation Ladder

1. **Sense:** `npm run css:payload`
2. **Whitespace & Diff Hygiene:** `git diff --check`
3. **JS Syntax Verification:** `node --check <touched-module.js>`
4. **Runtime Contracts & Local Check:**
   ```bash
   npm run check:runtime
   npm run check:local
   ```
