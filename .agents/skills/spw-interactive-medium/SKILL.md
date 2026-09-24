---
name: spw-interactive-medium
description: Play, scene, and practice-bed behavior—device-aware tokens, keyboard scenes, topical payloads. Not for ordinary editorial reading routes.
---

# Spw Interactive Medium for spwashi.com

Read first:
* `../_shared/site-workflow.md`
* `../_shared/site-vs-workbench.md`
* `./references/interactive-medium-rails.md`

---

## ⚡ Quick Strike

* **Context Gate:** This skill is for play, practice, lab, or scene routes (e.g. `/play/rpg-wednesday/`, math practice beds), where hosts carry `.spw-scene-bed`.
* **Reading Stays Reading:** Editorial routes keep only the progressive runtime every page shares. Scene orchestration there spends a reader's attention on mechanics they did not come for.
* **Stop Condition:** Do not add scene orchestration JS or potentiation loops to blog, about, or curriculum reading pages.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Hover-Locked Mechanics:** Every keyboard/pointer scene must degrade gracefully to touch taps on mobile/coarse pointers.
* 🚫 **Respect Reduced Motion:** Under `prefers-reduced-motion: reduce`, replace springs, parallax, and continuous canvas loops with instant or opacity changes. Keep the feedback itself: reduced motion is not reduced reward (`interaction-microstates.spw#reward_contract`).
* 🚫 **No Re-inventing Viewport Detection:** Do not write bespoke `window.innerWidth` listeners; read `data-spw-scene-posture` and the `--spw-medium-*` properties that `interactive-medium.js` and `systems/interactive-medium.css` already set.

---

## 📐 Posture & Runtime Token Matrix

| Posture State | Viewport / Pointer Condition | CSS Behavior / Modulator |
| :--- | :--- | :--- |
| **`touch-field`** | Compact/narrow viewport + coarse pointer | Suppress hover lifts; tap targets at `--spw-medium-touch-min` |
| **`touch-tablet`** | Mid/regular viewport + coarse pointer | Multi-column touch layout with touch-friendly spacing |
| **`pointer-balanced`** | Regular viewport + fine pointer | Standard desktop hover lifts and subtle key potentiation |
| **`pointer-rich`** | Wide/atlas viewport + fine pointer | Full scene lane mechanics, expanded tooltips, deep resonance |

### Dedicated Module Owners:
* **Lanes & Local Memory:** `public/js/runtime/scene-interaction.js`
* **Key Events & Potentiation:** `public/js/runtime/spw-key-events.js`
* **Device & Register Tokens:** `public/js/runtime/interactive-medium.js`

---

## 🌌 Tooling & Validation Ladder

1. **Verify Module Syntax:**
   ```bash
   node --check public/js/runtime/interactive-medium.js
   ```
2. **Catalog & Behavior Scope Gate:**
   ```bash
   npm run check:runtime
   ```
3. **Smoke Test Practice Routes (Narrow & Wide):**
   * `/play/rpg-wednesday/`
   * `/topics/film/scene-composition/mise-en-scene/`
4. **Full Local Verification:**
   ```bash
   npm run check:local
   ```
