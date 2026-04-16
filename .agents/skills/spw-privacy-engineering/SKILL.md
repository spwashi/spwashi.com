---
name: spw-privacy-engineering
description: Audit privacy and data-handling risks in the spwashi.com site. Use for local storage, service worker state, embeds, analytics snippets, asset metadata, and disclosure of browser-resident behavior.
---

# Spw Privacy Engineering for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Inventory browser-visible data flows:
   - localStorage/sessionStorage
   - service worker caches
   - analytics or third-party embeds
   - image or media metadata
2. Identify what is stored, for how long, and whether the user can understand or clear it.
3. Prefer private-by-default behavior:
   - short retention
   - explicit naming
   - easy reset paths
4. If a feature is mostly ornamental, question whether it needs persistence at all.

## Good Outputs

- concise data inventory
- retention and disclosure fixes
- settings copy clarifications
- reduced or normalized storage/state behavior
