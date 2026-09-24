---
name: spw-typescript-affordances
description: Use TypeScript where checks and contracts pay off. Do not convert the public site to a TS app.
---

# Spw TypeScript Affordances for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Where TS Lives:** Build tooling (`scripts/ts/`), contract checkers, shared type contracts (`types/`), and portable kernel edges (`public/ts/`).
* **Where TS Does Not Live:** Public routes, DOM narratives, and ordinary progressive modules. They stay vanilla ES modules so the browser runs what the repo shows, with no build between a reader and the source.
* **Stop Condition:** Converting route `index.html` scripts or a progressive module to TypeScript is out of scope. Add JSDoc against `types/` instead.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Client-Side Transpilation Bundlers:** The public site serves standard `.js` ES modules directly to the browser.
* 🚫 **No Runtime npm Types:** Do not import `@types/*` into client-facing scripts.
* 🚫 **Preserve Vanilla JS Ergonomics:** In plain JS runtime files, use `Object.freeze()`, structured constants, and JSDoc (`@typedef {import('<relative>/types/module-catalog').SpwModuleDef}`) for type hints.

---

## 📐 TypeScript Architecture & Compilation Matrix

| Target Surface | Source Path | Compiled Output | Build Script | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Shared contracts** | `types/**/*.d.ts` | *(ambient / type-only)* | included by every tsconfig | Catalog `SpwModuleDef`, cost axes, feeds, dataset |
| **Scripts / Tooling** | `scripts/ts/**/*.mts` | `scripts/typed/` | `npm run build:tools` | Type-safe manifest, CSS, & runtime contract checkers |
| **Typed Kernel Runtime**| `public/ts/**/*.ts` | `public/js/typed/` | `npm run build:runtime` | Portable edges (bus, feeds, core DOM contracts) |
| **Vanilla Runtime** | `public/js/**/*.js` | Native execution | *(None / direct)* | Standard browser modules, UI controllers, routes |

---

## 🌌 Tooling & Validation Ladder

When modifying TypeScript files:

```bash
# Fast loop while editing:
npm run typecheck

# Gate (compiles tools, runtime, and public sources with tsc):
npm run check:local

# Only when catalog defs or import boundaries moved:
npm run check:runtime
```
