---
name: spw-craft-quality
description: Improve visual hierarchy, accessibility (a11y), device parity, or code clarity on one small public slice — a route, a shared layer, or a module. Use for craft or polish passes; prefer removing weight over adding inspectability.
---

# Spw Craft Quality for spwashi.com

* Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.
* Adjacent measurement surface: [`.spw/skills/craft-quality.spw`](../../../.spw/skills/craft-quality.spw)

---

## 1. Spw Invocation Contract

* **Default Operation:** `align` (or `prime` if opening an exploratory direction).
* **Sense (Pre-flight):** `npm run css:payload` when the pass touches CSS, so you know the weight before you add to it. An HTML-only or JS-only pass can skip it.
* **Probe (Falsification):** `npm run check:local && git diff --check`
* **Precipitate:** Durable rules go to `.spw/conventions/stylesheet-ecology.spw`; measurements go to `.spw/skills/craft-quality.spw`. A polish pass rarely earns either.

---

## 2. ⚡ Quick Strike & Stop Conditions

* **Bounded Focus:** Pick **one** axis (clarity, hierarchy, a11y, device parity, or maintainability) on **one** bounded slice.
* **Anti-Bloat Rule:** Remove dead attributes, obsolete observers, and unneeded CSS selectors before adding new code.
* **Stop Condition:** Past three edited files, you have usually crossed into a second slice. Finish the first, then name the second rather than continuing into it.

---

## 3. 🛡️ Constitutional Guardrails

* 🚫 **No Cascade Disruption:** Honor the CSS layer order. Do not add `!important` outside `ornament`. About 165 existing uses in components and routes are debt, not precedent; leave them unless removing them is the slice.
* 🚫 **No Cosmetic Attribute Sprawl:** Do not invent one-off `data-spw-*` attributes for visual-only tweaks.
* 🚫 **No Hover-Only Disclosures:** Navigation and controls must work on touch/coarse pointers.
* 🚫 **A11y Baselines:** Touch targets per the matrix below. Clear `:focus-visible` rings. WCAG AA contrast (4.5:1 minimum).
* 🚫 **No inherited rest calcs:** `--charge` / `--spw-resonance` do not inherit. Spend `--spw-attention-opacity` from frame reports or `:focus-within`, not a `:root` calc — root-level calcs force per-element resolution on every style recalc. Lift with `.spw-frame:focus-within`, not `:has(:focus-within)`.
* 🚫 **No html containing-block:** Do not `contain:layout` or `position:relative` on `html` / `[data-spw-floating-chrome]`.

---

## 4. 📐 Implementation & Device Matrix

| Target Dimension | Implementation Contract | CSS Layer / Selector |
| :--- | :--- | :--- |
| **Touch Targets** | `--touch-target-min` (44px) on chips/sigils and native buttons **outside** `[data-spw-floating-chrome]`. Compact chrome keeps `--touch-target-compact`. Do not set `min-inline-size` on every `button` from the components layer — that layer beats shell packing. | `components/foundation.css` via `:where(...)` with floating-chrome exclusion |
| **Contrast & Ink** | Use `--ink-on-matte*` and `--material-ink-*` tokens on matte surfaces | `tokens/core.css` tokens |
| **Focus Rings** | Clear `:focus-visible` outline using `--focus-ring` token | `shell/chrome/*.css` & component styles |
| **Fluid Responsiveness**| Container queries (`@container`) and CSS `clamp()` over scattered `@media` | `components/*.css`, `shell/layout.css` |
| **DOM Event Cleanup** | `AbortController` or explicit `removeEventListener` on unmount | Plain JS modules |

---

## 5. 🌌 Execution & Validation Ladder

1. **Sense:** `npm run css:payload` (CSS passes)
2. **Whitespace & Diff Hygiene:** `git diff --check`
3. **JS Syntax Verification:** `node --check <touched-module.js>`
4. **Local Check:** `npm run check:local` (includes `check-site` and runtime bindings). Add `npm run check:runtime` only when module catalog or import boundaries moved.
5. **If ink, resonance, or pocket chrome moved:** `npm run visual:checks` (attention-miss receipts) and a pocket smoke of the changed route.
