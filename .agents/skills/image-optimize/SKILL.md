---
name: image-optimize
description: Generate lighter public image derivatives when promoting assets. Skip for throwaway experiments.
---

# Image Optimization for spwashi.com

Read first: `../_shared/site-workflow.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Rule:** Optimize images **only** when promoting them into tracked public assets.
* **Stop Condition:** Do not batch-optimize throwaway experiments or unreferenced raw drafts.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **Never Commit Raw Uncompressed Blobs:** High-resolution uncompressed PNGs/JPEGs (>1MB) must never be checked directly into `public/images/`.
* 🚫 **Preserve Aspect Ratios:** Always specify explicit `width` and `height` (or CSS `aspect-ratio`) to prevent Cumulative Layout Shift (CLS).
* 🚫 **Master vs Derivative:** Keep raw masters in source directories; publish only optimized derivatives under `public/images/`.

---

## 📐 Format Tier & Size Budget Matrix (Codex)

| Role | Preferred Format | Max Target Size | Max Display Width |
| :--- | :--- | :--- | :--- |
| **Hero / Banner** | AVIF / WebP | < 120 KiB | 1440px |
| **Content Card** | AVIF / WebP | < 60 KiB | 800px |
| **Specimen / Figure** | WebP / Compressed PNG | < 40 KiB | 600px |
| **Icons & Line Art** | Inline SVG | < 10 KiB | Vector / fluid |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Generate Image Variants:**
   ```bash
   bash .agents/skills/image-optimize/scripts/generate-variants.sh <source-image>
   ```
2. **Verify Asset Manifest:**
   ```bash
   npm run images:manifest
   ```
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
