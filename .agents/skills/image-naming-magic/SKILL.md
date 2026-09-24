---
name: image-naming-magic
description: Name, alt-text, and place site images so they fit route copy and palette. Use when promoting or sorting assets—not for every temporary render.
---

# Image Naming Magic for spwashi.com

Read first: `../_shared/site-workflow.md`.

---

## ⚡ Quick Strike

* **Name for Meaning:** Name assets for their semantic feeling and structure (e.g. `spwashi-studio-desk-morning.webp`), not raw hash noise (`image_129482.png`).
* **Stop Condition:** Do not create elaborate metadata sidecars for simple illustrative decorations.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Low-Quality Alt Text:** Alt text does not say "image of...", "graphic showing...", or repeat the filename. Say what the image contributes to the sentence around it; a screen reader user hears it in that flow.
* 🚫 **Decorative Images:** Purely decorative ornaments use `alt=""` (or `aria-hidden="true"` on non-`img` decoration).
* 🚫 **Root-Relative Paths:** Use root-relative paths in HTML: `/public/images/<category>/<filename>.<ext>`.

---

## 📐 Semantic Naming Grammar

```text
Format:  [domain]-[subject]-[posture]-[variant].[ext]
Example: craft-vellum-binding-detail.webp
Example: software-terminal-monochrome-dense.webp
```

| Asset Role | Naming Prefix | Alt-Text Standard |
| :--- | :--- | :--- |
| **Hero Image** | `hero-<slug>-...` | Conveys mood, subject, and primary setting |
| **Topic Specimen**| `<topic>-diagram-...` | Explains the structural/conceptual relationship |
| **Profile / Avatar** | `author-spwashi-...` | Identifies person, context, and environment |
| **Ornament / Accent**| `ornament-<motif>-...` | `alt=""` (marked decorative) |

---

## 🌌 Tooling & Validation Ladder

1. **Check Image Manifest:**
   ```bash
   npm run images:manifest
   ```
2. **Verify HTML References:** Every image has a valid `src`, `alt`, `width`, and `height`. Below-the-fold images take `loading="lazy"`; the first image a reader sees does not (lazy-loading it delays the page's largest paint).
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
