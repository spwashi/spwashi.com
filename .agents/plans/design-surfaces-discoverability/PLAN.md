# Design surfaces: discoverability, live tokens, ornament map

Operation: align. Fixity: tending. Four asks in one pass: make design stubs and labs reachable, make the token pages answer to a press, map the ornaments, and add marks and diagrams that read the field.

## Discoverability (design/index.html)
- New closing frame `#design-stubs`, "Stubs and Labs the Hub Forgot": two route bridges. Reference stubs (ornaments, density, slots, materials, affordance, accessibility, website) and playable labs (menu-field, subject-balance, spellcraft-bench, theme-resonance, kernel-audit, load-symphony A and B). Before this, eight of those routes had zero links from the hub.
- Landmark "Stubs" in the on-page rooms nav; "Ornament map" in the Open-a-spoke bridge; `related_routes` folded on both page tags.

## Token pages answer to a press (no new JS)
- The pattern is the existing `.spw-ornament-rail` hosting `data-site-setting-set` chips (ornament.css §17). The engine binds these sitewide; confirmed on /design/palettes/ by pressing a resonance chip and reading the root attribute.
- Rule adopted after measuring: a chip stays only where its press has a visible consequence on that page. Silent absorption is worse than no chip (interaction-reward contract).
- `/design/slots/`: showSemanticMetadata on/off. Root attribute `data-spw-show-semantic-metadata` has eight stylesheet consumers (token labels on chips and allocated slots).
- `/design/ornaments/`: paletteResonance (recolors every mark; proven on palettes) and colorMode on the rail specimen.
- `/design/density/` and `/design/materials/`: no chips. See findings.

## Findings recorded for follow-up, not fixed here
- `componentDensity` and `spacingTuner` change the root attributes and the packing state, but on a profiled page `--spw-pack-pad-active` is held by measured occupancy on `main` and the frame, and `typography-packing.css` line 88 re-declares `--component-pad` after the tier rules at the same specificity. Net effect: neither the base tier nor a panel's own `data-spw-density` moves a panel's padding. The density page's four specimens were already flat before this pass. The ladder diagram and caption now say the tier is resolved per frame by the runtime.
- `baseMetamaterial` writes the root attribute, but frames do not receive `data-spw-metamaterial` from the base, so the hero on the materials page and the footer do not answer. The secondary carriers (material.css §2b) inherit correctly once a frame carries the attribute.
- Settings with no stylesheet consumer by root attribute: showFrameMetadata, baseAffordance, contourProfile, fieldResonance, operatorSaturation. They may have JS consumers; they are not chip material until something visible reads them.

## Ornament map (/design/ornaments/)
New reference route. Three altitudes (semantic state, field state, ornament) drawn once; a vocabulary grid with a live specimen per family and its owner sheet and convention; four gate questions before a new mark. `data-spw-copy-unit="ornaments.hook.lede"`.

## New marks (ornament.css §18) and SVGs
- `hr[data-spw-ornament="rule"]`: hairline with an operator notch that lengthens with `--ornament-resonance` and brightens with `--spw-attention-light`.
- `.spw-ornament-corner`: an empty child painting four corner ticks with gradients; spends attention light, sets down when the host is dimmed, lengthens on hover or focus. One absolutely positioned element, so the idle pack's arrival moves nothing. Used on the ornament map hero and the hub's stubs frame.
- Three hand-authored `.spw-svg-figure` diagrams with title and desc, `currentColor` ink and the brand accent variable: ornament altitudes, density ladder, slot anatomy. Each opts into the tunability contract by attribute.

## Not done
- No new `data-spw-*` family. No JS. Whimsy backlog items (seasonal, trails) stay unbuilt. The packing and base-material propagation findings above are shared-runtime changes and need their own patch and a browser review.

## Region variety prime — 2026-09-22
- [Region variety and token bridge](region-variety.spw): new reader direction, verified fragment destinations, module gates, and five self-referential ornament token declarations. Operation `prime`, fixity `experimental`; public implementation remains pending.
- First bounded implementation: verify and repair the shared ornament token bridge. Then connect contrasting specimens by native fragments; each destination must visibly earn the link.

## Token semantics and current copy — 2026-09-22
- Operation `align`, fixity `tending`: clarify the five registered ornament inputs in `tokens/core.css`; zero contributes no signal in that channel, and numeric registration does not enforce a 0–1 range. Local resonance and inherited ornament resonance remain distinct.
- Chrome baseline: all five registered inputs inherited parent values and accepted explicit local zero. The cyclic declarations did not read their raw-field fallback. Opus is concurrently implementing ornament paint and route links; preserve those edits.
- Refresh Home's live blurb, Design's entry and reference descriptions, and Now's dated opener/receipt using the existing ornament map, linked labs, and diagrams. Preserve the September 26 close and support paths. Remove stale claims that density/material references have working setting controls.
- User direction: Now's meditation copy names development as attentive practice, tentative models of other readers, mathematical relationships/constraints/transformations, personal art, vocabulary and sentence structure. These are intentions, not claims of measured cognitive improvement. Preserve `now.cycle.meditation`; add `now.practice.direction` for the distinct study paragraph.
- Validation: Chrome pocket probes found refreshed copy on all three routes and no horizontal overflow; ornament inputs inherited 0.1–0.5 and accepted local zero. `check:local -- --allow-dirty` passed 406 tests; copy accessor audit, manifest regeneration, generated-output check, and `git diff --check` passed. The manifest reported five unstructured expressions already outside this copy patch.

## Validation
`npm run manifest` (148 routes), `npm run build:css`, `npm run audit:copy:accessor`, `npm run check:local -- --allow-dirty`, `git diff --check`; browser at 500px: /design/ornaments/ flourish pack ready, corner painted, rule notch at rest, resonance chip writes the root attribute, no overflow, no console errors; /design/density/ figure fits; /design/slots/ metadata chip verified below.
