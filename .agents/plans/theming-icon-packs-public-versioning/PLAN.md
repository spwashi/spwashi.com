# Plan: Theming, Icon Packs, Public Folder Versioning, Asset Optimization

## Context (from while-working note)
After the light/dark/smaller/path/larger/style UX and customizable shortcuts work, now is a good time to consider:
- Theming and icon packs
- Public folder versioning
- Asset optimization

This aligns with ongoing theme/palette/motif work, SVG tunability, design catalog, and making the site more "project development" friendly (custom visuals for users' own sites/tools).

## Current State (audit via tools)
- **Theming**: 
  - site-settings.js has THEME_PACK_OPTIONS: neutral-paper (default), electric-studio, glass-console.
  - Applied via data-spw-theme-pack on <html>, CSS in tokens/core.css and shell layers.
  - paletteResonance (route, craft, signal, etc.) for component-level.
  - In design/components and experiments: live tuning for semanticDensity, palettes via SVG and CSS specimens.
  - Manifest has theme_color, background_color.
- **Icons**:
  - No dedicated "icon packs". Site uses text-based operators (#> ~ ^ etc in .operator-chip, .frame-sigil), inline SVGs in some places (playground, specimens), favicon/apple-touch-icon.png, spec-pills.
  - SVG hosts in design/experiments/svg and runtime support heavy customization (palettes, stroke, pointer) which can act as icon-like.
  - No CSS var for icon font/family or pack switching.
- **Public folder**:
  - /public/css/, /public/js/, /public/images/ (with subdirs assets, creatures, renders, etc.), /public/data/, /public/ts/.
  - Served as-is in dev and in dist/public/ for GitHub Pages.
  - manifest.webmanifest at root references /public/images/icon-192.png etc.
  - sw.js for offline.
  - No versioning in paths (e.g. /public/v1.2/css/... or hashed filenames for cache bust).
  - dist/ has versioned? (dist-vite has hashed assets).
- **Assets**:
  - Many PNGs (favicon, apple-touch, various illustrations/renders). Not aggressively optimized (sizes in ls show e.g. 40k favicon).
  - No systematic webp/avif fallbacks or responsive images in all places (some use in HTML).
  - Image optimization was a previous skill/plan (image-optimize), but not enforced in repo for all public/images.
  - Build uses Vite for some, but main is hand/static + scripts/build.mjs.

## Goals / Considerations
- **Theming expansion**: Allow more theme packs (e.g. user-contributable via CSS custom props only). Deepen integration with iconography.
- **Icon packs**: Introduce lightweight pack switching, e.g. data-spw-icon-pack="text|line|filled|regional" that affects .operator-chip, sigils, perhaps via font or background SVGs. Leverage existing SVG tunability for "icon" semantics. Make it part of themePack or separate setting.
- **Public versioning**: 
  - Add `version` sync between manifest, sw, and perhaps a public/VERSION or build step that prefixes paths in prod (but keep hand-authored simple).
  - For cache: encourage content-hashed filenames for images/css/js in future, or use ?v= in references.
  - Update sw.js and manifest to better bust on version change.
- **Asset optimization**:
  - Document process using existing image-optimize skill (no new deps).
  - Add variants for key icons (e.g. icon-192.png -> icon-192.webp).
  - Update HTML/manifest to use picture or type fallbacks where high value (favicon, hero images).
  - For public/images, add a simple audit or note in design/catalog.
  - Tie to screenshot value: optimized assets for clean local/regional captures.

## Constraints (AGENTS.md)
- No new npm packages without plan note + human review. Prefer ci --ignore-scripts for any temp.
- Surgical: start with docs/plan, small HTML/attr additions, CSS var extensions, one or two manifest/sw updates.
- If new semantic family (e.g. icon-pack contract), add to .spw and operational-semantics.
- Update agent-optimization/PLAN.md and this new plan.
- Validation on any edits.
- Keep pages framework-free, use existing local state (settings, localStorage).

## Likely Files (initial)
- .agents/plans/theming-icon-packs-public-versioning/PLAN.md (this)
- .agents/plans/agent-optimization/PLAN.md (cross-ref)
- public/js/kernel/site-settings.js (expand THEME_PACK_OPTIONS, add ICON_PACK_OPTIONS if lightweight)
- public/css/tokens/core.css (new vars for icon packs, e.g. --icon-family, --icon-weight)
- manifest.webmanifest + dist one (bump version, add icon variants)
- public/sw.js (version awareness)
- design/palettes/ or design/components/ (add icon pack specimens)
- settings/index.html (expose new theming/icon controls in appearance or new section)
- Any high-use images (e.g. apple-touch-icon) for opt variants (manual or via skill)
- .spw/conventions/ (if icon-pack or asset-versioning contract emerges)

## Out of Scope (initial)
- Full migration of all images to optimized variants (too broad; phased).
- New build pipeline changes without plan.
- Icon system that requires new deps or fonts.

## Next Steps (surgical first)
1. Create this plan + cross-refs.
2. Small extension: add ICON_PACK_OPTIONS stub in site-settings (text|symbol|minimal) with data attr.
3. CSS: add example vars and rules for .operator-chip etc under theme.
4. Update manifest version and note icon variants.
5. Add a specimen in design/components or palettes for "icon pack" preview.
6. Expose in settings appearance section (surgical copy + radio if simple).
7. If useful, one public/images optimization pass for core icons using existing means.
8. Instrument (data attrs for new packs so catalog picks them up).

This keeps the "magic manuscript" extensible for users to theme their own Spw surfaces and tools.

**Status**: Consideration phase started. Will execute minimal patches only after review in plan.

## Executed (initial consideration steps)
- Created this plan + cross-ref in agent-optimization/PLAN.md.
- Wired initial "iconPack" semantic stub in public/js/kernel/site-settings.js:
  - ICON_PACK_OPTIONS (text/symbol/regional)
  - Added to DEFAULT_SITE_SETTINGS, SETTING_OPTIONS, normalize, and dataset write (spwIconPack).
  - This makes the data attr flow to <html>, visible to design catalog, instrumentation, and any future CSS.
- Added surgical UI stub in settings/index.html (in Appearance fieldset): radio options for the 3 packs, with hints tying to regional screenshots/project notes. Also added state readout card.
- The actual visual effect (CSS rules for .operator-chip etc based on data-spw-icon-pack) and deeper integration (with SVG project-motif, theming tokens) left for follow-up patches after this consideration.
- No bloat: just the contract extension + minimal radios (progressive; if JS not there, radios do nothing harmful).
- This "starts considering" without overcommitting; the semantic is now queryable and part of the runtime model.

Next surgical could be: add CSS examples under existing theme rules, expose in design/components as specimen, bump manifest version + note asset variants.

All per AGENTS (plan first, surgical on settings surface which already covers theming, validation clean).
