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

## ⚡ 60-Second Quick Strike (Grok)

* **Context Gate:** This skill is ONLY for play, practice, lab, or scene routes (e.g. `/play/rpg-wednesday/`, math practice beds).
* **Zero-JS Principle:** Reading and editorial routes must remain pristine, readable, and lightweight without interactive runtime overhead.
* **Stop Condition:** Do not add scene orchestration JS or potentiation loops to standard blog, about, or curriculum reading pages.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Hover-Locked Mechanics:** Every keyboard/pointer scene must degrade gracefully to touch taps on mobile/coarse pointers.
* 🚫 **Respect Reduced Motion:** If `prefers-reduced-motion: reduce` is active, disable physics-driven transitions, spring oscillations, and continuous canvas loops.
* 🚫 **No Re-inventing Viewport Detection:** Never write bespoke `window.innerWidth` listeners; consume `shell-disclosure` and `interactive-medium` CSS custom properties.

---

## 📐 Posture & Runtime Token Matrix (Codex)

| Posture State | Viewport / Pointer Condition | CSS Behavior / Modulator |
| :--- | :--- | :--- |
| **`touch-field`** | Compact/narrow viewport + coarse pointer | Suppress hover lifts; expand tap targets (`min-height: 48px;`) |
| **`touch-tablet`** | Mid/regular viewport + coarse pointer | Multi-column touch layout with touch-friendly spacing |
| **`pointer-balanced`** | Regular viewport + fine pointer | Standard desktop hover lifts and subtle key potentiation |
| **`pointer-rich`** | Wide/atlas viewport + fine pointer | Full scene lane mechanics, expanded tooltips, deep resonance |

### Dedicated Module Owners:
* **Lanes & Local Memory:** `public/js/runtime/scene-interaction.js`
* **Key Events & Potentiation:** `public/js/runtime/spw-key-events.js`
* **Device & Register Tokens:** `public/js/runtime/interactive-medium.js`

---

## 🌌 Tooling & Validation Ladder (Antigravity)

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
