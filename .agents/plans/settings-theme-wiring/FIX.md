# Fix: settings-theme-wiring

**Status 2026-11-06.** The settings shelf landed (b2eda400), and rows 2, 3 and 4 are closed. Row 4 took eight controls that nothing reads off `/settings/` (b5d9f407), each checked in kebab, camelCase and direct-key form across `public/css`, `public/js` and every route; their engine and profile keys stay, inert. One of the eight is still offered elsewhere: `/services/` keeps a "Spec seams" card whose two buttons set `showSpecPills` (slice 4b below). Next on `settings/index.html`: the presets (settings-ornament-resonance), then landing-visual-hierarchy's parcel C (the sitting's `seams.settings`). Row 6 waits on the creator's icon-pack answer (`index.spw#wonder_settings_theme_wiring_icon_packs`). Rows 1 and 5, and the inherited density and metamaterial findings, start with a browser pass (slice A).

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.dead_settings_controls, settings.theme_rows, settings.icon_packs, seams.settings.

**Related:** [runtime-settings](../archive/runtime-settings/PLAN.md) · [settings-ornament-resonance](../settings-ornament-resonance/PLAN.md) · [settings-theme-packs](../archive/settings-theme-packs/PLAN.md) (archived). **Absorbed 2026-10-06:** [design-surfaces-discoverability](../archive/design-surfaces-discoverability/PLAN.md).

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/js/kernel/site-settings-engine.js` + `public/css/*` | Many saved settings never affect rendering or runtime behavior | ui-interaction | P1 |
| 2 | `settings/index.html` | **Closed 2026-10-10.** `viewportActivation` had no reader: nothing called `shouldUseViewportActivation` (`site-settings-engine.js:1188`) and no CSS read the attribute. The fieldset was removed; the engine and profile keys stay, inert. | ui-interaction | — |
| 3 | `public/css/blog-surface.css` + `public/js/blog-specimens.js` | **Closed 2026-10-06.** Both files are gone from the tree. | ui-visual | — |
| 4 | `settings/index.html` | **Closed 2026-11-05.** Eight controls had no reader in CSS, JS, any route or the deviations list: `depthIndicators`, `baseAffordance` (and its state card), `showSpecPills`, `operatorHighlighting` (and the Ornament valve's query), `shellMenuPresentation` (and the note promising a modal menu), `fractalNesting`, `showFrameMetadata`, `verboseLogging`. The fieldsets left the page; the engine and profile keys stay, inert. The engine itself reads contour, stroke, field resonance, header opacity, mono font, motion intensity, infospace, relational, mutations and lazy loading, so those stay. `/services/` still offers it (slice 4b). | ui-visual | — |
| 5 | `public/css/effects/grain-texture.css` + `public/js/kernel/site-settings-engine.js` | Grain controls fight each other; semantic density comments do not match runtime behavior | regression | P2 |
| 6 | `settings/index.html` (three `iconPack` radios at line 1272, readout at 2594) | `iconPack` writes `data-spw-icon-pack` on `<html>` and nothing in `public/css` reads it; the stub came from `theming-icon-packs-public-versioning` (archived 2026-09-27), which never landed its CSS. The fieldset is labelled "Icon pack (considering)". Wire or remove after the creator answers `index.spw#wonder_settings_theme_wiring_icon_packs`. | ui-interaction | P2 |

## Diagnosis

- The storage and apply pipeline is coherent. The fault is controls whose `data-spw-*` flag has no CSS or JS reader, so a reader's choice changes nothing they can see.
- Row 4's census settled the settings page: of 18 controls that looked dead by attribute, eight had no reader and left, and ten are read by the engine into tokens (contour, stroke, field resonance, header opacity, mono font, motion intensity, infospace, relational, mutations, lazy loading). Whether those ten visibly change a page is row 1's question.
- The blog-only wiring this FIX first diagnosed went with row 3's files.

## Slices

Landed: Commit 2, "remove dead controls and align copy", as row 2 (08f060d6, 2026-10-10) and row 4 (b5d9f407, 2026-11-05).

- **4b — the dead control on `/services/`.** Inside `#services-tuning`, the "Spec seams" card (`aria-label="Services spec pill visibility"`) sets `showSpecPills:on|off`, and its "specs:" readout pill shows the value. The engine writes `spwShowSpecPills` (`site-settings-engine.js`, in the dataset map), and nothing in `public/css` or `public/js` reads it. Touches `services/index.html` only: remove the card and the readout pill, or wire the pills if the creator wants them. Ungated as a removal, but it waits for landing-visual-hierarchy's parcel B, which moves `#services-tuning` (`index.spw#wonder_landing_visual_hierarchy_services_tuning_seat`), so the two edits do not collide. Verify: `rg -n showSpecPills services/index.html` is empty, and the tuning card's other controls still bind.
- **A — the browser pass (rows 1 and 5, density, metamaterial).** No code. On `/settings/`, move each grain control and each density control, and record which of them changes the page. Then set `baseMetamaterial` and look at the hero of `/design/materials/` and the footer. One wip probe line per control, naming what moved. This is a reading, not a sensation call, so an agent with a browser can run it. Where a row 1 control reads nothing visible, the first Commit 1 named where its wiring would go: `public/css/effects/enhancements.css`, and the spirit-phase rules in `public/css/effects/developmental-climate.css`.
- **B — grain (row 5).** `public/css/effects/grain-texture.css` and the engine's grain writes, after A names which control wins. Verify: the two grain controls each change one visible thing, and `npm run check:css` passes.
- **C — density.** `componentDensity` and `spacingTuner` lose to `typography-packing.css`, which re-declares `--component-pad` after the tier rules (lines 47 and 72) at the same specificity. Touches that file only, once A confirms the loss on a page. Verify: a panel's padding moves with `data-spw-density`.
- **D — metamaterial.** The base `baseMetamaterial` never reaches frames as `data-spw-metamaterial`. The engine or a scoped CSS default carries it, without a new attribute family. Verify: the materials hero and the footer answer.

Proposal, so that a dead control cannot come back: turn row 4's census into an advisory sensor. For each `data-site-setting-set` key on any route, it counts readers in all three forms (kebab attribute, camelCase dataset key, setting key) outside the two settings files, and prints one Spw line per key, such as `setting[showSpecPills]{readers.0} ~ offered{/services/}`. On green it prints only the headline, and on a dead key the full list. It would have caught 4b.

## Deferred

- Broader CSS architecture consolidation around grammar, handles and ornaments remains in `.agents/plans/archive/spw-css-architecture/`.
- Route palettes stay their own; this fix only makes the global controls materially truthful.

## Inherited from design-surfaces-discoverability — 2026-10-06

That pass ([plan](../archive/design-surfaces-discoverability/PLAN.md), archived 2026-10-06) recorded two saved settings that do not reach panels and left them here, beside row 4's inert controls:

- `componentDensity` and `spacingTuner` move the root attributes and the packing state, but on a profiled page measured occupancy holds `--spw-pack-pad-active`, and `typography-packing.css` re-declares `--component-pad` after the tier rules at the same specificity; neither the base tier nor a panel's `data-spw-density` moves a panel's padding.
- `baseMetamaterial` writes the root attribute, but frames do not receive `data-spw-metamaterial` from the base, so the materials page hero and the footer do not answer.
