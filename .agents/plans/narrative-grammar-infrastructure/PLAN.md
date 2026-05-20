# Narrative Grammar Infrastructure

## Goal

Make narrative instrumentation useful across routes without letting the runtime guess too aggressively from ordinary prose.

## Current Patch Scope

- Tighten `public/js/semantic/narrative-instrumentation.js` so implicit character recognition is opt-in through `data-spw-narrative-implicit`.
- Use `data-spw-narrative-copy`, copy labels, copy roles, and copy purposes on RPG Wednesday so the inspector can explain why prose is interactive.
- Extend the same metadata to the Midjourney Bench so artists can read copy as storyboard, layout, and visual-canon handoff material.
- Normalize RPG gameplay panel selectors in shared CSS so character and asset composers receive the intended layout rules.
- Keep the narrative drawer on the site overlay scale instead of hard-coded z-index.
- Refine PWA chrome so install/update toasts identify as floating chrome and app shortcuts point to RPG Wednesday and the visual bench.
- Normalize shared chrome layering so headers stay below true overlays, route menus stay on the floating layer, and modal notices use the priority layer.
- Add a runtime attribute audit helper so late-added data attributes can declare source, reason, and styling axis for team review and console inspection.

## Contract

Essential prose stays in HTML. Narrative mode adds handles, resonance, sentence context, and copyable Spw seeds; it must not become the only way to read or navigate a page.

Runtime styling mutations should use `writeRuntimeDatasetValues(...)` when they are likely to affect visible layout, chrome, selection, or semantic emphasis. The console hook is `window.spwRuntimeAudit.mutations()`.
