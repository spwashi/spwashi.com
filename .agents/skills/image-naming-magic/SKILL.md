---
name: image-naming-magic
description: Name, alt-text, and place site images so they fit route copy and palette. Use when promoting or sorting assets—not for every temporary render.
---

# Image Naming Magic for spwashi.com

Read first: `../_shared/site-workflow.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Name for Meaning:** Name assets for their semantic feeling and structure (e.g. `spwashi-studio-desk-morning.webp`), not raw hash noise (`image_129482.png`).
* **Stop Condition:** Do not create elaborate metadata sidecars for simple illustrative decorations.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Low-Quality Alt Text:** Alt text must never say "image of...", "graphic showing...", or repeat the filename. Describe the meaningful visual content and emotion for screen reader users.
* 🚫 **Decorative Images:** Purely decorative background ornaments should use `alt=""` or `aria-hidden="true"`.
* 🚫 **Root-Relative Paths:** Always use root-relative paths in HTML: `/public/images/<category>/<filename>.<ext>`.

---

## 📐 Semantic Naming Grammar (Codex)

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

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Check Image Manifest:**
   ```bash
   npm run images:manifest
   ```
2. **Verify HTML References:** Ensure all image tags have valid `src`, `alt`, `width`, `height`, and `loading="lazy"`.
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
