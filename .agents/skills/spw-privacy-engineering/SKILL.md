---
name: spw-privacy-engineering
description: Audit privacy risks in the browser (storage, service worker, embeds, asset metadata) and in the workers that persist visitor submissions. Use when data handling changes, not as a default every patch.
---

# Spw Privacy Engineering for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Core Posture:** Browser-resident by default, privacy-first, no dark patterns. Anything that leaves the browser does so because the visitor sent it.
* **Storage Rule:** Client state is clearable by the visitor and never sent to an endpoint they did not choose.
* **Server Rule:** Workers that store submissions (`wap-mom` FILINGS in KV, including emails; `autonomous-feedback` D1) keep only what the submission needs, say so where the visitor submits, and have a deletion path.
* **Stop Condition:** Do not build telemetry collection apparatus "just to see what users do".

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Tracking Cookies:** The site does not use invasive tracking or fingerprinting cookies.
* 🚫 **No Covert Data Leaks:** Do not put interaction traces or settings state into third-party query strings.
* 🚫 **Clear Reset Surfaces:** `/settings/` offers a visible way back to defaults that clears modified state cleanly.

---

## 📐 Storage & PWA Privacy Matrix

| Data Vector | Authorized Storage Engine | Scope & Retention | Audit Requirement |
| :--- | :--- | :--- | :--- |
| **Site Settings** | `localStorage` via `site-settings.js` | User preferences (theme, font scale, mood) | Must validate schema on read/write |
| **Service Worker Cache** | CacheStorage API via `sw.js` | Static assets & offline shell routes | Enforce cache quotas & clean eviction |
| **Volatile Interaction** | In-memory `SpwBus` / WeakMaps | Current browsing session only | Garbage collected on page unload |
| **Public Assets** | `public/images/` | Static media | Strip EXIF geolocation & device metadata |
| **Visitor Submissions** | Worker KV / D1 (`workers/*/wrangler.jsonc`) | Only fields the submission needs | Retention stated; deletion path exists; no IP or user-agent kept unless the feature needs it |

---

## 🌌 Tooling & Validation Ladder

1. **PWA & Offline Service Worker Check:**
   ```bash
   npm run check:pwa
   ```
2. **Storage Key Audit:** Inspect `public/js/kernel/site-settings.js` for clean namespace isolation.
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
