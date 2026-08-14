---
name: spw-typescript-affordances
description: Use TypeScript where checks and contracts pay off. Do not convert the public site to a TS app.
---

# Spw TypeScript Affordances for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Where TS Lives:** Strictly in build tooling (`scripts/ts/`), contract checkers, and portable kernel edges (`public/ts/`).
* **Where TS Does NOT Live:** Public routes, DOM narratives, and standard progressive modules. Public runtime remains clean, vanilla ES modules.
* **Stop Condition:** If you find yourself trying to convert route `index.html` scripts into TypeScript, STOP.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Client-Side Transpilation Bundlers:** The public site serves standard `.js` ES modules directly to the browser.
* 🚫 **No Runtime npm Types:** Never import `@types/*` into client-facing scripts.
* 🚫 **Preserve Pure Vanilla JS Ergonomics:** In plain JS runtime files, use `Object.freeze()`, structured constants, and standard JSDoc comments for type hints.

---

## 📐 TypeScript Architecture & Compilation Matrix (Codex)

| Target Surface | Source Path | Compiled Output | Build Script | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Scripts / Tooling** | `scripts/ts/**/*.mts` | `scripts/typed/` | `npm run build:tools` | Type-safe manifest, CSS, & runtime contract checkers |
| **Typed Kernel Runtime**| `public/ts/**/*.ts` | `public/js/typed/` | `npm run build:runtime` | Portable edges (bus, feeds, core DOM contracts) |
| **Vanilla Runtime** | `public/js/**/*.js` | Native execution | *(None / direct)* | Standard browser modules, UI controllers, routes |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

When modifying TypeScript files:

```bash
# 1. Typecheck entire codebase:
npm run typecheck

# 2. Build tooling scripts:
npm run build:tools

# 3. Build runtime modules:
npm run build:runtime

# 4. Check runtime catalog hygiene:
npm run check:runtime

# 5. Full local validation gate:
npm run check:local
```
