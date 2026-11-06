# Fix: settings-theme-wiring

**Status 2026-11-05.** The settings shelf landed (b2eda400); rows 2, 3 and 4 are closed. Row 4 took eight controls nothing reads off `/settings/` (depth indicators, base affordance, spec pills, operator highlighting, shell menu presentation, fractal nesting, frame metadata, verbose logging), each checked in kebab, camelCase and direct-key form across `public/css`, `public/js` and every route; their engine and profile keys stay, inert. Next: the settings presets, then landing-visual-hierarchy's parcel C (the sitting's `seams.settings`). Row 6 waits on the creator's icon-pack question (`index.spw#wonder_settings_theme_wiring_icon_packs`); rows 1, 5 and the inherited density and metamaterial findings need a live browser pass: the grain and density controls on `/settings/`, then the materials page hero (`/design/materials/`) and the footer.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.dead_settings_controls, settings.theme_rows, settings.icon_packs, seams.settings.

**Related:** [runtime-settings](../archive/runtime-settings/PLAN.md) · [settings-ornament-resonance](../settings-ornament-resonance/PLAN.md) · [settings-theme-packs](../archive/settings-theme-packs/PLAN.md) (archived). **Absorbed 2026-10-06:** [design-surfaces-discoverability](../archive/design-surfaces-discoverability/PLAN.md).

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/js/kernel/site-settings-engine.js` + `public/css/*` | Many saved settings never affect rendering or runtime behavior | ui-interaction | P1 |
| 2 | `settings/index.html` | **Closed 2026-10-10.** `viewportActivation` had no reader: nothing called `shouldUseViewportActivation` (`site-settings-engine.js:1188`) and no CSS read the attribute. The fieldset was removed; the engine and profile keys stay, inert. | ui-interaction | — |
| 3 | `public/css/blog-surface.css` + `public/js/blog-specimens.js` | **Closed 2026-10-06.** Both files are gone from the tree. | ui-visual | — |
| 4 | `settings/index.html` | **Closed 2026-11-05.** Eight controls had no reader in CSS, JS, any route or the deviations list: `depthIndicators`, `baseAffordance` (and its state card), `showSpecPills`, `operatorHighlighting` (and the Ornament valve's query), `shellMenuPresentation` (and the note promising a modal menu), `fractalNesting`, `showFrameMetadata`, `verboseLogging`. The fieldsets left the page; the engine and profile keys stay, inert. The engine itself reads contour, stroke, field resonance, header opacity, mono font, motion intensity, infospace, relational, mutations and lazy loading, so those stay. `/services/` still reads out the stored spec-pill value. | ui-visual | — |
| 5 | `public/css/effects/grain-texture.css` + `public/js/kernel/site-settings-engine.js` | Grain controls fight each other; semantic density comments do not match runtime behavior | regression | P2 |
| 6 | `settings/index.html` (three `iconPack` radios + readout) | `iconPack` writes `data-spw-icon-pack` on `<html>` and nothing in `public/css` reads it; the stub came from `theming-icon-packs-public-versioning` (archived 2026-09-27), which never landed its CSS. The fieldset is labelled "Icon pack (considering)". Wire or remove after the creator answers `index.spw#wonder_settings_theme_wiring_icon_packs`. | ui-interaction | P2 |

## Diagnosis

- The storage/apply pipeline is coherent, but many `data-spw-*` flags have no CSS or JS consumers.
- Global theme/accessibility settings are mostly wired only for the blog surface.
- Some controls should be implemented globally with lightweight selectors or runtime listeners.
- The remaining speculative controls should be removed from the user-facing settings surface until they have actual behavior.

## Planned Fixes

### Commit 1: `&[settings] — wire live runtime preferences`
- Update `public/js/kernel/site-settings-engine.js` (apply and datasets; `site-settings.js` is now a 15-line re-export)
- Update `public/js/kernel/site-settings-profiles.js` (defaults and allowed values)
- Update `public/css/effects/enhancements.css`
- Update `public/css/effects/grain-texture.css`
- Update `public/css/effects/developmental-climate.css` (the spirit-phase rules; `spirit-phases.css` is gone)
- Ripple risk: medium

### Commit 2: `&[settings] — remove dead controls and align copy`
- Update `settings/index.html`
- Ripple risk: low

## Deferred

- Broader CSS architecture consolidation around grammar, handles, and ornaments remains in `.agents/plans/archive/spw-css-architecture/`.
- Route-specific surfaces beyond the blog will continue to use their existing palettes; this fix only makes the global controls materially truthful.

## Inherited from design-surfaces-discoverability — 2026-10-06

That pass ([plan](../archive/design-surfaces-discoverability/PLAN.md), archived 2026-10-06) recorded two saved settings that do not reach panels and left them here, beside row 4's inert controls:

- `componentDensity` and `spacingTuner` move the root attributes and the packing state, but on a profiled page measured occupancy holds `--spw-pack-pad-active`, and `typography-packing.css` re-declares `--component-pad` after the tier rules at the same specificity; neither the base tier nor a panel's `data-spw-density` moves a panel's padding.
- `baseMetamaterial` writes the root attribute, but frames do not receive `data-spw-metamaterial` from the base, so the materials page hero and the footer do not answer.
