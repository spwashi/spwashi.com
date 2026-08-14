---
name: spw-privacy-engineering
description: Audit browser-resident privacy risks—storage, service worker, embeds, analytics, asset metadata. Use when data handling changes, not as a default every patch.
---

# Spw Privacy Engineering for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Core Posture:** Browser-resident, privacy-first, zero dark-patterns.
* **Storage Rule:** All client state must be clearable by the user and never exfiltrated to unconsented endpoints.
* **Stop Condition:** Do not build telemetry collection apparatus "just to see what users do".

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Tracking Cookies:** The site does not use invasive tracking or fingerprinting cookies.
* 🚫 **No Covert Data Leaks:** Never leak user interaction traces or settings states into third-party query strings.
* 🚫 **Clear Reset Surfaces:** Settings on `/settings/` must always offer transparent "Reset to Defaults" controls that purge modified state cleanly.

---

## 📐 Storage & PWA Privacy Matrix (Codex)

| Data Vector | Authorized Storage Engine | Scope & Retention | Audit Requirement |
| :--- | :--- | :--- | :--- |
| **Site Settings** | `localStorage` via `site-settings.js` | User preferences (theme, font scale, mood) | Must validate schema on read/write |
| **Service Worker Cache** | CacheStorage API via `sw.js` | Static assets & offline shell routes | Enforce cache quotas & clean eviction |
| **Volatile Interaction** | In-memory `SpwBus` / WeakMaps | Current browsing session only | Garbage collected on page unload |
| **Public Assets** | `public/images/` | Static media | Strip EXIF geolocation & device metadata |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **PWA & Offline Service Worker Check:**
   ```bash
   npm run check:pwa
   ```
2. **Storage Key Audit:** Inspect `public/js/kernel/site-settings.js` for clean namespace isolation.
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
