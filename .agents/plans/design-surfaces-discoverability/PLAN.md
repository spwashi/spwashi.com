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

## Validation
`npm run manifest` (148 routes), `npm run build:css`, `npm run audit:copy:accessor`, `npm run check:local -- --allow-dirty`, `git diff --check`; browser at 500px: /design/ornaments/ flourish pack ready, corner painted, rule notch at rest, resonance chip writes the root attribute, no overflow, no console errors; /design/density/ figure fits; /design/slots/ metadata chip verified below.
