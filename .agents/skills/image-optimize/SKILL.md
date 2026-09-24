---
name: image-optimize
description: Generate lighter public image derivatives when promoting assets. Skip for throwaway experiments.
---

# Image Optimization for spwashi.com

Read first: `../_shared/site-workflow.md`.

---

## ⚡ Quick Strike

* **Rule:** Optimize images **only** when promoting them into tracked public assets.
* **Stop Condition:** Do not batch-optimize throwaway experiments or unreferenced raw drafts.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No New Raw Blobs:** Do not add uncompressed PNGs/JPEGs over 1MB to `public/images/`; every visitor pays for them. A handful already exist (logo concepts, some renders) — debt, not precedent; leave them unless they are the slice.
* 🚫 **Preserve Aspect Ratios:** Give every image explicit `width` and `height` (or CSS `aspect-ratio`) so it does not shift layout on arrival.
* 🚫 **Master vs Derivative:** Raw masters stay untracked (Midjourney sessions unzip to the gitignored `public/images/renders/_raw/`); commit only derivatives. `cwebp` drops metadata by default; a master committed as PNG/JPEG may still carry EXIF, so check with `magick identify -verbose`.

---

## 📐 Format Tier & Size Budget Matrix

Pixel tiers and quality per asset kind live in `references/size-tiers.spw`, which `scripts/generate-variants.sh` follows. The byte budgets below are targets for the rendered file:

| Role | Preferred Format | Target Size |
| :--- | :--- | :--- |
| **Hero / Banner** | AVIF / WebP | < 120 KiB |
| **Content Card** | AVIF / WebP | < 60 KiB |
| **Specimen / Figure** | WebP / Compressed PNG | < 40 KiB |
| **Icons & Line Art** | Inline SVG | < 10 KiB |

---

## 🌌 Tooling & Validation Ladder

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
